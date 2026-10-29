import { useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';
import { Button, ChoiceChip, Heading, Loading, Notice, Progress, Screen, TextAction, ui } from '@/components/care-ui';
import { useAccount } from '@/lib/account-context';
import { interests, request } from '@/lib/account';
import { useSubmission } from '@/hooks/use-submission';
export default function Interests() {
    const { account, loading, error, refresh } = useAccount();
    if (loading)
        return <Screen title="Your interests">
        <Loading label="Loading your saved interests…"/>
        </Screen>;
    if (error || !account)
        return <Screen title="Your interests">
        <Notice tone="error">{error || 'We couldn’t find your account.'}</Notice>
        <Button title="Try again" onPress={refresh}/>
        </Screen>;
    return <InterestSelection current={account.interests}/>;
}
function InterestSelection({ current }: {
    current: string[];
}) {
    const { next, editing } = useLocalSearchParams<{
        next?: string;
        editing?: string;
    }>();
    const { refresh } = useAccount();
    const [selected, setSelected] = useState(current);
    const [message, setMessage] = useState('');
    const { busy, run } = useSubmission();
    function finish() { router.replace(editing === '1' ? '/profile' : next === 'verification' ? '/onboarding-complete?next=verification' : '/onboarding-complete'); }
    function save() { void run(async () => { setMessage(''); try {
        await request('/preferences', { interests: selected });
        refresh();
        finish();
    }
    catch (error) {
        setMessage(error instanceof Error ? error.message : 'We couldn’t save your interests. Please try again.');
    } }); }
    return <Screen title="Your interests">
    <Progress step={1} total={1} label="Optional personalization"/>
    <Heading title="Make this space yours" description="Choose what you’d like to learn about. You can change these later. Selecting a topic doesn’t mean you have a medical condition."/>
    <View style={ui.wrap}>{interests.map(topic => <ChoiceChip key={topic} title={topic} checked={selected.includes(topic)} onPress={() => setSelected(values => values.includes(topic) ? values.filter(value => value !== topic) : [...values, topic])}/>)}</View>{message && <Notice tone="error">{message}</Notice>}<Button title={editing === '1' ? 'Save interests' : 'Save and continue'} busy={busy} onPress={save}/>
    <TextAction title={editing === '1' ? 'Cancel changes' : 'Skip for now'} onPress={finish}/>
    </Screen>;
}
