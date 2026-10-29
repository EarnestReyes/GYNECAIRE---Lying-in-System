import { useState } from 'react';
import { router } from 'expo-router';
import { Text, View } from 'react-native';
import { Button, EmptyState, Notice, Screen, TextAction, ui } from '@/components/care-ui';
import { AccountFeedback } from '@/components/account-feedback';
import { useSession } from '@/lib/session';
import { useAccount } from '@/lib/account-context';
import { supabase } from '@/lib/supabase';
import { useSubmission } from '@/hooks/use-submission';
export default function Profile() {
    const { session } = useSession();
    const { account } = useAccount();
    const [message, setMessage] = useState('');
    const { busy, run } = useSubmission();
    function logout() { void run(async () => { setMessage(''); try {
        const { error } = await supabase.auth.signOut();
        if (error)
            setMessage('We couldn’t sign you out. Please try again.');
        else
            router.replace('/');
    }
    catch {
        setMessage('We couldn’t sign you out. Please check your connection and try again.');
    } }); }
    if (!session)
        return <Screen title="Profile" tabbed>
        <EmptyState title="A space of your own" description="Sign in to save resources on this device, choose your interests, and start a clinic patient request." icon="profile"/>
        <Button title="Sign in" onPress={() => router.push('/login')}/>
        <Button title="Create an account" secondary onPress={() => router.push('/account-type')}/>
        <TextAction title="Keep exploring as a guest" onPress={() => router.navigate('/dashboard')}/>
        </Screen>;
    return <Screen title="My account" tabbed>
    <View style={ui.card}>
    <Text style={ui.sectionTitle}>{account?.full_name || 'Your account'}</Text>
    <Text selectable style={ui.small}>{session.user.email}</Text>
    <Text style={ui.label}>{account?.account_type === 'patient' ? 'Verified clinic patient' : account?.account_type === 'staff' || account?.account_type === 'admin' ? 'Clinic staff account' : account ? 'General user' : 'Checking your account…'}</Text>
    </View>
    <AccountFeedback />{account?.account_type === 'general' && <View style={ui.card}>
        <Text style={ui.cardTitle}>{account.verification_status === 'pending' ? 'Your clinic request is being reviewed' : account.verification_status === 'rejected' ? 'Please check your clinic request' : 'Ready to receive clinic care?'}</Text>
        <Text style={ui.small}>Clinic approval connects your account with your patient record. Your identity stays the same.</Text>
        <Button title={account.verification_status ? 'View my clinic request' : 'Become a clinic patient'} onPress={() => router.push(account.verification_status ? '/verification-pending' : '/verification')}/>
        </View>}<View style={ui.card}>
    <TextAction title="My interests" onPress={() => router.push('/interests?editing=1')}/>
    <TextAction title="Saved resources on this device" onPress={() => router.navigate('/learn?saved=1')}/>
    <TextAction title="Settings, privacy, and help" onPress={() => router.push('/settings')}/>
    </View>{account?.account_type === 'staff' || account?.account_type === 'admin' ? <Notice>Use the staff web portal for clinic administration and patient management.</Notice> : null}{message && <Notice tone="error">{message}</Notice>}<Button title="Sign out" secondary busy={busy} onPress={logout}/>
    </Screen>;
}
