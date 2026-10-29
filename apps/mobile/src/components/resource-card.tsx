import { useState } from 'react';
import { Linking, Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useSession } from '@/lib/session';
import { useLibrary } from '@/lib/library';
import type { Resource } from '@/lib/education';
import { Notice, ui } from './care-ui';
import { CareIcon } from './care-icon';
export function ResourceCard({ resource }: {
    resource: Resource;
}) {
    const { session } = useSession();
    const { saved, busy, error: saveError, toggle } = useLibrary();
    const [error, setError] = useState('');
    const bookmarked = saved.includes(resource.id);
    async function open() { try {
        await Linking.openURL(resource.url);
    }
    catch {
        setError('We couldn’t open this resource. Check your internet connection and try again.');
    } }
    return <View style={ui.card}>
    <View style={ui.row}>
    <Pressable accessibilityRole="link" accessibilityLabel={`Read ${resource.title} on the World Health Organization website`} onPress={open} style={[ui.flex,{ minHeight: 48,justifyContent: 'center' }]}>
    <Text style={ui.cardTitle}>{resource.title}</Text>
    <Text style={ui.caption}>World Health Organization</Text>
    <View style={[ui.row,{ gap: 4 }]}><Text style={ui.link}>Read resource</Text><CareIcon name="external" size={16}/></View>
    </Pressable>
    <Pressable accessibilityRole="button" accessibilityLabel={!session ? 'Sign in to save this resource' : bookmarked ? `Remove ${resource.title} from saved resources` : `Save ${resource.title}`} accessibilityState={{ selected: bookmarked, disabled: !!session && busy }} disabled={!!session && busy} onPress={() => { if (!session)
        router.push('/login');
    else
        void toggle(resource.id); }} style={ui.iconButton}>
    <CareIcon name={bookmarked ? 'saved' : 'bookmark'}/>
    </Pressable>
    </View>
    <Text style={ui.small}>{resource.description}</Text>
    {(error || saveError) && <Notice tone="error">{error || saveError}</Notice>}</View>;
}
