export const brand = {
  primary: '#8D315F', plum: '#4B153B', rose: '#E78AA9', blush: '#FCEAF0',
  background: '#FFF8FA', white: '#FFFFFF', muted: '#786875', border: '#EAD6E0',
  error: '#A32F49', success: '#286B60', softSuccess: '#ECF6F1', disabled: '#F3EDF0',
};
export const space = { xs: 4, sm: 8, md: 12, base: 16, screen: 20, lg: 24, xl: 32 };
export const radius = { small: 8, input: 16, card: 18, pill: 100 };
export const type = {
  hero: { fontSize: 26, lineHeight: 33, fontWeight: '600' },
  title: { fontSize: 22, lineHeight: 29, fontWeight: '600' },
  navigation: { fontSize: 18, lineHeight: 24, fontWeight: '600' },
  section: { fontSize: 18, lineHeight: 25, fontWeight: '600' },
  card: { fontSize: 16, lineHeight: 23, fontWeight: '600' },
  body: { fontSize: 15, lineHeight: 22, fontWeight: '400' },
  secondary: { fontSize: 13, lineHeight: 20, fontWeight: '400' },
  caption: { fontSize: 12, lineHeight: 17, fontWeight: '400' },
  button: { fontSize: 15, lineHeight: 22, fontWeight: '600' },
} as const;
