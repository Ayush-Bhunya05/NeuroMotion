import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Dimensions, ViewStyle, TextStyle } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { typography, spacing } from '../../src/theme';
import GlassCard from '../../src/components/ui/GlassCard';
import { getPhysicalSessions, StoredPhysicalSession } from '../../src/services/dbService';
import ProgressBar from '../../src/components/ui/ProgressBar';

const { width } = Dimensions.get('window');

/**
 * NeuroMotion AI — Advanced Analytics Dashboard (Summary)
 * Matches user-provided high-density analytics layout.
 */
export default function AdvancedSummaryScreen() {
  const { sessionId, id } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [session, setSession] = useState<StoredPhysicalSession | null>(null);
  const [history, setHistory] = useState<StoredPhysicalSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const sessions = await getPhysicalSessions();
        const found = sessions.find(s => s.id === sessionId) || sessions[sessions.length - 1];
        setSession(found);
        setHistory(sessions.slice().reverse().slice(0, 10)); // Get recent 10 for charts
      } catch (e) {
        console.error('Error loading analytics:', e);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [sessionId]);

  if (loading) return <View style={styles.loadingContainer}><Text style={styles.loadingText}>Processing Neural Data...</Text></View>;
  if (!session) return <View style={styles.loadingContainer}><Text style={styles.loadingText}>Session Analysis Unavailable</Text></View>;

  const scoreResult = session.scoreResult || { finalScore: 0, grade: 'F', accuracy: 0, romScore: 0, consistency: 0, feedback: [], riskLevel: 'low' };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#0A0E27', '#161B33']} style={StyleSheet.absoluteFill as ViewStyle} />
      
      {/* Header Bar */}
      <View style={[styles.headerBar, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable onPress={() => router.replace('/(physical)/dashboard')} style={styles.backBtn}>
           <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
           <Text style={styles.backText}>Back</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Analytics Dashboard</Text>
        <View style={styles.aiBadge}>
           <View style={styles.aiDot} />
           <Text style={styles.aiText}>AI ACTIVE</Text>
        </View>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + spacing.xl }]}
      >
        {/* Section 1: Hero Score */}
        <Animated.View entering={FadeInUp.duration(600)} style={styles.heroSection}>
          <GlassCard variant="dark" style={styles.heroCard} noPadding>
            <View style={styles.heroRow}>
              <View style={styles.scoreRingWrapper}>
                <View style={styles.scoreRingInner}>
                  <Text style={styles.heroScoreText}>{scoreResult.finalScore.toFixed(0)}</Text>
                  <Text style={styles.heroScoreSub}>/100</Text>
                </View>
              </View>
              
              <View style={styles.heroInfo}>
                <View style={[styles.gradeBadge, { backgroundColor: getGradeColor(scoreResult.grade) }]}>
                  <Text style={styles.gradeText}>Grade {scoreResult.grade}</Text>
                </View>
                <Text style={styles.exerciseNameText}>{session.exerciseName}</Text>
                <Text style={styles.exerciseMetaText}>{session.totalReps} reps • {Math.floor((session.endTime! - session.startTime) / 1000)}s</Text>
              </View>
            </View>
          </GlassCard>
        </Animated.View>

        {/* Section 2: Metrics Grid */}
        <View style={styles.metricsGrid}>
          {[
            { label: 'ACCURACY', val: `${scoreResult.accuracy.toFixed(0)}%`, sub: 'Form quality', icon: 'shield-checkmark', color: '#EF4444' },
            { label: 'ROM', val: `${scoreResult.romScore.toFixed(0)}%`, sub: 'Range of motion', icon: 'triangle', color: '#FBBF24' },
            { label: 'CONSISTENCY', val: `${scoreResult.consistency.toFixed(0)}%`, sub: 'Rep uniformity', icon: 'stats-chart', color: '#8B5CF6' },
            { label: 'RISK LEVEL', val: scoreResult.riskLevel.toUpperCase(), sub: 'Injury assessment', icon: 'medical', color: scoreResult.riskLevel === 'low' ? '#10B981' : '#FBBF24' }
          ].map((m, i) => (
            <Animated.View key={i} entering={FadeInDown.delay(200 + i * 50)} style={styles.metricItem}>
               <GlassCard variant="dark" style={styles.metricCard} noPadding>
                  <View style={[styles.metricHeader, { borderLeftColor: m.color, borderLeftWidth: 3 }]}>
                     <Ionicons name={m.icon as any} size={14} color={m.color} />
                     <Text style={styles.metricLabel}>{m.label}</Text>
                  </View>
                  <View style={styles.metricValRow}>
                    {i === 3 && <View style={[styles.riskDot, { backgroundColor: m.color }]} />}
                    <Text style={[styles.metricVal, { color: i === 3 ? (scoreResult.riskLevel === 'low' ? '#10B981' : '#FFFFFF') : '#FFFFFF' }]}>
                      {m.val}
                    </Text>
                  </View>
                  <Text style={styles.metricSub}>{m.sub}</Text>
               </GlassCard>
            </Animated.View>
          ))}
        </View>

        {/* Section 3: ML Movement Analysis */}
        <Animated.View entering={FadeInDown.delay(500)}>
          <GlassCard variant="dark" style={styles.analysisCard}>
            <View style={styles.sectionHeaderInner}>
               <Text style={styles.sectionEmoji}>🧠</Text>
               <Text style={styles.sectionTitle}>ML Movement Analysis</Text>
            </View>
            <View style={styles.analysisList}>
               {scoreResult.feedback.length > 0 ? scoreResult.feedback.map((f, i) => (
                 <View key={i} style={styles.analysisRow}>
                    <View style={styles.bullet} />
                    <Text style={styles.analysisText}>{f.replace('⚠️', '').replace('ℹ️', '').trim()}</Text>
                 </View>
               )) : (
                 <View style={styles.analysisRow}>
                    <View style={styles.bullet} />
                    <Text style={styles.analysisText}>Good execution. Focus on controlled eccentric phase for better stability.</Text>
                 </View>
               )}
            </View>
          </GlassCard>
        </Animated.View>

        {/* Section 4: ML Repetition Trajectory */}
        <Animated.View entering={FadeInDown.delay(600)}>
           <GlassCard variant="dark" style={styles.chartCard}>
              <View style={styles.sectionHeaderInner}>
                 <Text style={styles.sectionEmoji}>📊</Text>
                 <Text style={styles.sectionTitle}>ML Repetition Trajectory</Text>
              </View>
              <View style={styles.trajectoryChart}>
                 {session.reps.map((rep, i) => (
                   <View key={i} style={styles.trajectoryCol}>
                      <View style={[styles.trajectoryBar, { height: (rep.formScore || 80) * 0.6, backgroundColor: (rep.formScore || 80) >= 80 ? '#10B981' : '#FBBF24' }]} />
                      <Text style={styles.trajectoryId}>{i + 1}</Text>
                   </View>
                 ))}
              </View>
           </GlassCard>
        </Animated.View>

        {/* Section 5: Angle Analysis grid (Numeric) */}
        <Animated.View entering={FadeInDown.delay(700)}>
           <GlassCard variant="dark" style={styles.angleCard}>
              <View style={styles.sectionHeaderInner}>
                 <Text style={styles.sectionEmoji}>📐</Text>
                 <Text style={styles.sectionTitle}>Angle Analysis</Text>
              </View>
              <View style={styles.angleGrid}>
                 <View style={styles.angleBox}>
                    <Text style={styles.angleVal}>{session.avgAngle.toFixed(1)}°</Text>
                    <Text style={styles.angleLabel}>Average</Text>
                 </View>
                 <View style={styles.angleBox}>
                    <Text style={styles.angleVal}>{session.minAngle.toFixed(1)}°</Text>
                    <Text style={styles.angleLabel}>Minimum</Text>
                 </View>
                 <View style={styles.angleBox}>
                    <Text style={styles.angleVal}>{session.maxAngle.toFixed(1)}°</Text>
                    <Text style={styles.angleLabel}>Maximum</Text>
                 </View>
                 <View style={styles.angleBox}>
                    <Text style={styles.angleVal}>±{session.angleVariation.toFixed(1)}°</Text>
                    <Text style={styles.angleLabel}>Variation</Text>
                 </View>
              </View>
           </GlassCard>
        </Animated.View>

        {/* Section 6: Weekly Activity */}
        <Animated.View entering={FadeInDown.delay(800)}>
           <GlassCard variant="dark" style={styles.chartCard}>
              <View style={styles.sectionHeaderInner}>
                 <Text style={styles.sectionEmoji}>📅</Text>
                 <Text style={styles.sectionTitle}>Weekly Activity</Text>
              </View>
              <View style={styles.weeklyChart}>
                 {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => {
                    const active = day === 'Sun'; // Mock current day
                    return (
                      <View key={i} style={styles.weeklyCol}>
                        <View style={[styles.weeklyBar, { height: active ? 40 : 10, backgroundColor: active ? '#6366F1' : 'rgba(255,255,255,0.1)' }]} />
                        <Text style={styles.weeklyDay}>{day.slice(0, 1)}</Text>
                      </View>
                    );
                 })}
              </View>
           </GlassCard>
        </Animated.View>

        {/* Section 7: Personal Bests */}
        <Animated.View entering={FadeInDown.delay(900)}>
           <GlassCard variant="dark" style={styles.bestCard}>
              <View style={styles.sectionHeaderInner}>
                 <Text style={styles.sectionEmoji}>🏆</Text>
                 <Text style={styles.sectionTitle}>Personal Bests</Text>
              </View>
              <View style={styles.bestGrid}>
                 <View style={styles.bestBox}>
                    <Text style={styles.bestVal}>75</Text>
                    <Text style={styles.bestLabel}>Best Score</Text>
                 </View>
                 <View style={styles.bestBox}>
                    <Text style={styles.bestVal}>{session.totalReps}</Text>
                    <Text style={styles.bestLabel}>Most Reps</Text>
                 </View>
                 <View style={styles.bestBox}>
                    <Text style={styles.bestVal}>{history.length}</Text>
                    <Text style={styles.bestLabel}>Total Sessions</Text>
                 </View>
              </View>
           </GlassCard>
        </Animated.View>

        {/* Section 8: Daily Goal */}
        <Animated.View entering={FadeInDown.delay(1000)}>
           <GlassCard variant="dark" style={styles.goalCard}>
              <View style={styles.sectionHeaderInner}>
                 <Text style={styles.sectionEmoji}>🎯</Text>
                 <Text style={styles.sectionTitle}>Daily Goal Progress</Text>
              </View>
              <ProgressBar value={70} color="#6366F1" dark showValue={false} height={10} />
              <Text style={styles.goalMeta}>23/30 reps today</Text>
           </GlassCard>
        </Animated.View>

        <View style={styles.bottomPad} />

        {/* Footer Actions */}
        <View style={styles.footer}>
           <Pressable onPress={() => router.replace(`/(physical)/exercise?id=${(id as string) || 'squats'}`)} style={styles.retryBtn}>
              <Text style={styles.footerBtnText}>🔄 Retry</Text>
           </Pressable>
           <Pressable onPress={() => router.replace('/(physical)/dashboard')} style={styles.homeBtn}>
              <Text style={styles.footerBtnText}>🏠 Home</Text>
           </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const getGradeColor = (grade: string) => {
  if (grade === 'A') return '#10B981';
  if (grade === 'B') return '#3B82F6';
  if (grade === 'C') return '#FBBF24';
  return '#EF4444';
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0E27' } as ViewStyle,
  loadingContainer: { flex: 1, backgroundColor: '#0A0E27', alignItems: 'center', justifyContent: 'center' } as ViewStyle,
  loadingText: { color: '#6366F1', fontFamily: typography.fonts.headingBold } as TextStyle,
  headerBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingBottom: spacing.md } as ViewStyle,
  backBtn: { flexDirection: 'row', alignItems: 'center' } as ViewStyle,
  backText: { color: '#FFFFFF', marginLeft: 4, fontFamily: typography.fonts.bodyMedium } as TextStyle,
  headerTitle: { color: '#FFFFFF', fontSize: 16, fontFamily: typography.fonts.headingBold } as TextStyle,
  aiBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(16, 185, 129, 0.1)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 } as ViewStyle,
  aiDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#10B981', marginRight: 6 } as ViewStyle,
  aiText: { color: '#10B981', fontSize: 10, fontFamily: typography.fonts.bodySemiBold } as TextStyle,
  scroll: { paddingHorizontal: spacing.lg } as ViewStyle,
  heroSection: { marginVertical: spacing.md } as ViewStyle,
  heroCard: { padding: spacing.lg } as ViewStyle,
  heroRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg } as ViewStyle,
  scoreRingWrapper: { width: 80, height: 80, borderRadius: 40, borderWidth: 4, borderColor: '#FBBF24', alignItems: 'center', justifyContent: 'center' } as ViewStyle,
  scoreRingInner: { alignItems: 'center' } as ViewStyle,
  heroScoreText: { fontSize: 24, fontFamily: typography.fonts.headingBold, color: '#FFFFFF' } as TextStyle,
  heroScoreSub: { fontSize: 10, color: 'rgba(255,255,255,0.4)' } as TextStyle,
  heroInfo: { flex: 1 } as ViewStyle,
  gradeBadge: { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 8, marginBottom: 8 } as ViewStyle,
  gradeText: { color: '#FFFFFF', fontSize: 12, fontFamily: typography.fonts.headingBold } as TextStyle,
  exerciseNameText: { color: '#FFFFFF', fontSize: 20, fontFamily: typography.fonts.headingBold } as TextStyle,
  exerciseMetaText: { color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 2 } as TextStyle,
  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, marginBottom: spacing.lg } as ViewStyle,
  metricItem: { width: (width - spacing.lg * 2 - spacing.md) / 2 } as ViewStyle,
  metricCard: { padding: spacing.md } as ViewStyle,
  metricHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingLeft: 8, marginBottom: 8 } as ViewStyle,
  metricLabel: { color: 'rgba(255,255,255,0.4)', fontSize: 10, fontFamily: typography.fonts.bodySemiBold, letterSpacing: 0.5 } as TextStyle,
  metricValRow: { flexDirection: 'row', alignItems: 'center', paddingLeft: 12 } as ViewStyle,
  metricVal: { color: '#FFFFFF', fontSize: 22, fontFamily: typography.fonts.headingBold } as TextStyle,
  metricSub: { color: 'rgba(255,255,255,0.3)', fontSize: 9, paddingLeft: 12, marginTop: 2 } as TextStyle,
  riskDot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 } as ViewStyle,
  analysisCard: { padding: spacing.lg, marginBottom: spacing.md } as ViewStyle,
  sectionHeaderInner: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: spacing.lg } as ViewStyle,
  sectionEmoji: { fontSize: 18 } as TextStyle,
  sectionTitle: { color: '#FFFFFF', fontSize: 15, fontFamily: typography.fonts.headingBold } as TextStyle,
  analysisList: { gap: spacing.md } as ViewStyle,
  analysisRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md } as ViewStyle,
  bullet: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#6366F1' } as ViewStyle,
  analysisText: { flex: 1, color: 'rgba(255,255,255,0.7)', fontSize: 12, lineHeight: 18 } as TextStyle,
  chartCard: { padding: spacing.lg, marginBottom: spacing.md } as ViewStyle,
  trajectoryChart: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', height: 80, paddingHorizontal: spacing.sm } as ViewStyle,
  trajectoryCol: { alignItems: 'center', gap: 8 } as ViewStyle,
  trajectoryBar: { width: 12, borderRadius: 6 } as ViewStyle,
  trajectoryId: { color: 'rgba(255,255,255,0.3)', fontSize: 9 } as TextStyle,
  angleCard: { padding: spacing.lg, marginBottom: spacing.md } as ViewStyle,
  angleGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: spacing.xl } as ViewStyle,
  angleBox: { width: '45%' } as ViewStyle,
  angleVal: { color: '#FFFFFF', fontSize: 22, fontFamily: typography.fonts.headingBold } as TextStyle,
  angleLabel: { color: 'rgba(255,255,255,0.4)', fontSize: 11, marginTop: 4 } as TextStyle,
  weeklyChart: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', height: 50, paddingHorizontal: spacing.md } as ViewStyle,
  weeklyCol: { alignItems: 'center', gap: 6 } as ViewStyle,
  weeklyBar: { width: 16, borderRadius: 8 } as ViewStyle,
  weeklyDay: { color: 'rgba(255,255,255,0.3)', fontSize: 10 } as TextStyle,
  bestCard: { padding: spacing.lg, marginBottom: spacing.md } as ViewStyle,
  bestGrid: { flexDirection: 'row', justifyContent: 'space-between' } as ViewStyle,
  bestBox: { alignItems: 'center' } as ViewStyle,
  bestVal: { color: '#FFFFFF', fontSize: 22, fontFamily: typography.fonts.headingBold } as TextStyle,
  bestLabel: { color: 'rgba(255,255,255,0.4)', fontSize: 10, marginTop: 4 } as TextStyle,
  goalCard: { padding: spacing.lg, marginBottom: spacing.md } as ViewStyle,
  goalMeta: { color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 12 } as TextStyle,
  historyCard: { padding: spacing.lg, marginBottom: spacing.md } as ViewStyle,
  historyList: { gap: spacing.md } as ViewStyle,
  historyItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.03)', padding: spacing.md, borderRadius: 12 } as ViewStyle,
  historyName: { color: '#FFFFFF', fontSize: 14, fontFamily: typography.fonts.bodySemiBold } as TextStyle,
  historyTime: { color: 'rgba(255,255,255,0.4)', fontSize: 11, marginTop: 2 } as TextStyle,
  historyScoreBox: { alignItems: 'flex-end', gap: 6 } as ViewStyle,
  historyStat: { color: 'rgba(255,255,255,0.4)', fontSize: 11 } as TextStyle,
  historyGrade: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 } as ViewStyle,
  historyGradeText: { color: '#FFFFFF', fontSize: 10, fontFamily: typography.fonts.headingBold } as TextStyle,
  bottomPad: { height: 80 } as ViewStyle,
  footer: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.md } as ViewStyle,
  retryBtn: { flex: 1, backgroundColor: 'rgba(99, 102, 241, 0.2)', paddingVertical: 14, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#6366F1' } as ViewStyle,
  homeBtn: { flex: 1, backgroundColor: '#6366F1', paddingVertical: 14, borderRadius: 12, alignItems: 'center' } as ViewStyle,
  footerBtnText: { color: '#FFFFFF', fontFamily: typography.fonts.headingBold, fontSize: 15 } as TextStyle
});
