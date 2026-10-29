import { useState } from 'react';
import { Text } from 'react-native';
import { Button, EmptyState, Loading, Notice, Screen, Segments, ui } from '@/components/care-ui';
import { AppointmentCard } from '@/components/appointment-card';
import { ClinicInfo } from '@/components/clinic-info';
import { useCare } from '@/hooks/use-care';
import { useNow } from '@/hooks/use-now';
export default function Appointments() {
    const care = useCare();
    const [filter, setFilter] = useState('Upcoming');
    const now = useNow();
    const appointments = care.data?.appointments.filter(item => filter === 'All' || (filter === 'Upcoming' ? Date.parse(item.appointment_date) >= now && (item.status === 'pending' || item.status === 'confirmed') : Date.parse(item.appointment_date) < now || item.status === 'cancelled' || item.status === 'completed')).sort((a, b) => filter === 'Upcoming' ? Date.parse(a.appointment_date) - Date.parse(b.appointment_date) : Date.parse(b.appointment_date) - Date.parse(a.appointment_date));
    return <Screen title="My appointments" tabbed>
    <Text style={ui.text}>Check the clinic visits recorded for your verified patient account.</Text>
    <Segments options={["Upcoming", "Past", "All"]} value={filter} onChange={setFilter}/>{care.loading ? <Loading label="Loading your appointments…"/> : care.error ? <>
        <Notice tone="error">{care.error}</Notice>
        <Button title="Try again" onPress={care.refresh}/>
        </> : appointments?.length ? appointments.map(item => <AppointmentCard key={item.id} appointment={item}/>) : <EmptyState title={filter === 'Upcoming' ? 'No upcoming appointments' : 'No appointments in this view'} description="When the clinic records a visit for you, it will appear here. Contact the clinic to arrange or change a visit." icon="appointments"/>}<Button title="Refresh appointments" secondary onPress={care.refresh}/>
    <Notice>Showing up to 100 recorded visits. Online booking, cancellation, and rescheduling aren’t available in the app yet.</Notice>
    <ClinicInfo />
    </Screen>;
}
