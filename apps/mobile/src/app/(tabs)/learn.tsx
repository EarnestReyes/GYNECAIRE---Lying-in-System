import { useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { Button, EmptyState, Field, Heading, Notice, Screen, ui } from '@/components/care-ui';
import { ResourceCard } from '@/components/resource-card';
import { categories, filterResources, resources } from '@/lib/education';
import { useLibrary } from '@/lib/library';
import { brand, radius, space } from '@/constants/brand';
export default function Learn() {
    const { q, category, saved } = useLocalSearchParams<{
        q?: string;
        category?: string;
        saved?: string;
    }>();
    return <Library key={`${q || ''}:${category || ''}:${saved || ''}`} initialQuery={q || ''} initialCategory={categories.includes(category || '') ? category! : 'All'} savedOnly={saved === '1'}/>;
}
function Library({ initialQuery, initialCategory, savedOnly }: {
    initialQuery: string;
    initialCategory: string;
    savedOnly: boolean;
}) {
    const [query, setQuery] = useState(initialQuery);
    const [category, setCategory] = useState(initialCategory);
    const library = useLibrary();
    const matches = filterResources(query, category).filter(item => !savedOnly || library.saved.includes(item.id));
    return <Screen title={savedOnly ? 'Saved resources' : 'Learn'} tabbed>
    <Heading title={savedOnly ? 'A little knowledge, kept close' : 'Learn at your own pace'} description={savedOnly ? 'Saved on this device for your account. These resources do not sync to other devices.' : 'Browse trusted resources from the World Health Organization. These links support learning and do not replace professional care.'}/>
    <Field label="Search resources" value={query} onChangeText={setQuery} placeholder="Try pregnancy or nutrition" returnKeyType="search"/>
    <View style={ui.wrap}>{['All', ...categories].map(item => <Pressable key={item} accessibilityRole="button" accessibilityState={{ selected: item === category }} onPress={() => setCategory(item)} style={({ pressed }) => ({ paddingVertical: space.md, paddingHorizontal: space.base, minHeight: 48, borderRadius: radius.pill, borderWidth: 1, borderColor: item === category ? brand.primary : brand.border, backgroundColor: item === category ? brand.primary : brand.white, opacity: pressed ? .7 : 1 })}>
        <Text style={[ui.small, { color: item === category ? brand.white : brand.primary }]}>{item}</Text>
        </Pressable>)}</View>{library.error && <Notice tone="error">{library.error}</Notice>}<Text accessibilityLiveRegion="polite" style={ui.small}>{matches.length} {matches.length === 1 ? 'resource' : 'resources'} found</Text>{matches.map(resource => <ResourceCard key={resource.id} resource={resource}/>)}{!matches.length && <EmptyState title={savedOnly ? 'No saved resources in this view' : 'No matching resources'} description={savedOnly ? 'Use the bookmark button on a resource to keep it here, or try another filter.' : 'Try a shorter search or choose another category.'} icon="learn" action={<Button title="Clear filters" secondary onPress={() => { setQuery(''); setCategory('All'); }}/>}/>}<Notice>{resources.length} carefully selected public resource links are available. Clinic-authored articles and videos are not available yet.</Notice>
    </Screen>;
}
