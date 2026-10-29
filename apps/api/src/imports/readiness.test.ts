import test from 'node:test';
import assert from 'node:assert/strict';
import type { Pool } from 'pg';
import { importDatabaseReady } from './router.js';
test('import database capability probe fails closed without schema/permissions and reads no patient rows',async()=>{
 assert.equal(await importDatabaseReady({query:async()=>{throw new Error('Missing schema');}} as unknown as Pool),false);
 let calls=0;const pool={query:async(sql:string)=>{calls++;assert.ok(sql.includes('WHERE false'));assert.ok(sql.includes('patient_import_jobs'));assert.ok(sql.includes('patient_import_rows'));assert.ok(sql.includes('patient_import_provenance'));assert.ok(sql.includes('patient_import_events'));assert.ok(!sql.includes('public.patients '));return {rowCount:0,rows:[]};}} as unknown as Pool;
 assert.equal(await importDatabaseReady(pool),true);assert.equal(calls,1);
});
