import { useState } from 'react';
import { router } from 'expo-router';
import { Text } from 'react-native';
import { Brand, Button, Field, Notice, Screen, ui } from '@/components/care-ui';
import { supabase } from '@/lib/supabase';
export default function Login() {
 const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [busy, setBusy] = useState(false); const [message, setMessage] = useState('');
 async function login() {
  if (!email.trim() || !password) { setMessage('Enter your email and password.'); return; }
  setBusy(true); setMessage('');
  try { const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password }); if (error) { setMessage('Unable to log in. Check your details and confirm your email.'); return; } router.replace('/home'); } catch { setMessage('Unable to connect. Please try again.'); } finally { setBusy(false); }
 }
 return <Screen><Brand /><Text style={ui.title}>Welcome back</Text><Text style={ui.text}>Your care journey continues here.</Text><Field label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" autoComplete="email" /><Field label="Password" value={password} onChangeText={setPassword} secureTextEntry autoComplete="current-password" />{message && <Notice>{message}</Notice>}<Button title="Log In" busy={busy} onPress={login} /><Button title="Forgot Password?" secondary onPress={() => router.push('/recover')} /><Button title="Create Account" secondary onPress={() => router.push('/account-type')} /></Screen>;
}
