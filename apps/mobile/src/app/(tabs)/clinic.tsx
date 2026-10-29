import { router } from 'expo-router';
import { Text, View } from 'react-native';
import { Button, Heading, Notice, Screen, ui } from '@/components/care-ui';
import { ClinicInfo } from '@/components/clinic-info';
import { useSession } from '@/lib/session';
import { useAccount } from '@/lib/account-context';
export default function Clinic() {
    const { session } = useSession();
    const { account } = useAccount();
    return <Screen title="Our clinic" tabbed>
    <Heading title="A connection to caring people" description="Find clinic details and take the next step toward care."/>
    <ClinicInfo />
    <View style={ui.card}>
    <Text style={ui.sectionTitle}>Want to become a clinic patient?</Text>
    <Text style={ui.text}>Create an account and share a few details. The clinic will review your identity before connecting your medical records.</Text>
    <Button title={!session ? 'Sign in to start a clinic request' : account?.verification_status === 'pending' ? 'View my clinic request' : 'Become a clinic patient'} onPress={() => router.push(!session ? '/login' : account?.verification_status === 'pending' ? '/verification-pending' : '/verification')}/>
    </View>
    <Notice>Online appointment requests aren’t available yet. Contact the clinic to arrange a visit. No appointment is booked when you submit a verification request.</Notice>
    </Screen>;
}
