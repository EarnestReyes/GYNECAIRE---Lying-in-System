import type { Pool, PoolClient } from 'pg';
import { normalize, mayCreate, type Mapping, type Normalized } from './domain.js';
import { seal, unseal, sourceHash } from './crypto.js';

export class ImportError extends Error {constructor(public status:number,message:string){super(message);}}
export async function transaction<T>(pool:Pick<Pool,'connect'>,work:(db:PoolClient)=>Promise<T>):Promise<T>{
 const db=await pool.connect();try{await db.query('BEGIN');await db.query("SET LOCAL statement_timeout='30s'");await db.query("SET LOCAL lock_timeout='10s'");const result=await work(db);await db.query('COMMIT');return result;}catch(error){await db.query('ROLLBACK').catch(()=>{});throw error;}finally{db.release();}
}
export async function event(db:PoolClient,job:string,actor:string,action:string,details:object={}){
 await db.query('INSERT INTO public.patient_import_events(job_id,actor_id,action,details) VALUES($1,$2,$3,$4)',[job,actor,action,JSON.stringify(details)]);
 await db.query("INSERT INTO public.audit_logs(actor_profile_id,action,entity_type,entity_id) VALUES($1,$2,'patient_import',$3)",[actor,`import.${action}`,job]);
}
// Re-check active administrator membership *inside* each mutating transaction.
export async function requireActiveAdmin(db:Pick<PoolClient,'query'>,actor:string){
 const admin=await db.query(`SELECT s.id FROM public.staff_members s JOIN public.profiles p ON p.id=s.profile_id WHERE s.profile_id=$1 AND s.is_active AND s.staff_role='admin' AND p.account_type IN ('staff','admin') FOR SHARE OF s,p`,[actor]);
 if(!admin.rowCount)throw new ImportError(403,'Administrator access required');
}
export async function lockJob(db:PoolClient,id:string,actor:string,allowComplete=false){
 await requireActiveAdmin(db,actor);
 const result=await db.query('SELECT * FROM public.patient_import_jobs WHERE id=$1 FOR UPDATE',[id]);
 const job=result.rows[0];if(!job)throw new ImportError(404,'Import not found');
 if(job.status==='completed'&&allowComplete)return job;
 if(job.status==='completed')throw new ImportError(409,'This import is already complete');
 if(job.status==='expired'||new Date(job.expires_at).getTime()<=Date.now())throw new ImportError(410,'Staging expired. Create a new import');
 return job;
}
export function readRow(row:{data_cipher:Buffer;row_number:number},job:string):{cells:string[];normalized?:Normalized}{return JSON.parse(unseal(row.data_cipher,`${job}:${row.row_number}`).toString('utf8'));}
export async function findMatches(db:PoolClient,p:Normalized,source:string){
 const exact=await db.query(`SELECT id FROM public.patients WHERE lower(patient_number)=lower($1)
 UNION SELECT patient_id AS id FROM public.patient_import_provenance WHERE source_system=$2 AND source_identifier_hash=$3`,[p.patient.patient_number,source,sourceHash(p.source_id)]);
 const demographic=await db.query(`SELECT id FROM public.patients WHERE lower(regexp_replace(trim(full_name),'\\s+',' ','g'))=lower(regexp_replace(trim($1::text),'\\s+',' ','g'))
 OR ($2::date IS NOT NULL AND $3::text IS NOT NULL AND date_of_birth=$2::date AND regexp_replace(contact_number,'[^0-9]','','g')=regexp_replace($3::text,'[^0-9]','','g')) ORDER BY id LIMIT 21`,[p.patient.full_name,p.patient.date_of_birth,p.patient.contact_number]);
 const matches=[...new Set([...exact.rows,...demographic.rows].map(r=>String(r.id)))];
 return {matches,exact:Boolean(exact.rowCount),name:Boolean(demographic.rowCount),tooMany:(demographic.rowCount??0)>20};
}
export async function validateRows(db:PoolClient,job:Record<string,any>,actor:string,mapping:Mapping,order:'DMY'|'MDY'|'ISO'){
 const seen=new Set<string>();let after=1;
 while(true){const batch=await db.query('SELECT row_number,data_cipher FROM public.patient_import_rows WHERE job_id=$1 AND row_number>$2 ORDER BY row_number LIMIT 100',[job.id,after]);if(!batch.rowCount)break;
  for(const row of batch.rows){const data=readRow(row,job.id),p=normalize(data.cells,mapping,order,seen);const found=p.issues.length?{matches:[],exact:false,name:false,tooMany:false}:await findMatches(db,p,job.source_system);if(found.exact)p.issues.push('existing_identifier');else if(found.name)p.warnings.push('possible_demographic_duplicate');if(found.tooMany)p.issues.push('too_many_matches');
   await db.query('UPDATE public.patient_import_rows SET data_cipher=$3,issues=$4,warnings=$5,matches=$6,decision=$7 WHERE job_id=$1 AND row_number=$2',[job.id,row.row_number,seal(JSON.stringify({cells:data.cells,normalized:p}),`${job.id}:${row.row_number}`),p.issues,p.warnings,found.matches,'review']);after=row.row_number;
  }
 }
 await db.query("UPDATE public.patient_import_jobs SET status='validated',mapping=$2,date_order=$3,revision=revision+1 WHERE id=$1",[job.id,JSON.stringify(mapping),order]);await event(db,job.id,actor,'validated',{mapping,date_order:order});
}
export async function confirmImport(pool:Pick<Pool,'connect'>,id:string,actor:string,revision:number){
 return transaction(pool,async db=>{
  const job=await lockJob(db,id,actor,true);
  if(job.status==='completed')return {status:'completed',imported_count:job.imported_count,skipped_count:job.skipped_count,replayed:true};
  if(job.status!=='validated'||job.revision!==revision)throw new ImportError(409,'Review the current import revision before confirming');
  // Blocks concurrent manual patient writes and concurrent import commits while rechecking duplicates.
  await db.query('LOCK TABLE public.patients IN SHARE ROW EXCLUSIVE MODE');
  let after=1,imported=0,skipped=0;const created=new Set<string>();
  while(true){const batch=await db.query('SELECT * FROM public.patient_import_rows WHERE job_id=$1 AND row_number>$2 ORDER BY row_number LIMIT 100',[id,after]);if(!batch.rowCount)break;
   for(const row of batch.rows){after=row.row_number;if(row.decision==='skip'){skipped++;continue;}if(row.decision!=='create'||!mayCreate(row,true))throw new ImportError(409,'Every row must be resolved; invalid records must be skipped');
    const data=readRow(row,id),p=data.normalized;if(!p)throw new ImportError(409,'Validate records first');const match=await findMatches(db,p,job.source_system);
    if(match.exact||JSON.stringify(match.matches.filter(id=>!created.has(id)).sort())!==JSON.stringify([...row.matches].sort()))throw new ImportError(409,'Patient matches changed. Validate and review this import again');
    const patient=p.patient;const result=await db.query('INSERT INTO public.patients(patient_number,full_name,date_of_birth,contact_number,profile_id) VALUES($1,$2,$3,$4,NULL) RETURNING id',[patient.patient_number,patient.full_name,patient.date_of_birth,patient.contact_number]);const patientId=result.rows[0].id;
    await db.query(`INSERT INTO public.patient_import_provenance(job_id,row_number,patient_id,source_system,source_identifier_hash,source_identifier_cipher,source_file_hash,imported_by) VALUES($1,$2,$3,$4,$5,$6,$7,$8)`,[id,row.row_number,patientId,job.source_system,sourceHash(p.source_id),seal(p.source_id,`${id}:${row.row_number}:source`),job.file_hash,actor]);
    created.add(patientId);await db.query('UPDATE public.patient_import_rows SET patient_id=$3 WHERE job_id=$1 AND row_number=$2',[id,row.row_number,patientId]);
    await db.query("INSERT INTO public.audit_logs(actor_profile_id,action,entity_type,entity_id) VALUES($1,'patient.imported','patient',$2)",[actor,patientId]);imported++;
   }
  }
  await db.query("UPDATE public.patient_import_jobs SET status='completed',completed_at=now(),imported_count=$2,skipped_count=$3,source_cipher=NULL WHERE id=$1",[id,imported,skipped]);
  await event(db,id,actor,'completed',{imported,skipped,revision});return {status:'completed',imported_count:imported,skipped_count:skipped,replayed:false};
 });
}
// No patient values in error reports: row numbers + stable issue codes only.
export const errorColumns=['row_number','decision','issues','warnings'];
