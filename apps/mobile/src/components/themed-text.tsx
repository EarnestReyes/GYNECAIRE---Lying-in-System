import { Platform, StyleSheet, Text, type TextProps } from 'react-native';

import { Fonts, ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { brand, type as typography } from '@/constants/brand';

export type ThemedTextProps = TextProps & {
  type?: 'default' | 'title' | 'small' | 'smallBold' | 'subtitle' | 'link' | 'linkPrimary' | 'code';
  themeColor?: ThemeColor;
};

export function ThemedText({ style, type = 'default', themeColor, ...rest }: ThemedTextProps) {
  const theme = useTheme();

  return <Text style={[{ color: theme[themeColor ?? 'text'] }, styles[type], style]} {...rest} />;
}

const styles = StyleSheet.create({
  small: {
    ...typography.secondary,
  },
  smallBold: {
    ...typography.secondary,
    fontWeight: 700,
  },
  default: {
    ...typography.body,
  },
  title: {
    ...typography.hero,
  },
  subtitle: {
    ...typography.section,
  },
  link: {
    ...typography.secondary,
  },
  linkPrimary: {
    ...typography.secondary,
    color: brand.primary,
  },
  code: {
    fontFamily: Fonts.mono,
    fontWeight: Platform.select({ android: 700 }) ?? 500,
    fontSize: 12,
  },
});
