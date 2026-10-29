import test from 'node:test';
import assert from 'node:assert/strict';
import { normalize, suggestMapping, mappingSchema, jobSchema, mayCreate, csvCell } from './domain.js';
import { seal, unseal } from './crypto.js';
const mapping={full_name:0,patient_number:1,date_of_birth:2,contact_number:3};
test('Unicode names, empty optional cells and aliases are preserved',()=>{
 assert.deepEqual(suggestMapping(['Patient Name','Record No','DOB','Mobile']),mapping);
 const n=normalize(['María Dela Peña','OLD-001','',''],mapping,'ISO',new Set());assert.equal(n.patient.full_name,'María Dela Peña');assert.equal(n.patient.date_of_birth,null);assert.deepEqual(n.issues,[]);
});
test('required fields, dates, contact, unknown fields and duplicate mappings are rejected',()=>{
 assert.ok(normalize(['','bad/id','2024-02-30','abc'],mapping,'ISO',new Set()).issues.length>=3);
 assert.equal(mappingSchema.safeParse({mapping:{full_name:0,patient_number:0},date_order:'ISO'}).success,false);
 for(const filename of ['../test.csv','test.sql','test.xls','test.pdf','test.json'])assert.equal(jobSchema.safeParse({filename,source_system:'old',idempotency_key:'b97a2474-5cdd-4c3d-9c6b-ddc740cd0434'}).success,false);
 assert.equal(jobSchema.safeParse({filename:'test.csv',source_system:'old',idempotency_key:'b97a2474-5cdd-4c3d-9c6b-ddc740cd0434',uploader_id:'x'}).success,false);
});
test('ambiguous dates require review, text order is explicit, impossible dates fail',()=>{
 const a=normalize(['Test Person','P-1','02/03/2000',''],mapping,'DMY',new Set());assert.equal(a.patient.date_of_birth,'2000-03-02');assert.ok(a.warnings.includes('ambiguous_date_review'));
 assert.ok(normalize(['Test Person','P-1','02/03/2000',''],mapping,'ISO',new Set()).issues.includes('birth_date_format'));
 assert.ok(normalize(['Test Person','P-1','31/02/2000',''],mapping,'DMY',new Set()).issues.includes('invalid_date_of_birth'));
});
test('duplicates are flagged without merging names; decisions enforce warnings',()=>{
 const seen=new Set<string>();normalize(['Test Person','P-1','',''],mapping,'ISO',seen);
 assert.ok(normalize(['Test Person','P-1','',''],mapping,'ISO',seen).issues.includes('duplicate_in_file'));
 const sameName=normalize(['Test Person','P-2','',''],mapping,'ISO',seen);assert.deepEqual(sameName.issues,[]);assert.ok(sameName.warnings.includes('possible_duplicate_in_file'));
 const demographics=new Set<string>();normalize(['First Synthetic','P-3','2000-01-01','09123456789'],mapping,'ISO',demographics);
 assert.ok(normalize(['Other Synthetic','P-4','2000-01-01','0912 345 6789'],mapping,'ISO',demographics).warnings.includes('possible_duplicate_in_file'));
 assert.equal(mayCreate({issues:['existing_identifier'],warnings:[],matches:[]},true),false);
 assert.equal(mayCreate({issues:[],warnings:['ambiguous_date_review'],matches:[]},false),false);
 assert.equal(mayCreate({issues:[],warnings:[],matches:['id']},true),true);
});
test('error CSV escapes quotes, line breaks and formula prefixes',()=>{
 for(const value of ['=1+1',' +cmd','\t@SUM(A1)','-2','\r=1'])assert.ok(csvCell(value).startsWith('"\''));
 assert.equal(csvCell('a"b\nc'),'"a""b\nc"');
});
test('staging encryption authenticates ciphertext and row/job context',()=>{
 process.env.IMPORT_ENCRYPTION_KEY='12'.repeat(32);const data=seal('Synthetic only','job:2');assert.equal(unseal(data,'job:2').toString(),'Synthetic only');assert.throws(()=>unseal(data,'other:2'));const changed=Buffer.from(data);changed[30]=changed[30]!^1;assert.throws(()=>unseal(changed,'job:2'));
});
