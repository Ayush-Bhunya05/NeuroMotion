// NeuroMotion AI — ModuleSwitcher Component
import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolateColor,
} from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { colors, typography, spacing, borderRadius } from '../../theme';
import { useApp } from '../../contexts/AppContext';
import { ModuleType } from '../../types/user';

export default function ModuleSwitcher() {
  const { state, dispatch } = useApp();
  const router = useRouter();
  const togglePos = useSharedValue(state.activeModule === 'physical' ? 0 : 1);

  const handleSwitch = (module: ModuleType) => {
    if (module === state.activeModule) return;

    // Check if user has this module
    if (!state.user || state.user.rehabGoal !== module) {
      // Could show add-module prompt here
      return;
    }

    togglePos.value = withSpring(module === 'physical' ? 0 : 1, { damping: 18 });
    dispatch({ type: 'SET_ACTIVE_MODULE', payload: module });

    // Navigate to the module's dashboard
    if (module === 'physical') {
      router.replace('/(physical)/dashboard');
    } else {
      router.replace('/(cognitive)/dashboard');
    }
  };

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: togglePos.value * 140 }],
  }));

  const physicalTextStyle = useAnimatedStyle(() => ({
    color: interpolateColor(togglePos.value, [0, 1], ['#FFFFFF', 'rgba(255,255,255,0.5)']),
  }));

  const cognitiveTextStyle = useAnimatedStyle(() => ({
    color: interpolateColor(togglePos.value, [0, 1], ['rgba(255,255,255,0.5)', '#FFFFFF']),
  }));

  const indicatorBgStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      togglePos.value,
      [0, 1],
      [colors.physical, colors.cognitive]
    ),
  }));

  return (
    <View style={styles.container}>
      <View style={styles.track}>
        <Animated.View style={[styles.indicator, indicatorStyle, indicatorBgStyle]} />
        <Pressable style={styles.option} onPress={() => handleSwitch('physical')}>
          <Text style={styles.emoji}>💪</Text>
          <Animated.Text style={[styles.label, physicalTextStyle]}>Physical</Animated.Text>
        </Pressable>
        <Pressable style={styles.option} onPress={() => handleSwitch('cognitive')}>
          <Text style={styles.emoji}>🧠</Text>
          <Animated.Text style={[styles.label, cognitiveTextStyle]}>Cognitive</Animated.Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: spacing.sm,
  },
  track: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: borderRadius.round,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    padding: 3,
    width: 286,
    height: 44,
  },
  indicator: {
    position: 'absolute',
    width: 140,
    height: 38,
    borderRadius: borderRadius.round,
    top: 3,
    left: 3,
    opacity: 0.25,
  },
  option: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    zIndex: 1,
  },
  emoji: {
    fontSize: 16,
  },
  label: {
    fontSize: 13,
    fontFamily: typography.fonts.bodySemiBold,
    fontWeight: '600',
  },
});
