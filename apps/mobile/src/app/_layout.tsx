import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useEffect, useState, type PropsWithChildren } from 'react';
import { AccessibilityInfo } from 'react-native';
import { SessionProvider, useSession } from '@/lib/session';
import { AccountProvider } from '@/lib/account-context';
import { OnboardingDraftProvider } from '@/lib/onboarding-draft';
import { LibraryProvider } from '@/lib/library';
import { brand } from '@/constants/brand';
import { Loading, Screen } from '@/components/care-ui';
function DraftScope({ children }: PropsWithChildren) {
    const { session } = useSession();
    return <OnboardingDraftProvider key={session?.user.id || 'guest'}>
    <LibraryProvider>{children}</LibraryProvider>
    </OnboardingDraftProvider>;
}
function Navigation() {
    const { session, loading } = useSession();
    const [reduceMotion, setReduceMotion] = useState(true);
    useEffect(() => {
        void AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
        const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
        return () => subscription.remove();
    }, []);
    if (loading)
        return <Screen centered>
        <Loading label="Opening your care space…"/>
        </Screen>;
    return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: brand.background }, animation: reduceMotion ? 'none' : 'default' }}>
    <Stack.Screen name="(tabs)"/>
    <Stack.Protected guard={!session}>
      <Stack.Screen name="index"/>
      <Stack.Screen name="account-type"/>
      <Stack.Screen name="patient-type"/>
      <Stack.Screen name="register"/>
      <Stack.Screen name="login"/>
      <Stack.Screen name="recover"/>
    </Stack.Protected>
    <Stack.Protected guard={!!session}>
      <Stack.Screen name="interests"/>
      <Stack.Screen name="onboarding-complete"/>
      <Stack.Screen name="verification"/>
      <Stack.Screen name="verification-pending"/>
      <Stack.Screen name="reset-password"/>
      <Stack.Screen name="settings"/>
    </Stack.Protected>
    <Stack.Screen name="auth-callback"/>
    <Stack.Screen name="home"/>
    <Stack.Screen name="explore"/>
  </Stack>;
}
export default function RootLayout() {
    return <SafeAreaProvider>
    <SessionProvider>
    <AccountProvider>
    <DraftScope>
    <Navigation />
    </DraftScope>
    </AccountProvider>
    </SessionProvider>
    </SafeAreaProvider>;
}
