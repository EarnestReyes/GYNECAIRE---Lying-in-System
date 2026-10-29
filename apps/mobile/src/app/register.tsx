import { useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { Text, View } from 'react-native';
import { Button, Checkbox, EmptyState, Field, Heading, Notice, Progress, Screen, TextAction, ui } from '@/components/care-ui';
import { supabase } from '@/lib/supabase';
import { passwordErrors, validEmail } from '@/lib/form-validation';
import { useOnboardingDraft } from '@/lib/onboarding-draft';
import { useSubmission } from '@/hooks/use-submission';
import { space } from '@/constants/brand';
export default function Register() {
    const { intent } = useLocalSearchParams<{
        intent?: string;
    }>();
    const { draft, setDraft, clear } = useOnboardingDraft();
    const selectedIntent = intent === 'existing' || intent === 'new' ? intent : draft.intent;
    const clinic = selectedIntent !== 'general';
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [consent, setConsent] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [message, setMessage] = useState('');
    const [sent, setSent] = useState(false);
    const { busy, run } = useSubmission();
    function submit() {
        const next = { name: draft.name.trim().length < 2 ? 'Enter your full name.' : '', email: validEmail(draft.email) ? '' : 'Enter a valid email address.', ...passwordErrors(password, confirm), consent: consent ? '' : 'Please read and accept the privacy notice to continue.' };
        setErrors(next);
        if (Object.values(next).some(Boolean))
            return;
        void run(async () => {
            setMessage('');
            try {
                const { data, error } = await supabase.auth.signUp({ email: draft.email.trim(), password, options: { ...(process.env.EXPO_PUBLIC_AUTH_REDIRECT_URL ? { emailRedirectTo: process.env.EXPO_PUBLIC_AUTH_REDIRECT_URL } : {}), data: { full_name: draft.name.trim(), onboarding_intent: clinic ? selectedIntent === 'existing' ? 'existing' : 'new' : 'general' } } });
                if (error) {
                    setMessage('We couldn’t create your account. Please try again, or sign in if you already registered.');
                    return;
                }
                setPassword('');
                setConfirm('');
                if (data.session) {
                    clear();
                    router.replace(clinic ? '/interests?next=verification' : '/interests');
                }
                else
                    setSent(true);
            }
            catch {
                setMessage('We couldn’t connect. Check your internet connection and try again.');
            }
        });
    }
    if (sent)
        return <Screen title="Check your email">
        <EmptyState title="One last step" description={`We sent confirmation instructions to ${draft.email.trim()}. Open the link on this device, then come back to sign in.`} icon="mail"/>
        <Notice>Your clinic request can be completed after you confirm your email and sign in.</Notice>
        <Button title="Go to sign in" onPress={() => router.replace('/login')}/>
        <TextAction title="Use a different email" onPress={() => setSent(false)}/>
        </Screen>;
    return <Screen title="Create your account">
    <Progress step={clinic ? 3 : 2} total={clinic ? 3 : 2} label="Create your account"/>
    <Heading title="A caring connection starts here" description="One account for health resources and clinic care. * Required fields."/>
    <Field label="Full name" required value={draft.name} onChangeText={name => setDraft(value => ({ ...value, name }))} error={errors.name} autoComplete="name" maxLength={150} editable={!busy}/>
    <Field label="Email address" required value={draft.email} onChangeText={email => setDraft(value => ({ ...value, email }))} error={errors.email} autoCapitalize="none" keyboardType="email-address" autoComplete="email" maxLength={254} editable={!busy}/>
    <Field label="Password" required value={password} onChangeText={setPassword} error={errors.password} hint="Use at least 10 characters." secureTextEntry autoComplete="new-password" editable={!busy}/>
    <Field label="Confirm password" required value={confirm} onChangeText={setConfirm} error={errors.confirm} secureTextEntry autoComplete="new-password" editable={!busy}/>
    <View style={[ui.card, { gap: space.sm }]}>
    <Text style={ui.cardTitle}>Your privacy matters</Text>
    <Text style={ui.small}>We use your account details to provide access and contact you. Authorized staff review clinic intake details. Medical records need clinic approval.</Text>
    </View>
    <Checkbox title="I have read and agree to this privacy notice." checked={consent} onPress={() => setConsent(!consent)} error={errors.consent}/>{message && <Notice tone="error">{message}</Notice>}<Button title="Create account" busy={busy} onPress={submit}/>
    <TextAction title="Already registered? Sign in" onPress={() => router.replace('/login')}/>
    </Screen>;
}
