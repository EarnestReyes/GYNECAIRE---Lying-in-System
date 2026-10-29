import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { SessionProvider } from '@/lib/session';
import { brand } from '@/constants/brand';
export default function RootLayout() { return <SafeAreaProvider><SessionProvider><Stack screenOptions={{ headerStyle: { backgroundColor: brand.background }, headerTintColor: brand.primary, headerTitle: 'GYNECAIRE', contentStyle: { backgroundColor: brand.background } }}><Stack.Screen name="index" options={{ headerShown: false }} /></Stack></SessionProvider></SafeAreaProvider>; }
