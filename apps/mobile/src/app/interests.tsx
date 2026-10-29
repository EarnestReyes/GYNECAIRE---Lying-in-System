import { useState } from 'react';
import { Redirect, router } from 'expo-router';
import { Text } from 'react-native';
import { Button, Notice, Screen, ui } from '@/components/care-ui';
import { useSession } from '@/lib/session';
import { interests, request } from '@/lib/account';
export default function Interests() {
 const { session, loading } = useSession(); const [selected, setSelected] = useState<string[]>([]); const [busy, setBusy] = useState(false); const [message, setMessage] = useState('');
 if (loading) return <Screen><Notice>Loading your account…</Notice></Screen>;
 if (!session) return <Redirect href="/login" />;
 async function save() { setBusy(true); try { await request('/preferences', { interests: selected }); router.replace('/home'); } catch (error) { setMessage(error instanceof Error ? error.message : 'Unable to save.'); } finally { setBusy(false); } }
 return <Screen><Text style={ui.title}>Make this space yours</Text><Text style={ui.text}>Choose what you’d like to learn about. Interests are optional and are never treated as medical conditions.</Text>{interests.map(topic => <Button key={topic} title={`${selected.includes(topic) ? '✓ ' : ''}${topic}`} secondary={!selected.includes(topic)} onPress={() => setSelected(selected.includes(topic) ? selected.filter(item => item !== topic) : [...selected, topic])} />)}{message && <Notice>{message}</Notice>}<Button title="Save and Continue" busy={busy} onPress={save} /><Button title="Skip for Now" secondary onPress={() => router.replace('/home')} /></Screen>;
}
