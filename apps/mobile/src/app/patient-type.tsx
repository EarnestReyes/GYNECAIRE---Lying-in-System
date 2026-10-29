import { router } from 'expo-router';
import { Button, Heading, Notice, Progress, Screen, SelectionCard } from '@/components/care-ui';
import { useOnboardingDraft } from '@/lib/onboarding-draft';
export default function PatientType() {
    const { draft, setDraft } = useOnboardingDraft();
    const existing = draft.intent === 'existing';
    return <Screen title="Your clinic journey">
    <Progress step={2} total={3} label="Create your account"/>
    <Heading title="Have you visited our clinic before?" description="This helps the clinic know whether to find your existing record or arrange a first visit."/>
    <SelectionCard title="Yes, I’m an existing patient" description="I have received care at GYNECAIRE before." icon="records" selected={existing} onPress={() => setDraft(value => ({ ...value, intent: 'existing' }))}/>
    <SelectionCard title="No, I’m a new patient" description="I’d like to begin receiving care at GYNECAIRE." icon="profile" selected={!existing} onPress={() => setDraft(value => ({ ...value, intent: 'new' }))}/>
    <Notice>Your records stay private. The clinic will check your identity before linking an existing patient record.</Notice>
    <Button title="Continue to create account" onPress={() => { if (!existing)
        setDraft(value => ({ ...value, intent: 'new' })); router.push('/register'); }}/>
    </Screen>;
}
