import { useEffect, useState } from 'react';
import { Linking, Text, View } from 'react-native';
import { Button, Notice, ui } from './care-ui';
import { request } from '@/lib/account';
import { useSession } from '@/lib/session';
type PublishedClinic={clinic_name:string;description:string|null;contact_number:string|null;address:string|null;email:string|null;timezone:string;services:string[];operating_hours:Record<string,{closed:boolean;opens:string|null;closes:string|null}>;appointment_policies:{booking_enabled:boolean;cancellation_rules:string|null;cancellation_notice_hours:number}};
export function ClinicInfo() {
    const { session }=useSession();
    const owner=session?.user.id;
    const [result,setResult]=useState<{owner:string;settings:PublishedClinic|null;error:boolean}|null>(null);
    useEffect(()=>{if(!owner)return;const controller=new AbortController();void request<{settings:PublishedClinic|null}>('/clinic',undefined,controller.signal).then(value=>{if(!controller.signal.aborted)setResult({owner,settings:value.settings,error:false});}).catch(()=>{if(!controller.signal.aborted)setResult({owner,settings:null,error:true});});return()=>controller.abort();},[owner]);
    const current=result?.owner===owner?result:null;
    const clinic=current?.settings;
    const phone = owner?clinic?.contact_number:process.env.EXPO_PUBLIC_CLINIC_PHONE;
    const address = owner?clinic?.address:process.env.EXPO_PUBLIC_CLINIC_ADDRESS;
    const [error, setError] = useState('');
    async function contact(url: string) { try {
        await Linking.openURL(url);
    }
    catch {
        setError('We couldn’t open this on your device. Please use the clinic contact details above.');
    } }
    return <View style={ui.card}>
    <Text accessibilityRole="header" style={ui.sectionTitle}>{clinic?.clinic_name||'GYNECAIRE Lying-in Center'}</Text>
    <Text style={ui.text}>{clinic?.description||'Contact the clinic to confirm services, opening hours, and appointment arrangements.'}</Text>
    {owner&&!current&&<Text style={ui.small}>Loading shared clinic information...</Text>}
    {owner&&current&&!clinic&&<Notice>{current.error?'Clinic information could not be loaded. Please try again later.':'The clinic has not shared its configuration with signed-in users yet.'}</Notice>}
    {clinic?.email&&<Text selectable style={ui.small}>{clinic.email}</Text>}
    {clinic&&<><Text style={ui.label}>Operating hours ({clinic.timezone})</Text>{Object.entries(clinic.operating_hours).map(([day,hours])=><Text key={day} style={ui.small}>{day}: {hours.closed?'Closed':`${hours.opens} - ${hours.closes}`}</Text>)}<Text style={ui.label}>Services</Text><Text style={ui.text}>{clinic.services.length?clinic.services.join(', '):'No services published.'}</Text><Text style={ui.small}>{clinic.appointment_policies.booking_enabled?'Contact the clinic to request an appointment.':'The clinic is not currently accepting appointment requests.'} Online booking is not available in this app.</Text>{clinic.appointment_policies.cancellation_rules&&<Text style={ui.small}>{clinic.appointment_policies.cancellation_rules}</Text>}</>}
    <Text style={ui.label}>Contact number</Text>
    <Text selectable style={ui.small}>{phone || 'A clinic contact number has not been published in the app yet.'}</Text>{phone && /^\+?\d{7,15}$/.test(phone.replace(/[ ()-]/g, '')) && <Button title="Call the clinic" secondary icon="clinic" onPress={() => contact(`tel:${phone.replace(/[ ()-]/g, '')}`)}/>}<Text style={ui.label}>Location</Text>
    <Text selectable style={ui.small}>{address || 'Please ask the clinic for its current address.'}</Text>{address && <Button title="Open clinic location in Maps" secondary icon="external" onPress={() => contact(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`)}/>}{error && <Notice tone="error">{error}</Notice>}</View>;
}
