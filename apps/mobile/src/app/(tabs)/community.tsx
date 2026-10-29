import { router } from 'expo-router';
import { Text, View } from 'react-native';
import { Button, EmptyState, Notice, Screen, ui } from '@/components/care-ui';
export default function Community() {
    return <Screen title="Community" tabbed>
    <EmptyState title="A caring community is on its way" description="Discussions and questions will be available once the clinic has a moderation team and reporting tools ready." icon="community"/>
    <View style={ui.card}>
    <Text style={ui.sectionTitle}>A safer space for everyone</Text>
    <Text style={ui.text}>Keep personal medical details private. Be kind, respect other people’s experiences, and speak with a qualified professional about your own care.</Text>
    </View>
    <Notice>Posting and replies are not available. No public discussions or patient information are shown here.</Notice>
    <Button title="Explore health resources instead" secondary icon="learn" onPress={() => router.navigate('/learn')}/>
    </Screen>;
}
