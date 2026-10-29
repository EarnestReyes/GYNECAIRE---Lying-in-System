import { Router } from 'express';
import type { Pool } from 'pg';
import { z } from 'zod';
import type { AuthenticatedRequest } from '../middleware/authenticate.js';
import { staffAccessSchema } from '../validation/staff-access.js';

// Parent portal router requires JWT + admin. The mutation rechecks under locks.
export function staffAccessRouter(pool:Pool){
 const router=Router();
 router.patch('/:id/access',async(req:AuthenticatedRequest,res)=>{
  const parsed=staffAccessSchema.safeParse(req.body);
  if(!z.uuid().safeParse(req.params.id).success||!parsed.success){res.status(400).json({error:'Choose a supported role, account status and current review version.'});return;}
  const db=await pool.connect().catch(()=>null);if(!db){res.status(503).json({error:'Staff administration is unavailable'});return;}
  try{
   await db.query('BEGIN');await db.query("SET LOCAL lock_timeout='10s'");
   // Serializes opposing administrator updates; eligibility is checked *after* this lock.
   await db.query("SELECT pg_advisory_xact_lock(hashtextextended('gynecaire.staff-access',0))");
   const actor=await db.query(`SELECT s.id FROM public.staff_members s JOIN public.profiles p ON p.id=s.profile_id
    WHERE s.profile_id=$1 AND s.is_active AND s.staff_role='admin' AND p.account_type IN ('staff','admin') FOR SHARE OF s,p`,[req.authUserId]);
   if(!actor.rowCount){await db.query('ROLLBACK');res.status(403).json({error:'Active administrator access required'});return;}
   const result=await db.query(`SELECT s.id,s.profile_id,s.staff_role,s.is_active,p.account_type FROM public.staff_members s
    JOIN public.profiles p ON p.id=s.profile_id WHERE s.id=$1 FOR UPDATE OF s,p`,[req.params.id]);
   const target=result.rows[0];if(!target){await db.query('ROLLBACK');res.status(404).json({error:'Staff member not found'});return;}
   if(String(target.profile_id).toLowerCase()===req.authUserId?.toLowerCase()){await db.query('ROLLBACK');res.status(409).json({error:'Another administrator must manage your own access.'});return;}
   if(!['staff','admin'].includes(target.account_type)){await db.query('ROLLBACK');res.status(409).json({error:'This membership needs administrator provisioning before access can change.'});return;}
   const input=parsed.data;
   if(input.expected.staff_role!==target.staff_role||input.expected.is_active!==target.is_active){await db.query('ROLLBACK');res.status(409).json({error:'Access changed since you opened this form. Refresh the team directory and review again.'});return;}
   const changedRole=input.staff_role!==target.staff_role,changedStatus=input.is_active!==target.is_active;
   if(changedRole||changedStatus){
    await db.query('UPDATE public.staff_members SET staff_role=$2,is_active=$3 WHERE id=$1',[target.id,input.staff_role,input.is_active]);
    if(changedRole)await db.query("INSERT INTO public.audit_logs(actor_profile_id,action,entity_type,entity_id) VALUES($1,$2,'staff_member',$3)",[req.authUserId,`staff.role_changed.${target.staff_role}.${input.staff_role}`,target.id]);
    if(changedStatus)await db.query("INSERT INTO public.audit_logs(actor_profile_id,action,entity_type,entity_id) VALUES($1,$2,'staff_member',$3)",[req.authUserId,input.is_active?'staff.activated':'staff.deactivated',target.id]);
   }
   await db.query('COMMIT');res.json({saved:true,changed:changedRole||changedStatus});
  }catch{await db.query('ROLLBACK').catch(()=>{});res.status(503).json({error:'Access was not saved. Refresh and retry.'});}finally{db.release();}
 });return router;
}
