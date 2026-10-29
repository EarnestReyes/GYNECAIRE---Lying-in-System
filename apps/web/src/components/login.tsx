import { useState, type FormEvent } from 'react';
import { signIn } from '../lib/auth';
import { supabase } from '../lib/supabase';
import { Brand } from './ui';
import { Icon } from './icon';
import { MaternalArt } from './maternal-art';

export function Login({ onAuthenticated, initialError = '', recovery = false }: { onAuthenticated: () => Promise<void>; initialError?: string; recovery?: boolean }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [visible, setVisible] = useState(false);
  const [forgot, setForgot] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setMessage('');
    try {
      if (recovery) {
        if (password.length < 10 || password !== confirm) throw new Error('Use matching passwords of at least 10 characters.');
        const { error } = await supabase.auth.updateUser({ password });
        if (error) throw new Error('Unable to reset the password. Request a new recovery link and try again.');
        await onAuthenticated();
      } else if (forgot) {
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: `${window.location.origin}/` });
        if (error) throw new Error('Unable to send recovery email. Please try again.');
        setMessage('If an account exists, you’ll receive a secure recovery link by email.');
      } else {
        const { error } = await signIn(email.trim(), password);
        if (error) throw new Error('Unable to sign in. Check your email, password, and email confirmation.');
        await onAuthenticated();
      }
      setPassword(''); setConfirm('');
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Unable to connect. Please try again.'); }
    finally { setBusy(false); }
  }

  return <main className="login-page">
    <section className="login-story"><Brand /><div className="story-content"><span className="eyebrow">COMPASSIONATE CARE, CONNECTED</span><h1>Every woman.<br />Every chapter.<br /><em>Exceptional care.</em></h1><p>A thoughtful space for the people who make a difference in every patient’s journey.</p><MaternalArt /><span className="story-seal"><Icon name="heart" size={16} /> Your partner in every stage of womanhood</span></div><small>GYNECAIRE · Lying-in Center Management System</small></section>
    <section className="login-form-section"><div className="login-form-card"><div className="login-icon"><Icon name="lock" size={26} /></div><span className="eyebrow">ADMIN & STAFF PORTAL</span><h2>{recovery ? 'A fresh start' : forgot ? 'Let’s get you back in' : 'Welcome back'}</h2><p>{recovery ? 'Choose a new password to secure your account.' : forgot ? 'Enter your email to receive a password recovery link.' : 'Sign in to your workspace. A day of caring begins here.'}</p>
      <form onSubmit={submit} className="form-stack">
        {!recovery && <label>Email address<input type="email" autoComplete="username" placeholder="you@clinic.com" value={email} onChange={event => setEmail(event.target.value)} required maxLength={254} /></label>}
        {!forgot && <label>{recovery ? 'New password' : 'Password'}<span className="password-field"><input type={visible ? 'text' : 'password'} autoComplete={recovery ? 'new-password' : 'current-password'} placeholder="Enter your password" value={password} onChange={event => setPassword(event.target.value)} required minLength={recovery ? 10 : undefined} /><button type="button" className="icon-button" aria-label={visible ? 'Hide password' : 'Show password'} aria-pressed={visible} onClick={() => setVisible(!visible)}><Icon name="eye" /></button></span></label>}
        {recovery && <label>Confirm password<input type={visible ? 'text' : 'password'} autoComplete="new-password" value={confirm} onChange={event => setConfirm(event.target.value)} required minLength={10} /></label>}
        {!recovery && !forgot && <div className="form-aside"><span>Use a trusted device</span><button type="button" className="text-button" onClick={() => { setForgot(true); setMessage(''); }}>Forgot password?</button></div>}
        {(message || initialError) && <div className="notice" role="status">{message || initialError}</div>}
        <button className="button full" disabled={busy}>{busy ? 'Please wait…' : recovery ? 'Update password' : forgot ? 'Send recovery link' : 'Sign in to your workspace'}<Icon name="arrow" size={18} /></button>
        {forgot && <button type="button" className="text-button" onClick={() => { setForgot(false); setMessage(''); }}>Back to sign in</button>}
      </form>
      <div className="login-security"><Icon name="staff" size={20} /><p>For authorized clinic personnel only.<br /><span>Access is securely verified by the clinic.</span></p></div><p className="login-help">Need access? Contact your clinic administrator.</p>
    </div><footer className="login-footer">Private. Secure. Centered on care.</footer></section>
  </main>;
}
