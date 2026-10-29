import { Router, type RequestHandler } from 'express';
import type { Pool } from 'pg';
import type { AuthenticatedRequest } from '../middleware/authenticate.js';
import { personalProfileSchema } from '../validation/settings.js';

// Mounted behind the portal's JWT and active staff guards. Writes recheck under lock.
export function profileRouter(pool:Pool){
 const router=Router();
 const load:RequestHandler=async(req:AuthenticatedRequest,res)=>{
  try{const result=await pool.query(`SELECT p.id,p.full_name,p.phone_number,p.created_at,s.staff_role,s.is_active
   FROM public.profiles p JOIN public.staff_members s ON s.profile_id=p.id
   WHERE p.id=$1 AND s.is_active AND p.account_type IN ('staff','admin')`,[req.authUserId]);
   if(!result.rowCount){res.status(403).json({error:'Active staff access required'});return;}res.json(result.rows[0]);
  }catch{res.status(503).json({error:'Unable to load your profile'});}
 };
 router.get('/',load);
 router.patch('/',async(req:AuthenticatedRequest,res)=>{
  const parsed=personalProfileSchema.safeParse(req.body);if(!parsed.success){res.status(400).json({error:'Enter a name of 2–150 characters and a valid contact number, or leave contact blank.'});return;}
  const db=await pool.connect().catch(()=>null);if(!db){res.status(503).json({error:'Profile service unavailable'});return;}
  try{await db.query('BEGIN');
   const eligible=await db.query(`SELECT p.id FROM public.profiles p JOIN public.staff_members s ON s.profile_id=p.id
    WHERE p.id=$1 AND s.is_active AND s.staff_role IN ('admin','midwife','nurse','receptionist') AND p.account_type IN ('staff','admin') FOR UPDATE OF p,s`,[req.authUserId]);
   if(!eligible.rowCount){await db.query('ROLLBACK');res.status(403).json({error:'Active staff access required'});return;}
   const result=await db.query(`UPDATE public.profiles SET full_name=$2,phone_number=$3,updated_at=now() WHERE id=$1 RETURNING id,full_name,phone_number,created_at`,[req.authUserId,parsed.data.full_name,parsed.data.phone_number]);
   await db.query("INSERT INTO public.audit_logs(actor_profile_id,action,entity_type,entity_id) VALUES($1,'profile.updated','profile',$1)",[req.authUserId]);
   await db.query('COMMIT');res.json(result.rows[0]);
  }catch{await db.query('ROLLBACK').catch(()=>{});res.status(503).json({error:'Unable to save your profile. Please retry.'});}finally{db.release();}
 });return router;
}
