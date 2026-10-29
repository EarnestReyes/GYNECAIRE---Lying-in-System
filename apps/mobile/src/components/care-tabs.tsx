import { Tabs } from 'expo-router';
import { Text, useWindowDimensions, type ColorValue } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAccount } from '@/lib/account-context';
import { patientNavigation } from '@/lib/navigation';
import { CareIcon, type CareIconName } from '@/components/care-icon';
import { brand, space } from '@/constants/brand';
export default function AppTabs() {
    const { account } = useAccount();
    const patient = patientNavigation(account?.account_type);
    const insets = useSafeAreaInsets();
    const { fontScale, width } = useWindowDimensions();
    const icon = (name: CareIconName) => ({ color }: {
        color: ColorValue;
    }) => <CareIcon name={name} color={color} size={21}/>;
    const label = (text: string) => ({ color }: {
        color: ColorValue;
    }) => <Text maxFontSizeMultiplier={1.25} style={{ fontSize: 12, lineHeight: 18, textAlign: 'center', color }}>{text}</Text>;
    return <Tabs backBehavior="history" screenOptions={{ headerShown: false, tabBarActiveTintColor: brand.primary, tabBarInactiveTintColor: brand.muted, tabBarHideOnKeyboard: true, tabBarLabelStyle: { fontSize: 12, lineHeight: 18 }, tabBarStyle: { height: 56 + Math.max(insets.bottom, space.sm) + Math.max(0, Math.min(fontScale, 1.25) - 1) * 36, paddingTop: space.xs, paddingBottom: Math.max(insets.bottom, space.sm), backgroundColor: brand.white, borderTopColor: brand.border }, tabBarItemStyle: { minHeight: 48 }, tabBarAllowFontScaling: true }}>
    <Tabs.Screen name="dashboard" options={{ title: 'Home', tabBarLabel: label('Home'), tabBarIcon: icon('home') }}/>
    <Tabs.Protected guard={patient}>
      <Tabs.Screen name="records" options={{ title: 'Records', tabBarLabel: label('Records'), tabBarIcon: icon('records') }}/>
      <Tabs.Screen name="appointments" options={{ title: 'Appointments', tabBarLabel: label(width < 390 || fontScale > 1.1 ? 'Visits' : 'Appointments'), tabBarAccessibilityLabel: 'Appointments', tabBarIcon: icon('appointments') }}/>
    </Tabs.Protected>
    <Tabs.Screen name="learn" options={{ title: 'Learn', tabBarLabel: label('Learn'), tabBarIcon: icon('learn') }}/>
    <Tabs.Protected guard={!patient}>
      <Tabs.Screen name="clinic" options={{ title: 'Clinic', tabBarLabel: label('Clinic'), tabBarIcon: icon('clinic') }}/>
      <Tabs.Screen name="community" options={{ title: 'Community', tabBarLabel: label('Community'), tabBarIcon: icon('community') }}/>
    </Tabs.Protected>
    <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarLabel: label('Profile'), tabBarIcon: icon('profile') }}/>
  </Tabs>;
}
