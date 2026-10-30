import { Router, type RequestHandler } from 'express';
import type { Pool } from 'pg';
import { z } from 'zod';
import type { AuthenticatedRequest } from '../middleware/authenticate.js';
import { appointmentSchema, appointmentUpdateSchema, dateRangeSchema, pageSchema, patientSchema } from '../validation/portal.js';
import { profileRouter } from './settings-profile.js';
import { staffAccessRouter } from './staff-access.js';
import { avatarRouter } from './profile-avatar.js';
import { clinicSettingsRouter } from './clinic-settings.js';

export function createPortalRouter(pool:Pool,staffGuards:RequestHandler[],adminGuard:RequestHandler){
const router = Router();
router.use((_req, res, next) => { res.set('Cache-Control', 'no-store'); next(); });
router.use(...staffGuards);
router.use('/clinic-settings',clinicSettingsRouter(pool,adminGuard));
router.use('/profile/avatar', avatarRouter(pool));
router.use('/profile', profileRouter(pool));
router.use('/members',adminGuard,staffAccessRouter(pool));

router.get('/session', async (req: AuthenticatedRequest, res) => {
  try {
    const result = await pool.query(`SELECT p.full_name,s.staff_role FROM public.profiles p
      JOIN public.staff_members s ON s.profile_id=p.id WHERE p.id=$1 AND s.is_active`, [req.authUserId]);
    if (!result.rowCount) { res.status(403).json({ error: 'Staff access required' }); return; }
    res.json(result.rows[0]);
  } catch { res.status(500).json({ error: 'Unable to load staff account' }); }
});

router.get('/overview', async (_req, res) => {
  try {
    const result = await pool.query(`SELECT
      (SELECT count(*)::int FROM public.patients) AS total_patients,
      (SELECT count(*)::int FROM public.appointments WHERE (appointment_date AT TIME ZONE 'Asia/Manila')::date=(now() AT TIME ZONE 'Asia/Manila')::date) AS today_appointments,
      (SELECT count(*)::int FROM public.patient_verifications WHERE status='pending') AS pending_requests,
      (SELECT count(*)::int FROM public.appointments WHERE status='pending') AS pending_appointments`);
    const schedule = await pool.query(`SELECT a.id,a.appointment_date,a.appointment_type,a.status,p.full_name,p.patient_number
      FROM public.appointments a JOIN public.patients p ON p.id=a.patient_id
      WHERE (a.appointment_date AT TIME ZONE 'Asia/Manila')::date=(now() AT TIME ZONE 'Asia/Manila')::date ORDER BY a.appointment_date LIMIT 20`);
    const activity = await pool.query(`SELECT id,action,entity_type,created_at FROM public.audit_logs ORDER BY created_at DESC LIMIT 6`);
    res.set('Cache-Control', 'no-store').json({ ...result.rows[0], schedule: schedule.rows, activity: activity.rows });
  } catch { res.status(500).json({ error: 'Unable to load dashboard' }); }
});

router.get('/patients', async (req, res) => {
  const parsed = pageSchema.safeParse(req.query);
  if (!parsed.success) { res.status(400).json({ error: 'Invalid patient filter' }); return; }
  const { page, search, filter } = parsed.data;
  const where = `WHERE (p.full_name ILIKE $1 OR p.patient_number ILIKE $1)
    AND ($2='all' OR ($2='linked' AND p.profile_id IS NOT NULL) OR ($2='unlinked' AND p.profile_id IS NULL))`;
  try {
    const count = await pool.query(`SELECT count(*)::int AS total FROM public.patients p ${where}`, [`%${search.replace(/[\\%_]/g, '\\$&')}%`, filter]);
    const result = await pool.query(`SELECT p.id,p.patient_number,p.full_name,p.date_of_birth::text,p.contact_number,
      (p.profile_id IS NOT NULL) AS linked,p.created_at,
      (SELECT max(a.appointment_date) FROM public.appointments a WHERE a.patient_id=p.id AND a.status='completed') AS last_visit
      FROM public.patients p ${where} ORDER BY p.full_name,p.id LIMIT 15 OFFSET $3`, [`%${search.replace(/[\\%_]/g, '\\$&')}%`, filter, (page - 1) * 15]);
    res.set('Cache-Control', 'no-store').json({ items: result.rows, total: count.rows[0].total, page, page_size: 15 });
  } catch { res.status(500).json({ error: 'Unable to load patients' }); }
});

router.get('/patients/:id', async (req, res) => {
  if (!z.uuid().safeParse(req.params.id).success) { res.status(400).json({ error: 'Invalid patient' }); return; }
  try {
    const patient = await pool.query(`SELECT id,patient_number,full_name,date_of_birth::text,contact_number,(profile_id IS NOT NULL) AS linked,created_at FROM public.patients WHERE id=$1`, [req.params.id]);
    if (!patient.rowCount) { res.status(404).json({ error: 'Patient not found' }); return; }
    const appointments = await pool.query(`SELECT id,appointment_date,appointment_type,status FROM public.appointments WHERE patient_id=$1 ORDER BY appointment_date DESC LIMIT 30`, [req.params.id]);
    res.set('Cache-Control', 'no-store').json({ ...patient.rows[0], appointments: appointments.rows });
  } catch { res.status(500).json({ error: 'Unable to load patient' }); }
});

// All writes are parameterized and audited. No schema changes are required.
router.post('/patients', async (req: AuthenticatedRequest, res) => {
  const parsed = patientSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: 'Invalid patient details' }); return; }
  const client = await pool.connect().catch(() => null);
  if (!client) { res.status(503).json({ error: 'Clinic connection unavailable' }); return; }
  try {
    await client.query('BEGIN');
    const p = parsed.data;
    await client.query('LOCK TABLE public.patients IN SHARE ROW EXCLUSIVE MODE');
    const duplicate=await client.query('SELECT id FROM public.patients WHERE lower(patient_number)=lower($1)',[p.patient_number]);
    if(duplicate.rowCount){await client.query('ROLLBACK');res.status(409).json({error:'Patient number is already in use (case-insensitive).'});return;}
    const result = await client.query(`INSERT INTO public.patients(full_name,patient_number,date_of_birth,contact_number) VALUES($1,$2,$3,$4) RETURNING id`, [p.full_name,p.patient_number,p.date_of_birth,p.contact_number]);
    await client.query(`INSERT INTO public.audit_logs(actor_profile_id,action,entity_type,entity_id) VALUES($1,'patient.created','patient',$2)`, [req.authUserId,result.rows[0].id]);
    await client.query('COMMIT'); res.status(201).json(result.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    res.status(isConflict(error) ? 409 : 500).json({ error: isConflict(error) ? 'Patient number is already in use' : 'Unable to save patient' });
  } finally { client.release(); }
});

