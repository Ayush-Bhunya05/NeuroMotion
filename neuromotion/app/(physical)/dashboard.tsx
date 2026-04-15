// NeuroMotion AI — Physical Dashboard (Dark Edition)
import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, Dimensions } from 'react-native';
const { width: SCREEN_WIDTH } = Dimensions.get('window');
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius } from '../../src/theme';
import GlassCard from '../../src/components/ui/GlassCard';
import ProgressBar from '../../src/components/ui/ProgressBar';
import { useApp } from '../../src/contexts/AppContext';
import { getPhysicalSessions, StoredPhysicalSession } from '../../src/services/dbService';
import { generateKinematicClinicalInsights } from '../../src/services/feedbackEngine';
import { MiniLineChart } from '../../src/components/charts/Charts';
import DoctorSelectionModal from '../../src/components/shared/DoctorSelectionModal';

export default function PhysicalDashboard() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { state: app } = useApp();
  const [showDoctorModal, setShowDoctorModal] = useState(false);

  const [dbSessions, setDbSessions] = useState<StoredPhysicalSession[]>([]);

  useFocusEffect(
    React.useCallback(() => {
      const load = async () => {
        const sessions = await getPhysicalSessions(true);
        setDbSessions(sessions);
      };
      load();
    }, [])
  );

  // 📈 Logic-Based Trends
  const squatTrend = useMemo(() => {
    return dbSessions
      .filter(s => s.exerciseName.toLowerCase().includes('squat'))
      .slice(0, 6).reverse()
      .map((s, i) => ({ label: `S${i + 1}`, value: s.scoreResult?.finalScore || 0 }));
  }, [dbSessions]);

  const raiseTrend = useMemo(() => {
    return dbSessions
      .filter(s => s.exerciseName.toLowerCase().includes('raise'))
      .slice(0, 6).reverse()
      .map((s, i) => ({ label: `R${i + 1}`, value: s.scoreResult?.romScore || 0 }));
  }, [dbSessions]);

  const todayLocal = new Date().toLocaleDateString('en-CA');
  const todaySessions = dbSessions.filter(s => new Date(s.createdAt).toLocaleDateString('en-CA') === todayLocal);

  const completedGames = {
    squats: todaySessions.some(s => s.exerciseName.toLowerCase().includes('squat')),
    arm_raises: todaySessions.some(s => s.exerciseName.toLowerCase().includes('raise'))
  };

  const tasksCompletedCount = Object.values(completedGames).filter(Boolean).length;
  const totalTasksCount = Object.keys(completedGames).length;
  const dailyProgressPercent = totalTasksCount > 0 ? Math.round((tasksCompletedCount / totalTasksCount) * 100) : 0;

  const aiInsights = generateKinematicClinicalInsights(dbSessions);

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#020412', '#0A0E27']} style={StyleSheet.absoluteFill} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.scroll, { paddingTop: insets.top + spacing.lg }]}>

        <Animated.View entering={FadeInDown.duration(500)} style={styles.headerSection}>
          <View style={styles.headerRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.greeting}>Dashboard</Text>
              <Text style={styles.userName}>Hi, {app.user?.name || 'Patient'} 👋</Text>
            </View>
            <View style={{ flexDirection: 'row', gap: spacing.md, alignItems: 'center' }}>
              <Pressable onPress={() => setShowDoctorModal(true)} style={styles.iconBtn}>
                <Ionicons name="medical-outline" size={20} color="#00D9A6" />
              </Pressable>
              {app.user?.rehabGoal === 'dual' && (
                <Pressable onPress={() => router.push('/(shared)/dashboard')} style={styles.unifiedBtn}>
                  <Ionicons name="grid-outline" size={18} color="#00D9A6" />
                </Pressable>
              )}
              <Pressable onPress={() => router.push('/(shared)/profile')}>
                <LinearGradient colors={['#00D9A6', '#009E79']} style={styles.avatarGrad}>
                  <Text style={styles.avatarText}>{app.user?.name?.charAt(0) || 'U'}</Text>
                </LinearGradient>
              </Pressable>
            </View>
          </View>
        </Animated.View>

        <DoctorSelectionModal
          visible={showDoctorModal}
          onClose={() => setShowDoctorModal(false)}
          module="physical"
        />

        <Animated.View entering={FadeInDown.delay(100).duration(500)}>
          <GlassCard variant="dark" style={styles.aiPlanCard}>
            <View style={styles.aiHeader}>
              <View style={styles.aiIconBadge}><Text style={{ fontSize: 18 }}>🎯</Text></View>
              <Text style={styles.aiTitle}>Daily AI Mission</Text>
            </View>
            <Text style={styles.aiDesc}>Complete your daily rehab exercises </Text>
            <View style={styles.dailyProgressBar}><View style={[styles.dailyProgressFill, { width: `${dailyProgressPercent}%` }]} /></View>
            <Pressable onPress={() => router.push('/(physical)/exercise-info?id=squats')} style={styles.aiStartBtn}>
              <LinearGradient colors={['#00D9A6', '#009E79']} style={styles.aiStartGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                <Text style={styles.aiStartText}>Initialize Session</Text>
                <Ionicons name="arrow-forward" size={16} color="#001424" />
              </LinearGradient>
            </Pressable>
          </GlassCard>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(200).duration(500)} style={{ marginTop: 24 }}>
          <Text style={styles.sectionHeader}>Mobility Trends </Text>
          <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false} style={styles.trendScroll} contentContainerStyle={styles.trendScrollContent}>
            <View style={styles.chartPage}>
              <GlassCard variant="dark" style={styles.chartCard}>
                <View style={styles.chartTitleRow}>
                  <Text style={styles.chartTitle}>Squat Performance</Text>
                  <StatusBadge label="Score" color="#00D9A6" />
                </View>
                {squatTrend.length > 0 ? <MiniLineChart data={squatTrend} color="#00D9A6" width={SCREEN_WIDTH - 64} /> : <View style={styles.emptyChart}><Text style={styles.emptyText}>Complete a squat session to see progress.</Text></View>}
              </GlassCard>
            </View>
          </ScrollView>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(300).duration(500)}>
          <View style={styles.aiBadgeHeader}>
            <Ionicons name="sparkles" size={14} color="#6C63FF" />
            <Text style={styles.aiBadgeText}>AI CLINICAL INSIGHTS (LOCAL)</Text>
          </View>
          <GlassCard style={styles.aiCard}>
            <View style={styles.aiInsightsList}>
              {aiInsights.map((insight, idx) => (
                <View key={idx} style={styles.aiInsightRow}>
                  <View style={[styles.aiDot, { backgroundColor: insight.type === 'positive' ? '#10B981' : insight.type === 'warning' ? '#EF4444' : '#6C63FF' }]} />
                  <Text style={styles.aiInsightText}>{insight.message}</Text>
                </View>
              ))}
            </View>
          </GlassCard>
        </Animated.View>

        <Text style={styles.disclaimer}>Neural Diagnostics · Progressive Kinematic Adaptation</Text>
      </ScrollView>
    </View>
  );
}

