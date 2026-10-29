import { useState } from 'react';
import { Text, View } from 'react-native';
import { Button, EmptyState, Notice, Screen, ui } from '@/components/care-ui';
export default function Records() {
    const [category, setCategory] = useState('Prenatal');
    return <Screen title="My records" tabbed>
    <Text style={ui.text}>Your clinic documents, together in one private place.</Text>
    <View style={ui.card}>
    <Text style={ui.cardTitle}>Record categories</Text>{['Prenatal', 'Postnatal', 'Other'].map(item => <Button key={item} title={item} secondary={category !== item} onPress={() => setCategory(item)}/>)}</View>
    <EmptyState title={`${category} documents aren’t available here yet`} description="Your clinic has not connected digital medical records to this app. Please ask the clinic for copies of documents you need." icon="lock"/>
    <Notice>This message doesn’t mean you have no medical records. Only your clinic can confirm what is recorded in your file.</Notice>
    </Screen>;
}
