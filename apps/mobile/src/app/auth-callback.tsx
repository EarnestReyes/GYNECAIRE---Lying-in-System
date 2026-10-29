import { useEffect, useRef, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { Button, Notice, Screen } from '@/components/care-ui';
import { supabase } from '@/lib/supabase';
export default function AuthCallback() {
 const { code, next } = useLocalSearchParams<{ code?: string; next?: string }>(); const started = useRef(false); const [message, setMessage] = useState('Confirming your secure link…');
 useEffect(() => {
  if (started.current) return; started.current = true;
  if (!code) { setMessage('This link is incomplete. Request a new email and open it on the same device.'); return; }
  supabase.auth.exchangeCodeForSession(code).then(({ error }) => { if (error) setMessage('This link expired or was opened on another device. Request a new email.'); else router.replace(next === 'recover' ? '/reset-password' : '/interests'); }).catch(() => setMessage('Unable to connect. Please request a new link.'));
 }, [code, next]);
 return <Screen><Notice>{message}</Notice><Button title="Back to Log In" secondary onPress={() => router.replace('/login')} /></Screen>;
}
