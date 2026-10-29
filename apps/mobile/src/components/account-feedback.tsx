import { Button, Loading, Notice } from './care-ui';
import { useAccount } from '@/lib/account-context';
export function AccountFeedback() {
    const { loading, error, refresh } = useAccount();
    if (loading)
        return <Loading label="Loading your account…"/>;
    if (error)
        return <>
        <Notice tone="error">{error}</Notice>
        <Button title="Try loading my account again" secondary onPress={refresh}/>
        </>;
    return null;
}
