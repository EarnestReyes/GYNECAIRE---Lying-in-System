import { useCallback } from 'react';
import { router, useFocusEffect } from 'expo-router';
import { Text, View } from 'react-native';
import { Button, EmptyState, Heading, Loading, Notice, Progress, Screen, ui } from '@/components/care-ui';
import { CareIcon } from '@/components/care-icon';
import { useAccount } from '@/lib/account-context';
import { space } from '@/constants/brand';
export default function VerificationStatus() {
    const { account, loading, error, refresh } = useAccount();
    useFocusEffect(useCallback(() => { refresh(); }, [refresh]));
    const status = account?.verification_status;
    return <Screen title="My clinic request">{loading ? <Loading label="Checking your clinic request…"/> : error ? <>
        <Notice tone="error">{error}</Notice>
        <Button title="Check again" onPress={refresh}/>
        </> : status === 'pending' ? <>
        <Progress step={2} total={2} label="Clinic patient request"/>
        <EmptyState title="Your request is with the clinic" description="You’ve completed your part. Clinic staff will check your identity before approving your patient account." icon="clock"/>
        <View style={ui.card}>{['Request received', 'Waiting for clinic review', 'Approval and record linking'].map((label, index) => <View key={label} style={ui.row}>
            <CareIcon name={index === 0 ? 'check' : 'clock'}/>
            <View style={ui.flex}>
            <Text style={ui.cardTitle}>{label}</Text>{index === 1 && <Text style={ui.small}>The clinic may contact you using the number you submitted.</Text>}</View>
            </View>)}</View>
        <Notice>You can keep exploring health resources while you wait. No review time or automatic notification is promised.</Notice>
        <Button title="Check for an update" secondary onPress={refresh}/>
        <Button title="Back to home" onPress={() => router.replace('/dashboard')}/>
        </> : status === 'approved' ? <>
        <EmptyState title="You’re a verified clinic patient" description="Your clinic has approved your account. You can now see the patient features available to you." icon="check"/>
        <Button title="Go to my home" onPress={() => router.replace('/dashboard')}/>
        </> : status === 'rejected' ? <>
        <Heading title="The clinic couldn’t approve this request" description="Please contact the clinic to check your details before trying again. Your health information is still protected."/>
        <Button title="Review my details and try again" onPress={() => router.replace('/verification')}/>
        <Button title="Back to home" secondary onPress={() => router.replace('/dashboard')}/>
        </> : <>
        <EmptyState title="No request submitted yet" description="Start a clinic patient request when you’re ready to receive care." icon="clinic"/>
        <Button title="Become a clinic patient" onPress={() => router.replace('/verification')}/>
        <View style={{ height: space.sm }}/>
        </>}</Screen>;
}
