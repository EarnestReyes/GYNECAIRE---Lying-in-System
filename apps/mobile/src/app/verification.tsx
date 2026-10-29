import { useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';
import { Button, Checkbox, Field, Heading, Loading, Notice, Progress, Screen, SelectionCard } from '@/components/care-ui';
import { request } from '@/lib/account';
import { useAccount } from '@/lib/account-context';
import { useOnboardingDraft } from '@/lib/onboarding-draft';
import { useSession } from '@/lib/session';
import { validBirthDate, validPhone } from '@/lib/form-validation';
import { useSubmission } from '@/hooks/use-submission';
import { space } from '@/constants/brand';
export default function Verification() {
    const { account, loading, error, refresh } = useAccount();
    const { session } = useSession();
    const { draft, setDraft } = useOnboardingDraft();
    const { kind } = useLocalSearchParams<{
        kind?: string;
    }>();
    const [existing, setExisting] = useState(kind === 'existing' || draft.intent === 'existing' || session?.user.user_metadata.onboarding_intent === 'existing');
    const [consent, setConsent] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [message, setMessage] = useState('');
    const { busy, run } = useSubmission();
    function submit() {
        const next = { dob: validBirthDate(draft.dateOfBirth) ? '' : 'Enter a real date of birth, for example 1995-06-15.', phone: validPhone(draft.phone) ? '' : 'Enter a contact number with at least 7 digits.', consent: consent ? '' : 'Please agree to clinic identity verification to continue.' };
        setErrors(next);
        if (Object.values(next).some(Boolean))
            return;
        void run(async () => {
            setMessage('');
            try {
                await request('/verification', { patient_kind: existing ? 'existing' : 'new', date_of_birth: draft.dateOfBirth, contact_number: draft.phone.trim(), consent: true });
                setDraft(value => ({ ...value, dateOfBirth: '', phone: '' }));
                refresh();
                router.replace('/verification-pending');
            }
            catch (error) {
                setMessage(error instanceof Error ? error.message : 'We couldn’t submit your request. Please try again.');
            }
        });
    }
    if (loading)
        return <Screen title="Clinic patient request">
        <Loading label="Checking your account…"/>
        </Screen>;
    if (error)
        return <Screen title="Clinic patient request">
        <Notice tone="error">{error}</Notice>
        <Button title="Try again" onPress={refresh}/>
        </Screen>;
    if (account?.account_type !== 'general' || account.verification_status === 'pending')
        return <Screen title="Clinic patient request">
        <Notice>{account?.account_type === 'patient' ? 'Your clinic patient account is already verified.' : account?.verification_status === 'pending' ? 'Your request is already with the clinic. There’s no need to submit it again.' : 'Clinic requests are available for general-user accounts.'}</Notice>
        <Button title={account?.verification_status === 'pending' ? 'View my request' : 'Go to home'} onPress={() => router.replace(account?.verification_status === 'pending' ? '/verification-pending' : '/dashboard')}/>
        </Screen>;
    return <Screen title="Become a clinic patient">
    <Progress step={1} total={2} label="Clinic patient request"/>
    <Heading title="Let’s connect you with the clinic" description="Share your birth date and contact number for clinic review. * Required fields."/>
    <View style={{ gap: space.md }}>
    <SelectionCard title="I’m a new patient" icon="profile" selected={!existing} onPress={() => setExisting(false)}/>
    <SelectionCard title="I’m an existing patient" icon="records" selected={existing} onPress={() => setExisting(true)}/>
    </View>
    <Field label="Date of birth" required value={draft.dateOfBirth} onChangeText={dateOfBirth => setDraft(value => ({ ...value, dateOfBirth }))} error={errors.dob} hint="Year-month-day, for example 1995-06-15." placeholder="YYYY-MM-DD" keyboardType="numbers-and-punctuation" maxLength={10} editable={!busy}/>
    <Field label="Contact number" required value={draft.phone} onChangeText={phone => setDraft(value => ({ ...value, phone }))} error={errors.phone} keyboardType="phone-pad" autoComplete="tel" maxLength={25} editable={!busy}/>
    <Notice>Authorized clinic staff review these details. Medical records stay private until your identity is verified.</Notice>
    <Checkbox title="I agree to the clinic using these details to check my identity and contact me about this request." checked={consent} onPress={() => setConsent(!consent)} error={errors.consent}/>{message && <Notice tone="error">{message}</Notice>}<Button title="Submit clinic request" busy={busy} onPress={submit}/>
    </Screen>;
}
