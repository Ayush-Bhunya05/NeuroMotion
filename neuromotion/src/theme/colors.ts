// NeuroMotion AI — Color System (Light Theme)
export const colors = {
  // Primary brand gradient (from image: Aura Health blue)
  primary: '#2B5EEA',
  primaryLight: '#5C84FA',
  primaryDark: '#1E43D0',
  primaryGlow: 'rgba(43, 94, 234, 0.15)',

  // Module accent colors (adapted for light theme)
  physical: '#1976D2', // Muted blue for physical
  physicalLight: '#E3F2FD',
  physicalDark: '#115293',
  physicalGlow: 'rgba(25, 118, 210, 0.1)',

  cognitive: '#8E24AA', // Soft purple for cognitive
  cognitiveLight: '#F3E5F5',
  cognitiveDark: '#6A1B9A',
  cognitiveGlow: 'rgba(142, 36, 170, 0.1)',

  // Backgrounds — very light soft gradients
  bgPrimary: '#F6F8FD', // Main background from image
  bgSecondary: '#EEF2FC',
  bgTertiary: '#FFFFFF',
  bgCard: '#FFFFFF', // Solid white cards
  bgElevated: '#FFFFFF',

  // Glassmorphism (Soft light theme style)
  glassBg: 'rgba(255, 255, 255, 0.85)',
  glassBgHover: 'rgba(255, 255, 255, 0.95)',
  glassBorder: 'rgba(255, 255, 255, 1)',
  glassBorderLight: 'rgba(0, 0, 0, 0.03)',

  // Text colors (Dark for light theme)
  textPrimary: '#1A1D28', // Near black for strong headings
  textSecondary: '#4A5568', // Slate grey for subtitles
  textMuted: '#A0AEC0', // Light grey for disabled/tags
  textDisabled: 'rgba(26, 29, 40, 0.3)',

  // Status
  success: '#38A169',
  successDark: '#2F855A',
  warning: '#D69E2E',
  warningDark: '#B7791F',
  error: '#E53E3E',
  errorDark: '#C53030',
  info: '#3182CE',
  infoDark: '#2B6CB0',

  // Gradients
  gradientPrimary: ['#2B5EEA', '#5C84FA'] as const,
  gradientPhysical: ['#1976D2', '#42A5F5'] as const,
  gradientCognitive: ['#8E24AA', '#AB47BC'] as const,
  gradientDark: ['#F6F8FD', '#EEF2FC'] as const,
  gradientCard: ['#FFFFFF', '#FFFFFF'] as const,
  gradientAccent: ['#2B5EEA', '#8E24AA'] as const,

  // Misc
  overlay: 'rgba(0, 0, 0, 0.3)',
  divider: 'rgba(0, 0, 0, 0.06)',
  skeleton: 'rgba(0, 0, 0, 0.04)',
} as const;

export type ColorKey = keyof typeof colors;
