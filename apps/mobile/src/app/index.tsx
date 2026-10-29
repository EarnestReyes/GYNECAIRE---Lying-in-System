import { Redirect, router } from 'expo-router';
import { ActivityIndicator, Text } from 'react-native';
import { Brand, Button, CareArt, Screen, ui } from '@/components/care-ui';
import { useSession } from '@/lib/session';
export default function Welcome() {
 const { session, loading } = useSession();
 if (loading) return <Screen><ActivityIndicator accessibilityLabel="Restoring session" /></Screen>;
 if (session) return <Redirect href="/home" />;
 return <Screen><Brand /><CareArt /><Text style={[ui.title, { textAlign: 'center' }]}>Your Partner in Every Stage of Womanhood</Text><Text style={[ui.text, { textAlign: 'center' }]}>A little reassurance. A trusted connection. Care for every chapter of your journey.</Text><Button title="Create Account" onPress={() => router.push('/account-type')} /><Button title="Log In" secondary onPress={() => router.push('/login')} /><Button title="Continue as Guest" secondary onPress={() => router.push('/home')} /></Screen>;
}
