import { router, useLocalSearchParams } from 'expo-router';
import { Button, CareArt, Heading, Screen } from '@/components/care-ui';
export default function OnboardingComplete() {
    const { next } = useLocalSearchParams<{
        next?: string;
    }>();
    return <Screen title="You’re all set" back={false} centered>
    <CareArt />
    <Heading title="Welcome to your care space" description={next === 'verification' ? 'Your account is ready. Next, share a few details so the clinic can review your patient request.' : 'Explore trusted health resources, find clinic information, and request patient verification whenever you’re ready.'}/>
    <Button title={next === 'verification' ? 'Continue to clinic verification' : 'Go to home'} onPress={() => router.replace(next === 'verification' ? '/verification' : '/dashboard')}/>
    </Screen>;
}
