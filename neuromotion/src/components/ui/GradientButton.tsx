// NeuroMotion AI — GradientButton Component
import React from 'react';
import { Text, StyleSheet, Pressable, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { colors, typography, spacing, borderRadius } from '../../theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface GradientButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'physical' | 'cognitive' | 'neutral' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  icon?: string;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
}

const GRADIENT_COLORS = {
  primary: ['#6C63FF', '#8B83FF'] as const,
  physical: ['#00D9A6', '#00B4D8'] as const,
  cognitive: ['#FF6B9D', '#C084FC'] as const,
  neutral: ['#2D3748', '#4A5568'] as const,
  outline: ['transparent', 'transparent'] as const,
  ghost: ['transparent', 'transparent'] as const,
};

const SIZE_CONFIG = {
  sm: { height: 38, fontSize: 13, px: 16 },
  md: { height: 48, fontSize: 15, px: 24 },
  lg: { height: 56, fontSize: 17, px: 32 },
};

export default function GradientButton({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  icon,
  loading = false,
  disabled = false,
  fullWidth = false,
  style,
}: GradientButtonProps) {
  const scale = useSharedValue(1);
  const cfg = SIZE_CONFIG[size];

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const isOutlined = variant === 'outline' || variant === 'ghost';

  return (
    <AnimatedPressable
      style={[animStyle, fullWidth && { width: '100%' }]}
      onPress={disabled || loading ? undefined : onPress}
      onPressIn={() => { scale.value = withSpring(0.96, { damping: 15 }); }}
      onPressOut={() => { scale.value = withSpring(1, { damping: 15 }); }}
    >
      <LinearGradient
        colors={disabled ? ['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.04)'] : [...GRADIENT_COLORS[variant]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[
          styles.button,
          {
            height: cfg.height,
            paddingHorizontal: cfg.px,
            borderRadius: borderRadius.md,
          },
          isOutlined && styles.outlined,
          fullWidth && { width: '100%' },
          style,
        ]}
      >
        {loading ? (
          <ActivityIndicator color={colors.textPrimary} size="small" />
        ) : (
          <>
            {icon && <Text style={styles.icon}>{icon}</Text>}
            <Text
              style={[
                styles.text,
                { fontSize: cfg.fontSize },
                disabled && styles.disabledText,
                isOutlined && styles.outlinedText,
              ]}
            >
              {title}
            </Text>
          </>
        )}
      </LinearGradient>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  outlined: {
    borderWidth: 1,
    borderColor: colors.glassBorderLight,
  },
  text: {
    color: '#FFFFFF',
    fontFamily: typography.fonts.bodySemiBold,
    fontWeight: '600',
  },
  outlinedText: {
    color: colors.textSecondary,
  },
  disabledText: {
    color: colors.textMuted,
  },
  icon: {
    fontSize: 18,
  },
});
