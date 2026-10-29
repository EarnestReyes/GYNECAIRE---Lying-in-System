import { useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, Text } from 'react-native';
import { Button, Field, Notice, Screen, ui } from '@/components/care-ui';
import { supabase } from '@/lib/supabase';
export default function Register() {
 const { intent } = useLocalSearchParams<{ intent?: string }>();
 const [name, setName] = useState(''); const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [confirm, setConfirm] = useState(''); const [consent, setConsent] = useState(false); const [busy, setBusy] = useState(false); const [message, setMessage] = useState('');
 async function submit() {
  if (name.trim().length < 2 || name.trim().length > 150 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) || password.length < 10 || password !== confirm || !consent) { setMessage('Enter your name, a valid email, and matching passwords of at least 10 characters. Please accept the privacy notice.'); return; }
  setBusy(true); setMessage('');
  try {
   const { data, error } = await supabase.auth.signUp({ email: email.trim(), password, options: { ...(process.env.EXPO_PUBLIC_AUTH_REDIRECT_URL ? { emailRedirectTo: process.env.EXPO_PUBLIC_AUTH_REDIRECT_URL } : {}), data: { full_name: name.trim(), onboarding_intent: intent === 'existing' || intent === 'new' ? intent : 'general' } } });
   if (error) { setMessage('Unable to create your account. Try again or log in if you already registered.'); return; }
   if (data.session) router.replace('/interests'); else { setMessage('Check your email to confirm your account, then return here to log in. Your clinic request can be completed after login.'); setPassword(''); setConfirm(''); }
  } catch { setMessage('Unable to connect. Please try again.'); } finally { setBusy(false); }
 }
 return <Screen><Text style={ui.caption}>YOUR ACCOUNT · 3 OF 3</Text><Text style={ui.title}>A caring connection starts here</Text><Field label="Full name" value={name} onChangeText={setName} autoComplete="name" maxLength={150} /><Field label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" autoComplete="email" /><Field label="Password (at least 10 characters)" value={password} onChangeText={setPassword} secureTextEntry autoComplete="new-password" /><Field label="Confirm password" value={confirm} onChangeText={setConfirm} secureTextEntry autoComplete="new-password" /><Notice>We use your account details to provide access and contact you about your requests. Clinic intake details are shared only with authorized clinic staff for verification. Medical records require separate clinic approval. Do not submit another person’s information.</Notice><Pressable accessibilityRole="checkbox" accessibilityState={{ checked: consent }} onPress={() => setConsent(!consent)} style={{ paddingVertical: 12 }}><Text style={ui.label}>{consent ? '☑' : '☐'} I have read and agree to this privacy notice.</Text></Pressable>{message && <Notice>{message}</Notice>}<Button title="Create Account" busy={busy} onPress={submit} /><Button title="Already registered? Log In" secondary onPress={() => router.replace('/login')} /></Screen>;
}
