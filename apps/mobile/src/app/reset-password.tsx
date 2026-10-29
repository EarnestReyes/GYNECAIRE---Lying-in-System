import { useState } from 'react';
import { router } from 'expo-router';
import { Button, EmptyState, Field, Heading, Notice, Screen } from '@/components/care-ui';
import { supabase } from '@/lib/supabase';
import { passwordErrors } from '@/lib/form-validation';
import { useSubmission } from '@/hooks/use-submission';
export default function ResetPassword() {
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [errors, setErrors] = useState({ password: '', confirm: '' });
    const [message, setMessage] = useState('');
    const [saved, setSaved] = useState(false);
    const { busy, run } = useSubmission();
    function save() {
        const next = passwordErrors(password, confirm);
        setErrors(next);
        if (Object.values(next).some(Boolean))
            return;
        void run(async () => { setMessage(''); try {
            const { error } = await supabase.auth.updateUser({ password });
            if (error)
                setMessage('We couldn’t change your password. Please request a new recovery email and try again.');
            else {
                setPassword('');
                setConfirm('');
                setSaved(true);
            }
        }
        catch {
            setMessage('We couldn’t connect. Please try again.');
        } });
    }
    return <Screen title="Change password">{saved ? <>
        <EmptyState title="Your password is updated" description="Use your new password the next time you sign in." icon="check"/>
        <Button title="Go to home" onPress={() => router.replace('/dashboard')}/>
        </> : <>
        <Heading title="Choose a new password" description="Use a password you haven’t shared with anyone."/>
        <Field label="New password" required value={password} onChangeText={setPassword} error={errors.password} hint="Use at least 10 characters." secureTextEntry autoComplete="new-password" editable={!busy}/>
        <Field label="Confirm new password" required value={confirm} onChangeText={setConfirm} error={errors.confirm} secureTextEntry autoComplete="new-password" editable={!busy}/>{message && <Notice tone="error">{message}</Notice>}<Button title="Update password" busy={busy} onPress={save}/>
        </>}</Screen>;
}
