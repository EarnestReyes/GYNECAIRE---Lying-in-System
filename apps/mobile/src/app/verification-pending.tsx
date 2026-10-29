import { useCallback, useState } from 'react';
import { Redirect, router, useFocusEffect } from 'expo-router';
import { Text, View } from 'react-native';
import { Button, Notice, Screen, ui } from '@/components/care-ui';
import { request, type Account } from '@/lib/account';
import { useSession } from '@/lib/session';
export default function Pending() {
 const { session, loading } = useSession(); const [account, setAccount] = useState<Account | null>(null); const [message, setMessage] = useState('');
 const refresh = useCallback(() => { let active = true; if (session) request<Account>('').then(data => { if (active) { setAccount(data); setMessage(''); } }).catch(error => { if (active) setMessage(error instanceof Error ? error.message : 'Unable to load status.'); }); return () => { active = false; }; }, [session]);
 useFocusEffect(refresh);
 if (!loading && !session) return <Redirect href="/login" />;
 const status = account?.verification_status;
 return <Screen><Text style={ui.title}>{status === 'approved' ? 'Verification Approved' : status === 'rejected' ? 'Review Completed' : status === 'pending' ? 'Account Under Verification' : 'Verification Status'}</Text>{message ? <Notice>{message}</Notice> : !account ? <Notice>Loading your submission…</Notice> : <View style={ui.card}><Text style={ui.label}>Submission: {status ? 'Received' : 'Not submitted'}</Text><Text style={ui.text}>Clinic review: {status ?? 'Not started'}</Text><Text style={ui.text}>{status === 'pending' ? 'The clinic will contact you using your submitted contact details. Clinical records remain protected while review is pending.' : status === 'approved' ? 'Your patient account is now verified.' : status === 'rejected' ? 'Please contact the clinic to clarify your details before submitting again.' : 'Start a verification request from Home.'}</Text></View>}<Button title="Refresh Status" secondary onPress={() => { refresh(); }} /><Button title="Back to Home" onPress={() => router.replace('/home')} /></Screen>;
}
