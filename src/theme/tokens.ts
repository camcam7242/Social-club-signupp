export const colors = {
  blue: '#2D6CF6',
  blueInk: '#1D4ED8',
  blueSoft: '#EAF1FE',
  orange: '#FF7A3D',
  orangeSoft: '#FFEDE2',
  ink: '#15181E',
  body: '#3A3F4A',
  muted: '#8A8F9A',
  line: '#E9EBEF',
  field: '#F4F5F7',
  white: '#FFFFFF',
  success: '#1FAA55',
  successDeep: '#15643A',
  successTint: '#E7F6ED',
  warning: '#E0922F',
  danger: '#DC4A4A',
  avatarOrange: '#FF7A3D',
  avatarPurple: '#7C3AED',
  avatarTeal: '#0EA5A5',
  avatarPink: '#E0467C',
} as const;

export const typography = {
  screenTitle: { fontSize: 24, fontWeight: '700' as const, letterSpacing: -0.02 * 24 },
  sectionH: { fontSize: 26, fontWeight: '800' as const, letterSpacing: -0.02 * 26 },
  heroH: { fontSize: 33, fontWeight: '700' as const, letterSpacing: -0.02 * 33 },
  body: { fontSize: 15, fontWeight: '400' as const },
  bodyMed: { fontSize: 15, fontWeight: '600' as const },
  label: { fontSize: 13, fontWeight: '600' as const, letterSpacing: 0.05 * 13 },
  labelUpper: { fontSize: 12.5, fontWeight: '700' as const, letterSpacing: 0.06 * 12.5 },
  caption: { fontSize: 12, fontWeight: '400' as const },
} as const;

export const spacing = {
  screenH: 20,
  cardPad: 18,
  gap: 12,
  gapSm: 8,
  gapLg: 16,
} as const;

export const radius = {
  input: 14,
  card: 18,
  large: 22,
  pill: 999,
  btn: 15,
} as const;

export const shadows = {
  card: {
    shadowColor: '#14181E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 14,
    elevation: 4,
  },
  btn: {
    shadowColor: '#2D6CF6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.28,
    shadowRadius: 20,
    elevation: 6,
  },
} as const;
