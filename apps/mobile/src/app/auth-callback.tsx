import { useEffect, useRef, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { Button, Loading, Notice, Screen } from '@/components/care-ui';
import { supabase } from '@/lib/supabase';
export default function AuthCallback() {
    const { code, next } = useLocalSearchParams<{
        code?: string;
        next?: string;
    }>();
    const started = useRef(false);
    const [error, setError] = useState('');
    useEffect(() => {
        if (started.current)
            return;
        started.current = true;
        if (!code)
            return;
        supabase.auth.exchangeCodeForSession(code).then(({ data, error }) => {
            if (error)
                setError('This link may have expired or opened on another device. Please request a new email.');
            else {
                const intent = data.session?.user.user_metadata.onboarding_intent;
                router.replace(next === 'recover' ? '/reset-password' : intent === 'existing' || intent === 'new' ? '/interests?next=verification' : '/interests');
            }
        }).catch(() => setError('We couldn’t connect. Please request a new email and try again.'));
    }, [code, next]);
    const message = !code ? 'This link is incomplete. Request a new email and open it on the same device.' : error;
    return <Screen title="Confirming your email" back={false}>{message ? <>
        <Notice tone="error">{message}</Notice>
        <Button title="Go to sign in" onPress={() => router.replace('/login')}/>
        </> : <Loading label="Opening your secure link…"/>}</Screen>;
}
