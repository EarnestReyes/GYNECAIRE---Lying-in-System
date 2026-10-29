import { SymbolView } from 'expo-symbols';
import type { ColorValue } from 'react-native';
import { brand } from '@/constants/brand';
const names = {
    home: { ios: 'house', android: 'home', web: 'home' },
    learn: { ios: 'book', android: 'menu_book', web: 'menu_book' },
    profile: { ios: 'person.crop.circle', android: 'account_circle', web: 'account_circle' },
    clinic: { ios: 'cross.case', android: 'medical_services', web: 'medical_services' },
    appointments: { ios: 'calendar', android: 'calendar_month', web: 'calendar_month' },
    records: { ios: 'doc.text', android: 'description', web: 'description' },
    community: { ios: 'bubble.left.and.bubble.right', android: 'forum', web: 'forum' },
    heart: { ios: 'heart', android: 'favorite_border', web: 'favorite_border' },
    check: { ios: 'checkmark', android: 'check', web: 'check' },
    back: { ios: 'chevron.left', android: 'chevron_left', web: 'chevron_left' },
    next: { ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' },
    search: { ios: 'magnifyingglass', android: 'search', web: 'search' },
    bookmark: { ios: 'bookmark', android: 'bookmark_border', web: 'bookmark_border' },
    saved: { ios: 'bookmark.fill', android: 'bookmark', web: 'bookmark' },
    lock: { ios: 'lock.shield', android: 'lock', web: 'lock' },
    external: { ios: 'arrow.up.right', android: 'open_in_new', web: 'open_in_new' },
    clock: { ios: 'clock', android: 'schedule', web: 'schedule' },
    settings: { ios: 'gearshape', android: 'settings', web: 'settings' },
    mail: { ios: 'envelope', android: 'mail', web: 'mail' },
} as const;
export type CareIconName = keyof typeof names;
export function CareIcon({ name, color = brand.primary, size = 20 }: {
    name: CareIconName;
    color?: ColorValue;
    size?: number;
}) {
    return <SymbolView name={names[name]} tintColor={color} size={size} style={{ width: size, height: size }} accessible={false}/>;
}
