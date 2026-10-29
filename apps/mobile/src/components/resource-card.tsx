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
    <View style={ui.iconCircle}>
    <CareIcon name={resource.icon}/>
    </View>
    <View style={ui.flex}>
    <Text accessibilityRole="header" style={ui.cardTitle}>{resource.title}</Text>
    <Text style={ui.small}>World Health Organization</Text>
    </View>
    </View>
    <Text style={ui.small}>{resource.description}</Text>
    <View style={[ui.row, { justifyContent: 'space-between', flexWrap: 'wrap' }]}>
    <Pressable accessibilityRole="link" accessibilityLabel={`Read ${resource.title} on the WHO website`} onPress={open} style={ui.textAction}>
    <View style={ui.row}>
    <Text style={ui.link}>Read at WHO</Text>
    <CareIcon name="external" size={18}/>
    </View>
    </Pressable>
    <Pressable accessibilityRole="button" accessibilityLabel={!session ? 'Sign in to save this resource' : bookmarked ? `Remove ${resource.title} from saved resources` : `Save ${resource.title}`} accessibilityState={{ selected: bookmarked, disabled: !!session && busy }} disabled={!!session && busy} onPress={() => { if (!session)
        router.push('/login');
    else
        void toggle(resource.id); }} style={ui.iconButton}>
    <CareIcon name={bookmarked ? 'saved' : 'bookmark'}/>
    </Pressable>
    </View>{(error || saveError) && <Notice tone="error">{error || saveError}</Notice>}</View>;
}
