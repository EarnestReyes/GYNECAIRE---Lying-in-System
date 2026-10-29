import { Router } from 'express';
import { z } from 'zod';
import { decisionSchema } from '../validation/onboarding.js';
import { pool } from '../config/database.js';
import { authenticate, type AuthenticatedRequest } from '../middleware/authenticate.js';
import { requireStaff } from '../middleware/authorize.js';
const router = Router();
router.use(authenticate, requireStaff('admin', 'midwife', 'nurse', 'receptionist'));
router.get('/', async (_req, res) => {
 try { const result = await pool.query(`SELECT v.id,v.profile_id,p.full_name,v.patient_kind,v.date_of_birth::text,v.contact_number,v.created_at FROM public.patient_verifications v JOIN public.profiles p ON p.id=v.profile_id WHERE v.status='pending' ORDER BY v.created_at LIMIT 100`); res.set('Cache-Control','no-store').json(result.rows); } catch { res.status(500).json({ error: 'Unable to load requests' }); }
});
router.post('/:id/decision', async (req: AuthenticatedRequest, res) => {
 const parsed = decisionSchema.safeParse(req.body); if (!z.uuid().safeParse(req.params.id).success || !parsed.success) { res.status(400).json({ error: 'Invalid decision. Approval requires an existing clinic patient and identity verification.' }); return; }
 const client = await pool.connect().catch(() => null);
 if (!client) { res.status(503).json({ error: 'Clinic connection unavailable' }); return; }
 try {
  await client.query('BEGIN');
  const result = await client.query(`SELECT * FROM public.patient_verifications WHERE id=$1 FOR UPDATE`, [req.params.id]);
  const verification = result.rows[0];
  if (!verification || verification.status !== 'pending') { await client.query('ROLLBACK'); res.status(409).json({ error: 'Request is no longer pending' }); return; }
  // Recheck and lock staff authorization within the transaction.
  const staff = await client.query(`SELECT s.id FROM public.staff_members s JOIN public.profiles p ON p.id=s.profile_id WHERE s.profile_id=$1 AND s.is_active AND p.account_type IN ('staff','admin') FOR SHARE OF s,p`, [req.authUserId]);
  if (!staff.rowCount) { await client.query('ROLLBACK'); res.status(403).json({ error: 'Staff access required' }); return; }
  const profile = await client.query(`SELECT account_type FROM public.profiles WHERE id=$1 FOR UPDATE`, [verification.profile_id]);
  if (profile.rows[0]?.account_type !== 'general') { await client.query('ROLLBACK'); res.status(409).json({ error: 'Account is not eligible for transition' }); return; }
  let patientId: string | null = null;
  if (parsed.data.status === 'approved') {
   patientId = parsed.data.patient_id;
   const patient = await client.query(`SELECT profile_id FROM public.patients WHERE id=$1 FOR UPDATE`, [patientId]);
   if (!patient.rowCount || (patient.rows[0].profile_id && patient.rows[0].profile_id !== verification.profile_id)) { await client.query('ROLLBACK'); res.status(409).json({ error: 'Patient record unavailable for linkage' }); return; }
   await client.query(`UPDATE public.patients SET profile_id=$1 WHERE id=$2`, [verification.profile_id, patientId]);
   await client.query(`UPDATE public.profiles SET account_type='patient',updated_at=now() WHERE id=$1`, [verification.profile_id]);
  }
  await client.query(`UPDATE public.patient_verifications SET status=$1,patient_id=$2,reviewed_by=$3,reviewed_at=now() WHERE id=$4`, [parsed.data.status, patientId, staff.rows[0].id, verification.id]);
  await client.query(`INSERT INTO public.audit_logs(actor_profile_id,action,entity_type,entity_id) VALUES($1,$2,'patient_verification',$3)`, [req.authUserId, `verification.${parsed.data.status}`, verification.id]);
  await client.query('COMMIT'); res.json({ status: parsed.data.status });
 } catch { await client.query('ROLLBACK'); res.status(500).json({ error: 'Unable to review verification' }); } finally { client.release(); }
});
export default router;
