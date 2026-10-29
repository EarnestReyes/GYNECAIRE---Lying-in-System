import { useState } from 'react';
import { Redirect, router } from 'expo-router';
import { Text } from 'react-native';
import { Button, Field, Notice, Screen, ui } from '@/components/care-ui';
import { useSession } from '@/lib/session';
import { request } from '@/lib/account';
export default function Verification() {
 const { session, loading } = useSession(); const [kind, setKind] = useState<'new' | 'existing'>('new'); const [dob, setDob] = useState(''); const [phone, setPhone] = useState(''); const [consent, setConsent] = useState(false); const [message, setMessage] = useState(''); const [busy, setBusy] = useState(false);
 if (loading) return <Screen><Notice>Loading your account…</Notice></Screen>;
 if (!session) return <Redirect href="/login" />;
 async function submit() {
  if (!consent || !/^\d{4}-\d{2}-\d{2}$/.test(dob) || !/^[+\d ()-]{7,25}$/.test(phone)) { setMessage('Enter your birth date as YYYY-MM-DD, a contact number, and confirm consent.'); return; }
  setBusy(true); try { await request('/verification', { patient_kind: kind, date_of_birth: dob, contact_number: phone, consent: true }); router.replace('/verification-pending'); } catch (error) { setMessage(error instanceof Error ? error.message : 'Unable to submit.'); } finally { setBusy(false); }
 }
 return <Screen><Text style={ui.title}>Become a Clinic Patient</Text><Text style={ui.text}>Staff will contact you to arrange intake and verify your identity in person before linking records.</Text><Button title={`${kind === 'new' ? '✓ ' : ''}I’m a new patient`} secondary={kind !== 'new'} onPress={() => setKind('new')} /><Button title={`${kind === 'existing' ? '✓ ' : ''}I’m an existing patient`} secondary={kind !== 'existing'} onPress={() => setKind('existing')} /><Field label="Date of birth (YYYY-MM-DD)" value={dob} onChangeText={setDob} maxLength={10} /><Field label="Contact number" value={phone} onChangeText={setPhone} keyboardType="phone-pad" maxLength={25} /><Notice>Only authorized clinic staff can review these details. No medical record is linked automatically. Consent allows the clinic to use these details to review and contact you about this request.</Notice><Button title={consent ? '✓ Consent given — tap to withdraw' : 'I consent to clinic verification'} secondary={!consent} onPress={() => setConsent(!consent)} />{message && <Notice>{message}</Notice>}<Button title="Submit Verification Request" busy={busy} onPress={submit} /></Screen>;
}
