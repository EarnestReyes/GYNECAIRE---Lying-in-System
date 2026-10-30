import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import type { Pool } from 'pg';
import type { AuthenticatedRequest } from '../middleware/authenticate.js';
import { authenticate } from '../middleware/authenticate.js';
import { apiErrorHandler } from '../middleware/error-handler.js';
import { avatarRouter,avatarStorage,imageKind,ownedAvatar,normalizeAvatar,AVATAR_LIMIT } from './profile-avatar.js';

test('avatar validation rejects unknown content, empty files, oversized images and foreign paths',async()=>{
 assert.equal(imageKind(Buffer.from('<svg/>')),null);assert.equal(imageKind(Buffer.from([255,216,255])),'jpeg');
 const id='5afc17cc-f2f8-4ff9-84f3-242f162930ea';assert.equal(ownedAvatar(id+'/fbbc17cc-f2f8-4ff9-84f3-242f162930ea.jpg',id),true);assert.equal(ownedAvatar('../other.jpg',id),false);assert.equal(ownedAvatar('other/file.jpg',id),false);
 for(const input of [Buffer.alloc(0),Buffer.from('not an image'),Buffer.alloc(AVATAR_LIMIT+1)])await assert.rejects(normalizeAvatar(input));
});
test('own-avatar HTTP lifecycle checks active staff, isolates object paths, rolls back and queues cleanup',async()=>{
 const id='5afc17cc-f2f8-4ff9-84f3-242f162930ea';let path:string|null=null,before:string|null=null,allowed=true,failAudit=false,failStorage=false;const removed:string[]=[],uploads:string[]=[],queue=new Set<string>();
 const db={async query(sql:string,args:unknown[]=[]):Promise<any>{
  if(sql==='BEGIN'){before=path;return {rows:[],rowCount:0};}
  if(sql==='ROLLBACK'){path=before;return {rows:[],rowCount:0};}
  if(sql.startsWith('SELECT p.avatar_path')){assert.equal(args[0],id);assert.ok(sql.includes('s.is_active'));assert.ok(sql.includes('FOR UPDATE'));return {rows:allowed?[{avatar_path:path}]:[],rowCount:allowed?1:0};}
  if(sql.startsWith('SELECT avatar_path'))return {rows:[{avatar_path:path}],rowCount:1};
  if(sql.startsWith('UPDATE public.profiles')){assert.equal(args[0],id);assert.ok(!sql.includes('staff_role')&&!sql.includes('account_type'));path=args[1] as string|null;}
  if(sql.startsWith('INSERT INTO public.audit_logs')&&failAudit)throw Error('synthetic');
  if(sql.startsWith('INSERT INTO public.avatar_cleanup'))queue.add(args[0] as string);
  if(sql.startsWith('DELETE FROM public.avatar_cleanup'))queue.delete(args[0] as string);
  return {rows:[],rowCount:1};
 },release(){}};
 const pool={query:db.query,connect:async()=>db} as unknown as Pool;
 const storage={async put(p:string){assert.equal(ownedAvatar(p,id),true);if(failStorage)throw Error('synthetic');uploads.push(p);},async remove(p:string){removed.push(p);},async sign(p:string){return 'https://synthetic.invalid/'+p;}};
 const app=express();app.use('/unauthenticated',authenticate,avatarRouter(pool,()=>storage));app.use((req:AuthenticatedRequest,_res,next)=>{req.authUserId=id;next();});app.use('/disabled',avatarRouter(pool,()=>null));app.use('/photo',avatarRouter(pool,()=>storage,async bytes=>{if(!Buffer.isBuffer(bytes)||!imageKind(bytes))throw Error('invalid');return bytes;}));app.use(apiErrorHandler);
 const server=app.listen(0,'127.0.0.1');await new Promise<void>(r=>server.once('listening',r));const address=server.address();assert.ok(address&&typeof address==='object');const base='http://127.0.0.1:'+address.port;
 const put=(url='/photo',bytes=Buffer.from([255,216,255]))=>fetch(base+url,{method:'PUT',headers:{'Content-Type':'application/octet-stream'},body:bytes});
 try{
  assert.equal((await fetch(base+'/unauthenticated')).status,401);
  assert.deepEqual(await (await fetch(base+'/disabled')).json(),{available:false,url:null});assert.equal((await put('/disabled')).status,503);
  assert.equal((await put('/photo',Buffer.from('invalid'))).status,422);assert.equal((await put('/photo',Buffer.alloc(AVATAR_LIMIT+1))).status,413);
  allowed=false;assert.equal((await put()).status,403);assert.equal(uploads.length,0);allowed=true;
  assert.equal((await put()).status,200);const first=path;assert.ok(first);assert.ok((await (await fetch(base+'/photo')).json()).url.endsWith(first));
  assert.equal((await put()).status,200);assert.notEqual(path,first);assert.ok(removed.includes(first));const second=path;
  failAudit=true;assert.equal((await put()).status,503);assert.equal(path,second);failAudit=false;
  failStorage=true;assert.equal((await put()).status,503);assert.equal(path,second);failStorage=false;
  assert.equal((await fetch(base+'/photo',{method:'DELETE'})).status,200);assert.equal(path,null);assert.ok(removed.includes(second!));
 }finally{server.closeAllConnections();await new Promise<void>((r,j)=>server.close(e=>e?j(e):r()));}
});

