// NeuroMotion AI — Cognitive Tests Hub (Streamlined: Memory, Attention, Reaction)
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { colors, typography, spacing, borderRadius } from '../../src/theme';
import GlassCard from '../../src/components/ui/GlassCard';

type Mode = 'test' | 'practice';

export default function CognitiveTestsHub() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { mode: initialMode } = useLocalSearchParams();
  const [mode, setMode] = useState<Mode>(initialMode === 'practice' ? 'practice' : 'test');

  useEffect(() => {
    if (initialMode === 'practice' || initialMode === 'test') {
      setMode(initialMode as Mode);
    }
  }, [initialMode]);

  const practiceParam = mode === 'practice' ? '?practice=true' : '';

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <Animated.View entering={FadeInDown.duration(500)}>
          <Text style={styles.title}>Cognitive Training</Text>
          <Text style={styles.subtitle}>
            {mode === 'test' ? 'Clinically tracked sessions affecting your brain dashboard.' : 'Warm up freely without saving any performance data.'}
          </Text>
        </Animated.View>

        {/* Mode Toggle */}
        <Animated.View entering={FadeInDown.delay(100).duration(400)}>
          <View style={styles.toggleContainer}>
            <Pressable
              onPress={() => setMode('test')}
              style={[styles.toggleBtn, mode === 'test' && { backgroundColor: '#8E24AA' }]}
            >
              <Text style={[styles.toggleText, mode === 'test' && { color: '#fff' }]}>🎯  Test Hub</Text>
            </Pressable>
            <Pressable
              onPress={() => setMode('practice')}
              style={[styles.toggleBtn, mode === 'practice' && { backgroundColor: '#8E24AA' }]}
            >
              <Text style={[styles.toggleText, mode === 'practice' && { color: '#fff' }]}>🏋️  Practice</Text>
            </Pressable>
          </View>
        </Animated.View>

        {/* 🃏 Memory Game */}
        <Animated.View entering={FadeInDown.delay(200).duration(500)}>
          <Pressable onPress={() => router.push(`/(cognitive)/memory-game${practiceParam}` as any)}>
            <GlassCard variant={mode === 'test' ? 'cognitive' : 'default'} style={styles.card}>
              <Text style={styles.icon}>🃏</Text>
              <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>Memory Card</Text>
                <Text style={styles.cardDesc}>
                  {mode === 'test' ? 'Dynamic pattern matching based on recall history.' : 'Classical matching. No scores saved.'}
                </Text>
              </View>
            </GlassCard>
          </Pressable>
        </Animated.View>

        {/* 🎯 Attention Game */}
        <Animated.View entering={FadeInDown.delay(300).duration(500)}>
          <Pressable onPress={() => router.push(`/(cognitive)/attention-game${practiceParam}` as any)}>
            <GlassCard variant={mode === 'test' ? 'cognitive' : 'default'} style={styles.card}>
              <Text style={styles.icon}>🎯</Text>
              <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>Attention Stability</Text>
                <Text style={styles.cardDesc}>
                  {mode === 'test' ? 'Focus tracking that adapts to your reflex accuracy.' : 'Training targets. No pressure.'}
                </Text>
              </View>
            </GlassCard>
          </Pressable>
        </Animated.View>

        {/* ⚡ Reaction Game */}
        <Animated.View entering={FadeInDown.delay(400).duration(500)}>
          <Pressable onPress={() => router.push(`/(cognitive)/reaction-test${practiceParam}` as any)}>
            <GlassCard variant={mode === 'test' ? 'cognitive' : 'default'} style={styles.card}>
              <Text style={styles.icon}>⚡</Text>
              <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>Quick Reaction</Text>
                <Text style={styles.cardDesc}>
                  {mode === 'test' ? 'Reaction timing that adjusts to your response curve.' : 'Reflex warm-up. No saves.'}
                </Text>
              </View>
            </GlassCard>
          </Pressable>
        </Animated.View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgPrimary },
  scroll: { padding: spacing.xl, paddingBottom: 100, gap: spacing.lg },
  title: { fontSize: 28, fontFamily: typography.fonts.headingBold, color: colors.textPrimary },
  subtitle: { fontSize: 13, color: colors.textSecondary, marginBottom: spacing.sm, lineHeight: 20 },
  toggleContainer: { flexDirection: 'row', backgroundColor: 'rgba(0,0,0,0.03)', borderRadius: 20, padding: 4, marginBottom: spacing.md, borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)' },
  toggleBtn: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 16 },
  toggleText: { fontSize: 14, fontFamily: typography.fonts.bodySemiBold, color: colors.textSecondary },
  card: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg, padding: spacing.lg, borderLeftWidth: 4, borderLeftColor: '#8E24AA' },
  icon: { fontSize: 36 },
  cardContent: { flex: 1, gap: 4 },
  cardTitle: { fontSize: 18, fontFamily: typography.fonts.headingBold, color: colors.textPrimary },
  cardDesc: { fontSize: 13, color: colors.textSecondary, lineHeight: 18 },
});
