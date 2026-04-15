// NeuroMotion AI — Landing Page
import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { colors, typography, spacing } from '../src/theme';
import GradientButton from '../src/components/ui/GradientButton';
import { useApp } from '../src/contexts/AppContext';
import { auth, db } from '../src/services/firebase';
import { doc, getDoc } from 'firebase/firestore';

export default function LandingPage() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { state, dispatch } = useApp();

  useEffect(() => {
    const checkAuth = async () => {
      if (state.isAuthenticated && state.user) {
        const userDocRef = doc(db, 'users', state.user.id);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
          const userData = userDocSnap.data();
          const role = userData.role;
          const rehabGoal = userData.rehabGoal;

          if (role === 'doctor') {
            dispatch({ type: 'SET_ACTIVE_MODULE', payload: 'physical' });
            router.replace('/(doctor)/dashboard');
          } else if (role === 'guardian') {
            router.replace('/(physical)/dashboard');
          } else {
            if (rehabGoal === 'physical') {
              dispatch({ type: 'SET_ACTIVE_MODULE', payload: 'physical' });
              router.replace('/(physical)/dashboard');
            } else if (rehabGoal === 'cognitive') {
              dispatch({ type: 'SET_ACTIVE_MODULE', payload: 'cognitive' });
              router.replace('/(cognitive)/dashboard');
            } else if (rehabGoal === 'dual') {
              dispatch({ type: 'SET_ACTIVE_MODULE', payload: 'dual' });
              router.replace('/(shared)/dashboard');
            } else {
              dispatch({ type: 'SET_ACTIVE_MODULE', payload: 'physical' });
              router.replace('/(physical)/dashboard');
            }
          }
        } else {
          router.replace('/(auth)/login');
        }
      }
    };

    checkAuth();
  }, [state.isAuthenticated, state.user]);

  return (
    <LinearGradient colors={[colors.bgPrimary, colors.bgSecondary]} style={[styles.container, { paddingTop: insets.top + spacing.xxl }]}>
      <Animated.View entering={FadeInUp.duration(600)} style={styles.header}>
        <View style={styles.logoContainer}>
          <Text style={styles.logo}>🧠</Text>
        </View>
        <Text style={styles.title}>NeuroMotion AI</Text>
        <Text style={styles.subtitle}>Empowering your rehabilitation journey through intelligent, personalized therapy.</Text>
      </Animated.View>

      <View style={styles.content}>
        <Animated.View entering={FadeInDown.delay(200).duration(600)} style={styles.card}>
          <Text style={styles.cardTitle}>Why NeuroMotion?</Text>
          <View style={styles.featureItem}>
            <View style={styles.dot} />
            <Text style={styles.featureText}>Real-time AI pose analysis</Text>
          </View>
          <View style={styles.featureItem}>
            <View style={styles.dot} />
            <Text style={styles.featureText}>Cognitive health tracking</Text>
          </View>
          <View style={styles.featureItem}>
            <View style={styles.dot} />
            <Text style={styles.featureText}>Unified reporting for clinicians</Text>
          </View>
        </Animated.View>
      </View>

      <Animated.View entering={FadeInDown.delay(400).duration(600)} style={[styles.footer, { paddingBottom: insets.bottom + spacing.xl }]}>
        <GradientButton 
          title="Go to Login" 
          onPress={() => router.push('/(auth)/login')} 
          size="lg" 
          fullWidth 
        />
      </Animated.View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: spacing.xl },
  header: { alignItems: 'center', marginTop: spacing.xl },
  logoContainer: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(43, 94, 234, 0.1)', justifyContent: 'center', alignItems: 'center', marginBottom: spacing.lg },
  logo: { fontSize: 40 },
  title: { fontSize: 32, fontFamily: typography.fonts.headingBold, fontWeight: '700', color: colors.primaryDark, marginBottom: spacing.sm },
  subtitle: { fontSize: 16, color: colors.textSecondary, fontFamily: typography.fonts.bodyMedium, fontWeight: '500', textAlign: 'center', lineHeight: 24, paddingHorizontal: spacing.md },
  content: { flex: 1, justifyContent: 'center' },
  card: { backgroundColor: colors.bgCard, padding: spacing.xl, borderRadius: 24, borderWidth: 1, borderColor: 'rgba(0,0,0,0.04)' },
  cardTitle: { fontSize: 20, fontFamily: typography.fonts.headingBold, fontWeight: '700', color: colors.textPrimary, marginBottom: spacing.md },
  featureItem: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary, marginRight: spacing.md },
  featureText: { fontSize: 16, color: colors.textSecondary, fontFamily: typography.fonts.body },
  footer: { alignItems: 'center', marginTop: 'auto' },
});
