import { useState } from 'react';
import { router } from 'expo-router';
import { Text, View } from 'react-native';
import { Button, EmptyState, Field, Heading, Loading, Notice, Screen, TextAction, ui } from '@/components/care-ui';
import { ResourceCard } from '@/components/resource-card';
import { AccountFeedback } from '@/components/account-feedback';
import { AppointmentCard } from '@/components/appointment-card';
import { useSession } from '@/lib/session';
import { useAccount } from '@/lib/account-context';
import { useCare } from '@/hooks/use-care';
import { useNow } from '@/hooks/use-now';
import { categories, resources } from '@/lib/education';
import { brand } from '@/constants/brand';
export default function Dashboard() {
    const { session } = useSession();
    const { account } = useAccount();
    const [search, setSearch] = useState('');
    const patient = account?.account_type === 'patient';
    const recommended = [...resources].sort((a, b) => Number(b.categories.some(tag => account?.interests.includes(tag))) - Number(a.categories.some(tag => account?.interests.includes(tag))));
    function explore() { router.push({ pathname: '/learn', params: { q: search } }); }
    return <Screen title="GYNECAIRE" tabbed>
    <Heading title={account ? `Hello, ${account.full_name.split(' ')[0]}` : 'Welcome to your care space'} description={patient ? 'Your clinic connection, in one reassuring place.' : 'Trusted health information and a little guidance for every chapter.'}/>
    <AccountFeedback />
    {patient ? <PatientOverview /> : <View style={[ui.card, { backgroundColor: brand.blush }]}>
        <Text accessibilityRole="header" style={ui.sectionTitle}>Your guide to every stage</Text>
        <Text style={ui.text}>Explore health information from trusted sources, at your own pace.</Text>
        <Button title="Explore health resources" icon="learn" onPress={() => router.navigate('/learn')}/>
        </View>}
    {account?.verification_status === 'pending' && <View style={ui.card}>
        <Text style={ui.cardTitle}>Your clinic request is being reviewed</Text>
        <Text style={ui.small}>Keep exploring while the clinic checks your details.</Text>
        <Button title="View my request" secondary onPress={() => router.push('/verification-pending')}/>
        </View>}
    <Field label="Find health information" value={search} onChangeText={setSearch} placeholder="Search topics or resources" returnKeyType="search" onSubmitEditing={explore}/>
    <Button title="Search resources" secondary icon="search" onPress={explore}/>
    <View style={ui.card}>
    <Text accessibilityRole="header" style={ui.sectionTitle}>Browse by category</Text>{categories.map(category => <TextAction key={category} title={category} onPress={() => router.push({ pathname: '/learn', params: { category } })}/>)}</View>
    <Heading title={account?.interests.length ? 'Based on your interests' : 'A good place to begin'} description="Resources open on the World Health Organization website."/>{recommended.slice(0, 2).map(resource => <ResourceCard key={resource.id} resource={resource}/>)}
    {!patient && <View style={ui.card}>
        <Text style={ui.cardTitle}>Ready to connect with GYNECAIRE?</Text>
        <Text style={ui.small}>Find clinic information or start a request to become a clinic patient.</Text>
        <Button title="Visit the clinic page" secondary icon="clinic" onPress={() => router.navigate('/clinic')}/>{session && account?.account_type === 'general' && account.verification_status !== 'pending' && <Button title="Become a clinic patient" onPress={() => router.push('/verification')}/>}</View>}
  </Screen>;
}
function PatientOverview() {
    const care = useCare();
    const now = useNow();
    const upcoming = care.data?.appointments.filter(item => (item.status === 'pending' || item.status === 'confirmed') && new Date(item.appointment_date).getTime() >= now).sort((a, b) => Date.parse(a.appointment_date) - Date.parse(b.appointment_date))[0];
    return <>{care.loading ? <Loading label="Loading your clinic information…"/> : care.error ? <>
        <Notice tone="error">{care.error}</Notice>
        <Button title="Try again" onPress={care.refresh}/>
        </> : <>
        <Text accessibilityRole="header" style={ui.sectionTitle}>Your next appointment</Text>{upcoming ? <AppointmentCard appointment={upcoming}/> : <View style={ui.card}>
            <EmptyState title="No upcoming appointments" description="Your next clinic visit will appear here once it’s recorded. Contact the clinic to arrange a visit." icon="appointments"/>
            </View>}</>}<View style={ui.card}>
    <Text style={ui.sectionTitle}>Your care, at a glance</Text>
    <Button title="My appointments" icon="appointments" onPress={() => router.navigate('/appointments')}/>
    <Button title="My records" secondary icon="records" onPress={() => router.navigate('/records')}/>
    </View>
    <Notice>Pregnancy details and clinical measurements haven’t been connected in the app yet. Your clinic can help you check this information.</Notice>
    </>;
}
