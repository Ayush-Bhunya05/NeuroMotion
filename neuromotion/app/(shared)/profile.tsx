// NeuroMotion AI — User Profile Screen (Dark Edition)
import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Switch, Alert, Pressable, ViewStyle, TextStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { typography, spacing } from '../../src/theme';
import GlassCard from '../../src/components/ui/GlassCard';
import GradientButton from '../../src/components/ui/GradientButton';
import StatusBadge from '../../src/components/ui/StatusBadge';
import { useApp } from '../../src/contexts/AppContext';
import { usePhysical } from '../../src/contexts/PhysicalContext';
import { useCognitive } from '../../src/contexts/CognitiveContext';
import { calculateUnifiedScore } from '../../src/services/feedbackEngine';
import { auth } from '../../src/services/firebase';
import { signOut } from 'firebase/auth';

export default function Profile() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { state: app, dispatch } = useApp();
  const activeModule = app.activeModule;
  const isLight = activeModule === 'cognitive';
  const { state: physical } = usePhysical();
  const { state: cognitive } = useCognitive();
  const user = app.user;
  const [notificationsOn, setNotificationsOn] = useState(true);

  if (!user) return <View style={styles.loadingContainer}><Text style={styles.loadingText}>Loading Profile...</Text></View>;

  const unifiedScore = calculateUnifiedScore(
    user.rehabGoal === 'physical' ? physical.currentScore.overall : null,
    user.rehabGoal === 'cognitive' ? cognitive.currentScore.overall : null,
  );

  const addGuardian = () => {
    Alert.alert('Add Guardian', 'Enter guardian details', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Add Demo Guardian', 
        onPress: () => {
          dispatch({ type: 'ADD_GUARDIAN', payload: { name: 'John Smith', email: 'john@email.com', relationship: 'Parent' } });
        }
      },
    ]);
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          try {
            await signOut(auth);
            router.replace('/(auth)/login');
          } catch (err) {
            console.error('Logout error:', err);
            Alert.alert('Error', 'Failed to log out. Please try again.');
          }
        }
      },
    ]);
  };

  return (
    <View style={[styles.container, isLight && styles.containerLight]}>
      {isLight ? (
        <LinearGradient colors={['#F0F4FF', '#FFFFFF']} style={StyleSheet.absoluteFill as ViewStyle} />
      ) : (
        <LinearGradient colors={['#020412', '#0A0E27']} style={StyleSheet.absoluteFill as ViewStyle} />
      )}
      
      {/* Custom Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable onPress={() => router.back()} style={[styles.backBtn, isLight && styles.backBtnLight]}>
          <Ionicons name="arrow-back" size={24} color={isLight ? '#1E293B' : '#FFFFFF'} />
        </Pressable>
        <Text style={[styles.headerTitle, isLight && styles.headerTitleLight]}>User Profile</Text>
        <Pressable onPress={() => router.push('/(shared)/settings')} style={styles.settingsBtn}>
          <Ionicons name="settings-outline" size={22} color={isLight ? '#64748B' : '#FFFFFF'} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Avatar & Name */}
        <Animated.View entering={FadeInDown.duration(500)} style={styles.avatarSection}>
          <LinearGradient colors={user.rehabGoal === 'physical' ? ['#00D9A6', '#009E79'] : ['#6C63FF', '#4F46E5']} style={styles.avatar}>
            <Text style={styles.avatarText}>{user.name.charAt(0)}</Text>
          </LinearGradient>
          <Text style={[styles.name, isLight && styles.nameLight]}>{user.name}</Text>
          <Text style={[styles.email, isLight && styles.emailLight]}>{user.email}</Text>
          <View style={styles.roleBadge}>
            <StatusBadge label={user.role.toUpperCase()} variant="info" />
          </View>
        </Animated.View>

        {/* Unified Recovery Score */}
        <Animated.View entering={FadeInDown.delay(100).duration(500)}>
          <GlassCard variant={isLight ? 'default' : 'dark'} style={[styles.accentCard, isLight && styles.accentCardLight]}>
            <Text style={[styles.sectionTitle, isLight && styles.sectionTitleLight]}>Unified Recovery Index</Text>
            <View style={styles.unifiedRow}>
              <View style={[styles.unifiedCircle, isLight && styles.unifiedCircleLight]}>
                <Text style={[styles.unifiedScore, isLight && styles.unifiedScoreLight]}>{unifiedScore}</Text>
                <Text style={styles.unifiedLabel}>/ 100</Text>
              </View>
              <View style={styles.unifiedBreakdown}>
                <View style={styles.subScore}>
                  <Text style={[styles.subLabel, isLight && styles.subLabelLight]}>💪 Physical Status</Text>
                  <Text style={[styles.subVal, { color: '#00D9A6' }]}>{physical.currentScore.overall}</Text>
                </View>
                <View style={[styles.divider, isLight && styles.dividerLight]} />
                <View style={styles.subScore}>
                  <Text style={[styles.subLabel, isLight && styles.subLabelLight]}>🧠 Cognitive Status</Text>
                  <Text style={[styles.subVal, { color: '#6C63FF' }]}>{cognitive.currentScore.overall}</Text>
                </View>
              </View>
            </View>
          </GlassCard>
        </Animated.View>

        {/* Goal */}
        <Animated.View entering={FadeInDown.delay(150).duration(500)}>
          <GlassCard variant={isLight ? 'elevated' : 'dark'}>
            <Text style={[styles.sectionTitle, isLight && styles.sectionTitleLight]}>Active Rehabilitation Goal</Text>
            {user.rehabGoal ? (
              <View style={styles.moduleRow}>
                <View style={[styles.moduleIconBox, isLight && styles.moduleIconBoxLight]}>
                  <Text style={styles.moduleIcon}>{user.rehabGoal === 'physical' ? '💪' : '🧠'}</Text>
                </View>
                <View style={styles.moduleInfo}>
                  <Text style={[styles.moduleName, isLight && styles.moduleNameLight]}>{user.rehabGoal === 'physical' ? 'Physical Rehabilitation' : 'Cognitive Training'}</Text>
                  <Text style={[styles.moduleStatus, isLight && styles.moduleStatusLight]}>AI Monitoring Active</Text>
                </View>
                <StatusBadge label="Active" variant={user.rehabGoal === 'physical' ? 'physical' : 'cognitive'} />
              </View>
            ) : (
              <Text style={styles.emptyText}>No active goal selected.</Text>
            )}
          </GlassCard>
        </Animated.View>

        {/* Personal Info */}
        <Animated.View entering={FadeInDown.delay(200).duration(500)}>
          <GlassCard variant={isLight ? 'elevated' : 'dark'}>
            <Text style={[styles.sectionTitle, isLight && styles.sectionTitleLight]}>Account Details</Text>
            {[
              { label: 'Contact', value: user.contact || 'Not linked', icon: 'call-outline' },
              { label: 'Classification', value: user.role === 'user' ? 'Patient' : 'Specialist', icon: 'ribbon-outline' },
              { label: 'Cloud Sync', value: 'Enabled', icon: 'cloud-done-outline' },
            ].map((item, i) => (
              <View key={i} style={[styles.infoRow, isLight && styles.infoRowLight, i === 2 && { borderBottomWidth: 0 }]}>
                <Ionicons name={item.icon as any} size={18} color={isLight ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.4)'} />
                <Text style={[styles.infoLabel, isLight && styles.infoLabelLight]}>{item.label}</Text>
                <Text style={[styles.infoValue, isLight && styles.infoValueLight]}>{item.value}</Text>
              </View>
            ))}
          </GlassCard>
        </Animated.View>

        {/* Guardian Mode */}
        <Animated.View entering={FadeInDown.delay(250).duration(500)}>
          <GlassCard variant={isLight ? 'elevated' : 'dark'}>
            <View style={styles.guardianHeader}>
              <Text style={[styles.sectionTitle, isLight && styles.sectionTitleLight]}>Guardian Network</Text>
              <Pressable onPress={addGuardian}>
                <Text style={styles.addText}>+ Add</Text>
              </Pressable>
            </View>
            {user.guardians.length === 0 ? (
              <Text style={[styles.emptyText, isLight && styles.emptyTextLight]}>No active guardians synchronized</Text>
            ) : (
              user.guardians.map((g, i) => (
                <View key={i} style={styles.guardianRow}>
                  <View style={[styles.guardianAvatar, isLight && styles.guardianAvatarLight]}>
                    <Text style={[styles.guardianAvatarText, isLight && styles.guardianAvatarTextLight]}>{g.name.charAt(0)}</Text>
                  </View>
                  <View style={styles.guardianInfo}>
                    <Text style={[styles.guardianName, isLight && styles.guardianNameLight]}>{g.name}</Text>
                    <Text style={[styles.guardianEmail, isLight && styles.guardianEmailLight]}>{g.email} · {g.relationship}</Text>
                  </View>
                  <Ionicons name="shield-checkmark" size={16} color="#00D9A6" />
                </View>
              ))
            )}
          </GlassCard>
        </Animated.View>

        {/* Settings Quick */}
        <Animated.View entering={FadeInDown.delay(300).duration(500)}>
          <GlassCard variant={isLight ? 'elevated' : 'dark'}>
            <Text style={[styles.sectionTitle, isLight && styles.sectionTitleLight]}>Interface Preferences</Text>
            <View style={styles.prefRow}>
              <View style={styles.prefLeft}>
                <Ionicons name="notifications-outline" size={18} color="#00D9A6" />
                <Text style={[styles.prefLabel, isLight && styles.prefLabelLight]}>Biometric Alerts</Text>
              </View>
              <Switch 
                value={notificationsOn} 
                onValueChange={setNotificationsOn} 
                trackColor={{ true: '#00D9A6', false: isLight ? '#E2E8F0' : '#333' }} 
                thumbColor="#FFFFFF" 
              />
            </View>
          </GlassCard>
        </Animated.View>

        {/* Actions */}
        <View style={styles.actions}>
          <GradientButton title="📊  Download Medical Report" onPress={() => router.push('/(shared)/unified-report')} variant="physical" fullWidth />
          <GradientButton title="Logout Session" onPress={handleLogout} variant="outline" fullWidth />
        </View>
        
        <View style={styles.footerPad} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020412' } as ViewStyle,
  containerLight: { backgroundColor: '#F8FAFC' },
  loadingContainer: { flex: 1, backgroundColor: '#020412', alignItems: 'center', justifyContent: 'center' } as ViewStyle,
  loadingText: { color: '#FFFFFF', fontFamily: typography.fonts.headingBold } as TextStyle,
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingBottom: spacing.md } as ViewStyle,
  backBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' } as ViewStyle,
  backBtnLight: { backgroundColor: '#FFFFFF', borderColor: '#E2E8F0' },
  headerTitle: { color: '#FFFFFF', fontSize: 18, fontFamily: typography.fonts.headingBold, letterSpacing: 0.5 } as TextStyle,
  headerTitleLight: { color: '#1E293B' },
  settingsBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' } as ViewStyle,
  scroll: { padding: spacing.lg, gap: spacing.lg } as ViewStyle,
  avatarSection: { alignItems: 'center', paddingVertical: spacing.xl } as ViewStyle,
  avatar: { width: 100, height: 100, borderRadius: 50, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md, borderWidth: 2, borderColor: 'rgba(108, 99, 255, 0.4)' } as ViewStyle,
  avatarText: { fontSize: 36, fontWeight: '700', color: '#FFFFFF' } as TextStyle,
  name: { fontSize: 26, fontFamily: typography.fonts.headingBold, color: '#FFFFFF', letterSpacing: -0.5 } as TextStyle,
  nameLight: { color: '#1E293B' },
  email: { fontSize: 14, color: 'rgba(255,255,255,0.5)', marginTop: 4, fontFamily: typography.fonts.body } as TextStyle,
  emailLight: { color: '#64748B' },
  roleBadge: { marginTop: 14 } as ViewStyle,
  accentCard: { borderColor: 'rgba(108, 99, 255, 0.3)', borderWidth: 1, backgroundColor: 'rgba(108, 99, 255, 0.03)' } as ViewStyle,
  accentCardLight: { borderColor: 'rgba(108, 99, 255, 0.1)', backgroundColor: '#FFFFFF' },
  sectionTitle: { fontSize: 13, fontFamily: typography.fonts.bodySemiBold, color: '#FFFFFF', marginBottom: spacing.lg, opacity: 0.5, letterSpacing: 1, textTransform: 'uppercase' } as TextStyle,
  sectionTitleLight: { color: '#64748B', opacity: 1 },
  unifiedRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xl } as ViewStyle,
  unifiedCircle: { width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(108, 99, 255, 0.1)', borderWidth: 2, borderColor: '#6C63FF', alignItems: 'center', justifyContent: 'center' } as ViewStyle,
  unifiedCircleLight: { backgroundColor: '#F0F4FF' },
  unifiedScore: { fontSize: 36, fontFamily: typography.fonts.headingBold, color: '#FFFFFF' } as TextStyle,
  unifiedScoreLight: { color: '#1E293B' },
  unifiedLabel: { fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 2, fontWeight: '700' } as TextStyle,
  unifiedBreakdown: { flex: 1, gap: spacing.md } as ViewStyle,
  subScore: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' } as ViewStyle,
  subLabel: { fontSize: 13, color: 'rgba(255,255,255,0.6)', fontFamily: typography.fonts.body } as TextStyle,
  subLabelLight: { color: '#64748B' },
  subVal: { fontSize: 18, fontFamily: typography.fonts.headingBold } as TextStyle,
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.06)' } as ViewStyle,
  dividerLight: { backgroundColor: '#F1F5F9' },
  moduleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: 4 } as ViewStyle,
  moduleIconBox: { width: 48, height: 48, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.04)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' } as ViewStyle,
  moduleIconBoxLight: { backgroundColor: '#F8FAFC', borderColor: '#E2E8F0' },
  moduleIcon: { fontSize: 22 } as TextStyle,
  moduleInfo: { flex: 1 } as ViewStyle,
  moduleName: { fontSize: 16, fontFamily: typography.fonts.headingBold, color: '#FFFFFF' } as TextStyle,
  moduleNameLight: { color: '#1E293B' },
  moduleStatus: { fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 2 } as TextStyle,
  moduleStatusLight: { color: '#94A3B8' },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.lg, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.04)' } as ViewStyle,
  infoRowLight: { borderBottomColor: '#F1F5F9' },
  infoLabel: { flex: 1, fontSize: 14, color: 'rgba(255,255,255,0.5)', fontFamily: typography.fonts.body } as TextStyle,
  infoLabelLight: { color: '#64748B' },
  infoValue: { fontSize: 14, color: '#FFFFFF', fontFamily: typography.fonts.bodyMedium } as TextStyle,
  infoValueLight: { color: '#1E293B' },
  guardianHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md } as ViewStyle,
  addText: { color: '#00D9A6', fontSize: 14, fontFamily: typography.fonts.headingBold } as TextStyle,
  guardianRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md } as ViewStyle,
  guardianAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.05)', alignItems: 'center', justifyContent: 'center' } as ViewStyle,
  guardianAvatarLight: { backgroundColor: '#F1F5F9' },
  guardianAvatarText: { fontSize: 14, color: '#FFFFFF', fontWeight: '700' } as TextStyle,
  guardianAvatarTextLight: { color: '#64748B' },
  guardianInfo: { flex: 1 } as ViewStyle,
  guardianName: { fontSize: 14, fontFamily: typography.fonts.bodyMedium, color: '#FFFFFF' } as TextStyle,
  guardianNameLight: { color: '#1E293B' },
  guardianEmail: { fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2 } as TextStyle,
  guardianEmailLight: { color: '#94A3B8' },
  emptyText: { fontSize: 13, color: 'rgba(255,255,255,0.3)', fontStyle: 'italic' } as TextStyle,
  emptyTextLight: { color: '#94A3B8' },
  prefRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' } as ViewStyle,
  prefLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.md } as ViewStyle,
  prefLabel: { fontSize: 14, color: '#FFFFFF', opacity: 0.8 } as TextStyle,
  prefLabelLight: { color: '#1E293B', opacity: 1 },
  actions: { gap: spacing.md, marginTop: spacing.xl } as ViewStyle,
  footerPad: { height: 120 } as ViewStyle,
});
