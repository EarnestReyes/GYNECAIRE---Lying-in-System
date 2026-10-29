import { useState, type FormEvent } from 'react';
import { supabase } from '../lib/supabase';
import type { StaffIdentity } from '../lib/portal';
import { Badge, PageHeading, Panel } from '../components/ui';

export function Settings({ user }: { user: StaffIdentity }) {
  const [password, setPassword] = useState(''); const [confirm, setConfirm] = useState(''); const [message, setMessage] = useState(''); const [busy, setBusy] = useState(false);
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (password.length < 10 || password !== confirm) { setMessage('Use matching passwords of at least 10 characters.'); return; }
    setBusy(true); setMessage('');
    try { const { error } = await supabase.auth.updateUser({ password }); if (error) setMessage('Unable to change your password. You may need to sign in again or use password recovery.'); else { setMessage('Your password has been updated.'); setPassword(''); setConfirm(''); } }
    catch { setMessage('Unable to connect. Please try again.'); } finally { setBusy(false); }
  }
  return <><PageHeading title="Settings" description="Your account, your workspace, and the details that keep care connected." /><div className="settings-grid"><Panel title="My account" action={<Badge tone="confirmed">Verified staff</Badge>}><dl className="settings-details"><dt>Full name</dt><dd>{user.full_name}</dd><dt>Clinic role</dt><dd className="capitalize">{user.staff_role === 'admin' ? 'Administrator' : user.staff_role}</dd><dt>Clinic timezone</dt><dd>Asia/Manila (UTC+08:00)</dd><dt>Access</dt><dd>Managed by your clinic administrator</dd></dl><p className="panel-note">Profile and role editing are not available. Contact your administrator for corrections.</p></Panel><Panel title="Account security"><form className="form-stack padded" onSubmit={save}><label>New password<input type="password" autoComplete="new-password" required minLength={10} value={password} onChange={event => setPassword(event.target.value)} /></label><label>Confirm password<input type="password" autoComplete="new-password" required minLength={10} value={confirm} onChange={event => setConfirm(event.target.value)} /></label>{message && <p className="notice" role="status">{message}</p>}<button className="button" disabled={busy}>{busy ? 'Updating…' : 'Update password'}</button></form></Panel><Panel title="Clinic configuration" action={<Badge tone="pending">Not connected</Badge>}><div className="padded"><p>Clinic contact information, operating hours, booking rules, and service configuration require administrator settings endpoints.</p><button className="button secondary" disabled>Edit clinic settings</button></div></Panel><Panel title="Notifications & preferences" action={<Badge tone="pending">Not connected</Badge>}><div className="padded"><p>Notification delivery and account preferences are not connected. The portal does not send email or push notifications about patient activity.</p><button className="button secondary" disabled>Manage notifications</button></div></Panel></div></>;
}
