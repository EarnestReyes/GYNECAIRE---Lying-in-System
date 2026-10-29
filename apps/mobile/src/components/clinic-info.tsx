import { useState } from 'react';
import { Linking, Text, View } from 'react-native';
import { Button, Notice, ui } from './care-ui';
export function ClinicInfo() {
    const phone = process.env.EXPO_PUBLIC_CLINIC_PHONE;
    const address = process.env.EXPO_PUBLIC_CLINIC_ADDRESS;
    const [error, setError] = useState('');
    async function contact(url: string) { try {
        await Linking.openURL(url);
    }
    catch {
        setError('We couldn’t open this on your device. Please use the clinic contact details above.');
    } }
    return <View style={ui.card}>
    <Text accessibilityRole="header" style={ui.sectionTitle}>GYNECAIRE Lying-in Center</Text>
    <Text style={ui.text}>Contact the clinic to confirm services, opening hours, and appointment arrangements.</Text>
    <Text style={ui.label}>Contact number</Text>
    <Text selectable style={ui.small}>{phone || 'A clinic contact number has not been published in the app yet.'}</Text>{phone && /^\+?\d{7,15}$/.test(phone.replace(/[ ()-]/g, '')) && <Button title="Call the clinic" secondary icon="clinic" onPress={() => contact(`tel:${phone.replace(/[ ()-]/g, '')}`)}/>}<Text style={ui.label}>Location</Text>
    <Text selectable style={ui.small}>{address || 'Please ask the clinic for its current address.'}</Text>{address && <Button title="Open clinic location in Maps" secondary icon="external" onPress={() => contact(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`)}/>}{error && <Notice tone="error">{error}</Notice>}</View>;
}
