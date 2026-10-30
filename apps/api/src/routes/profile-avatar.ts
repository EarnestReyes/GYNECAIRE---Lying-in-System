import { Router, raw } from 'express';
import { randomUUID } from 'node:crypto';
import { rateLimit } from 'express-rate-limit';
import type { Pool } from 'pg';
import type { AuthenticatedRequest } from '../middleware/authenticate.js';

export const AVATAR_LIMIT=2*1024*1024;
export function imageKind(bytes:Buffer){
 if(bytes.length>=3&&bytes[0]===255&&bytes[1]===216&&bytes[2]===255)return 'jpeg';
 if(bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])))return 'png';
 if(bytes.toString('ascii',0,4)==='RIFF'&&bytes.toString('ascii',8,12)==='WEBP')return 'webp';
 return null;
}
export function ownedAvatar(path:string,id:string){return /^[a-f0-9-]{36}$/i.test(id)&&path.toLowerCase().startsWith(id.toLowerCase()+'/')&&/^[a-f0-9-]{36}\.jpg$/i.test(path.slice(id.length+1));}
type Storage={put:(path:string,bytes:Buffer)=>Promise<void>;remove:(path:string)=>Promise<void>;sign:(path:string)=>Promise<string>};
export function avatarStorage():Storage|null{
 const base=process.env.SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(process.env.AVATARS_ENABLED!=='true'||!base?.startsWith('https://')||!key)return null;
 const root=base.replace(/\/$/,'')+'/storage/v1';
 const secret=key;
 async function request(path:string,method:string,body?:BodyInit,contentType='application/json'){const response=await fetch(root+path,{method,headers:{Authorization:'Bearer '+secret,apikey:secret,'Content-Type':contentType},...(body===undefined?{}:{body}),signal:AbortSignal.timeout(10000)});if(!response.ok)throw new Error('Storage unavailable');return response;}
 return {async put(path,bytes){await request('/object/staff-avatars/'+path,'POST',new Uint8Array(bytes),'image/jpeg');},async remove(path){await request('/object/staff-avatars','DELETE',JSON.stringify({prefixes:[path]}));},async sign(path){const data=await (await request('/object/sign/staff-avatars/'+path,'POST',JSON.stringify({expiresIn:300}))).json() as {signedURL:string};if(!data.signedURL?.startsWith('/object/sign/'))throw new Error('Invalid storage response');return root+data.signedURL;}};
}
export async function normalizeAvatar(bytes:Buffer):Promise<Buffer>{
 if(!Buffer.isBuffer(bytes)||!bytes.length||bytes.length>AVATAR_LIMIT||!imageKind(bytes))throw new Error('Choose a JPEG, PNG or WebP image up to 2 MB.');
 // Dynamic loading keeps all other clinic workflows usable when the native decoder is unavailable.
 const moduleName='sharp';const {default:sharp}=await import(moduleName);
 const image=sharp(bytes,{limitInputPixels:16000000,animated:false,failOn:'warning'});
 const meta=await image.metadata();if(!['jpeg','png','webp'].includes(meta.format)||!meta.width||!meta.height||(meta.pages??1)>1)throw new Error('Unsupported image');
 return image.rotate().resize(512,512,{fit:'cover'}).jpeg({quality:85}).toBuffer();
}
export function avatarRouter(pool:Pool,storageFactory=avatarStorage,normalize=normalizeAvatar){
 const router=Router();
 const limit=rateLimit({windowMs:15*60*1000,limit:20,keyGenerator:req=>(req as AuthenticatedRequest).authUserId??'unauthenticated',message:{error:'Too many photo changes. Please try again later.'},standardHeaders:'draft-8',legacyHeaders:false});
 router.get('/',async(req:AuthenticatedRequest,res)=>{try{
  const storage=storageFactory();if(!storage){res.json({available:false,url:null});return;}
  if(normalize===normalizeAvatar){try{const decoder='sharp';await import(decoder);}catch{res.json({available:false,url:null});return;}}
  const result=await pool.query('SELECT avatar_path FROM public.profiles WHERE id=$1',[req.authUserId]);const path=result.rows[0]?.avatar_path;
  res.json({available:true,url:path&&ownedAvatar(path,req.authUserId!)?await storage.sign(path):null});
 }catch{res.status(503).json({error:'Profile photos are unavailable. Check storage configuration and migration.'});}});
 router.put('/',limit,raw({type:'application/octet-stream',limit:AVATAR_LIMIT}),async(req:AuthenticatedRequest,res)=>{await change(req,res,false);});
 router.delete('/',limit,async(req:AuthenticatedRequest,res)=>{await change(req,res,true);});
 async function change(req:AuthenticatedRequest,res:import('express').Response,remove:boolean){
  const storage=storageFactory();if(!storage){res.status(503).json({error:'Profile photos are not configured yet.'});return;}
  let bytes:Buffer|undefined;
  if(!remove){try{bytes=await normalize(req.body);}catch{res.status(422).json({error:'Image could not be processed. Choose a valid, single-frame JPEG, PNG or WebP up to 2 MB and 16 megapixels. The server image decoder must be installed.'});return;}}
  const db=await pool.connect().catch(()=>null);if(!db){res.status(503).json({error:'Profile service unavailable'});return;}
  let uploaded:string|null=null,committing=false,committed=false;
  try{await db.query('BEGIN');await db.query("SET LOCAL lock_timeout='10s'");
   const eligible=await db.query(`SELECT p.avatar_path FROM public.profiles p JOIN public.staff_members s ON s.profile_id=p.id WHERE p.id=$1 AND s.is_active AND p.account_type IN ('staff','admin') FOR UPDATE OF p,s`,[req.authUserId]);
   if(!eligible.rowCount){await db.query('ROLLBACK');res.status(403).json({error:'Active staff access required'});return;}
   const old=eligible.rows[0].avatar_path as string|null;
   const next=remove?null:req.authUserId+'/'+randomUUID()+'.jpg';
   if(next&&bytes){await pool.query('INSERT INTO public.avatar_cleanup(object_path) VALUES($1) ON CONFLICT DO NOTHING',[next]);uploaded=next;await storage.put(next,bytes);await db.query('DELETE FROM public.avatar_cleanup WHERE object_path=$1',[next]);}
   await db.query('UPDATE public.profiles SET avatar_path=$2,updated_at=now() WHERE id=$1',[req.authUserId,next]);
   if(old&&ownedAvatar(old,req.authUserId!))await db.query('INSERT INTO public.avatar_cleanup(object_path) VALUES($1) ON CONFLICT DO NOTHING',[old]);
   await db.query("INSERT INTO public.audit_logs(actor_profile_id,action,entity_type,entity_id) VALUES($1,$2,'profile',$1)",[req.authUserId,remove?'profile.avatar_removed':'profile.avatar_updated']);
   committing=true;await db.query('COMMIT');committed=true;
   // Durable cleanup queue retains failures for the operator's retry job.
   if(old&&ownedAvatar(old,req.authUserId!)){try{await storage.remove(old);await pool.query('DELETE FROM public.avatar_cleanup WHERE object_path=$1',[old]);}catch{/* Queue remains. */}}
   res.json({saved:true});
  }catch{await db.query('ROLLBACK').catch(()=>{});if(uploaded&&!committing&&!committed)await storage.remove(uploaded).catch(()=>{});res.status(503).json({error:'Photo could not be saved. Refresh your profile before retrying.'});}finally{db.release();}
 }
 return router;
}

// Grace period protects in-flight uploads. Never delete a currently referenced object.
export async function purgeAvatarObjects(pool:Pool){
 const storage=avatarStorage();if(!storage)return;
 const result=await pool.query(`SELECT object_path FROM public.avatar_cleanup q WHERE created_at < now()-interval '1 hour' AND NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.avatar_path=q.object_path) LIMIT 50`);
 for(const row of result.rows){const path=String(row.object_path);if(!/^[a-f0-9-]{36}\/[a-f0-9-]{36}\.jpg$/i.test(path))continue;await storage.remove(path);await pool.query('DELETE FROM public.avatar_cleanup WHERE object_path=$1',[path]);}
}