router.put('/patients/:id', async (req: AuthenticatedRequest, res) => {
  const parsed = patientSchema.safeParse(req.body);
  if (!z.uuid().safeParse(req.params.id).success || !parsed.success) { res.status(400).json({ error: 'Invalid patient details' }); return; }
  const client = await pool.connect().catch(() => null);
  if (!client) { res.status(503).json({ error: 'Clinic connection unavailable' }); return; }
  try {
    await client.query('BEGIN');
    const p = parsed.data;
    await client.query('LOCK TABLE public.patients IN SHARE ROW EXCLUSIVE MODE');
    const duplicate=await client.query('SELECT id FROM public.patients WHERE lower(patient_number)=lower($1) AND id<>$2',[p.patient_number,req.params.id]);
    if(duplicate.rowCount){await client.query('ROLLBACK');res.status(409).json({error:'Patient number is already in use (case-insensitive).'});return;}
    const result = await client.query(`UPDATE public.patients SET full_name=$1,patient_number=$2,date_of_birth=$3,contact_number=$4 WHERE id=$5 RETURNING id`, [p.full_name,p.patient_number,p.date_of_birth,p.contact_number,req.params.id]);
    if (!result.rowCount) { await client.query('ROLLBACK'); res.status(404).json({ error: 'Patient not found' }); return; }
    await client.query(`INSERT INTO public.audit_logs(actor_profile_id,action,entity_type,entity_id) VALUES($1,'patient.updated','patient',$2)`, [req.authUserId,req.params.id]);
    await client.query('COMMIT'); res.json(result.rows[0]);
  } catch (error) { await client.query('ROLLBACK'); res.status(isConflict(error) ? 409 : 500).json({ error: isConflict(error) ? 'Patient number is already in use' : 'Unable to update patient' }); } finally { client.release(); }
});

router.get('/appointments', async (req, res) => {
  const parsed = z.object({ date: z.iso.date().optional(), status: z.enum(['all','pending','confirmed','completed','cancelled']).default('all'), page: z.coerce.number().int().min(1).max(100000).default(1) }).safeParse(req.query);
  if (!parsed.success) { res.status(400).json({ error: 'Invalid appointment filter' }); return; }
  const { date, status, page } = parsed.data;
  const where = `WHERE ($1::date IS NULL OR (a.appointment_date AT TIME ZONE 'Asia/Manila')::date=$1::date) AND ($2='all' OR a.status=$2)`;
  try {
    const count = await pool.query(`SELECT count(*)::int AS total FROM public.appointments a ${where}`, [date ?? null,status]);
    const result = await pool.query(`SELECT a.id,a.patient_id,a.appointment_date,a.appointment_type,a.status,p.full_name,p.patient_number FROM public.appointments a JOIN public.patients p ON p.id=a.patient_id ${where} ORDER BY a.appointment_date DESC,a.id LIMIT 15 OFFSET $3`, [date ?? null,status,(page-1)*15]);
    res.set('Cache-Control', 'no-store').json({ items: result.rows, total: count.rows[0].total, page, page_size: 15 });
  } catch { res.status(500).json({ error: 'Unable to load appointments' }); }
});

