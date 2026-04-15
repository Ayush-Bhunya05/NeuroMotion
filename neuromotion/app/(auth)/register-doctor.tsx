// NeuroMotion AI — Doctor Registration
import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, KeyboardAvoidingView, Platform, ScrollView, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { colors, typography, spacing, borderRadius } from '../../src/theme';
import GlassCard from '../../src/components/ui/GlassCard';
import GradientButton from '../../src/components/ui/GradientButton';
import Header from '../../src/components/shared/Header';
import { useRouter } from 'expo-router';

import { auth, db } from '../../src/services/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { collection, query, where, getDocs, doc, setDoc } from 'firebase/firestore';

export default function RegisterDoctor() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [contact, setContact] = useState('');
  const [password, setPassword] = useState('');
  const [specialty, setSpecialty] = useState<'physical' | 'cognitive' | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const isFormValid = name && email && contact && password && specialty;

  const handleRegister = async () => {
    if (!isFormValid) {
      setErrorMsg('Please fill in all mandatory fields.');
      return;
    }

    if (!email.includes('@')) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }

    if (contact.length > 10) {
      setErrorMsg('Phone number cannot exceed 10 digits.');
      return;
    }

    if (name.trim().toLowerCase() === email.trim().toLowerCase()) {
      setErrorMsg('Name and email cannot be identical.');
      return;
    }
    setLoading(true);
    setErrorMsg('');
    try {
      // Check for duplicate email in Firestore
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('email', '==', email.toLowerCase().trim()));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        setErrorMsg('This email is already registered.');
        setLoading(false);
        return;
      }

      const userCred = await createUserWithEmailAndPassword(auth, email, password);
      
      // Store additional clinician details in Firestore
      await setDoc(doc(db, 'users', userCred.user.uid), {
        id: userCred.user.uid,
        name,
        email,
        contact: contact.trim(),
        role: 'doctor',
        specialty,
        module: specialty, // Add module field for consistency
        patients: [], 
        createdAt: new Date().toISOString()
      });

      // Navigate to doctor dashboard (onAuthStateChanged handles login)
      router.replace('/(doctor)/dashboard');
    } catch (error: any) {
      setErrorMsg(error.message || 'Registration failed.');
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <LinearGradient colors={[colors.bgPrimary, colors.bgSecondary]} style={[styles.container, { paddingTop: insets.top }]}>
        <Header title="" showBack backIconColor={colors.primary} />
        
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <Animated.View entering={FadeInUp.duration(600)} style={styles.header}>
            <Text style={styles.title}>Provider Setup</Text>
            <Text style={styles.subtitle}>Create your clinician account</Text>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(200).duration(600)}>
            <GlassCard variant="default" style={styles.formCard}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Full Name (with credentials) *</Text>
                <TextInput value={name} onChangeText={setName} placeholder="Dr. John Doe, MD" placeholderTextColor={colors.textMuted} style={styles.input} />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Work Email Address *</Text>
                <TextInput value={email} onChangeText={setEmail} placeholder="name@clinic.com" placeholderTextColor={colors.textMuted} keyboardType="email-address" autoCapitalize="none" style={styles.input} />
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Contact Number *</Text>
                <TextInput value={contact} onChangeText={setContact} placeholder="1234567890" placeholderTextColor={colors.textMuted} keyboardType="number-pad" maxLength={10} style={styles.input} />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Password *</Text>
                <TextInput value={password} onChangeText={setPassword} placeholder="Create a secure password" placeholderTextColor={colors.textMuted} secureTextEntry style={styles.input} />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Primary Specialization *</Text>
                <View style={styles.chipRow}>
                  <Pressable 
                    onPress={() => setSpecialty('physical')}
                    style={[styles.chip, specialty === 'physical' && styles.chipActive]}
                  >
                    <Text style={[styles.chipText, specialty === 'physical' && styles.chipTextActive]}>Physical Rehab</Text>
                  </Pressable>
                  <Pressable 
                    onPress={() => setSpecialty('cognitive')}
                    style={[styles.chip, specialty === 'cognitive' && styles.chipActive]}
                  >
                    <Text style={[styles.chipText, specialty === 'cognitive' && styles.chipTextActive]}>Cognitive Training</Text>
                  </Pressable>
                </View>
              </View>

              {errorMsg ? <Text style={styles.errorText}>{errorMsg}</Text> : null}

              <GradientButton 
                title="Register as Provider" 
                onPress={handleRegister} 
                fullWidth 
                size="lg" 
                style={styles.loginBtn} 
                variant={isFormValid ? "neutral" : "outline"}
                loading={loading}
              />
            </GlassCard>
            
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
  title: { fontSize: 28, fontFamily: typography.fonts.headingBold, fontWeight: '700', color: colors.textPrimary, marginBottom: spacing.xs },
  subtitle: { fontSize: 15, color: colors.textSecondary, fontFamily: typography.fonts.body, textAlign: 'center' },
  formCard: { padding: spacing.lg, marginBottom: spacing.xl }, 
  inputGroup: { marginBottom: spacing.lg },
  label: { fontSize: 13, fontFamily: typography.fonts.bodySemiBold, fontWeight: '600', color: colors.textSecondary, marginBottom: 8 },
  input: { backgroundColor: 'rgba(0,0,0,0.02)', borderWidth: 1, borderColor: colors.glassBorderLight, borderRadius: borderRadius.md, paddingHorizontal: spacing.md, paddingVertical: 14, fontSize: 15, color: colors.textPrimary, fontFamily: typography.fonts.body },
  
  loginBtn: { marginBottom: spacing.xl },
  // Chip Styles
  chipRow: { flexDirection: 'row', gap: spacing.md },
  chip: { flex: 1, paddingVertical: 14, alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.02)', borderWidth: 1, borderColor: colors.glassBorderLight, borderRadius: borderRadius.md },
  chipActive: { backgroundColor: colors.textPrimary, borderColor: colors.textPrimary },
  chipText: { fontSize: 14, fontFamily: typography.fonts.bodySemiBold, color: colors.textSecondary },
  chipTextActive: { color: colors.bgPrimary, fontWeight: '700' },

  errorText: { color: colors.error, fontSize: 13, fontFamily: typography.fonts.bodySemiBold, textAlign: 'center', marginBottom: spacing.md },
});
