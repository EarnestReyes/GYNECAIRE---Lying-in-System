import { Router } from 'express';
import { preferencesSchema, verificationSchema } from '../validation/onboarding.js';
import { pool } from '../config/database.js';
import { authenticate, type AuthenticatedRequest } from '../middleware/authenticate.js';
const router = Router();
router.use(authenticate);
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
