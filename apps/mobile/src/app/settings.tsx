import { router } from 'expo-router';
import { Text, View } from 'react-native';
import { Button, Heading, Notice, Screen, ui } from '@/components/care-ui';
import { ClinicInfo } from '@/components/clinic-info';
export default function Settings() {
    return <Screen title="Settings and help">
    <Heading title="Your account, with care" description="Manage your password and understand how to get help."/>
    <View style={ui.card}>
    <Text style={ui.sectionTitle}>Account security</Text>
    <Button title="Change my password" secondary icon="lock" onPress={() => router.push('/reset-password')}/>
    </View>
    <View style={ui.card}>
    <Text style={ui.sectionTitle}>Privacy</Text>
    <Text style={ui.text}>Medical records are only available to verified patients through clinic-approved access. Resource bookmarks are stored on this device for your account. Health topics you choose are interests, not medical conditions.</Text>
    </View>
    <View style={ui.card}>
    <Text style={ui.sectionTitle}>Notifications and language</Text>
    <Text style={ui.text}>The app currently uses English. Push notifications and language preferences are not available yet. Check your clinic request in Profile for updates.</Text>
    </View>
    <ClinicInfo />
    <Notice>GYNECAIRE supports your connection with the clinic. It does not replace professional medical advice or emergency services.</Notice>
    <View style={ui.card}>
    <Text style={ui.sectionTitle}>About GYNECAIRE</Text>
    <Text style={ui.text}>Your partner in every stage of womanhood. A patient connection and health-education companion for GYNECAIRE Lying-in Center.</Text>
    </View>
    </Screen>;
}