router.post('/appointments', async (req: AuthenticatedRequest, res) => {
  const parsed = appointmentSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: 'Invalid appointment details' }); return; }
  const client = await pool.connect().catch(() => null);
  if (!client) { res.status(503).json({ error: 'Clinic connection unavailable' }); return; }
  try {
    await client.query('BEGIN');
    const a = parsed.data;
    const result = await client.query(`INSERT INTO public.appointments(patient_id,appointment_date,appointment_type) VALUES($1,$2,$3) RETURNING id`, [a.patient_id,a.appointment_date,a.appointment_type]);
    await client.query(`INSERT INTO public.audit_logs(actor_profile_id,action,entity_type,entity_id) VALUES($1,'appointment.created','appointment',$2)`, [req.authUserId,result.rows[0].id]);
    await client.query('COMMIT'); res.status(201).json(result.rows[0]);
  } catch (error) { await client.query('ROLLBACK'); res.status(isConflict(error) ? 409 : 500).json({ error: isConflict(error) ? 'Patient is no longer available' : 'Unable to create appointment' }); } finally { client.release(); }
});

router.patch('/appointments/:id', async (req: AuthenticatedRequest, res) => {
  const parsed = appointmentUpdateSchema.safeParse(req.body);
  if (!z.uuid().safeParse(req.params.id).success || !parsed.success) { res.status(400).json({ error: 'Invalid appointment update' }); return; }
  const client = await pool.connect().catch(() => null);
  if (!client) { res.status(503).json({ error: 'Clinic connection unavailable' }); return; }
  try {
    await client.query('BEGIN');
    const existing = await client.query(`SELECT status FROM public.appointments WHERE id=$1 FOR UPDATE`, [req.params.id]);
    if (!existing.rowCount) { await client.query('ROLLBACK'); res.status(404).json({ error: 'Appointment not found' }); return; }
    if (['completed','cancelled'].includes(existing.rows[0].status)) { await client.query('ROLLBACK'); res.status(409).json({ error: 'Finalized appointments cannot be changed' }); return; }
    await client.query(`UPDATE public.appointments SET status=$1,appointment_date=COALESCE($2::timestamptz,appointment_date) WHERE id=$3`, [parsed.data.status,parsed.data.appointment_date ?? null,req.params.id]);
    await client.query(`INSERT INTO public.audit_logs(actor_profile_id,action,entity_type,entity_id) VALUES($1,'appointment.updated','appointment',$2)`, [req.authUserId,req.params.id]);
    await client.query('COMMIT'); res.json({ saved: true });
  } catch { await client.query('ROLLBACK'); res.status(500).json({ error: 'Unable to update appointment' }); } finally { client.release(); }
});

router.get('/reports', async (req, res) => {
  const parsed = dateRangeSchema.safeParse(req.query);
  if (!parsed.success) { res.status(400).json({ error: 'Select a valid date range of up to 366 days' }); return; }
  const { from,to } = parsed.data;
  try {
    const visits = await pool.query(`SELECT to_char(m.month,'YYYY-MM') AS month,count(a.id)::int AS visits
      FROM generate_series(date_trunc('month',$1::date),date_trunc('month',$2::date),interval '1 month') AS m(month)
      LEFT JOIN public.appointments a ON date_trunc('month',a.appointment_date AT TIME ZONE 'Asia/Manila')=m.month
        AND a.status='completed' AND (a.appointment_date AT TIME ZONE 'Asia/Manila')::date BETWEEN $1::date AND $2::date
      GROUP BY m.month ORDER BY m.month`, [from,to]);
    const services = await pool.query(`SELECT appointment_type AS service,count(*)::int AS count FROM public.appointments WHERE status='completed' AND (appointment_date AT TIME ZONE 'Asia/Manila')::date BETWEEN $1::date AND $2::date GROUP BY 1 ORDER BY 2 DESC`, [from,to]);
    const patients = await pool.query(`SELECT count(*)::int AS count FROM public.patients WHERE (created_at AT TIME ZONE 'Asia/Manila')::date BETWEEN $1::date AND $2::date`, [from,to]);
    res.json({ visits: visits.rows, services: services.rows, new_patients: patients.rows[0].count });
  } catch { res.status(500).json({ error: 'Unable to generate report' }); }
});

router.get('/members', async (req:AuthenticatedRequest, res) => {
  try {
    const result = await pool.query(`SELECT s.id,p.full_name,s.staff_role,s.is_active,s.created_at,(s.profile_id=$1) AS is_self,
      (p.account_type IN ('staff','admin')) AS eligible FROM public.staff_members s JOIN public.profiles p ON p.id=s.profile_id ORDER BY p.full_name`,[req.authUserId]);
    res.set('Cache-Control', 'no-store').json(result.rows);
  } catch { res.status(500).json({ error: 'Unable to load staff members' }); }
});

function isConflict(error: unknown) { return typeof error === 'object' && error !== null && 'code' in error && (error.code === '23505' || error.code === '23503'); }
return router;
}
