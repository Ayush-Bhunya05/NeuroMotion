// NeuroMotion AI — StatusBadge Component
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, typography, borderRadius, spacing } from '../../theme';

interface StatusBadgeProps {
  label: string;
  variant?: 'success' | 'warning' | 'error' | 'info' | 'physical' | 'cognitive' | 'neutral';
  size?: 'sm' | 'md';
  icon?: string;
}

const VARIANT_COLORS = {
  success: { bg: 'rgba(74,222,128,0.15)', text: '#4ADE80', border: 'rgba(74,222,128,0.25)' },
  warning: { bg: 'rgba(251,191,36,0.15)', text: '#FBBF24', border: 'rgba(251,191,36,0.25)' },
  error: { bg: 'rgba(248,113,113,0.15)', text: '#F87171', border: 'rgba(248,113,113,0.25)' },
  info: { bg: 'rgba(96,165,250,0.15)', text: '#60A5FA', border: 'rgba(96,165,250,0.25)' },
  physical: { bg: 'rgba(0,217,166,0.15)', text: '#00D9A6', border: 'rgba(0,217,166,0.25)' },
  cognitive: { bg: 'rgba(255,107,157,0.15)', text: '#FF6B9D', border: 'rgba(255,107,157,0.25)' },
  neutral: { bg: 'rgba(255,255,255,0.06)', text: colors.textSecondary, border: colors.glassBorder },
};

export default function StatusBadge({ label, variant = 'neutral', size = 'sm', icon }: StatusBadgeProps) {
  const c = VARIANT_COLORS[variant];
  const isSmall = size === 'sm';

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: c.bg,
          borderColor: c.border,
          paddingHorizontal: isSmall ? 8 : 12,
          paddingVertical: isSmall ? 3 : 5,
        },
      ]}
    >
      {icon && <Text style={[styles.icon, { fontSize: isSmall ? 11 : 13 }]}>{icon}</Text>}
      <Text style={[styles.text, { color: c.text, fontSize: isSmall ? 11 : 13 }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: borderRadius.round,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  icon: {},
  text: {
    fontFamily: typography.fonts.bodyMedium,
    fontWeight: '500',
  },
});
