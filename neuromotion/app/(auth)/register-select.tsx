// NeuroMotion AI — Auth Selection Screen
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { colors, typography, spacing } from '../../src/theme';
import GlassCard from '../../src/components/ui/GlassCard';
import Header from '../../src/components/shared/Header';

export default function RegisterSelect() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <LinearGradient colors={[colors.bgPrimary, colors.bgSecondary]} style={[styles.container, { paddingTop: insets.top }]}>
      <Header title="" showBack backIconColor={colors.primary} />
      
      <View style={styles.content}>
        <Animated.View entering={FadeInUp.duration(600)} style={styles.header}>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Select the role you are registering for</Text>
        </Animated.View>

        <View style={styles.cards}>
          <Animated.View entering={FadeInDown.delay(100).duration(500)}>
            <GlassCard variant="default" onPress={() => router.push('/(auth)/register-patient')} style={styles.roleCard}>
              <View style={styles.row}>
                <Text style={styles.iconText}>👤</Text>
                <View style={styles.txtContainer}>
                    <Text style={styles.roleName}>Patient</Text>
                    <Text style={styles.roleDesc}>Access your personal rehabilitation dashboard</Text>
                </View>
              </View>
            </GlassCard>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(200).duration(500)}>
            <GlassCard variant="default" onPress={() => router.push('/(auth)/register-doctor')} style={styles.roleCard}>
                <View style={styles.row}>
                    <Text style={styles.iconText}>👨‍⚕️</Text>
                    <View style={styles.txtContainer}>
                        <Text style={styles.roleName}>Doctor</Text>
                        <Text style={styles.roleDesc}>Manage patients and track their progress</Text>
                    </View>
                </View>
            </GlassCard>
          </Animated.View>

        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, paddingHorizontal: spacing.xl, justifyContent: 'center', paddingBottom: 60 },
  header: { alignItems: 'center', marginBottom: spacing.xl },
  title: { fontSize: 30, fontFamily: typography.fonts.headingBold, fontWeight: '700', color: colors.textPrimary, marginBottom: spacing.xs },
  subtitle: { fontSize: 15, color: colors.textSecondary, fontFamily: typography.fonts.body, textAlign: 'center' },
  cards: { gap: spacing.md },
  roleCard: { padding: spacing.lg, paddingVertical: spacing.xl },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  iconText: { fontSize: 36 },
  txtContainer: { flex: 1 },
  roleName: { fontSize: 18, fontFamily: typography.fonts.headingBold, fontWeight: '700', color: colors.textPrimary, marginBottom: 2 },
  roleDesc: { fontSize: 14, color: colors.textSecondary, fontFamily: typography.fonts.body, lineHeight: 20 },
});
