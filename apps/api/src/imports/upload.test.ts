import test from 'node:test';
import assert from 'node:assert/strict';
import express, { type RequestHandler } from 'express';
import type { Pool } from 'pg';
import type { AuthenticatedRequest } from '../middleware/authenticate.js';
import { createImportRouter, readiness } from './router.js';

const jobId='b97a2474-5cdd-4c3d-9c6b-ddc740cd0434';
// Only transport/orchestration is integrated here. No deployed database or actual file parser.
test('upload transport rejects invalid bodies; quarantine failures roll back without parsing',async()=>{
 let scanFails=true,parseFails=false,parseCalls=0,rollback=0,staged=0,enabled=true;const queries:string[]=[];
 const db={async query(sql:string):Promise<any>{queries.push(sql);if(sql==='ROLLBACK')rollback++;if(sql.startsWith('SELECT s.id'))return {rows:[{id:'admin'}],rowCount:1};if(sql.startsWith('SELECT * FROM public.patient_import_jobs'))return {rows:[{id:jobId,status:'created',filename:'synthetic.csv',expires_at:new Date(Date.now()+60000)}],rowCount:1};if(sql.startsWith('UPDATE public.patient_import_jobs'))staged++;return {rows:[],rowCount:0};},release(){}};
 const pool={query:db.query,connect:async()=>db} as unknown as Pool;const identity:RequestHandler=(req,_res,next)=>{(req as AuthenticatedRequest).authUserId='synthetic-admin';next();};
 const app=express();app.use('/imports',createImportRouter(pool,identity,{readiness:()=>({...readiness(),enabled}),scanFile:async()=>{if(scanFails)throw new Error('Sensitive scanner details must never reach the client');},parseFile:async()=>{parseCalls++;if(parseFails)throw new Error('Sensitive parser details must never reach the client');return {headers:['Name','Number'],rows:[['Synthetic Only','P-1']]};}}));
 const server=app.listen(0,'127.0.0.1');await new Promise<void>(resolve=>server.once('listening',resolve));const address=server.address();assert.ok(address&&typeof address==='object');const url=`http://127.0.0.1:${address.port}/imports/${jobId}`;
 try{
  const invalidJson=await fetch(url+'/confirm',{method:'POST',headers:{'content-type':'application/json'},body:'{"synthetic-private-field":'});assert.equal(invalidJson.status,400);assert.ok(!(await invalidJson.text()).includes('synthetic-private-field'));
  assert.equal((await fetch(url+'/file',{method:'PUT',headers:{'content-type':'text/plain'},body:'synthetic'})).status,400);
  assert.equal((await fetch(url+'/file',{method:'PUT',headers:{'content-type':'application/octet-stream'},body:Buffer.alloc(0)})).status,400);
  assert.equal((await fetch(url+'/file',{method:'PUT',headers:{'content-type':'application/octet-stream'},body:Buffer.alloc(8*1024*1024+1)})).status,413);
  const blocked=await fetch(url+'/file',{method:'PUT',headers:{'content-type':'application/octet-stream'},body:'synthetic'});assert.equal(blocked.status,422);assert.ok(!(await blocked.text()).includes('Sensitive'));assert.equal(parseCalls,0);assert.equal(rollback,1);assert.equal(staged,0);
  scanFails=false;parseFails=true;const malformed=await fetch(url+'/file',{method:'PUT',headers:{'content-type':'application/octet-stream'},body:'synthetic'});assert.equal(malformed.status,422);assert.ok(!(await malformed.text()).includes('Sensitive'));assert.equal(rollback,2);assert.equal(staged,0);
  enabled=false;assert.equal((await fetch(url+'/confirm',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({revision:1,confirm:true})})).status,503);
  assert.equal((await fetch(url+'/file',{method:'PUT',headers:{'content-type':'application/octet-stream'},body:'synthetic'})).status,503);
  assert.ok(!queries.some(q=>q.startsWith('INSERT INTO public.patients')));
 }finally{server.closeAllConnections();await new Promise<void>((resolve,reject)=>server.close(e=>e?reject(e):resolve()));}
});
