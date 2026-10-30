import test from 'node:test';
import assert from 'node:assert/strict';
import express, { type RequestHandler } from 'express';
import type { Pool } from 'pg';
import { createPortalRouter } from './portal-router.js';
import type { AuthenticatedRequest } from '../middleware/authenticate.js';
import { authenticate } from '../middleware/authenticate.js';
import { apiErrorHandler } from '../middleware/error-handler.js';

test('existing portal endpoints require authentication before database access',async()=>{
 let calls=0;const pool={query:async()=>{calls++;throw new Error('Unexpected DB access');}} as unknown as Pool;
 const admin:RequestHandler=(_req,res)=>{res.sendStatus(403);};const app=express();app.use(createPortalRouter(pool,[authenticate],admin));const server=app.listen(0,'127.0.0.1');await new Promise<void>(resolve=>server.once('listening',resolve));const address=server.address();assert.ok(address&&typeof address==='object');
 try{for(const path of ['/session','/overview','/patients','/appointments','/reports','/members','/profile','/profile/avatar'])assert.equal((await fetch('http://127.0.0.1:'+address.port+path)).status,401);assert.equal(calls,0);}finally{server.closeAllConnections();await new Promise<void>(resolve=>server.close(()=>resolve()));}
});
test('connected patient/appointment/report HTTP routes preserve validation, audit transactions and final-status protection',async()=>{
 const id='d97a2474-5cdd-4c3d-9c6b-ddc740cd0434';let duplicate=false,failAudit=false,final=false,inserts=0,updates=0,commits=0,rollbacks=0,audit=0;let snapshot={inserts,updates,audit};const sqlCalls:string[]=[];
 const db={async query(sql:string,args:any[]=[]):Promise<any>{sqlCalls.push(sql);
  if(sql==='BEGIN')snapshot={inserts,updates,audit};if(sql==='ROLLBACK'){rollbacks++;({inserts,updates,audit}=snapshot);}if(sql==='COMMIT')commits++;
  if(sql.startsWith('SELECT id FROM public.patients WHERE lower'))return {rowCount:duplicate?1:0,rows:duplicate?[{id}]:[]};
  if(sql.startsWith('SELECT status FROM'))return {rowCount:1,rows:[{status:final?'completed':'pending'}]};
  if(sql.startsWith('INSERT INTO public.patients')||sql.startsWith('INSERT INTO public.appointments')){inserts++;return {rowCount:1,rows:[{id}]};}
  if(sql.startsWith('UPDATE')){updates++;return {rowCount:1,rows:[{id}]};}
  if(sql.startsWith('INSERT INTO public.audit_logs')){if(failAudit)throw new Error('Synthetic audit failure');audit++;}
  if(sql.includes('count(*)::int AS total'))return {rowCount:1,rows:[{total:0}]};
  if(sql.includes('count(*)::int AS count'))return {rowCount:1,rows:[{count:0}]};
  if(sql.includes('FROM public.patients WHERE id='))return {rowCount:1,rows:[{id,full_name:'Synthetic Patient',patient_number:'OLD-1',linked:false}]};
  if(sql.includes('COALESCE')||sql.includes('generate_series'))return {rowCount:0,rows:[]};
  assert.ok(!args.some(value=>typeof value==='string'&&sql.includes(value)&&value.includes('Synthetic')));return {rowCount:0,rows:[]};
 },release(){}};
 const pool={query:db.query,connect:async()=>db} as unknown as Pool;
 const staff:RequestHandler=(req,_res,next)=>{(req as AuthenticatedRequest).authUserId='actor';next();};const admin:RequestHandler=(_req,res)=>{res.sendStatus(403);};const app=express();app.use(express.json());app.use(createPortalRouter(pool,[staff],admin));app.use(apiErrorHandler);const server=app.listen(0,'127.0.0.1');await new Promise<void>(resolve=>server.once('listening',resolve));const address=server.address();assert.ok(address&&typeof address==='object');const url='http://127.0.0.1:'+address.port;
 const send=(path:string,method:string,body:object)=>fetch(url+path,{method,headers:{'content-type':'application/json'},body:JSON.stringify(body)});const patient={full_name:'Synthetic Patient',patient_number:'OLD-1',date_of_birth:null,contact_number:null};
 try{
  const malformed=await fetch(url+'/patients',{method:'POST',headers:{'content-type':'application/json'},body:'{"synthetic-private-field":'});assert.equal(malformed.status,400);assert.ok(!(await malformed.text()).includes('synthetic-private-field'));
  assert.equal((await fetch(url+'/members')).status,403);assert.equal((await fetch(url+'/patients?filter=all')).status,200);assert.equal((await fetch(url+'/patients/'+id)).status,200);
  assert.equal((await send('/patients','POST',{...patient,profile_id:id})).status,400);assert.equal((await send('/patients','POST',patient)).status,201);assert.equal(inserts,1);assert.equal(audit,1);
  duplicate=true;assert.equal((await send('/patients','POST',{...patient,patient_number:'old-1'})).status,409);assert.equal(inserts,1);duplicate=false;
  assert.equal((await send('/patients/'+id,'PUT',patient)).status,200);assert.equal(updates,1);
  failAudit=true;assert.equal((await send('/patients','POST',patient)).status,500);assert.equal(inserts,1);failAudit=false;
  assert.equal((await send('/appointments','POST',{patient_id:id,appointment_date:'2026-10-30T08:00:00+08:00',appointment_type:'Prenatal consultation'})).status,201);
  assert.equal((await send('/appointments/'+id,'PATCH',{status:'confirmed'})).status,200);final=true;assert.equal((await send('/appointments/'+id,'PATCH',{status:'cancelled'})).status,409);
  assert.equal((await fetch(url+'/reports?from=2026-10-01&to=2026-10-30')).status,200);assert.equal((await fetch(url+'/reports?from=2026-10-30&to=2026-10-01')).status,400);
  assert.equal(commits,4);assert.equal(rollbacks,3);assert.ok(sqlCalls.includes('LOCK TABLE public.patients IN SHARE ROW EXCLUSIVE MODE'));
 }finally{server.closeAllConnections();await new Promise<void>(resolve=>server.close(()=>resolve()));}
});
