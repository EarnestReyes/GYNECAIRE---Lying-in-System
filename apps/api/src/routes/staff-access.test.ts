import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import type { Pool } from 'pg';
import type { AuthenticatedRequest } from '../middleware/authenticate.js';
import { staffAccessRouter } from './staff-access.js';
import { staffAccessSchema } from '../validation/staff-access.js';

test('access schema rejects unknown roles, privilege fields and unreviewed updates',()=>{
 for(const body of [{staff_role:'doctor',is_active:true,expected:{staff_role:'nurse',is_active:true}},{staff_role:'admin',is_active:true},{staff_role:'admin',is_active:true,expected:{staff_role:'nurse',is_active:true},account_type:'admin'}])assert.equal(staffAccessSchema.safeParse(body).success,false);
});
test('staff access rejects non-admin/self/stale/ineligible changes; successful mutations are atomic and audited',async()=>{
 const id='d97a2474-5cdd-4c3d-9c6b-ddc740cd0434';let admin=true,fail=false,releases=0,locked=false,audits=0;
 let member={id,profile_id:'target',staff_role:'nurse',is_active:true,account_type:'staff'},before={...member},beforeAudits=0;
 const db={async query(sql:string,args:any[]=[]):Promise<any>{
  if(sql==='BEGIN'){before={...member};beforeAudits=audits;locked=false;}if(sql==='ROLLBACK'){member={...before};audits=beforeAudits;}
  if(sql.includes('pg_advisory_xact_lock'))locked=true;
  if(sql.startsWith('SELECT s.id FROM')){assert.ok(locked);assert.equal(args[0],'actor');assert.ok(sql.includes("s.staff_role='admin'"));return {rowCount:admin?1:0,rows:admin?[{id:'actor-staff'}]:[]};}
  if(sql.startsWith('SELECT s.id,s.profile_id'))return {rowCount:1,rows:[{...member}]};
  if(sql.startsWith('UPDATE')){assert.ok(!sql.includes('profiles'));member={...member,staff_role:args[1],is_active:args[2]};}
  if(sql.startsWith('INSERT')){if(fail)throw new Error('Synthetic failure');audits++;}
  return {rowCount:0,rows:[]};},release(){releases++;}};
 const app=express();app.use(express.json());app.use('/members',(req:AuthenticatedRequest,_res,next)=>{req.authUserId='actor';next();},staffAccessRouter({connect:async()=>db} as unknown as Pool));
 const server=app.listen(0,'127.0.0.1');await new Promise<void>(resolve=>server.once('listening',resolve));const address=server.address();assert.ok(address&&typeof address==='object');const url=`http://127.0.0.1:${address.port}/members/${id}/access`;
 const send=(body:object)=>fetch(url,{method:'PATCH',headers:{'content-type':'application/json'},body:JSON.stringify(body)});const change={staff_role:'midwife',is_active:false,expected:{staff_role:'nurse',is_active:true}};
 try{
  assert.equal((await send({...change,profile_id:'other'})).status,400);admin=false;assert.equal((await send(change)).status,403);admin=true;
  member.profile_id='actor';assert.equal((await send(change)).status,409);member.profile_id='target';member.account_type='general';assert.equal((await send(change)).status,409);member.account_type='staff';
  assert.equal((await send({...change,expected:{staff_role:'admin',is_active:true}})).status,409);
  fail=true;assert.equal((await send(change)).status,503);assert.equal(member.staff_role,'nurse');assert.equal(audits,0);fail=false;
  assert.equal((await send(change)).status,200);assert.equal(member.staff_role,'midwife');assert.equal(member.is_active,false);assert.equal(audits,2);
  assert.equal((await send(change)).status,409);assert.equal(audits,2);assert.equal(releases,7);
 }finally{server.closeAllConnections();await new Promise<void>((resolve,reject)=>server.close(error=>error?reject(error):resolve()));}
});
