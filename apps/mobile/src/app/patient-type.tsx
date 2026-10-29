import { router } from 'expo-router';
import { Text } from 'react-native';
import { Button, Notice, Screen, ui } from '@/components/care-ui';
export default function PatientType() { return <Screen><Text style={ui.caption}>YOUR CLINIC JOURNEY · 2 OF 3</Text><Text style={ui.title}>Have we met before?</Text><Button title="Yes, I’m an existing patient" onPress={() => router.push('/register?intent=existing')} /><Button title="No, I’m a new patient" secondary onPress={() => router.push('/register?intent=new')} /><Notice>The clinic verifies your identity before linking records. A name or patient number never grants access.</Notice></Screen>; }
