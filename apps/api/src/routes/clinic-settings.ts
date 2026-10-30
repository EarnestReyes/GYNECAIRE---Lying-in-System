import { Router,type RequestHandler } from 'express';
import type { Pool } from 'pg';
import type { AuthenticatedRequest } from '../middleware/authenticate.js';
import { clinicConfigurationSchema,clinicUpdateSchema,patientClinicFields } from '../validation/clinic-settings.js';
const columns='clinic_name,description,contact_number,email,address,timezone,operating_hours,services,appointment_policies,patient_visible,version,updated_at,updated_by';
const unavailable={error:'Clinic configuration is unavailable. Ask an administrator to verify migration 006 and API database permissions.'};

export function patientClinicRead(pool:Pool):RequestHandler{return async(_req,res)=>{
 res.set('Cache-Control','no-store');
 try{const result=await pool.query(`SELECT ${columns} FROM public.clinic_settings WHERE id=1`);const row=result.rows[0];res.json({settings:row?patientClinicFields(clinicConfigurationSchema.parse(Object.fromEntries(Object.keys(clinicConfigurationSchema.shape).map(key=>[key,row[key]])))):null});}
 catch{res.status(503).json({error:'Clinic information is currently unavailable.'});}
};}
export function clinicSettingsRouter(pool:Pool,adminGuard:RequestHandler){
 const router=Router();
 router.get('/',async(_req,res)=>{try{const result=await pool.query(`SELECT ${columns} FROM public.clinic_settings WHERE id=1`);res.json({settings:result.rows[0]??null});}catch{res.status(503).json(unavailable);}});
 router.put('/',adminGuard,async(req:AuthenticatedRequest,res)=>{
  const parsed=clinicUpdateSchema.safeParse(req.body);
  if(!parsed.success){res.status(400).json({error:parsed.error.issues.slice(0,4).map(issue=>`${issue.path.join('.')||'Form'}: ${issue.message}`).join(' '),fields:parsed.error.issues.map(issue=>({path:issue.path.join('.'),message:issue.message}))});return;}
  const db=await pool.connect().catch(()=>null);if(!db){res.status(503).json(unavailable);return;}
  try{await db.query('BEGIN');await db.query("SET LOCAL lock_timeout='10s'");
   // Serializes first creation as well as edits; no fabricated seed record is needed.
   await db.query("SELECT pg_advisory_xact_lock(hashtext('gynecaire.clinic-settings'))");
   const admin=await db.query(`SELECT p.id FROM public.profiles p JOIN public.staff_members s ON s.profile_id=p.id WHERE p.id=$1 AND s.is_active AND s.staff_role='admin' AND p.account_type IN ('staff','admin') FOR UPDATE OF p,s`,[req.authUserId]);
   if(!admin.rowCount){await db.query('ROLLBACK');res.status(403).json({error:'Active administrator access required.'});return;}
   const current=await db.query('SELECT version FROM public.clinic_settings WHERE id=1 FOR UPDATE');
   if((current.rows[0]?.version??0)!==parsed.data.expected_version){await db.query('ROLLBACK');res.status(409).json({error:'Another administrator saved changes. Reload the latest configuration before editing again.'});return;}
   const {expected_version,...value}=parsed.data;
   const result=await db.query(`INSERT INTO public.clinic_settings(id,clinic_name,description,contact_number,email,address,timezone,operating_hours,services,appointment_policies,patient_visible,version,updated_by)
    VALUES(1,$1,$2,$3,$4,$5,$6,$7::jsonb,$8,$9::jsonb,$10,$11,$12)
    ON CONFLICT(id) DO UPDATE SET clinic_name=EXCLUDED.clinic_name,description=EXCLUDED.description,contact_number=EXCLUDED.contact_number,email=EXCLUDED.email,address=EXCLUDED.address,timezone=EXCLUDED.timezone,operating_hours=EXCLUDED.operating_hours,services=EXCLUDED.services,appointment_policies=EXCLUDED.appointment_policies,patient_visible=EXCLUDED.patient_visible,version=EXCLUDED.version,updated_by=EXCLUDED.updated_by,updated_at=now()
    RETURNING ${columns}`,[value.clinic_name,value.description,value.contact_number,value.email,value.address,value.timezone,JSON.stringify(value.operating_hours),value.services,JSON.stringify(value.appointment_policies),value.patient_visible,expected_version+1,req.authUserId]);
   await db.query("INSERT INTO public.audit_logs(actor_profile_id,action,entity_type,entity_id) VALUES($1,'clinic.settings_updated','clinic_settings',NULL)",[req.authUserId]);
   await db.query('COMMIT');res.json({settings:result.rows[0]});
  }catch{await db.query('ROLLBACK').catch(()=>{});res.status(503).json(unavailable);}finally{db.release();}
 });return router;
}
