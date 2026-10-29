import { useState, type ComponentRef, type PropsWithChildren, type ReactNode, type RefObject } from 'react';
import { router } from 'expo-router';
import { ActivityIndicator, Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { brand as b, radius, space, type } from '@/constants/brand';
import { CareIcon, type CareIconName } from './care-icon';
import careMark from '@/assets/images/gynecaire-mark.png';
export function Screen({ children, title, tabbed = false, back = true, centered = false, footer }: PropsWithChildren<{
    title?: string;
    tabbed?: boolean;
    back?: boolean;
    centered?: boolean;
    footer?: ReactNode;
}>) {
    return <SafeAreaView style={ui.safe} edges={tabbed ? ['top', 'left', 'right'] : ['top', 'left', 'right', 'bottom']}>
    {title && <View style={ui.header}>{!tabbed && back && <Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={() => router.canGoBack() ? router.back() : router.replace('/dashboard')} style={({ pressed }) => [ui.backButton, pressed && ui.pressed]}>
            <CareIcon name="back" size={20}/>
            </Pressable>}<Text accessibilityRole="header" style={ui.headerTitle}>{title}</Text>
        </View>}
    <KeyboardAvoidingView style={ui.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={ui.flex} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" contentContainerStyle={[ui.screen, centered && ui.centered]}>
        <View style={ui.content}>{children}</View>
      </ScrollView>
      {footer && <View style={ui.footer}>{footer}</View>}
    </KeyboardAvoidingView>
  </SafeAreaView>;
}
export function Heading({ title, description, level = 'screen' }: {
    title: string;
    description?: string;
    level?: 'screen' | 'section';
}) {
    return <View style={{ gap: space.sm }}>
    <Text accessibilityRole="header" style={level === 'section' ? ui.sectionTitle : ui.title}>{title}</Text>{description && <Text style={level === 'section' ? ui.small : ui.text}>{description}</Text>}</View>;
}
export function Button({ title, onPress, secondary = false, busy = false, disabled = false, icon }: {
    title: string;
    onPress: () => void;
    secondary?: boolean;
    busy?: boolean;
    disabled?: boolean;
    icon?: CareIconName;
}) {
    return <Pressable accessibilityRole="button" accessibilityLabel={title} accessibilityState={{ disabled: disabled || busy, busy }} disabled={disabled || busy} onPress={onPress} style={({ pressed }) => [ui.button, secondary && ui.secondary, disabled && ui.disabled, pressed && ui.pressed]}>
    {busy ? <ActivityIndicator color={secondary ? b.primary : b.white}/> : icon && <CareIcon name={icon} size={20} color={secondary ? b.primary : b.white}/>}
    <Text style={[ui.buttonText, secondary && { color: b.primary }]}>{busy ? 'Please wait…' : title}</Text>
  </Pressable>;
}
export function TextAction({ title, onPress }: {
    title: string;
    onPress: () => void;
}) {
    return <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [ui.textAction, pressed && ui.pressed]}>
    <Text style={ui.link}>{title}</Text>
    </Pressable>;
}
export function Field({ label, secureTextEntry, required, error, hint, inputRef, ...props }: TextInputProps & {
    label: string;
    required?: boolean;
    error?: string;
    hint?: string;
    inputRef?: RefObject<ComponentRef<typeof TextInput> | null>;
}) {
    const [visible, setVisible] = useState(false);
    return <View style={{ gap: space.sm }}>
    <Text style={ui.label}>{label}{required ? ' *' : ''}</Text>
    <View style={[ui.field, !!error && { borderColor: b.error }]}>
    <TextInput {...props} ref={inputRef} accessibilityLabel={`${label}${required ? ', required' : ''}`} accessibilityHint={error || hint} secureTextEntry={secureTextEntry && !visible} placeholderTextColor={b.muted} style={ui.input}/>
      {secureTextEntry && <Pressable accessibilityRole="button" accessibilityLabel={visible ? 'Hide password' : 'Show password'} onPress={() => setVisible(!visible)} style={ui.passwordToggle}>
        <Text style={ui.link}>{visible ? 'Hide' : 'Show'}</Text>
        </Pressable>}
    </View>{error ? <Text accessibilityLiveRegion="polite" style={ui.fieldError}>{error}</Text> : hint && <Text style={ui.small}>{hint}</Text>}
  </View>;
}
export function Notice({ children, tone = 'info' }: PropsWithChildren<{
    tone?: 'info' | 'error' | 'success';
}>) {
    return <View style={[ui.notice, tone === 'success' && { backgroundColor: b.softSuccess }]}>
    <Text accessibilityRole={tone === 'error' ? 'alert' : 'text'} accessibilityLiveRegion="polite" style={[ui.noticeText, tone === 'error' && { color: b.error }, tone === 'success' && { color: b.success }]}>{children}</Text>
    </View>;
}
export function Loading({ label = 'Getting things ready…' }: {
    label?: string;
}) {
    return <View style={ui.empty}>
    <ActivityIndicator size="large" color={b.primary}/>
    <Text accessibilityLiveRegion="polite" style={ui.text}>{label}</Text>
    </View>;
}
export function EmptyState({ title, description, icon = 'heart', action }: {
    title: string;
    description: string;
    icon?: CareIconName;
    action?: ReactNode;
}) {
    return <View style={ui.empty}>
    <View style={ui.iconCircle}>
    <CareIcon name={icon} size={22}/>
    </View>
    <Text accessibilityRole="header" style={[ui.sectionTitle, { textAlign: 'center' }]}>{title}</Text>
    <Text style={[ui.text, { textAlign: 'center' }]}>{description}</Text>{action}</View>;
}
export function SelectionCard({ title, description, icon = 'heart', selected = false, onPress }: {
    title: string;
    description?: string;
    icon?: CareIconName;
    selected?: boolean;
    onPress: () => void;
}) {
    return <Pressable accessibilityRole="radio" accessibilityState={{ checked: selected }} onPress={onPress} style={({ pressed }) => [ui.selection, selected && ui.selectionActive, pressed && ui.pressed]}>
    <View style={ui.iconCircle}>
    <CareIcon name={icon}/>
    </View>
    <View style={ui.flex}>
    <Text style={ui.cardTitle}>{title}</Text>{description && <Text style={ui.small}>{description}</Text>}</View>
    <CareIcon name={selected ? 'check' : 'next'} size={20}/>
    </Pressable>;
}
export function Checkbox({ title, checked, onPress, error }: {
    title: string;
    checked: boolean;
    onPress: () => void;
    error?: string;
}) {
    return <View style={{ gap: space.xs }}>
    <Pressable accessibilityRole="checkbox" accessibilityState={{ checked }} onPress={onPress} style={({ pressed }) => [ui.checkboxRow, pressed && ui.pressed]}>
    <View style={[ui.checkbox, checked && { backgroundColor: b.primary }]}>{checked && <CareIcon name="check" size={17} color={b.white}/>}</View>
    <Text style={[ui.small, ui.flex]}>{title}</Text>
    </Pressable>{error && <Text style={ui.fieldError}>{error}</Text>}</View>;
}
export function Segments({ options, value, onChange }: { options: string[]; value: string; onChange: (value: string) => void }) {
    return <View style={ui.wrap}>{options.map(option => <Pressable key={option} accessibilityRole="button" accessibilityState={{ selected: option === value }} onPress={() => onChange(option)} style={({ pressed }) => [ui.segment, option === value && ui.selectionActive, pressed && ui.pressed]}><Text style={[ui.small, { color: b.primary, textAlign: 'center', fontWeight: option === value ? '600' : '400' }]}>{option}</Text></Pressable>)}</View>;
}
export function ChoiceChip({ title, checked, onPress }: { title: string; checked: boolean; onPress: () => void }) {
    return <Pressable accessibilityRole="checkbox" accessibilityState={{ checked }} onPress={onPress} style={({ pressed }) => [ui.choiceChip, checked && ui.selectionActive, pressed && ui.pressed]}><View style={[ui.checkbox, { width: 20, height: 20 }, checked && { backgroundColor: b.primary }]}>{checked && <CareIcon name="check" size={14} color={b.white}/>}</View><Text style={[ui.small, ui.flex, { color: b.plum }]}>{title}</Text></Pressable>;
}
export function Progress({ step, total, label }: {
    step: number;
    total: number;
    label: string;
}) {
    return <View accessibilityRole="progressbar" accessibilityLabel={label} accessibilityValue={{ min: 1, max: total, now: step }} style={{ gap: space.sm }}>
    <Text style={ui.small}>{label} · Step {step} of {total}</Text>
    <View style={ui.progressRow}>{Array.from({ length: total }, (_, index) => <View key={index} style={[ui.progressDot, index < step && { backgroundColor: b.primary }]}/>)}</View>
    </View>;
}
export function Brand() {
    return <View style={{ alignItems: 'center', gap: space.sm }}>
    <Image source={careMark} style={{ width: 44, height: 44 }} accessible={false}/>
    <Text maxFontSizeMultiplier={1.3} style={ui.logo}>GYNECAIRE</Text>
    <Text style={ui.caption}>Lying-in Center Management System</Text>
    </View>;
}
export function CareArt() {
    return <View accessible accessibilityLabel="Mother cradling her baby illustration" style={ui.art}>
    <View style={ui.halo}/>
    <View style={ui.body}/>
    <View style={ui.head}/>
    <View style={ui.baby}>
    <CareIcon name="heart" size={24}/>
    </View>
    </View>;
}
export const ui = StyleSheet.create({
    flex: { flex: 1 }, safe: { flex: 1, backgroundColor: b.background }, screen: { flexGrow: 1, paddingHorizontal: space.screen, paddingTop: space.base, paddingBottom: space.lg }, centered: { justifyContent: 'center' },
    content: { width: '100%', maxWidth: 480, alignSelf: 'center', gap: space.base },
    header: { width: '100%', maxWidth: 520, alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: space.xs, paddingHorizontal: space.md, paddingVertical: space.xs },
    headerTitle: { ...type.navigation, color: b.plum, flex: 1 }, backButton: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center', borderRadius: radius.input }, iconButton: { minWidth: 48, minHeight: 48, alignItems: 'center', justifyContent: 'center', borderRadius: radius.input },
    footer: { width: '100%', maxWidth: 520, alignSelf: 'center', paddingHorizontal: space.screen, paddingTop: space.sm, paddingBottom: space.base, backgroundColor: b.background },
    logo: { color: b.plum, fontSize: 24, lineHeight: 31, letterSpacing: 1.5, fontWeight: '600', textAlign: 'center', flexShrink: 1 }, caption: { ...type.caption, color: b.muted, textAlign: 'center' },
    heroTitle: { ...type.hero, color: b.plum }, title: { ...type.title, color: b.plum }, sectionTitle: { ...type.section, color: b.plum }, cardTitle: { ...type.card, color: b.plum }, text: { ...type.body, color: b.muted }, small: { ...type.secondary, color: b.muted }, label: { ...type.secondary, color: b.plum, fontWeight: '600' },
    card: { backgroundColor: b.white, borderRadius: radius.card, borderWidth: 1, borderColor: b.border, padding: space.base, gap: space.md },
    row: { flexDirection: 'row', alignItems: 'center', gap: space.md }, wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
    button: { backgroundColor: b.primary, minHeight: 52, borderRadius: radius.input, paddingVertical: space.md, paddingHorizontal: space.base, gap: space.sm, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }, secondary: { backgroundColor: b.white, borderWidth: 1, borderColor: b.border }, disabled: { opacity: 0.55 }, buttonText: { ...type.button, color: b.white, textAlign: 'center', flexShrink: 1 },
    textAction: { minHeight: 48, justifyContent: 'center', alignItems: 'center', padding: space.sm }, link: { ...type.secondary, fontWeight: '600', color: b.primary }, pressed: { opacity: .72 },
    field: { backgroundColor: b.white, borderWidth: 1, borderColor: b.border, borderRadius: radius.input, flexDirection: 'row', alignItems: 'center' }, input: { flex: 1, minWidth: 0, minHeight: 50, paddingVertical: space.md, paddingHorizontal: space.base, color: b.plum, ...type.body }, passwordToggle: { minHeight: 48, minWidth: 60, padding: space.md, justifyContent: 'center', alignItems: 'center' }, fieldError: { ...type.secondary, color: b.error },
    notice: { backgroundColor: b.blush, borderRadius: radius.input, padding: space.md }, noticeText: { ...type.secondary, color: b.plum },
    selection: { flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.base, borderRadius: radius.card, borderWidth: 1, borderColor: b.border, backgroundColor: b.white }, selectionActive: { borderColor: b.primary, backgroundColor: b.blush },
    iconCircle: { width: 36, height: 36, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center', backgroundColor: b.blush },
    checkboxRow: { flexDirection: 'row', alignItems: 'center', gap: space.md, minHeight: 48, paddingVertical: space.sm }, checkbox: { width: 24, height: 24, borderRadius: 6, borderWidth: 1, borderColor: b.primary, alignItems: 'center', justifyContent: 'center' },
    progressRow: { flexDirection: 'row', gap: space.xs }, progressDot: { flex: 1, height: 4, backgroundColor: b.border, borderRadius: radius.pill },
    segment: { flexGrow: 1, flexBasis: '28%', minWidth: 72, minHeight: 44, justifyContent: 'center', paddingVertical: space.md, paddingHorizontal: space.sm, borderWidth: 1, borderColor: b.border, borderRadius: radius.input, backgroundColor: b.white },
    choiceChip: { flexGrow: 1, flexBasis: '46%', minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: space.sm, padding: space.md, borderWidth: 1, borderColor: b.border, borderRadius: radius.input, backgroundColor: b.white },
    empty: { alignItems: 'center', gap: space.md, paddingVertical: space.screen },
    art: { height: 168, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', backgroundColor: b.blush, borderRadius: radius.card }, halo: { position: 'absolute', width: 152, height: 152, borderRadius: 76, backgroundColor: '#F4CDDC' }, body: { position: 'absolute', top: 72, width: 100, height: 120, borderTopLeftRadius: 60, borderTopRightRadius: 48, backgroundColor: b.primary, transform: [{ rotate: '-12deg' }] }, head: { position: 'absolute', top: 16, width: 56, height: 64, borderRadius: 32, backgroundColor: '#C88878', borderTopWidth: 16, borderColor: b.plum }, baby: { position: 'absolute', top: 96, left: '47%', width: 76, height: 48, borderRadius: 28, backgroundColor: b.white, alignItems: 'center', justifyContent: 'center', transform: [{ rotate: '-25deg' }] },
});
