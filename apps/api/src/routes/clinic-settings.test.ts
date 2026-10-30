import test from 'node:test';
import assert from 'node:assert/strict';
import express,{type RequestHandler} from 'express';
import type { Pool } from 'pg';
import { clinicDays,clinicUpdateSchema,patientClinicFields } from '../validation/clinic-settings.js';
import { clinicSettingsRouter,patientClinicRead } from './clinic-settings.js';
import { authenticate,type AuthenticatedRequest } from '../middleware/authenticate.js';
const fixture=()=>({clinic_name:'Synthetic Test Clinic',description:null,contact_number:null,email:null,address:null,timezone:'Asia/Manila',operating_hours:Object.fromEntries(clinicDays.map(day=>[day,{closed:true,opens:null,closes:null}])),services:['Synthetic consultation'],appointment_policies:{booking_enabled:false,minimum_notice_hours:24,slot_minutes:30,cancellation_notice_hours:12,cancellation_rules:null},patient_visible:false,expected_version:0});
test('clinic validation rejects role assignment, invalid hours/timezone, duplicate services and unsafe policy values',()=>{
 assert.ok(clinicUpdateSchema.safeParse(fixture()).success);
 for(const change of [{staff_role:'admin'},{updated_by:'foreign'},{timezone:'Not/AZone'},{clinic_name:''},{email:'invalid'},{expected_version:-1},{services:['Same','same']},{appointment_policies:{...fixture().appointment_policies,slot_minutes:0}},{operating_hours:{...fixture().operating_hours,monday:{closed:false,opens:'18:00',closes:'09:00'}}},{operating_hours:{...fixture().operating_hours,monday:{closed:true,opens:'09:00',closes:'10:00'}}}])assert.equal(clinicUpdateSchema.safeParse({...fixture(),...change}).success,false,JSON.stringify(Object.keys(change)));
});
test('patient projection requires publication and omits internal metadata and scheduling fields',()=>{
 const {expected_version:_,...input}=fixture();const value=clinicUpdateSchema.parse({...input,expected_version:0});assert.equal(patientClinicFields(value),null);const projected=patientClinicFields({...value,patient_visible:true})!;
 assert.equal(projected.clinic_name,input.clinic_name);assert.ok(!('updated_by' in projected)&&!('version' in projected)&&!('patient_visible' in projected));assert.ok(!('slot_minutes' in projected.appointment_policies)&&!('minimum_notice_hours' in projected.appointment_policies));
});
test('clinic HTTP read/write authorization, persistence, conflicts, failure rollback and patient publication',async()=>{
 let current:any=null,snapshot:any=null,activeAdmin=true,guardAdmin=true,failAudit=false,unavailable=false,audits=0,snapshotAudits=0,writes=0;
 const db={async query(sql:string,args:unknown[]=[]):Promise<any>{
  if(unavailable&&sql.includes('clinic_settings'))throw Error('synthetic database detail must not leak');
  if(sql==='BEGIN'){snapshot=structuredClone(current);snapshotAudits=audits;}
  if(sql==='ROLLBACK'){current=snapshot;audits=snapshotAudits;}
  if(sql.startsWith('SELECT p.id')){assert.equal(args[0],'actor');assert.ok(sql.includes("s.staff_role='admin'")&&sql.includes('s.is_active'));return {rows:activeAdmin?[{id:'actor'}]:[],rowCount:activeAdmin?1:0};}
  if(sql.startsWith('SELECT version'))return {rows:current?[{version:current.version}]:[],rowCount:current?1:0};
  if(sql.startsWith('SELECT clinic_name'))return {rows:current?[structuredClone(current)]:[],rowCount:current?1:0};
  if(sql.startsWith('INSERT INTO public.clinic_settings')){writes++;assert.equal(args[11],'actor');assert.ok(!sql.includes(String(args[0])));current={clinic_name:args[0],description:args[1],contact_number:args[2],email:args[3],address:args[4],timezone:args[5],operating_hours:JSON.parse(args[6] as string),services:args[7],appointment_policies:JSON.parse(args[8] as string),patient_visible:args[9],version:args[10],updated_by:'actor',updated_at:'2026-10-30T00:00:00Z'};return {rows:[structuredClone(current)],rowCount:1};}
  if(sql.startsWith('INSERT INTO public.audit_logs')){if(failAudit)throw Error('synthetic');assert.ok(sql.includes('clinic.settings_updated'));audits++;}
  return {rows:[],rowCount:0};
 },release(){}};
 const pool={query:db.query,connect:async()=>db} as unknown as Pool;
 const admin:RequestHandler=(_req,res,next)=>guardAdmin?next():void res.status(403).json({error:'Admin required'});
 const app=express();app.use(express.json());app.use('/unauthenticated',authenticate,clinicSettingsRouter(pool,admin));app.get('/unauthenticated-patient',authenticate,patientClinicRead(pool));app.use((req:AuthenticatedRequest,_res,next)=>{req.authUserId='actor';next();});app.use('/clinic',clinicSettingsRouter(pool,admin));app.get('/patient',patientClinicRead(pool));
 const server=app.listen(0,'127.0.0.1');await new Promise<void>(resolve=>server.once('listening',resolve));const address=server.address();assert.ok(address&&typeof address==='object');const base='http://127.0.0.1:'+address.port;
 const put=(body:object)=>fetch(base+'/clinic',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
 try{
  assert.equal((await fetch(base+'/unauthenticated')).status,401);assert.equal((await fetch(base+'/unauthenticated',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(fixture())})).status,401);
  assert.equal((await fetch(base+'/unauthenticated-patient')).status,401);
  assert.deepEqual(await (await fetch(base+'/clinic')).json(),{settings:null});
  guardAdmin=false;assert.equal((await fetch(base+'/clinic')).status,200);assert.equal((await put(fixture())).status,403);assert.equal(writes,0);guardAdmin=true;
  assert.equal((await put({...fixture(),staff_role:'admin'})).status,400);activeAdmin=false;assert.equal((await put(fixture())).status,403);activeAdmin=true;
  assert.equal((await put(fixture())).status,200);assert.equal(audits,1);assert.equal(current.version,1);assert.equal((await (await fetch(base+'/clinic')).json()).settings.clinic_name,fixture().clinic_name);
  assert.deepEqual(await (await fetch(base+'/patient')).json(),{settings:null});
  assert.equal((await put(fixture())).status,409);assert.equal(audits,1);
  failAudit=true;assert.equal((await put({...fixture(),expected_version:1,clinic_name:'Rollback clinic'})).status,503);assert.equal(current.clinic_name,fixture().clinic_name);assert.equal(audits,1);failAudit=false;
  assert.equal((await put({...fixture(),expected_version:1,patient_visible:true})).status,200);assert.equal(current.version,2);const patient=await (await fetch(base+'/patient')).json();assert.ok(patient.settings);assert.ok(!('updated_by' in patient.settings));
  unavailable=true;const failure=await fetch(base+'/clinic');assert.equal(failure.status,503);assert.ok(!(await failure.text()).includes('synthetic database detail'));assert.equal((await fetch(base+'/patient')).status,503);
 }finally{server.closeAllConnections();await new Promise<void>(resolve=>server.close(()=>resolve()));}
});
