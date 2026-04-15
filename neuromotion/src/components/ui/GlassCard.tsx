// NeuroMotion AI — GlassCard Component
import React, { ReactNode } from 'react';
import { View, StyleSheet, ViewStyle, Pressable, StyleProp } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { colors, borderRadius, spacing, shadows } from '../../theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface GlassCardProps {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  variant?: 'default' | 'elevated' | 'physical' | 'cognitive' | 'accent' | 'dark';
  padding?: number;
  noPadding?: boolean;
}

const GLOW_MAP = {
  default: undefined,
  elevated: undefined,
  physical: colors.physical,
  cognitive: colors.cognitive,
  accent: colors.primary,
  dark: '#00D9A6',
};

const GRADIENT_MAP = {
  default: ['rgba(255,255,255,0.06)', 'rgba(255,255,255,0.02)'] as const,
  elevated: ['rgba(255,255,255,0.10)', 'rgba(255,255,255,0.04)'] as const,
  physical: ['rgba(0,217,166,0.12)', 'rgba(0,217,166,0.03)'] as const,
  cognitive: ['rgba(255,107,157,0.12)', 'rgba(255,107,157,0.03)'] as const,
  accent: ['rgba(108,99,255,0.15)', 'rgba(108,99,255,0.04)'] as const,
  dark: ['rgba(30, 27, 75, 0.6)', 'rgba(15, 13, 46, 0.4)'] as const,
};

const BORDER_MAP = {
  default: colors.glassBorder,
  elevated: colors.glassBorderLight,
  physical: 'rgba(0, 0, 0, 0.04)',
  cognitive: 'rgba(0, 0, 0, 0.04)',
  accent: 'rgba(0, 0, 0, 0.04)',
  dark: 'rgba(0, 217, 166, 0.2)',
};

export default function GlassCard({
  children,
  style,
  onPress,
  variant = 'default',
  padding,
  noPadding = false,
}: GlassCardProps) {
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    if (onPress) scale.value = withSpring(0.97, { damping: 15 });
  };
  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15 });
  };

  const glowColor = GLOW_MAP[variant];
  const content = (
    <LinearGradient
      colors={[...GRADIENT_MAP[variant]]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[
        styles.gradient,
        { borderColor: BORDER_MAP[variant] },
        !noPadding && { padding: padding ?? spacing.xl },
        glowColor ? shadows.glow(glowColor) : shadows.md,
        style,
      ]}
    >
      {children}
    </LinearGradient>
  );

  if (onPress) {
    return (
      <AnimatedPressable
        style={animStyle}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        {content}
      </AnimatedPressable>
    );
  }

  return <Animated.View style={animStyle}>{content}</Animated.View>;
}

const styles = StyleSheet.create({
  gradient: {
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    overflow: 'hidden',
  },
});
