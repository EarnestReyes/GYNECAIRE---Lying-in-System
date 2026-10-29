import { router } from 'expo-router';
import { Heading, Notice, Progress, Screen, SelectionCard, Button } from '@/components/care-ui';
import { useOnboardingDraft } from '@/lib/onboarding-draft';
export default function AccountType() {
    const { draft, setDraft } = useOnboardingDraft();
    const clinic = draft.intent !== 'general';
    return <Screen title="Choose your account">
    <Progress step={1} total={clinic ? 3 : 2} label="Create your account"/>
    <Heading title="How would you like to use GYNECAIRE?" description="Choose the option that feels right for you. You can request clinic care later."/>
    <SelectionCard title="Clinic patient" description="Choose this if you receive care at GYNECAIRE or want to register as a clinic patient." icon="clinic" selected={clinic} onPress={() => setDraft(value => ({ ...value, intent: 'clinic' }))}/>
    <SelectionCard title="General user" description="Explore women’s health resources and clinic information, with no patient registration required." icon="learn" selected={!clinic} onPress={() => setDraft(value => ({ ...value, intent: 'general' }))}/>
    <Notice>Choosing Clinic patient starts a request. The clinic must verify your identity before you can see medical records.</Notice>
    <Button title="Continue" onPress={() => router.push(clinic ? '/patient-type' : '/register')}/>
    </Screen>;
}
