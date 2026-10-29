import { useCallback, useEffect, useState } from 'react';
import { router, useFocusEffect } from 'expo-router';
import { Text, View } from 'react-native';
import { Brand, Button, Notice, Screen, ui } from '@/components/care-ui';
import { useSession } from '@/lib/session';
import { request, type Account } from '@/lib/account';
import { supabase } from '@/lib/supabase';
export default function Home() {
 const { session, loading } = useSession(); const [account, setAccount] = useState<Account | null>(null); const [message, setMessage] = useState(''); const [busy, setBusy] = useState(false);
 const refresh = useCallback(() => { let active = true; setAccount(null); if (session) request<Account>('').then(data => { if (active) { setAccount(data); setMessage(''); } }).catch(error => { if (active) setMessage(error instanceof Error ? error.message : 'Unable to load account.'); }); return () => { active = false; }; }, [session]);
 useFocusEffect(refresh);
 useEffect(() => { if (!session) setMessage(''); }, [session]);
 async function logout() { setBusy(true); try { const { error } = await supabase.auth.signOut(); if (error) setMessage('Unable to log out. Please try again.'); else router.replace('/'); } catch { setMessage('Unable to log out. Please try again.'); } finally { setBusy(false); } }
 return <Screen><Brand /><Text style={ui.title}>{loading ? 'Restoring your session…' : account ? `Hello, ${account.full_name}` : 'Welcome to your care space'}</Text><Text style={ui.text}>A place to begin, learn, and connect with GYNECAIRE.</Text>{message && <Notice>{message}</Notice>}{account?.account_type === 'patient' ? <View style={ui.card}><Text style={ui.title}>Your patient account</Text><Notice>Your clinic has verified this account. Records, monitoring, and booking will be connected in Phase 5.</Notice></View> : account?.account_type === 'staff' || account?.account_type === 'admin' ? <Notice>Use the staff web portal for authorized clinic operations.</Notice> : <View style={ui.card}><Text style={ui.title}>Here for every chapter</Text><Text style={ui.text}>The educational library is being prepared. You can browse this welcome space without creating an account.</Text></View>}{session && account?.account_type === 'general' && <><Button title={account.verification_status === 'pending' ? 'View Verification Status' : 'Become a Clinic Patient'} onPress={() => router.push(account.verification_status === 'pending' ? '/verification-pending' : '/verification')} /><Button title="Personalize My Interests" secondary onPress={() => router.push('/interests')} /></>}{session ? <Button title="Log Out" secondary busy={busy} onPress={logout} /> : <><Button title="Log In" onPress={() => router.push('/login')} /><Button title="Create Account" secondary onPress={() => router.push('/account-type')} /></>}</Screen>;
}
