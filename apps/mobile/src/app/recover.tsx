import { useState } from 'react';
import { Text } from 'react-native';
import { Button, Field, Notice, Screen, ui } from '@/components/care-ui';
import { supabase } from '@/lib/supabase';
export default function Recover() {
 const [email, setEmail] = useState(''); const [busy, setBusy] = useState(false); const [message, setMessage] = useState('');
 async function send() {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { setMessage('Enter a valid email address.'); return; }
  const redirect = process.env.EXPO_PUBLIC_AUTH_REDIRECT_URL;
  if (!redirect) { setMessage('Password recovery links are not configured. Please contact the clinic.'); return; }
  setBusy(true);
  try { const url = new URL(redirect); url.searchParams.set('next', 'recover'); const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: url.toString() }); setMessage(error ? 'Unable to send a recovery email. Please try again.' : 'If an account exists, you will receive an email with password recovery instructions. Open the link on this device.'); } catch { setMessage('Unable to connect. Please try again.'); } finally { setBusy(false); }
 }
 return <Screen><Text style={ui.title}>Let’s get you back in</Text><Text style={ui.text}>We’ll email you a secure password recovery link.</Text><Field label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />{message && <Notice>{message}</Notice>}<Button title="Send Recovery Email" busy={busy} onPress={send} /></Screen>;
}
