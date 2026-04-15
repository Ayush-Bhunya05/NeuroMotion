// NeuroMotion AI — Spacing & Layout
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 40,
  massive: 48,
  giant: 64,
} as const;

export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  round: 999,
} as const;

export const shadows = {
  sm: {
    elevation: 0,
  },
  md: {
    elevation: 0,
  },
  lg: {
    elevation: 0,
  },
  glow: (color: string) => ({
    elevation: 0,
  }),
  none: {
    elevation: 0,
  },
};
