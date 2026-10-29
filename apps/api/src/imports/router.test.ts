import test from 'node:test';
import assert from 'node:assert/strict';
import express, { type RequestHandler } from 'express';
import type { Pool } from 'pg';
import { createImportRouter } from './router.js';
import { authenticate } from '../middleware/authenticate.js';

test('every import endpoint rejects missing authentication before touching data or parser',async()=>{
 let calls=0;const pool={query:async()=>{calls++;throw new Error('Should not query');}} as unknown as Pool;
 const app=express();app.use('/imports',createImportRouter(pool,authenticate));const server=app.listen(0,'127.0.0.1');await new Promise<void>(resolve=>server.once('listening',resolve));const address=server.address();assert.ok(address&&typeof address==='object');
 try{for(const [method,path] of [['GET','/capabilities'],['GET','/'],['POST','/'],['PUT','/b97a2474-5cdd-4c3d-9c6b-ddc740cd0434/file'],...['validate','decisions','confirm'].map(s=>['POST',`/b97a2474-5cdd-4c3d-9c6b-ddc740cd0434/${s}`]),...['','/rows','/events','/errors'].map(s=>['GET',`/b97a2474-5cdd-4c3d-9c6b-ddc740cd0434${s}`]),['DELETE','/b97a2474-5cdd-4c3d-9c6b-ddc740cd0434']]){const response:Response=await fetch(`http://127.0.0.1:${address.port}/imports${path}`,{method:method!});assert.equal(response.status,401,`${method} ${path}`);assert.equal(response.headers.get('cache-control'),'no-store');}assert.equal(calls,0);}finally{server.closeAllConnections();await new Promise<void>((resolve,reject)=>server.close(e=>e?reject(e):resolve()));}
});
test('administrator policy rejects other roles and inactive/ineligible accounts on every endpoint',async()=>{
 const identities:Record<string,boolean>={general:false,patient:false,nurse:false,midwife:false,receptionist:false,inactive_admin:false,admin_with_general_profile:false,admin:true};
 const identity:RequestHandler=(req,res,next)=>{const value=req.headers['x-test-identity'];if(typeof value!=='string'){res.sendStatus(401);return;}(req as import('../middleware/authenticate.js').AuthenticatedRequest).authUserId=value;next();};
 const pool={query:async(sql:string,args:string[])=>{assert.ok(sql.includes("s.is_active AND s.staff_role='admin'"));assert.ok(sql.includes("p.account_type IN ('staff','admin')"));return {rowCount:identities[args[0]!] ? 1 : 0,rows:[]};}} as unknown as Pool;
 const app=express();app.use('/imports',createImportRouter(pool,identity));const server=app.listen(0,'127.0.0.1');await new Promise<void>(resolve=>server.once('listening',resolve));const address=server.address();assert.ok(address&&typeof address==='object');
 const id='b97a2474-5cdd-4c3d-9c6b-ddc740cd0434';const endpoints:[string,string][]=[['GET','/'],['POST','/'],['GET','/capabilities'],['PUT', '/'+id+'/file'],['GET','/'+id],['DELETE','/'+id],...['rows','events','errors'].map(p=>['GET','/'+id+'/'+p] as [string,string]),...['validate','decisions','confirm'].map(p=>['POST','/'+id+'/'+p] as [string,string])];
 try{for(const role of Object.keys(identities).filter(k=>k!=='admin'))for(const [method,path] of endpoints){const response:Response=await fetch('http://127.0.0.1:'+address.port+'/imports'+path,{method,headers:{'x-test-identity':role}});assert.equal(response.status,403,role+' '+path);}assert.equal((await fetch('http://127.0.0.1:'+address.port+'/imports/capabilities',{headers:{'x-test-identity':'admin'}})).status,200);}finally{server.closeAllConnections();await new Promise<void>((resolve,reject)=>server.close(e=>e?reject(e):resolve()));}
});
