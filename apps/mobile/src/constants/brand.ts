export const brand = {
  primary: '#8D315F', plum: '#4B153B', rose: '#E78AA9', blush: '#FCEAF0',
  background: '#FFF8FA', white: '#FFFFFF', muted: '#786875', border: '#EAD6E0',
  error: '#A32F49', success: '#286B60', softSuccess: '#ECF6F1', disabled: '#F3EDF0',
};
export const space = { xs: 4, sm: 8, md: 12, base: 16, lg: 24, xl: 32, xxl: 40, section: 48 };
export const radius = { small: 8, input: 12, card: 20, pill: 100 };
export const type = {
  hero: { fontSize: 30, lineHeight: 39, fontWeight: '700' },
  title: { fontSize: 26, lineHeight: 34, fontWeight: '700' },
  section: { fontSize: 20, lineHeight: 28, fontWeight: '600' },
  card: { fontSize: 17, lineHeight: 25, fontWeight: '600' },
  body: { fontSize: 16, lineHeight: 25, fontWeight: '400' },
  secondary: { fontSize: 14, lineHeight: 22, fontWeight: '400' },
  caption: { fontSize: 12, lineHeight: 18, fontWeight: '400' },
  button: { fontSize: 16, lineHeight: 24, fontWeight: '600' },
} as const;
