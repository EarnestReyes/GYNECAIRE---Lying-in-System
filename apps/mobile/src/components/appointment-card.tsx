import { Text, View } from 'react-native';
import type { CareAppointment } from '@/lib/account';
import { CareIcon } from './care-icon';
import { ui } from './care-ui';
import { brand } from '@/constants/brand';
export function AppointmentCard({ appointment }: {
    appointment: CareAppointment;
}) {
    return <View style={ui.card}>
    <View style={ui.row}>
    <View style={ui.iconCircle}>
    <CareIcon name="appointments"/>
    </View>
    <Text style={[ui.cardTitle, ui.flex]}>{appointment.appointment_type}</Text>
    </View>
    <Text style={ui.text}>{new Intl.DateTimeFormat('en-PH', { timeZone: 'Asia/Manila', month: 'long', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(appointment.appointment_date))}</Text>
    <Text style={ui.small}>Clinic time · Philippines</Text>
    <Text style={[ui.label, { color: appointment.status === 'confirmed' ? brand.success : brand.primary }]}>Status: {appointment.status === 'pending' ? 'Waiting for clinic confirmation' : appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}</Text>
    </View>;
}
