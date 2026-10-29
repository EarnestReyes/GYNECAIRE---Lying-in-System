import { Router } from 'express';
import { preferencesSchema, verificationSchema } from '../validation/onboarding.js';
import { pool } from '../config/database.js';
import { authenticate, type AuthenticatedRequest } from '../middleware/authenticate.js';
const router = Router();
router.use(authenticate);
router.use((_req, res, next) => { res.set('Cache-Control', 'no-store'); next(); });
router.get('/care', async (req: AuthenticatedRequest, res) => {
 try {
  // Both clinic approval and linkage are required. Caller-supplied IDs are never used.
  const patient = await pool.query(`SELECT pt.id,pt.patient_number FROM public.patients pt
   JOIN public.profiles p ON p.id=pt.profile_id WHERE p.id=$1 AND p.account_type='patient'`, [req.authUserId]);
  if (!patient.rowCount) { res.status(403).json({ error: 'Verified linked patient account required' }); return; }
  const appointments = await pool.query(`SELECT id,appointment_date,appointment_type,status FROM public.appointments WHERE patient_id=$1
   ORDER BY (appointment_date >= now() AND status IN ('pending','confirmed')) DESC,
   CASE WHEN appointment_date >= now() AND status IN ('pending','confirmed') THEN appointment_date END ASC,
   appointment_date DESC LIMIT 100`, [patient.rows[0].id]);
  res.json({ patient_number: patient.rows[0].patient_number, appointments: appointments.rows });
 } catch { res.status(500).json({ error: 'Unable to load care information' }); }
});
router.get('/', async (req: AuthenticatedRequest, res) => {
 try {
  const result = await pool.query(`SELECT p.full_name, p.account_type, COALESCE(a.interests, '{}') AS interests,
   CASE WHEN p.account_type='patient' THEN 'approved' ELSE (SELECT v.status FROM public.patient_verifications v WHERE v.profile_id=p.id ORDER BY v.created_at DESC LIMIT 1) END AS verification_status
   FROM public.profiles p LEFT JOIN public.account_preferences a ON a.profile_id=p.id WHERE p.id=$1`, [req.authUserId]);
  if (!result.rowCount) { res.status(404).json({ error: 'Profile not found' }); return; }
  res.json(result.rows[0]);
 } catch { res.status(500).json({ error: 'Unable to load account' }); }
});
router.post('/preferences', async (req: AuthenticatedRequest, res) => {
 const parsed = preferencesSchema.safeParse(req.body); if (!parsed.success) { res.status(400).json({ error: 'Invalid preferences' }); return; }
 try { await pool.query(`INSERT INTO public.account_preferences(profile_id,interests) VALUES($1,$2) ON CONFLICT(profile_id) DO UPDATE SET interests=EXCLUDED.interests,updated_at=now()`, [req.authUserId, parsed.data.interests]); res.json({ saved: true }); } catch { res.status(500).json({ error: 'Unable to save preferences' }); }
});
router.post('/verification', async (req: AuthenticatedRequest, res) => {
 const parsed = verificationSchema.safeParse(req.body); if (!parsed.success) { res.status(400).json({ error: 'Invalid intake details or consent' }); return; }
 const client = await pool.connect().catch(() => null);
 if (!client) { res.status(503).json({ error: 'Clinic connection unavailable' }); return; }
 try {
  await client.query('BEGIN');
  const profile = await client.query(`SELECT account_type FROM public.profiles WHERE id=$1 FOR UPDATE`, [req.authUserId]);
  if (profile.rows[0]?.account_type !== 'general') { await client.query('ROLLBACK'); res.status(403).json({ error: 'General account required' }); return; }
  const pending = await client.query(`SELECT id FROM public.patient_verifications WHERE profile_id=$1 AND status='pending'`, [req.authUserId]);
  if (pending.rowCount) { await client.query('COMMIT'); res.json({ status: 'pending' }); return; }
  const { patient_kind, date_of_birth, contact_number } = parsed.data;
  const result = await client.query(`INSERT INTO public.patient_verifications(profile_id,patient_kind,date_of_birth,contact_number,consent_at) VALUES($1,$2,$3,$4,now()) RETURNING id`, [req.authUserId, patient_kind, date_of_birth, contact_number]);
  await client.query(`INSERT INTO public.audit_logs(actor_profile_id,action,entity_type,entity_id) VALUES($1,'verification.submitted','patient_verification',$2)`, [req.authUserId, result.rows[0].id]);
  await client.query('COMMIT'); res.status(201).json({ status: 'pending' });
 } catch { await client.query('ROLLBACK'); res.status(500).json({ error: 'Unable to submit verification' }); } finally { client.release(); }
});
export default router;
