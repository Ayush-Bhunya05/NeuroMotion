// NeuroMotion AI — Not Found Screen
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { colors, typography, spacing } from '../src/theme';
import GradientButton from '../src/components/ui/GradientButton';

export default function NotFound() {
  const router = useRouter();
  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>🔍</Text>
      <Text style={styles.title}>Page Not Found</Text>
      <Text style={styles.sub}>This screen doesn't exist in NeuroMotion AI.</Text>
      <GradientButton title="Go Home" onPress={() => router.replace('/')} variant="primary" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgPrimary, alignItems: 'center', justifyContent: 'center', gap: spacing.lg, padding: spacing.xxl },
  emoji: { fontSize: 64 },
  title: { fontSize: typography.sizes.h2, fontFamily: typography.fonts.headingBold, fontWeight: '700', color: colors.textPrimary },
  sub: { fontSize: 14, color: colors.textSecondary, textAlign: 'center' },
});
