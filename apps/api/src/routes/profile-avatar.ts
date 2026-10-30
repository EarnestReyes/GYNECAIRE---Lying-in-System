import { Router, raw } from 'express';
import { randomUUID } from 'node:crypto';
import { rateLimit } from 'express-rate-limit';
import type { Pool } from 'pg';
import type { AuthenticatedRequest } from '../middleware/authenticate.js';

export const AVATAR_LIMIT=3*1024*1024;
export type AvatarIssue='disabled'|'storage_key_missing'|'supabase_url_missing'|'decoder_missing'|'schema_unavailable'|'bucket_unavailable'|'bucket_incompatible'|'photo_unavailable';
export function avatarConfigurationIssues(env:NodeJS.ProcessEnv=process.env):AvatarIssue[]{
 const issues:AvatarIssue[]=[];
 if(env.AVATARS_ENABLED!=='true')issues.push('disabled');
 if(!env.SUPABASE_SERVICE_ROLE_KEY?.trim())issues.push('storage_key_missing');
 try{if(new URL(env.SUPABASE_URL??'').protocol!=='https:')throw Error();}catch{issues.push('supabase_url_missing');}
 return issues;
}
export function imageKind(bytes:Buffer){
 if(bytes.length>=3&&bytes[0]===255&&bytes[1]===216&&bytes[2]===255)return 'jpeg';
 if(bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])))return 'png';
 if(bytes.toString('ascii',0,4)==='RIFF'&&bytes.toString('ascii',8,12)==='WEBP')return 'webp';
 return null;
}
export function ownedAvatar(path:string,id:string){return /^[a-f0-9-]{36}$/i.test(id)&&path.toLowerCase().startsWith(id.toLowerCase()+'/')&&/^[a-f0-9-]{36}\.jpg$/i.test(path.slice(id.length+1));}
type Storage={put:(path:string,bytes:Buffer)=>Promise<void>;remove:(path:string)=>Promise<void>;sign:(path:string)=>Promise<string>;inspect?:()=>Promise<boolean>};
export function avatarStorage():Storage|null{
 const base=process.env.SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;
 // Reads/removal do not depend on a native decoder or the upload enable flag.
 if(avatarConfigurationIssues().some(issue=>issue!=='disabled')||!base||!key)return null;
 const root=base.replace(/\/$/,'')+'/storage/v1';
 const secret=key;
 async function request(path:string,method:string,body?:BodyInit,contentType='application/json'){const response=await fetch(root+path,{method,headers:{Authorization:'Bearer '+secret,apikey:secret,'Content-Type':contentType},...(body===undefined?{}:{body}),signal:AbortSignal.timeout(10000)});if(!response.ok)throw new Error('Storage unavailable');return response;}
 return {async inspect(){const bucket=await (await request('/bucket/staff-avatars','GET')).json() as {public?:boolean;file_size_limit?:number;allowed_mime_types?:string[]};return bucket.public===false&&Number(bucket.file_size_limit)>=AVATAR_LIMIT&&bucket.allowed_mime_types?.length===1&&bucket.allowed_mime_types[0]==='image/jpeg';},async put(path,bytes){if(bytes.length>AVATAR_LIMIT||imageKind(bytes)!=='jpeg')throw Error('Invalid normalized JPEG');await request('/object/staff-avatars/'+path,'POST',new Uint8Array(bytes),'image/jpeg');},async remove(path){await request('/object/staff-avatars','DELETE',JSON.stringify({prefixes:[path]}));},async sign(path){const data=await (await request('/object/sign/staff-avatars/'+path,'POST',JSON.stringify({expiresIn:300}))).json() as {signedURL:string};if(!data.signedURL?.startsWith('/object/sign/'))throw new Error('Invalid storage response');return root+data.signedURL;}};
}
export async function normalizeAvatar(bytes:Buffer):Promise<Buffer>{
 if(!Buffer.isBuffer(bytes)||!bytes.length||bytes.length>AVATAR_LIMIT||imageKind(bytes)!=='jpeg')throw new Error('Choose a JPEG image up to 3 MB.');
 // Dynamic loading keeps all other clinic workflows usable when the native decoder is unavailable.
 const moduleName='sharp';const {default:sharp}=await import(moduleName);
 const image=sharp(bytes,{limitInputPixels:16000000,animated:false,failOn:'warning'});
 const meta=await image.metadata();if(meta.format!=='jpeg'||!meta.width||!meta.height||(meta.pages??1)>1)throw new Error('Unsupported image');
 const output:Buffer=await image.rotate().resize(512,512,{fit:'cover'}).jpeg({quality:85}).toBuffer();
 if(output.length>AVATAR_LIMIT)throw Error('Processed image exceeds 3 MB');return output;
}
export function avatarRouter(pool:Pool,storageFactory=avatarStorage,normalize=normalizeAvatar){
 const router=Router();
 const limit=rateLimit({windowMs:15*60*1000,limit:20,keyGenerator:req=>(req as AuthenticatedRequest).authUserId??'unauthenticated',message:{error:'Too many photo changes. Please try again later.'},standardHeaders:'draft-8',legacyHeaders:false});
 router.use((_req,res,next)=>{res.set('Cache-Control','no-store');next();});
 router.get('/',async(req:AuthenticatedRequest,res)=>{
  const issues:AvatarIssue[]=storageFactory===avatarStorage?avatarConfigurationIssues():[];
  if(normalize===normalizeAvatar){try{const decoder='sharp';await import(decoder);}catch{issues.push('decoder_missing');}}
  const storage=storageFactory();let bucketReady=false,schemaReady=false,path:string|null=null,url:string|null=null;
  if(storage){try{bucketReady=storage.inspect?await storage.inspect():true;if(!bucketReady)issues.push('bucket_incompatible');}catch{issues.push('bucket_unavailable');}}
  else if(!issues.length)issues.push('bucket_unavailable');
  try{await pool.query('SELECT object_path,created_at FROM public.avatar_cleanup WHERE false');const result=await pool.query('SELECT avatar_path FROM public.profiles WHERE id=$1',[req.authUserId]);path=result.rows[0]?.avatar_path??null;schemaReady=true;}catch{issues.push('schema_unavailable');}
  if(storage&&bucketReady&&schemaReady&&path){if(ownedAvatar(path,req.authUserId!)){try{url=await storage.sign(path);}catch{issues.push('photo_unavailable');}}else issues.push('photo_unavailable');}
  res.json({available:issues.every(issue=>issue==='photo_unavailable'),canRemove:!!storage&&bucketReady&&schemaReady&&!!path,hasPhoto:!!path,issues,url,maxBytes:AVATAR_LIMIT,acceptedTypes:['image/jpeg']});
 });
 router.put('/',limit,raw({type:'application/octet-stream',limit:AVATAR_LIMIT}),async(req:AuthenticatedRequest,res)=>{await change(req,res,false);});
 router.delete('/',limit,async(req:AuthenticatedRequest,res)=>{await change(req,res,true);});
 async function change(req:AuthenticatedRequest,res:import('express').Response,remove:boolean){
  const storage=storageFactory();if(!storage){res.status(503).json({error:'Profile photos are not configured yet.'});return;}
  if(!remove&&storageFactory===avatarStorage&&process.env.AVATARS_ENABLED!=='true'){res.status(503).json({error:'Photo uploads are disabled. Set AVATARS_ENABLED=true in the API environment after verifying storage.'});return;}
  try{if(storage.inspect&&!await storage.inspect()){res.status(503).json({error:'The existing staff-avatars bucket must be private, JPEG-only, and allow 3 MB images.'});return;}}catch{res.status(503).json({error:'Storage could not be verified. Check the server credential and existing staff-avatars bucket.'});return;}
  let bytes:Buffer|undefined;
  if(!remove){try{bytes=await normalize(req.body);}catch{res.status(422).json({error:'Image could not be processed. Choose a valid, single-frame JPEG up to 3 MB and 16 megapixels. The server image decoder must be installed.'});return;}}
  const db=await pool.connect().catch(()=>null);if(!db){res.status(503).json({error:'Profile service unavailable'});return;}
  const next=remove?null:req.authUserId+'/'+randomUUID()+'.jpg';
  let uploaded:string|null=null,committing=false,committed=false;
  try{
   // Autocommit intent using this connection before BEGIN. Requesting a second
   // connection while holding profile locks can deadlock an exhausted pool.
   if(next)await db.query('INSERT INTO public.avatar_cleanup(object_path) VALUES($1) ON CONFLICT DO NOTHING',[next]);
   await db.query('BEGIN');await db.query("SET LOCAL lock_timeout='10s'");await db.query("SET LOCAL statement_timeout='30s'");
   const eligible=await db.query(`SELECT p.avatar_path FROM public.profiles p JOIN public.staff_members s ON s.profile_id=p.id WHERE p.id=$1 AND s.is_active AND p.account_type IN ('staff','admin') FOR UPDATE OF p,s`,[req.authUserId]);
   if(!eligible.rowCount){await db.query('ROLLBACK');res.status(403).json({error:'Active staff access required'});return;}
   const old=eligible.rows[0].avatar_path as string|null;
   if(next&&bytes){uploaded=next;await storage.put(next,bytes);await db.query('DELETE FROM public.avatar_cleanup WHERE object_path=$1',[next]);}
   await db.query('UPDATE public.profiles SET avatar_path=$2,updated_at=now() WHERE id=$1',[req.authUserId,next]);
   if(old&&ownedAvatar(old,req.authUserId!))await db.query('INSERT INTO public.avatar_cleanup(object_path) VALUES($1) ON CONFLICT DO NOTHING',[old]);
   await db.query("INSERT INTO public.audit_logs(actor_profile_id,action,entity_type,entity_id) VALUES($1,$2,'profile',$1)",[req.authUserId,remove?'profile.avatar_removed':'profile.avatar_updated']);
   committing=true;await db.query('COMMIT');committed=true;
   // Durable cleanup queue retains failures for the operator's retry job.
   if(old&&ownedAvatar(old,req.authUserId!)){try{await storage.remove(old);await db.query('DELETE FROM public.avatar_cleanup WHERE object_path=$1',[old]);}catch{/* Queue remains. */}}
   res.json({saved:true});
  }catch{await db.query('ROLLBACK').catch(()=>{});if(uploaded&&!committing&&!committed)await storage.remove(uploaded).catch(()=>{});res.status(503).json({error:'Photo could not be saved. Refresh your profile before retrying.'});}finally{db.release();}
 }
 return router;
}

// Grace period protects in-flight uploads. Never delete a currently referenced object.
export async function purgeAvatarObjects(pool:Pool,storage:Storage|null=avatarStorage()){
 if(!storage)return;
 const result=await pool.query(`SELECT object_path FROM public.avatar_cleanup q WHERE created_at < now()-interval '1 hour' AND NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.avatar_path=q.object_path) LIMIT 50`);
 let failed=0;
 for(const row of result.rows){const path=String(row.object_path);if(!/^[a-f0-9-]{36}\/[a-f0-9-]{36}\.jpg$/i.test(path))continue;try{await storage.remove(path);await pool.query('DELETE FROM public.avatar_cleanup WHERE object_path=$1',[path]);}catch{failed++;}}
 return {failed};
}
