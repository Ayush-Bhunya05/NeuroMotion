// NeuroMotion AI — Unified Dashboard (Dual Rehabilitation)
import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius } from '../../src/theme';
import GlassCard from '../../src/components/ui/GlassCard';
import { useApp } from '../../src/contexts/AppContext';
import { getPhysicalSessions, getCognitiveSessions } from '../../src/services/dbService';
import { generateKinematicClinicalInsights } from '../../src/services/feedbackEngine';

export default function UnifiedDashboard() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { state: app, dispatch } = useApp();
  
  const [physSessions, setPhysSessions] = useState<any[]>([]);
  const [cogSessions, setCogSessions] = useState<any[]>([]);

  useFocusEffect(
    React.useCallback(() => {
      const loadData = async () => {
        const pSessions = await getPhysicalSessions(true);
        const cSessions = await getCognitiveSessions();
        setPhysSessions(pSessions);
        setCogSessions(cSessions);
      };
      loadData();
    }, [])
  );

  const today = new Date().toLocaleDateString('en-CA');
  
  const physToday = physSessions.filter(s => new Date(s.createdAt).toLocaleDateString('en-CA') === today);
  const cogToday = cogSessions.filter(s => new Date(s.createdAt).toLocaleDateString('en-CA') === today);

  const physCount = physToday.length;
  const cogCount = cogToday.length;
  
  const totalProgress = Math.min(100, Math.round(((physCount > 0 ? 50 : 0) + (cogCount > 0 ? 50 : 0))));

  const physInsights = generateKinematicClinicalInsights(physSessions);

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#05070A', '#0F1219']} style={StyleSheet.absoluteFill} />
      
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + spacing.lg }]}
      >
        {/* Header */}
        <Animated.View entering={FadeInDown.duration(600)} style={styles.header}>
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.subGreeting}>UNIFIED CARE</Text>
              <Text style={styles.userName}>Welcome, {app.user?.name || 'Patient'}</Text>
            </View>
            <Pressable onPress={() => router.push('/(shared)/profile')}>
               <View style={styles.avatarContainer}>
                 <LinearGradient colors={['#8B5CF6', '#6D28D9']} style={styles.avatarGrad}>
                   <Text style={styles.avatarText}>{app.user?.name?.charAt(0) || 'U'}</Text>
                 </LinearGradient>
               </View>
            </Pressable>
          </View>
        </Animated.View>

        {/* Daily Recovery Score */}
        <Animated.View entering={FadeInDown.delay(100).duration(600)}>
          <GlassCard style={styles.scoreCard}>
            <View style={styles.scoreInfo}>
              <View>
                <Text style={styles.scoreLabel}>Daily Goal Progress</Text>
                <Text style={styles.scoreValue}>{totalProgress}%</Text>
              </View>
              <View style={styles.scoreCircle}>
                <Ionicons name="shield-checkmark-outline" size={32} color="#8B5CF6" />
              </View>
            </View>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${totalProgress}%` }]} />
            </View>
            <Text style={styles.scoreStatus}>
              {totalProgress === 100 ? "Amazing! Both sectors completed." : 
               totalProgress === 50 ? "Halfway there! Complete the remaining module." : 
               "Start your first session of the day!"}
            </Text>
          </GlassCard>
        </Animated.View>

        {/* Module Grids */}
        <View style={styles.moduleGrid}>
          {/* Physical Side */}
          <Animated.View entering={FadeInDown.delay(200).duration(600)} style={styles.moduleColumn}>
            <Pressable 
              onPress={() => {
                dispatch({ type: 'SET_ACTIVE_MODULE', payload: 'physical' });
                router.push('/(physical)/dashboard');
              }}
            >
              <GlassCard style={[styles.moduleCard, styles.physicalBorder]}>
                <View style={[styles.iconCircle, { backgroundColor: 'rgba(0, 217, 166, 0.1)' }]}>
                  <Ionicons name="body" size={24} color="#00D9A6" />
                </View>
                <Text style={styles.moduleName}>Physical</Text>
                <Text style={styles.moduleStatus}>{physCount > 0 ? '✓ Complete' : 'Pending'}</Text>
              </GlassCard>
            </Pressable>
          </Animated.View>

          {/* Cognitive Side */}
          <Animated.View entering={FadeInDown.delay(300).duration(600)} style={styles.moduleColumn}>
            <Pressable 
              onPress={() => {
                dispatch({ type: 'SET_ACTIVE_MODULE', payload: 'cognitive' });
                router.push('/(cognitive)/dashboard');
              }}
            >
              <GlassCard style={[styles.moduleCard, styles.cognitiveBorder]}>
                <View style={[styles.iconCircle, { backgroundColor: 'rgba(108, 93, 211, 0.1)' }]}>
                  <Ionicons name="apps-outline" size={24} color="#6C5DD3" />
                </View>
                <Text style={styles.moduleName}>Cognitive</Text>
                <Text style={styles.moduleStatus}>{cogCount > 0 ? '✓ Complete' : 'Pending'}</Text>
              </GlassCard>
            </Pressable>
          </Animated.View>
        </View>

        {/* Combined Insights */}
        <Animated.View entering={FadeInDown.delay(400).duration(600)}>
          <Text style={styles.sectionTitle}>AI Unified Diagnostics</Text>
          <GlassCard style={styles.insightsCard}>
            {physInsights.length > 0 ? (
              physInsights.slice(0, 2).map((insight, idx) => (
                <View key={idx} style={styles.insightRow}>
                  <Ionicons name="sparkles" size={16} color="#8B5CF6" />
                  <Text style={styles.insightText}>{insight.message}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.noDataText}>Complete a physical session to unlock AI insights.</Text>
            )}
            <View style={styles.divider} />
            <View style={styles.insightRow}>
              <Ionicons name="bulb-outline" size={16} color="#6C5DD3" />
              <Text style={styles.insightText}>
                {cogCount > 0 ? "Daily cognitive baseline maintained." : "Begin training to assess memory stability."}
              </Text>
            </View>
          </GlassCard>
        </Animated.View>

        {/* Quick Report */}
        <Pressable 
          onPress={() => router.push('/(shared)/unified-report')}
          style={styles.reportBtn}
        >
          <LinearGradient colors={['#1F2937', '#111827']} style={styles.reportGrad}>
            <Ionicons name="document-text-outline" size={20} color="#8B5CF6" />
            <Text style={styles.reportBtnText}>View Comprehensive Clinical Report</Text>
            <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.3)" />
          </LinearGradient>
        </Pressable>

        <Text style={styles.disclaimer}>
          Encryption Active · Multi-Module Sync Enabled
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#05070A' },
  scroll: { paddingHorizontal: spacing.lg, paddingBottom: 100 },
  header: { marginBottom: spacing.xl },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  subGreeting: { fontSize: 12, color: '#8B5CF6', fontFamily: typography.fonts.bodySemiBold, letterSpacing: 2 },
  userName: { fontSize: 24, color: '#FFFFFF', fontFamily: typography.fonts.headingBold, marginTop: 4 },
  avatarContainer: { padding: 3, borderRadius: 24, borderWidth: 1, borderColor: 'rgba(139, 92, 246, 0.3)' },
  avatarGrad: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 18, color: '#FFFFFF', fontWeight: '700' },
  
  scoreCard: { padding: spacing.xl, marginBottom: spacing.lg, backgroundColor: 'rgba(139, 92, 246, 0.05)', borderColor: 'rgba(139, 92, 246, 0.2)' },
  scoreInfo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg },
  scoreLabel: { fontSize: 14, color: 'rgba(255,255,255,0.6)', fontFamily: typography.fonts.bodyMedium },
  scoreValue: { fontSize: 36, color: '#FFFFFF', fontFamily: typography.fonts.headingBold },
  scoreCircle: { width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(139, 92, 246, 0.1)', alignItems: 'center', justifyContent: 'center' },
  progressTrack: { height: 8, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 4, marginBottom: spacing.md, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#8B5CF6', borderRadius: 4 },
  scoreStatus: { fontSize: 12, color: 'rgba(255,255,255,0.4)', textAlign: 'center' },

  moduleGrid: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.xl },
  moduleColumn: { flex: 1 },
  moduleCard: { padding: spacing.lg, alignItems: 'center' },
  iconCircle: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md },
  moduleName: { fontSize: 16, color: '#FFFFFF', fontFamily: typography.fonts.headingBold },
  moduleStatus: { fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 4 },

  sectionTitle: { fontSize: 18, color: '#FFFFFF', fontFamily: typography.fonts.headingBold, marginBottom: spacing.md },
  insightsCard: { padding: spacing.lg, backgroundColor: 'rgba(255,255,255,0.02)' },
  insightRow: { flexDirection: 'row', gap: 12, alignItems: 'flex-start', marginBottom: 12 },
  insightText: { flex: 1, fontSize: 13, color: 'rgba(255,255,255,0.7)', lineHeight: 20 },
  noDataText: { fontSize: 13, color: 'rgba(255,255,255,0.4)', fontStyle: 'italic' },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.05)', marginVertical: 12 },
  physicalBorder: { borderColor: 'rgba(0, 217, 166, 0.3)' },
  cognitiveBorder: { borderColor: 'rgba(108, 93, 211, 0.3)' },

  reportBtn: { marginTop: spacing.xl, borderRadius: 16, overflow: 'hidden' },
  reportGrad: { flexDirection: 'row', alignItems: 'center', padding: spacing.lg, gap: 12 },
  reportBtnText: { flex: 1, fontSize: 14, color: '#FFFFFF', fontFamily: typography.fonts.bodySemiBold },
  
  disclaimer: { textAlign: 'center', fontSize: 10, color: 'rgba(255,255,255,0.2)', marginTop: spacing.xxl },
});
