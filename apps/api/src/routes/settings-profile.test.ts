import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import type { Pool } from 'pg';
import type { AuthenticatedRequest } from '../middleware/authenticate.js';
import { authenticate } from '../middleware/authenticate.js';
import { profileRouter } from './settings-profile.js';
test('profile endpoint preserves identity/roles, audits successful changes and rolls back audit failure',async()=>{
 let current={id:'own-identity',full_name:'Synthetic Staff',phone_number:null as string|null},before={...current},allowed=true,failAudit=false,audits=0,released=0;const mutations:string[]=[];
 const db={async query(sql:string,args:unknown[]=[]):Promise<any>{
  if(sql==='BEGIN'){before={...current};return {rowCount:0,rows:[]};}if(sql==='ROLLBACK'){current={...before};return {rowCount:0,rows:[]};}
  if(sql.startsWith('SELECT p.id')){assert.equal(args[0],'own-identity');assert.ok(sql.includes('s.is_active'));assert.ok(sql.includes("p.account_type IN ('staff','admin')"));return {rowCount:allowed?1:0,rows:allowed?[{...current,staff_role:'nurse',is_active:true}]:[]};}
  if(sql.startsWith('UPDATE')){mutations.push(sql);assert.ok(!sql.includes('staff_role=')&&!sql.includes('account_type=')&&!sql.includes('is_active='));assert.equal(args[0],'own-identity');current={id:'own-identity',full_name:args[1] as string,phone_number:args[2] as string|null};return {rowCount:1,rows:[current]};}
  if(sql.startsWith('INSERT')){assert.ok(sql.includes('profile.updated'));if(failAudit)throw new Error('Synthetic audit failure');audits++;return {rowCount:1,rows:[]};}return {rowCount:0,rows:[]};
 },release(){released++;}};
 const pool={query:db.query,connect:async()=>db} as unknown as Pool;const app=express();app.use(express.json());app.use('/profile',(req:AuthenticatedRequest,_res,next)=>{req.authUserId='own-identity';next();},profileRouter(pool));app.use('/unauthenticated',authenticate,profileRouter(pool));const server=app.listen(0,'127.0.0.1');await new Promise<void>(resolve=>server.once('listening',resolve));const address=server.address();assert.ok(address&&typeof address==='object');const url='http://127.0.0.1:'+address.port;
 const patch=(body:object)=>fetch(url+'/profile',{method:'PATCH',headers:{'content-type':'application/json'},body:JSON.stringify(body)});
 try{assert.equal((await fetch(url+'/unauthenticated')).status,401);assert.equal((await fetch(url+'/profile')).status,200);assert.equal((await patch({full_name:'Changed',phone_number:null,staff_role:'admin'})).status,400);assert.equal(mutations.length,0);
  allowed=false;assert.equal((await patch({full_name:'Changed',phone_number:null})).status,403);assert.equal(current.full_name,'Synthetic Staff');allowed=true;
  assert.equal((await patch({full_name:'Updated Synthetic',phone_number:'09123456789'})).status,200);assert.equal(current.full_name,'Updated Synthetic');assert.equal(audits,1);
  failAudit=true;assert.equal((await patch({full_name:'Should roll back',phone_number:null})).status,503);assert.equal(current.full_name,'Updated Synthetic');assert.equal(released,3);
 }finally{server.closeAllConnections();await new Promise<void>((resolve,reject)=>server.close(e=>e?reject(e):resolve()));}
});
