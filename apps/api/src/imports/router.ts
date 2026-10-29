import express, { Router, type RequestHandler } from 'express';
import rateLimit from 'express-rate-limit';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import type { Pool } from 'pg';
import { z } from 'zod';
import { authenticate, type AuthenticatedRequest } from '../middleware/authenticate.js';
import { encryptionKey, seal } from './crypto.js';
import { MAX_BYTES, jobSchema, mappingSchema, decisionSchema, confirmSchema, suggestMapping, mayCreate, csvCell } from './domain.js';
import { parseFile } from './parser.js';
import { scanFile, scannerReady } from './scanner.js';
import { ImportError, transaction, event, lockJob, validateRows, readRow, confirmImport, requireActiveAdmin } from './service.js';

const require=createRequire(import.meta.url);
export function readiness(){let encrypted=true,libraries=true;try{encryptionKey();}catch{encrypted=false;}try{for(const name of ['csv-parse','exceljs','yauzl'])require.resolve(name);}catch{libraries=false;}const approved=process.env.IMPORTS_ENABLED==='true';return {enabled:approved&&encrypted&&libraries&&scannerReady(),approved,encryption:encrypted,scanner:scannerReady(),libraries};}
let activeUploads=0;
export function createImportRouter(pool:Pool,authentication:RequestHandler=authenticate,dependencies={parseFile,scanFile,readiness}){
 const router=Router();router.use((_req,res,next)=>{res.set('Cache-Control','no-store');res.set('X-Content-Type-Options','nosniff');next();},authentication);
 // Administrator policy is intrinsic to this router: callers cannot omit it.
 router.use((req:AuthenticatedRequest,res,next)=>{
  if(!req.authUserId){res.status(401).json({error:'Authentication required'});return;}
  void requireActiveAdmin(pool,req.authUserId).then(()=>next()).catch(error=>{
   res.status(error instanceof ImportError?error.status:503).json({error:error instanceof ImportError?error.message:'Unable to verify administrator access'});
  });
 });
 router.use(rateLimit({windowMs:60000,limit:120,standardHeaders:'draft-8',legacyHeaders:false,message:{error:'Too many import requests. Please wait a minute.'}}));
 router.use(express.json({limit:'64kb'}));
 router.get('/capabilities',(_req,res)=>{res.json({...dependencies.readiness(),formats:['csv','xlsx'],max_bytes:MAX_BYTES,max_rows:10000,retention_hours:24});});
 router.param('id',(req,res,next,id)=>{if(!z.uuid().safeParse(id).success){res.status(400).json({error:'Invalid import job'});return;}next();});
 const handle=(work:(req:AuthenticatedRequest,res:express.Response)=>Promise<void>):RequestHandler=>(req,res)=>{res.locals.importRunning=true;void work(req,res).catch(error=>{if(!res.headersSent)res.status(error instanceof ImportError?error.status:503).json({error:error instanceof ImportError?error.message:'Import service unavailable. Check configuration and migration 004.'});}).finally(()=>{res.locals.importRunning=false;res.locals.releaseImportSlot?.();});};
 router.post('/',handle(async(req,res)=>{
  const input=jobSchema.safeParse(req.body);if(!input.success)throw new ImportError(400,'Enter a source label and a supported CSV or XLSX filename');
  if(!dependencies.readiness().enabled)throw new ImportError(503,'Imports are disabled until deployment approval, encryption, a private malware scanner, and parser dependencies are configured');
  const result=await transaction(pool,async db=>{
   await requireActiveAdmin(db,req.authUserId!);
   // Serializes job creation per account, including idempotent retries.
   await db.query('SELECT pg_advisory_xact_lock(hashtextextended($1,0))',[req.authUserId]);
   const existing=await db.query('SELECT id,filename,source_system FROM public.patient_import_jobs WHERE uploader_id=$1 AND idempotency_key=$2',[req.authUserId,input.data.idempotency_key]);
   if(existing.rowCount){const job=existing.rows[0];if(job.filename!==input.data.filename||job.source_system!==input.data.source_system)throw new ImportError(409,'Idempotency key was already used for another file');return {id:job.id,replayed:true};}
   const count=await db.query("SELECT count(*)::int AS count FROM public.patient_import_jobs WHERE uploader_id=$1 AND status IN ('created','staged','validated') AND expires_at>now()",[req.authUserId]);if(count.rows[0].count>=3)throw new ImportError(429,'Finish or cancel an existing import first (three active jobs maximum)');
   const job=await db.query('INSERT INTO public.patient_import_jobs(uploader_id,idempotency_key,filename,source_system) VALUES($1,$2,$3,$4) RETURNING id',[req.authUserId,input.data.idempotency_key,input.data.filename,input.data.source_system]);await event(db,job.rows[0].id,req.authUserId!,'created');return {id:job.rows[0].id,replayed:false};
  });res.status(result.replayed?200:201).json(result);
 }));
 // The concurrency gate runs before raw body buffering; bytes never reach a public directory.
 const uploadSlot:RequestHandler=(req,res,next)=>{if(activeUploads>=2){res.status(429).json({error:'Two uploads are already processing. Try again shortly.'});return;}activeUploads++;let released=false;const release=()=>{if(!released){released=true;activeUploads--;}};res.locals.releaseImportSlot=release;req.once('aborted',release);res.once('finish',release);res.once('close',()=>{if(!res.locals.importRunning)release();});next();};
 router.put('/:id/file',uploadSlot,express.raw({type:'application/octet-stream',limit:MAX_BYTES}),handle(async(req,res)=>{
  if(!dependencies.readiness().enabled)throw new ImportError(503,'Uploads are disabled until the secure import deployment is approved and configured');
  if(!Buffer.isBuffer(req.body)||!req.body.length)throw new ImportError(400,'Select a nonempty file');
  const result=await transaction(pool,async db=>{
   const job=await lockJob(db,String(req.params.id),req.authUserId!);const hash=createHash('sha256').update(req.body).digest('hex');
   if(job.status!=='created'){if(job.file_hash===hash)return {status:job.status,replayed:true};throw new ImportError(409,'This job already has a file. Create a new import');}
   // Quarantine is volatile private memory; nothing is parsed until ClamAV accepts it.
   try{await dependencies.scanFile(req.body);}catch{throw new ImportError(422,'File was not accepted by the malware scanner, or scanning is unavailable. Ask your system administrator to check the scanner before retrying.');}
   let parsed;try{parsed=await dependencies.parseFile(req.body,job.filename);}catch{throw new ImportError(422,'File could not be parsed. Use UTF-8 CSV or a single-sheet, values-only XLSX within the upload limits.');}
   for(let start=0;start<parsed.rows.length;start+=100){const batch=parsed.rows.slice(start,start+100),values:unknown[]=[],tuples:string[]=[];for(let i=0;i<batch.length;i++){const row=start+i+2,offset=values.length;values.push(job.id,row,seal(JSON.stringify({cells:batch[i]}),`${job.id}:${row}`));tuples.push(`($${offset+1},$${offset+2},$${offset+3})`);}await db.query(`INSERT INTO public.patient_import_rows(job_id,row_number,data_cipher) VALUES ${tuples.join(',')}`,values);}
   await db.query("UPDATE public.patient_import_jobs SET status='staged',file_hash=$2,source_cipher=$3,headers=$4,row_count=$5,revision=revision+1 WHERE id=$1",[job.id,hash,seal(req.body,`${job.id}:file`),JSON.stringify(parsed.headers),parsed.rows.length]);await event(db,job.id,req.authUserId!,'staged',{rows:parsed.rows.length});return {status:'staged',replayed:false};
  });res.json(result);
 }));
 router.post('/:id/validate',handle(async(req,res)=>{
  const input=mappingSchema.safeParse(req.body);if(!input.success)throw new ImportError(400,'Map unique columns to name and patient number, and select a date order');
  await transaction(pool,async db=>{const job=await lockJob(db,String(req.params.id),req.authUserId!);if(!['staged','validated'].includes(job.status))throw new ImportError(409,'Upload a file first');if(Object.values(input.data.mapping).some(i=>i!==undefined&&i>=job.headers.length))throw new ImportError(400,'Mapped column is missing');await validateRows(db,job,req.authUserId!,input.data.mapping,input.data.date_order);});res.json({status:'validated'});
 }));
 router.post('/:id/decisions',handle(async(req,res)=>{
  const input=decisionSchema.safeParse(req.body);if(!input.success)throw new ImportError(400,'Invalid review decisions');
  await transaction(pool,async db=>{const job=await lockJob(db,String(req.params.id),req.authUserId!);if(job.status!=='validated'||job.revision!==input.data.revision)throw new ImportError(409,'Reload the current review');
   for(const decision of input.data.decisions){const result=await db.query('SELECT issues,warnings,matches FROM public.patient_import_rows WHERE job_id=$1 AND row_number=$2',[job.id,decision.row_number]);const row=result.rows[0];if(!row)throw new ImportError(404,'Import row not found');if(decision.decision==='create'&&!mayCreate(row,input.data.acknowledge_warnings))throw new ImportError(409,'Invalid or exact-duplicate rows must be skipped; acknowledge other warnings before creating');await db.query('UPDATE public.patient_import_rows SET decision=$3 WHERE job_id=$1 AND row_number=$2',[job.id,decision.row_number,decision.decision]);}
   await db.query('UPDATE public.patient_import_jobs SET revision=revision+1 WHERE id=$1',[job.id]);await event(db,job.id,req.authUserId!,'decisions',{decisions:input.data.decisions,acknowledged:input.data.acknowledge_warnings});
  });res.json({saved:true});
 }));
 router.post('/:id/confirm',handle(async(req,res)=>{if(!dependencies.readiness().enabled)throw new ImportError(503,'Patient imports are disabled until the secure deployment is approved and configured');const input=confirmSchema.safeParse(req.body);if(!input.success)throw new ImportError(400,'Explicit confirmation and current revision are required');res.json(await confirmImport(pool,String(req.params.id),req.authUserId!,input.data.revision));}));
 router.delete('/:id',handle(async(req,res)=>{await transaction(pool,async db=>{const job=await lockJob(db,String(req.params.id),req.authUserId!);await db.query("UPDATE public.patient_import_jobs SET status='expired',source_cipher=NULL WHERE id=$1",[job.id]);await db.query('UPDATE public.patient_import_rows SET data_cipher=NULL WHERE job_id=$1',[job.id]);await event(db,job.id,req.authUserId!,'cancelled');});res.json({cancelled:true});}));
 router.get('/',handle(async(req,res)=>{const page=z.coerce.number().int().min(1).max(100000).safeParse(req.query.page??1);if(!page.success)throw new ImportError(400,'Invalid page');const result=await pool.query('SELECT id,filename,source_system,status,row_count,imported_count,skipped_count,created_at,completed_at,expires_at FROM public.patient_import_jobs ORDER BY created_at DESC,id LIMIT 20 OFFSET $1',[(page.data-1)*20]);res.json({items:result.rows,page:page.data});}));
 router.get('/:id',handle(async(req,res)=>{const job=await pool.query('SELECT id,filename,source_system,status,headers,mapping,date_order,revision,row_count,imported_count,skipped_count,created_at,completed_at,expires_at FROM public.patient_import_jobs WHERE id=$1',[req.params.id]);if(!job.rowCount)throw new ImportError(404,'Import not found');const summary=await pool.query(`SELECT count(*) FILTER(WHERE decision='review')::int AS unresolved,count(*) FILTER(WHERE decision='create')::int AS to_create,count(*) FILTER(WHERE decision='skip')::int AS to_skip FROM public.patient_import_rows WHERE job_id=$1`,[req.params.id]);res.json({...job.rows[0],...summary.rows[0],suggested_mapping:suggestMapping(job.rows[0].headers??[])});}));
 router.get('/:id/rows',handle(async(req,res)=>{const page=z.coerce.number().int().min(1).max(200).safeParse(req.query.page??1);if(!page.success)throw new ImportError(400,'Invalid page');const job=await pool.query('SELECT expires_at,status FROM public.patient_import_jobs WHERE id=$1',[req.params.id]);if(!job.rowCount)throw new ImportError(404,'Import not found');if(new Date(job.rows[0].expires_at).getTime()<=Date.now()||job.rows[0].status==='expired')throw new ImportError(410,'Staging expired');const result=await pool.query('SELECT row_number,data_cipher,issues,warnings,matches,decision,patient_id FROM public.patient_import_rows WHERE job_id=$1 ORDER BY row_number LIMIT 50 OFFSET $2',[req.params.id,(page.data-1)*50]);res.json({items:result.rows.map(row=>{const {data_cipher,...meta}=row;return {...meta,...(data_cipher?readRow(row,String(req.params.id)): {})};}),page:page.data});}));
 router.get('/:id/events',handle(async(req,res)=>{const result=await pool.query('SELECT action,details,actor_id,created_at FROM public.patient_import_events WHERE job_id=$1 ORDER BY created_at DESC LIMIT 100',[req.params.id]);res.json({items:result.rows});}));
 router.get('/:id/errors',handle(async(req,res)=>{await transaction(pool,async db=>{await requireActiveAdmin(db,req.authUserId!);const result=await db.query('SELECT id FROM public.patient_import_jobs WHERE id=$1',[req.params.id]);if(!result.rowCount)throw new ImportError(404,'Import not found');await event(db,String(req.params.id),req.authUserId!,'error_report_downloaded');});const result=await pool.query("SELECT row_number,decision,issues,warnings FROM public.patient_import_rows WHERE job_id=$1 AND (cardinality(issues)>0 OR cardinality(warnings)>0) ORDER BY row_number",[req.params.id]);const csv=['row_number,decision,issues,warnings',...result.rows.map(row=>[row.row_number,row.decision,row.issues.join('; '),row.warnings.join('; ')].map(csvCell).join(','))].join('\r\n');res.json({filename:`import-${req.params.id}-errors.csv`,csv});}));
 router.use(((error:unknown,_req:express.Request,res:express.Response,_next:express.NextFunction)=>{const large=typeof error==='object'&&error!==null&&'type' in error&&error.type==='entity.too.large';res.status(large?413:400).json({error:large?'File exceeds the 8 MiB upload limit.':'Upload body could not be read. Select a file and retry using application/octet-stream.'});}) as express.ErrorRequestHandler);
 return router;
}

export async function purgeExpiredImports(pool:Pool){
 await transaction(pool,async db=>{await db.query(`UPDATE public.patient_import_rows r SET data_cipher=NULL FROM public.patient_import_jobs j WHERE r.job_id=j.id AND j.expires_at<=now() AND r.data_cipher IS NOT NULL`);await db.query("UPDATE public.patient_import_jobs SET source_cipher=NULL,status=CASE WHEN status='completed' THEN status ELSE 'expired' END WHERE expires_at<=now() AND (source_cipher IS NOT NULL OR status NOT IN ('completed','expired'))");});
}
