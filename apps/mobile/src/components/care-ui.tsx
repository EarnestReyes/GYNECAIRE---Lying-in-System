import { useState, type PropsWithChildren } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { brand as b } from '@/constants/brand';
export function Screen({ children }: PropsWithChildren) {
 return <SafeAreaView style={{ flex: 1, backgroundColor: b.background }}><KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}><ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={ui.screen}><View style={ui.content}>{children}</View></ScrollView></KeyboardAvoidingView></SafeAreaView>;
}
export function Button({ title, onPress, secondary = false, busy = false, disabled = false }: { title: string; onPress: () => void; secondary?: boolean; busy?: boolean; disabled?: boolean }) {
 return <Pressable accessibilityRole="button" accessibilityState={{ disabled: disabled || busy, busy }} disabled={disabled || busy} onPress={onPress} style={({ pressed }) => [ui.button, secondary && ui.secondary, { opacity: disabled || busy || pressed ? 0.6 : 1 }]}>{busy ? <ActivityIndicator color={b.white} /> : <Text style={[ui.buttonText, secondary && { color: b.primary }]}>{title}</Text>}</Pressable>;
}
export function Field({ label, secureTextEntry, ...props }: TextInputProps & { label: string }) {
 const [visible, setVisible] = useState(false);
 return <View style={{ gap: 7 }}><Text style={ui.label}>{label}</Text><View style={ui.field}><TextInput {...props} accessibilityLabel={label} secureTextEntry={secureTextEntry && !visible} placeholderTextColor={b.muted} style={ui.input} />{secureTextEntry && <Pressable accessibilityRole="button" accessibilityLabel={visible ? 'Hide password' : 'Show password'} onPress={() => setVisible(!visible)} style={{ padding: 12 }}><Text style={{ color: b.primary }}>{visible ? 'Hide' : 'Show'}</Text></Pressable>}</View></View>;
}
export function Notice({ children }: PropsWithChildren) { return <Text accessibilityLiveRegion="polite" style={ui.notice}>{children}</Text>; }
export function Brand() { return <View style={{ alignItems: 'center', gap: 8 }}><Text style={ui.logo}>GYNECAIRE</Text><Text style={ui.caption}>Lying-in Center Management System</Text></View>; }
export function CareArt() { return <View accessible accessibilityLabel="Mother cradling her baby illustration" style={ui.art}><View style={ui.halo} /><View style={ui.body} /><View style={ui.head} /><View style={ui.baby}><Text style={{ color: b.primary, fontSize: 34 }}>♡</Text></View><Text style={ui.artCaption}>Care that grows with you</Text></View>; }
export const ui = StyleSheet.create({
 screen: { flexGrow: 1, padding: 24, justifyContent: 'center' }, content: { width: '100%', maxWidth: 480, alignSelf: 'center', gap: 18 },
 logo: { color: b.primary, fontSize: 31, letterSpacing: 4, fontWeight: '700' }, caption: { color: b.muted, fontSize: 12, textAlign: 'center' },
 title: { color: b.plum, fontSize: 30, fontWeight: '700', lineHeight: 38 }, text: { color: b.muted, fontSize: 16, lineHeight: 25 }, label: { color: b.plum, fontWeight: '600', fontSize: 14 },
 card: { backgroundColor: b.white, borderRadius: 22, borderWidth: 1, borderColor: b.border, padding: 22, gap: 12 },
 button: { backgroundColor: b.primary, minHeight: 52, borderRadius: 16, padding: 15, justifyContent: 'center', alignItems: 'center' }, secondary: { backgroundColor: b.white, borderWidth: 1, borderColor: b.border }, buttonText: { color: b.white, fontWeight: '600', fontSize: 16 },
 field: { backgroundColor: b.white, borderWidth: 1, borderColor: b.border, borderRadius: 14, flexDirection: 'row', alignItems: 'center' }, input: { flex: 1, minHeight: 52, padding: 14, color: b.plum, fontSize: 16 }, notice: { color: b.primary, backgroundColor: b.blush, borderRadius: 14, padding: 16, lineHeight: 23 },
 art: { height: 250, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', backgroundColor: b.blush, borderRadius: 100 }, halo: { position: 'absolute', width: 200, height: 200, borderRadius: 100, backgroundColor: '#F4CDDC' }, body: { position: 'absolute', top: 90, width: 120, height: 150, borderTopLeftRadius: 70, borderTopRightRadius: 55, backgroundColor: b.primary, transform: [{ rotate: '-12deg' }] }, head: { position: 'absolute', top: 30, width: 64, height: 75, borderRadius: 36, backgroundColor: '#C88878', borderTopWidth: 20, borderColor: b.plum }, baby: { position: 'absolute', top: 116, left: '47%', width: 90, height: 55, borderRadius: 40, backgroundColor: b.white, alignItems: 'center', transform: [{ rotate: '-25deg' }] }, artCaption: { position: 'absolute', bottom: 10, color: b.plum, backgroundColor: b.blush, paddingHorizontal: 16, paddingVertical: 5, borderRadius: 20, fontSize: 12 },
});
