import { useState } from 'react';
import { Redirect, router } from 'expo-router';
import { Text } from 'react-native';
import { Button, Field, Notice, Screen, ui } from '@/components/care-ui';
import { useSession } from '@/lib/session';
import { supabase } from '@/lib/supabase';
export default function ResetPassword() {
 const { session, loading } = useSession(); const [password, setPassword] = useState(''); const [confirm, setConfirm] = useState(''); const [busy, setBusy] = useState(false); const [message, setMessage] = useState('');
 if (loading) return <Screen><Notice>Checking your session…</Notice></Screen>;
 if (!session) return <Redirect href="/recover" />;
 async function save() { if (password.length < 10 || password !== confirm) { setMessage('Use matching passwords of at least 10 characters.'); return; } setBusy(true); try { const { error } = await supabase.auth.updateUser({ password }); if (error) setMessage('Unable to update your password. Request a new recovery link and try again.'); else router.replace('/home'); } catch { setMessage('Unable to connect. Please try again.'); } finally { setBusy(false); } }
 return <Screen><Text style={ui.title}>Choose a new password</Text><Field label="New password" value={password} onChangeText={setPassword} secureTextEntry autoComplete="new-password" /><Field label="Confirm new password" value={confirm} onChangeText={setConfirm} secureTextEntry autoComplete="new-password" />{message && <Notice>{message}</Notice>}<Button title="Update Password" busy={busy} onPress={save} /></Screen>;
}
