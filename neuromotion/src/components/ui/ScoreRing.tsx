// NeuroMotion AI — ScoreRing Component (animated circular score)
import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { colors, typography } from '../../theme';
import { getScoreColor, getScoreLabel } from '../../utils/formatting';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface ScoreRingProps {
  score: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
  showLabel?: boolean;
  color?: string;
  animated?: boolean;
}

export default function ScoreRing({
  score,
  size = 120,
  strokeWidth = 8,
  label,
  showLabel = true,
  color,
  animated = true,
}: ScoreRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = useSharedValue(0);

  useEffect(() => {
    if (animated) {
      progress.value = withTiming(score / 100, {
        duration: 1200,
        easing: Easing.out(Easing.cubic),
      });
    } else {
      progress.value = score / 100;
    }
  }, [score]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - progress.value),
  }));

  const ringColor = color || getScoreColor(score);

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
        {/* Background ring */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        {/* Progress ring */}
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={ringColor}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          animatedProps={animatedProps}
          strokeLinecap="round"
        />
      </Svg>
      <View style={styles.labelContainer}>
        <Text style={[styles.scoreText, { color: ringColor, fontSize: size * 0.28 }]}>
          {Math.round(score)}
        </Text>
        {showLabel && (
          <Text style={[styles.labelText, { fontSize: size * 0.09 }]}>
            {label || getScoreLabel(score)}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  labelContainer: {
    position: 'absolute',
    alignItems: 'center',
  },
  scoreText: {
    fontFamily: typography.fonts.headingBold,
    fontWeight: '700',
  },
  labelText: {
    color: colors.textSecondary,
    fontFamily: typography.fonts.bodyMedium,
    fontWeight: '500',
    marginTop: 2,
  },
});