const StatusBadge = ({ label, color }: { label: string; color: string }) => (
  <View style={[styles.badge, { borderColor: color + '44' }]}><Text style={[styles.badgeText, { color }]}>{label}</Text></View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020412' },
  scroll: { paddingHorizontal: spacing.lg, paddingBottom: 100 },
  headerSection: { marginBottom: spacing.xl },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  greeting: { fontSize: 13, color: '#00D9A6', fontWeight: '600', letterSpacing: 1.5, textTransform: 'uppercase' },
  userName: { fontSize: 24, color: '#FFFFFF', fontWeight: '700', marginTop: 4 },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(0, 217, 166, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 217, 166, 0.1)'
  },
  avatarGrad: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 18, fontWeight: '700', color: '#001424' },
  unifiedBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0, 217, 166, 0.1)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(0, 217, 166, 0.2)' },

  aiPlanCard: { marginTop: spacing.md, padding: spacing.lg, borderColor: 'rgba(0, 217, 166, 0.4)', borderWidth: 1 },
  aiHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  aiIconBadge: { backgroundColor: 'rgba(0, 217, 166, 0.1)', padding: 6, borderRadius: 12 },
  aiTitle: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
  aiDesc: { fontSize: 13, color: 'rgba(255,255,255,0.6)', marginBottom: 16 },
  dailyProgressBar: { height: 6, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 3, marginBottom: 20, overflow: 'hidden' },
  dailyProgressFill: { height: '100%', backgroundColor: '#00D9A6' },
  aiStartBtn: { borderRadius: 14, overflow: 'hidden' },
  aiStartGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, gap: 8 },
  aiStartText: { color: '#001424', fontSize: 15, fontWeight: '700' },

  trendHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 32, marginBottom: 12 },
  sectionHeader: { fontSize: 18, fontWeight: '700', color: '#FFFFFF' },
  scrollHint: { fontSize: 10, color: '#00D9A6', marginBottom: 4 },
  trendScroll: { marginHorizontal: -spacing.lg },
  trendScrollContent: { paddingHorizontal: spacing.lg },
  chartPage: { width: SCREEN_WIDTH - 32, paddingRight: 16 },
  chartCard: { padding: 16 },
  chartTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  chartTitle: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },
  badge: { borderWidth: 1, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  badgeText: { fontSize: 9, fontWeight: '700', textTransform: 'uppercase' },

  aiBadgeHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 32, marginBottom: 12, backgroundColor: 'rgba(108, 99, 255, 0.1)', alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  aiBadgeText: { color: '#6C63FF', fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  aiCard: { padding: 16, backgroundColor: 'rgba(108, 99, 255, 0.03)', borderColor: 'rgba(108, 99, 255, 0.2)', borderWidth: 1 },
  aiInsightsList: { gap: 12 },
  aiInsightRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  aiDot: { width: 6, height: 6, borderRadius: 3, marginTop: 6 },
  aiInsightText: { flex: 1, fontSize: 13, color: 'rgba(255,255,255,0.8)', lineHeight: 20 },

  emptyChart: { height: 160, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 12 },
  emptyText: { color: 'rgba(255,255,255,0.3)', fontSize: 12 },
  disclaimer: { textAlign: 'center', fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 40, marginBottom: 20 },
});
