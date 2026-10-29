import { useCallback, useEffect, useRef, useState } from 'react';
import { signOut } from './lib/auth';
import { supabase } from './lib/supabase';
import { staffApi, type StaffIdentity } from './lib/portal';
import { Login } from './components/login';
import { Shell } from './components/shell';
import { readPage } from './lib/navigation';
import { Empty } from './components/ui';
import { Dashboard } from './pages/dashboard';
import { Patients } from './pages/patients';
import { Appointments } from './pages/appointments';
import { MedicalRecords, Checkups, Inventory } from './pages/clinical';
import { Reports } from './pages/reports';
import { Staff } from './pages/staff';
import { Settings } from './pages/settings';
import { Messages } from './pages/messages';
import './App.css';

export default function App() {
  const [mode, setMode] = useState<'loading' | 'login' | 'portal' | 'recovery'>('loading');
  const [user, setUser] = useState<StaffIdentity | null>(null);
  const [page, setPage] = useState(readPage);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const recovery = useRef(false);
  const authGeneration = useRef(0);
  const lastUserId = useRef<string | null>(null);

  const authorize = useCallback(async () => {
    const generation = authGeneration.current;
    try {
      const identity = await staffApi<StaffIdentity>('/session');
      if (generation !== authGeneration.current) return;
      recovery.current = false;
      setUser(identity); setMode('portal'); setError('');
    } catch (error) {
      await signOut();
      throw error;
    }
  }, []);

  useEffect(() => {
    let active = true;
    const lost = () => { if (active) { authGeneration.current++; setUser(null); setMode('login'); setError('Your session or staff access has changed. Please sign in again.'); } };
    const hash = () => setPage(readPage());
    window.addEventListener('portal-access-lost', lost);
    window.addEventListener('hashchange', hash);
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active) return;
      if (event === 'PASSWORD_RECOVERY') { authGeneration.current++; recovery.current = true; setUser(null); setMode('recovery'); }
      if (event === 'SIGNED_OUT') { authGeneration.current++; lastUserId.current = null; setUser(null); setMode('login'); }
      if (session && event !== 'PASSWORD_RECOVERY') {
        if (lastUserId.current && lastUserId.current !== session.user.id) lost();
        lastUserId.current = session.user.id;
      }
    });
    async function restore() {
      const generation = authGeneration.current;
      try {
        const { data } = await supabase.auth.getSession();
        if (!active || recovery.current) return;
        if (!data.session) { setMode('login'); return; }
        const identity = await staffApi<StaffIdentity>('/session');
        if (active && generation === authGeneration.current && !recovery.current) { setUser(identity); setMode('portal'); }
      } catch (error) { if (active && !recovery.current) { setUser(null); setMode('login'); setError(error instanceof Error ? error.message : 'Unable to verify staff access.'); } }
    }
    void restore();
    return () => { active = false; subscription.unsubscribe(); window.removeEventListener('portal-access-lost', lost); window.removeEventListener('hashchange', hash); };
  }, []);

  async function logout() {
    setBusy(true); setError('');
    try { const { error } = await signOut(); if (error) throw error; setUser(null); setMode('login'); }
    catch { setError('Unable to sign out. Please try again.'); }
    finally { setBusy(false); }
  }

  if (mode === 'loading') return <main className="boot-screen"><span className="spinner" /><p>Verifying GYNECAIRE staff access…</p></main>;
  if (mode !== 'portal' || !user) return <Login key={mode} recovery={mode === 'recovery'} onAuthenticated={authorize} initialError={error} />;
  const pages = {
    dashboard: <Dashboard user={user} />, patients: <Patients />, appointments: <Appointments />,
    records: <MedicalRecords />, checkups: <Checkups />, inventory: <Inventory />,
    reports: <Reports />, staff: user.staff_role === 'admin' ? <Staff /> : <Empty title="Administrator access required" icon="lock">Staff management is restricted to clinic administrators.</Empty>,
    settings: <Settings user={user} />, messages: <Messages />,
  };
  return <Shell user={user} page={page} logout={logout} busy={busy}>{error && <p role="alert" className="notice error">{error}</p>}<div key={page} className="page-content">{pages[page]}</div></Shell>;
}
