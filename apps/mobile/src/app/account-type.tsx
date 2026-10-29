import { router } from 'expo-router';
import { Heading, Notice, Progress, Screen, SelectionCard, Button } from '@/components/care-ui';
import { useOnboardingDraft } from '@/lib/onboarding-draft';
export default function AccountType() {
    const { draft, setDraft } = useOnboardingDraft();
    const clinic = draft.intent !== 'general';
    return <Screen title="Choose your account" footer={<Button title="Continue" onPress={() => router.push(clinic ? '/patient-type' : '/register')}/> }>
    <Progress step={1} total={clinic ? 3 : 2} label="Create your account"/>
    <Heading title="How will you use GYNECAIRE?" description="Choose how you'd like to get started."/>
    <SelectionCard title="Clinic Patient" description="Receive care at GYNECAIRE or begin your clinic patient journey." icon="clinic" selected={clinic} onPress={() => setDraft(value => ({ ...value, intent: 'clinic' }))}/>
    <SelectionCard title="General User" description="Explore health resources and clinic information." icon="learn" selected={!clinic} onPress={() => setDraft(value => ({ ...value, intent: 'general' }))}/>
    <Notice>Clinic patients need identity verification before medical records can be linked.</Notice>
    </Screen>;
}
