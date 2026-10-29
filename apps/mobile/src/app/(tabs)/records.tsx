import { useState } from 'react';
import { Text } from 'react-native';
import { EmptyState, Notice, Screen, Segments, ui } from '@/components/care-ui';
export default function Records() {
    const [category, setCategory] = useState('Prenatal');
    return <Screen title="My records" tabbed>
    <Text style={ui.text}>Your clinic documents, together in one private place.</Text>
    <Segments options={["Prenatal", "Postnatal", "Other"]} value={category} onChange={setCategory}/>
    <EmptyState title={`${category} documents aren’t available here yet`} description="Your clinic has not connected digital medical records to this app. Please ask the clinic for copies of documents you need." icon="lock"/>
    <Notice>This message doesn’t mean you have no medical records. Only your clinic can confirm what is recorded in your file.</Notice>
    </Screen>;
}
