// NeuroMotion AI — Glassmorphism Theme (Light Soft UI)
import { StyleSheet } from 'react-native';
import { colors } from './colors';

export const glass = StyleSheet.create({
  // Base soft card
  card: {
    backgroundColor: colors.glassBg,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    overflow: 'hidden',
  },

  // Elevated glass effect (e.g., for active elements or modals)
  elevated: {
    backgroundColor: colors.glassBgHover,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    overflow: 'hidden',
  },

  // Input fields
  input: {
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },

  // Navigation bars
  navbar: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.03)',
  },
});
