import test from 'node:test';
import assert from 'node:assert/strict';
import type { Pool, PoolClient } from 'pg';
import { seal } from './crypto.js';
import { confirmImport } from './service.js';
const actor='synthetic-admin',jobId='synthetic-job';
function fixture(count=1){
 process.env.IMPORT_ENCRYPTION_KEY='12'.repeat(32);
 let job:any={id:jobId,source_system:'test',status:'validated',revision:3,file_hash:'fakehash',expires_at:new Date(Date.now()+3600000),imported_count:0,skipped_count:0};
 let patients:any[]=[],audit:string[]=[],provenance:any[]=[],snapshot:any;let released=0,batches=0,admin=true,fail=false;
 const rows=Array.from({length:count},(_,i)=>{const row_number=i+2;return {row_number,data_cipher:seal(JSON.stringify({cells:[],normalized:{patient:{full_name:`Synthetic ${i}`,patient_number:`OLD-${i}`,date_of_birth:null,contact_number:null},source_id:`ID-${i}`,issues:[],warnings:[]}}),`${jobId}:${row_number}`),issues:[] as string[],warnings:[],matches:[],decision:'create'};});
 const db={async query(sql:string,args:any[]=[]):Promise<any>{
  let data:any[]=[];
  if(sql==='BEGIN')snapshot=structuredClone({job,patients,audit,provenance});
  else if(sql==='ROLLBACK')({job,patients,audit,provenance}=snapshot);
  else if(sql.startsWith('SELECT s.id'))data=admin?[{id:'admin'}]:[];
  else if(sql.startsWith('SELECT * FROM public.patient_import_jobs'))data=[job];
  else if(sql.startsWith('SELECT * FROM public.patient_import_rows')){data=rows.filter(r=>r.row_number>args[1]).slice(0,100);batches++;}
  else if(sql.startsWith('SELECT id FROM public.patients WHERE lower(patient_number)'))data=patients.filter(p=>p.number===args[0]).map(p=>({id:p.id}));
  else if(sql.startsWith('SELECT id FROM public.patients WHERE lower(regexp'))data=[];
  else if(sql.startsWith('INSERT INTO public.patients')){const p={id:`patient-${patients.length}`,number:args[0],profile_id:args[4]??null};assert.ok(sql.includes('NULL) RETURNING id'));patients.push(p);data=[{id:p.id}];}
  else if(sql.startsWith('INSERT INTO public.patient_import_provenance')){if(fail)throw new Error('Synthetic storage failure');provenance.push(args);}
  else if(sql.startsWith('INSERT INTO public.audit_logs'))audit.push(sql);
  else if(sql.startsWith('INSERT INTO public.patient_import_events'))audit.push('event');
  else if(sql.startsWith('UPDATE public.patient_import_jobs'))job={...job,status:'completed',imported_count:args[1],skipped_count:args[2]};
  return {rowCount:data.length,rows:data};
 },release(){released++;}};
 return {pool:{connect:async()=>db as unknown as PoolClient} as Pick<Pool,'connect'>,rows,patients:()=>patients,audit:()=>audit,provenance:()=>provenance,released:()=>released,batches:()=>batches,fail:(value=true)=>{fail=value;},deny:()=>{admin=false;}};
}
test('atomic import is audited, leaves profile_id null and confirmation retry is idempotent',async()=>{
 const f=fixture();const first=await confirmImport(f.pool,jobId,actor,3);assert.equal(first.imported_count,1);assert.equal(f.patients()[0].profile_id,null);assert.equal(f.provenance().length,1);assert.equal(f.audit().length,3);assert.equal((await confirmImport(f.pool,jobId,actor,3)).replayed,true);assert.equal(f.patients().length,1);assert.equal(f.released(),2);
});
test('failed provenance write rolls back patients and audit, and retry succeeds',async()=>{const f=fixture();f.fail();await assert.rejects(confirmImport(f.pool,jobId,actor,3));assert.equal(f.patients().length,0);assert.equal(f.audit().length,0);assert.equal(f.released(),1);f.fail(false);assert.equal((await confirmImport(f.pool,jobId,actor,3)).imported_count,1);});
test('inactive/non-admin, stale review and unresolved/invalid rows never create patients',async()=>{
 const f=fixture();f.deny();await assert.rejects(confirmImport(f.pool,jobId,actor,3),/Administrator/);assert.equal(f.patients().length,0);const stale=fixture();await assert.rejects(confirmImport(stale.pool,jobId,actor,2),/revision/);const bad=fixture();bad.rows[0]!.decision='review';await assert.rejects(confirmImport(bad.pool,jobId,actor,3),/Every row/);const invalid=fixture();invalid.rows[0]!.issues.push('existing_identifier');await assert.rejects(confirmImport(invalid.pool,jobId,actor,3));
});
test('large synthetic import reads staging in batches of at most 100',async()=>{const f=fixture(1001);await confirmImport(f.pool,jobId,actor,3);assert.equal(f.patients().length,1001);assert.equal(f.batches(),12);});
test('newly conflicting identifiers and changed match lists block confirmation',async()=>{const f=fixture();f.patients().push({id:'existing',number:'OLD-0'});await assert.rejects(confirmImport(f.pool,jobId,actor,3),/matches changed/);assert.equal(f.patients().length,1);const changed=fixture();(changed.rows[0]!.matches as string[]).push('new-match');await assert.rejects(confirmImport(changed.pool,jobId,actor,3),/matches changed/);});
test('explicitly skipped invalid records do not create patients',async()=>{const f=fixture();f.rows[0]!.issues.push('invalid_full_name');f.rows[0]!.decision='skip';const result=await confirmImport(f.pool,jobId,actor,3);assert.equal(result.skipped_count,1);assert.equal(result.imported_count,0);});
