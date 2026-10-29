import { useRef, useState, type ComponentRef } from 'react';
import { router } from 'expo-router';
import { TextInput } from 'react-native';
import { Button, Field, Heading, Notice, Screen, TextAction } from '@/components/care-ui';
import { supabase } from '@/lib/supabase';
import { validEmail } from '@/lib/form-validation';
import { useOnboardingDraft } from '@/lib/onboarding-draft';
import { useSubmission } from '@/hooks/use-submission';
export default function Login() {
    const { draft } = useOnboardingDraft();
    const [email, setEmail] = useState(draft.email);
    const [password, setPassword] = useState('');
    const [errors, setErrors] = useState({ email: '', password: '' });
    const [message, setMessage] = useState('');
    const { busy, run } = useSubmission();
    const passwordRef = useRef<ComponentRef<typeof TextInput>>(null);
    function login() {
        const next = { email: validEmail(email) ? '' : 'Enter a valid email address.', password: password ? '' : 'Enter your password.' };
        setErrors(next);
        if (Object.values(next).some(Boolean))
            return;
        void run(async () => {
            setMessage('');
            try {
                const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
                if (error) {
                    setMessage('Your email or password doesn’t match, or your email still needs confirmation. Please check and try again.');
                    return;
                }
                setPassword('');
                router.replace('/dashboard');
            }
            catch {
                setMessage('We couldn’t connect. Check your internet connection and try again.');
            }
        });
    }
    return <Screen title="Sign in">
    <Heading title="Welcome back" description="Sign in to check your account and continue your care journey."/>
    <Field label="Email address" required value={email} onChangeText={setEmail} error={errors.email} autoCapitalize="none" keyboardType="email-address" autoComplete="email" returnKeyType="next" onSubmitEditing={() => passwordRef.current?.focus()} editable={!busy}/>
    <Field label="Password" required inputRef={passwordRef} value={password} onChangeText={setPassword} error={errors.password} secureTextEntry autoComplete="current-password" returnKeyType="go" onSubmitEditing={login} editable={!busy}/>
    <TextAction title="Forgot your password?" onPress={() => router.push('/recover')}/>{message && <Notice tone="error">{message}</Notice>}<Button title="Sign in" busy={busy} onPress={login}/>
    <TextAction title="New here? Create an account" onPress={() => router.push('/account-type')}/>
    </Screen>;
}