test('real decoder validates content and emits a stripped square JPEG when sharp is installed',async t=>{
 const name='sharp';let sharp:any;try{sharp=(await import(name)).default;}catch{t.skip('sharp could not be installed through the configured registry');return;}
 const png=await sharp({create:{width:32,height:16,channels:3,background:'#cc6699'}}).png().toBuffer();
 const result=await normalizeAvatar(png);const metadata=await sharp(result).metadata();assert.equal(metadata.width,512);assert.equal(metadata.height,512);assert.equal(metadata.format,'jpeg');assert.equal(metadata.exif,undefined);
 await assert.rejects(normalizeAvatar(Buffer.from([255,216,255,0,1])));
});

test('private storage adapter uses server credentials, unique object uploads and five-minute signing',async()=>{
 const before={enabled:process.env.AVATARS_ENABLED,url:process.env.SUPABASE_URL,key:process.env.SUPABASE_SERVICE_ROLE_KEY};const original=globalThis.fetch;const calls:{url:string;init:RequestInit}[]=[];
 try{process.env.AVATARS_ENABLED='false';assert.equal(avatarStorage(),null);process.env.AVATARS_ENABLED='true';process.env.SUPABASE_URL='https://synthetic.invalid';process.env.SUPABASE_SERVICE_ROLE_KEY='synthetic-test-only';
  globalThis.fetch=async(input,init)=>{calls.push({url:String(input),init:init!});return new Response(JSON.stringify({signedURL:'/object/sign/staff-avatars/own.jpg?token=synthetic'}),{status:200,headers:{'Content-Type':'application/json'}});};
  const storage=avatarStorage()!;await storage.put('own/new.jpg',Buffer.from('synthetic'));await storage.sign('own/new.jpg');await storage.remove('own/old.jpg');
  assert.equal(calls[0]!.init.method,'POST');assert.equal((calls[0]!.init.headers as Record<string,string>)['Content-Type'],'image/jpeg');assert.equal(calls[1]!.init.body,JSON.stringify({expiresIn:300}));assert.equal(calls[2]!.init.method,'DELETE');assert.equal(calls[2]!.init.body,JSON.stringify({prefixes:['own/old.jpg']}));assert.ok(calls.every(call=>(call.init.headers as Record<string,string>).Authorization==='Bearer synthetic-test-only'));
 }finally{globalThis.fetch=original;for(const [key,value] of Object.entries({AVATARS_ENABLED:before.enabled,SUPABASE_URL:before.url,SUPABASE_SERVICE_ROLE_KEY:before.key})){if(value===undefined)delete process.env[key];else process.env[key]=value;}}
});
