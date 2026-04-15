// NeuroMotion AI — ProgressBar Component
import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing } from 'react-native-reanimated';
import { colors, typography, borderRadius } from '../../theme';
import { getScoreColor } from '../../utils/formatting';

interface ProgressBarProps {
  value: number; // 0-100
  label?: string;
  showValue?: boolean;
  height?: number;
  color?: string;
  animated?: boolean;
  dark?: boolean;
}

export default function ProgressBar({
  value,
  label,
  showValue = true,
  height = 8,
  color,
  animated = true,
  dark = false,
}: ProgressBarProps) {
  const width = useSharedValue(0);

  useEffect(() => {
    if (animated) {
      width.value = withTiming(value / 100, { duration: 800, easing: Easing.out(Easing.cubic) });
    } else {
      width.value = value / 100;
    }
  }, [value]);

  const barColor = color || getScoreColor(value);

  const animStyle = useAnimatedStyle(() => ({
    width: `${width.value * 100}%`,
    backgroundColor: barColor,
  }));

  return (
    <View style={styles.container}>
      {(label || showValue) && (
        <View style={styles.header}>
          {label && <Text style={[styles.label, dark && { color: '#FFFFFF' }]}>{label}</Text>}
          {showValue && <Text style={[styles.value, { color: barColor }]}>{Math.round(value)}%</Text>}
        </View>
      )}
      <View style={[styles.track, { height }]}>
        <Animated.View style={[styles.fill, { height }, animStyle]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  label: {
    color: colors.textSecondary,
    fontSize: 13,
    fontFamily: typography.fonts.bodyMedium,
    fontWeight: '500',
  },
  value: {
    fontSize: 13,
    fontFamily: typography.fonts.bodySemiBold,
    fontWeight: '600',
  },
  track: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: borderRadius.round,
    overflow: 'hidden',
  },
  fill: {
    borderRadius: borderRadius.round,
  },
});
