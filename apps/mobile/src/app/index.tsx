import { Redirect, router } from 'expo-router';
import { Text, View } from 'react-native';
import { Brand, Button, CareArt, Screen, TextAction, ui } from '@/components/care-ui';
import { useSession } from '@/lib/session';
import { space } from '@/constants/brand';
export default function Welcome() {
    const { session } = useSession();
    if (session)
        return <Redirect href="/dashboard"/>;
    return <Screen centered back={false}>
    <Brand />
    <CareArt />
    <View style={{ gap: space.sm }}>
    <Text accessibilityRole="header" style={[ui.heroTitle, { textAlign: 'center' }]}>Care for every chapter of your life</Text>
    <Text style={[ui.text, { textAlign: 'center' }]}>Your partner in every stage of womanhood.</Text>
    </View>
    <View style={{ gap: space.md }}>
    <Button title="Create an account" onPress={() => router.push('/account-type')}/>
    <Button title="Sign in" secondary onPress={() => router.push('/login')}/>
    <TextAction title="Explore as a guest" onPress={() => router.replace('/dashboard')}/>
    </View>
    <Text style={ui.caption}>Explore trusted health information. Connect with your clinic when you’re ready.</Text>
    </Screen>;
}
