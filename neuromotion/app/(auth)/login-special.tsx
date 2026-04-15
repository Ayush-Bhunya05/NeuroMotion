// NeuroMotion AI — Central Patient Login
import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { colors, typography, spacing, borderRadius } from '../../src/theme';
import GlassCard from '../../src/components/ui/GlassCard';
import GradientButton from '../../src/components/ui/GradientButton';
import Header from '../../src/components/shared/Header';
import { useApp } from '../../src/contexts/AppContext';

import { auth, db } from '../../src/services/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

export default function LoginSpecial() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { dispatch } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');



  const handleFirebaseLogin = async () => {
    if (!email || !password) {
      setErrorMsg('Please enter email and password.');
      return;
    }
    if (!email.includes('@')) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }
    setLoading(true);
    setErrorMsg('');
    try {
      const userCred = await signInWithEmailAndPassword(auth, email, password);
      
      // Smart Routing for Doctor/Guardian Portal
      const userDoc = await getDoc(doc(db, 'users', userCred.user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const role = userData.role;

        if (role === 'doctor') {
          router.replace('/(doctor)/dashboard');
        } else {
          // Patient account
          await auth.signOut();
          setErrorMsg('Access Denied: This is a Patient account. Please use the standard login.');
          setLoading(false);
        }
      } else {
        setErrorMsg('Profile data not found. Contact administrator.');
        await auth.signOut();
        setLoading(false);
      }
    } catch (error: any) {
      setErrorMsg(error.message || 'Login failed.');
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <LinearGradient colors={[colors.bgPrimary, colors.bgSecondary]} style={[styles.container, { paddingTop: insets.top }]}>
        <Header title="" showBack backIconColor={colors.primary} />
        
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <Animated.View entering={FadeInUp.duration(600)} style={styles.header}>
            <View style={styles.iconContainer}>
              <Text style={styles.iconText}>⚕️</Text>
            </View>
            <Text style={styles.title}>Provider Portal</Text>
            <Text style={styles.subtitle}>Sign in as a Doctor</Text>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(200).duration(600)}>
            <GlassCard variant="default" style={styles.formCard}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email Address</Text>
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="Enter your email"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  style={styles.input}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Password</Text>
                <TextInput value={password} onChangeText={setPassword} placeholder="Enter your password" placeholderTextColor={colors.textMuted} secureTextEntry style={styles.input} />
              </View>

              {errorMsg ? <Text style={styles.errorText}>{errorMsg}</Text> : null}

              <GradientButton title="Login" onPress={handleFirebaseLogin} loading={loading} fullWidth size="lg" style={styles.loginBtn} variant="neutral" />
            </GlassCard>
            
            <View style={styles.footerLinks}>
              <Text style={styles.footerText}>
                Are you a patient? <Text style={styles.linkText} onPress={() => router.push('/(auth)/login')}>Patient Login</Text>
              </Text>
            </View>
          </Animated.View>
        </ScrollView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flexGrow: 1, paddingHorizontal: spacing.xl, justifyContent: 'center', paddingBottom: 60 },
  header: { alignItems: 'center', marginBottom: spacing.xl },
  iconContainer: { width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(26, 29, 40, 0.05)', alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md },
  iconText: { fontSize: 28 },
  title: { fontSize: 28, fontFamily: typography.fonts.headingBold, fontWeight: '700', color: colors.textPrimary, marginBottom: spacing.xs },
  subtitle: { fontSize: 15, color: colors.textSecondary, fontFamily: typography.fonts.body, textAlign: 'center' },
  formCard: { padding: spacing.lg, marginBottom: spacing.xl },
  inputGroup: { marginBottom: spacing.lg },
  label: { fontSize: 13, fontFamily: typography.fonts.bodySemiBold, fontWeight: '600', color: colors.textSecondary, marginBottom: 8 },
  input: { backgroundColor: 'rgba(0,0,0,0.02)', borderWidth: 1, borderColor: colors.glassBorderLight, borderRadius: borderRadius.md, paddingHorizontal: spacing.md, paddingVertical: 14, fontSize: 15, color: colors.textPrimary, fontFamily: typography.fonts.body },
  loginBtn: { marginBottom: spacing.xl },
  footerLinks: { alignItems: 'center' },
  footerText: { textAlign: 'center', fontSize: 14, color: colors.textSecondary, fontFamily: typography.fonts.body },
  linkText: { color: colors.primary, fontFamily: typography.fonts.bodySemiBold, fontWeight: '600' },
  errorText: { color: colors.error, fontSize: 13, fontFamily: typography.fonts.bodySemiBold, textAlign: 'center', marginBottom: spacing.md },
});
