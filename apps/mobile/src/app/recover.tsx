import { useState } from 'react';
import { router } from 'expo-router';
import { Button, EmptyState, Field, Heading, Notice, Screen, TextAction } from '@/components/care-ui';
import { supabase } from '@/lib/supabase';
import { validEmail } from '@/lib/form-validation';
import { useSubmission } from '@/hooks/use-submission';
export default function Recover() {
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [sent, setSent] = useState(false);
    const { busy, run } = useSubmission();
    function send() {
        setError(validEmail(email) ? '' : 'Enter a valid email address.');
        if (!validEmail(email))
            return;
        void run(async () => {
            setMessage('');
            const redirect = process.env.EXPO_PUBLIC_AUTH_REDIRECT_URL;
            if (!redirect) {
                setMessage('Password help isn’t available in the app yet. Please contact the clinic.');
                return;
            }
            try {
                const url = new URL(redirect);
                url.searchParams.set('next', 'recover');
                const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: url.toString() });
                if (error)
                    setMessage('We couldn’t send the email. Please try again in a few minutes.');
                else
                    setSent(true);
            }
            catch {
                setMessage('We couldn’t connect. Check your internet connection and try again.');
            }
        });
    }
    return <Screen title="Password help">{sent ? <>
        <EmptyState title="Check your inbox" description="If an account exists for this email, you’ll receive a recovery link. Open it on the same device and browser where you requested it." icon="mail"/>
        <Button title="Back to sign in" onPress={() => router.replace('/login')}/>
        <TextAction title="Try another email" onPress={() => setSent(false)}/>
        </> : <>
        <Heading title="Let’s get you back in" description="Enter your account email. We’ll send instructions to help you choose a new password."/>
        <Field label="Email address" required value={email} onChangeText={setEmail} error={error} keyboardType="email-address" autoCapitalize="none" autoComplete="email" returnKeyType="send" onSubmitEditing={send} editable={!busy}/>{message && <Notice tone="error">{message}</Notice>}<Button title="Send recovery email" busy={busy} onPress={send}/>
        </>}</Screen>;
}
