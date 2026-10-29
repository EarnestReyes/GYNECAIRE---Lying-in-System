import { z } from 'zod';
import { patientSchema } from '../validation/portal.js';

export const MAX_BYTES = 8 * 1024 * 1024;
export const MAX_ROWS = 10000;
export const fields = ['full_name','patient_number','date_of_birth','contact_number','source_id'] as const;
export type Field = typeof fields[number];
export type Mapping = Partial<Record<Field, number | undefined>>;
export type PatientInput = z.infer<typeof patientSchema>;
export type Normalized = { patient: PatientInput; source_id: string; issues: string[]; warnings: string[] };
export const jobSchema = z.object({
 filename: z.string().trim().min(1).max(120).regex(/^[^\\/\x00-\x1f]+\.(csv|xlsx)$/i),
 source_system: z.string().trim().min(1).max(60).regex(/^[\p{L}\p{N} _-]+$/u).transform(s=>s.toLowerCase()),
 idempotency_key: z.uuid(),
}).strict();
export const mappingSchema = z.object({
 mapping: z.object({ full_name:z.number().int().min(0).max(49), patient_number:z.number().int().min(0).max(49),
 date_of_birth:z.number().int().min(0).max(49).optional(), contact_number:z.number().int().min(0).max(49).optional(), source_id:z.number().int().min(0).max(49).optional() }).strict(),
 date_order:z.enum(['ISO','DMY','MDY']),
}).strict().refine(v=>new Set(Object.values(v.mapping)).size===Object.values(v.mapping).length);
export const decisionSchema=z.object({revision:z.number().int().min(1),decisions:z.array(z.object({row_number:z.number().int().min(2).max(MAX_ROWS+1),decision:z.enum(['create','skip'])}).strict()).min(1).max(100),acknowledge_warnings:z.boolean()}).strict();
export const confirmSchema=z.object({revision:z.number().int().min(1),confirm:z.literal(true)}).strict();
const aliases:Record<Field,string[]>={ full_name:['fullname','patientname','name','patientfullname'],patient_number:['patientnumber','patientno','patientid','recordnumber','recordno','chartnumber'],date_of_birth:['dateofbirth','dob','birthdate','birthday'],contact_number:['contactnumber','phone','phonenumber','mobile','contactno'],source_id:['sourceid','legacyid','legacyidentifier'] };
export function suggestMapping(headers:string[]):Mapping {
 const result:Mapping={};for(const field of fields){const hits=headers.map((h,i)=>aliases[field].includes(h.toLowerCase().replace(/[^a-z0-9]/g,''))?i:-1).filter(i=>i>=0);if(hits.length===1)result[field]=hits[0]!;}return result;
}
export function normalize(cells:string[],mapping:Mapping,order:'ISO'|'DMY'|'MDY',seen:Set<string>):Normalized {
 const get=(f:Field)=>mapping[f]===undefined?'':(cells[mapping[f]!]??'').trim().normalize('NFC');
 const issues:string[]=[],warnings:string[]=[];let birth=get('date_of_birth');
 if(birth && !/^\d{4}-\d{2}-\d{2}$/.test(birth)){
  const hit=/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/.exec(birth);
  if(!hit||order==='ISO')issues.push('birth_date_format');else {const a=Number(hit[1]),b=Number(hit[2]);if(a<=12&&b<=12&&a!==b)warnings.push('ambiguous_date_review');birth=`${hit[3]}-${String(order==='DMY'?b:a).padStart(2,'0')}-${String(order==='DMY'?a:b).padStart(2,'0')}`;}
 }
 const patient={full_name:get('full_name'),patient_number:get('patient_number'),date_of_birth:birth||null,contact_number:get('contact_number')||null};
 const valid=patientSchema.safeParse(patient);if(!valid.success)for(const e of valid.error.issues)issues.push(`invalid_${String(e.path[0])}`);
 // ISO dates must also round-trip; reject impossible days even if a parser normalizes them.
 if(birth && (!Number.isFinite(Date.parse(birth))||new Date(birth).toISOString().slice(0,10)!==birth))issues.push('invalid_date_of_birth');
 const source_id=get('source_id')||patient.patient_number;if(!source_id||source_id.length>150)issues.push('invalid_source_id');
 for(const value of cells)if(/^[\s\u0000-\u001f]*[=+@-]/.test(value))warnings.push('spreadsheet_prefix_review');
 for(const key of [`number:${patient.patient_number.toLowerCase()}`,`source:${source_id.toLowerCase()}`]){if(seen.has(key))issues.push('duplicate_in_file');seen.add(key);}
 const nameKey=`name:${patient.full_name.toLowerCase().replace(/\s+/g,' ')}`;if(seen.has(nameKey))warnings.push('possible_duplicate_in_file');seen.add(nameKey);
 if(patient.date_of_birth&&patient.contact_number){const demographicKey=`demographic:${patient.date_of_birth}:${patient.contact_number.replace(/\D/g,'')}`;if(seen.has(demographicKey))warnings.push('possible_duplicate_in_file');seen.add(demographicKey);}
 return {patient,source_id,issues:[...new Set(issues)],warnings:[...new Set(warnings)]};
}
export function csvCell(value:unknown):string {
 let s=String(value??'');if(/^[\s\u0000-\u001f]*[=+@-]/.test(s))s="'"+s;return '"'+s.replace(/"/g,'""')+'"';
}
export function mayCreate(row:{issues:string[];warnings:string[];matches:string[]},acknowledged:boolean){return row.issues.length===0&&(!(row.warnings.length||row.matches.length)||acknowledged);}
