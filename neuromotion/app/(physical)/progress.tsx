// NeuroMotion AI — Physical Progress Screen (Dark Edition)
import React from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { typography, spacing } from '../../src/theme';
import GlassCard from '../../src/components/ui/GlassCard';
import ScoreRing from '../../src/components/ui/ScoreRing';
import ProgressBar from '../../src/components/ui/ProgressBar';
import { MiniLineChart, MiniBarChart } from '../../src/components/charts/Charts';
import { usePhysical } from '../../src/contexts/PhysicalContext';
import { useApp } from '../../src/contexts/AppContext';
import { EXERCISE_CONFIG } from '../../src/types/physical';
import { getPhysicalSessions, StoredPhysicalSession } from '../../src/services/dbService';
import { generateKinematicClinicalInsights } from '../../src/services/feedbackEngine';
import { formatDate } from '../../src/utils/formatting';

export default function PhysicalProgress() {
  const insets = useSafeAreaInsets();
  const { state } = usePhysical();
  const { state: app } = useApp();
  const user = app.user;
  const [sessions, setSessions] = React.useState<StoredPhysicalSession[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [showAll, setShowAll] = React.useState(false);

  React.useEffect(() => {
    const loadData = async () => {
      const dbSessions = await getPhysicalSessions(true);
      setSessions(dbSessions);
      setLoading(false);
    };
    loadData();
  }, []);

  const score = state.currentScore;
  
  const scoreHistory = sessions
    .slice()
    .sort((a,b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    .slice(-7)
    .map((s, i) => ({ label: `S${i+1}`, value: s.scoreResult?.finalScore || 0 }));
    
  const exerciseCounts: Record<string, number> = {};
  sessions.forEach(s => { 
    // Handle both cases: some sessions might have exerciseName (Squat) or exerciseType (squats)
    const type = s.exerciseName?.toLowerCase().includes('squat') ? 'squats' : 'arm_raises';
    exerciseCounts[type] = (exerciseCounts[type] || 0) + 1; 
  });
  
  const exerciseBarData = Object.entries(exerciseCounts).map(([key, val]) => ({ 
    label: EXERCISE_CONFIG[key as keyof typeof EXERCISE_CONFIG]?.icon || key.slice(0,3), 
    value: val 
  }));

  const clinicalInsights = generateKinematicClinicalInsights(sessions);

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#0A0E27', '#161B33']} style={StyleSheet.absoluteFill} />
      
      <ScrollView 
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + spacing.lg }]} 
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.greeting}>ANALYTICS ENGINE</Text>
          <Text style={styles.pageTitle}>Recovery Progress</Text>
        </View>

        <Animated.View entering={FadeInDown.duration(500)}>
          <GlassCard variant="dark" style={styles.scoreCard}>
            <View style={styles.scoreRow}>
              <ScoreRing score={score.overall} size={110} color="#00D9A6" />
              <View style={styles.scoreInfo}>
                <Text style={styles.scoreLabel}>Health Index</Text>
                <Text style={styles.sessions}>{sessions.length} Missions Completed</Text>
                <Text style={[styles.trend, { color: sessions.length > 0 ? '#00D9A6' : '#FBBF24' }]}>
                  STATUS: {sessions.length > 0 ? 'ACTIVE' : 'INITIALIZING'} {sessions.length > 0 ? '🚀' : '⚡'}
                </Text>
              </View>
            </View>
          </GlassCard>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(100).duration(500)}>
          <GlassCard variant="dark">
            <Text style={styles.sectionTitle}>Performance History</Text>
            {scoreHistory.length > 0 ? (
              <MiniLineChart data={scoreHistory} color="#00D9A6" />
            ) : (
              <Text style={styles.emptyText}>No session data available yet.</Text>
            )}
          </GlassCard>
        </Animated.View>

        {/* Precision Metrics - Only show if we have data */}
        {sessions.length > 0 && (
          <Animated.View entering={FadeInDown.delay(200).duration(500)}>
            <GlassCard variant="dark">
              <Text style={styles.sectionTitle}>Precision Metrics</Text>
              <View style={{ gap: spacing.lg }}>
                <ProgressBar value={Math.round(sessions.reduce((acc, s) => acc + (s.scoreResult?.accuracy || 0), 0) / sessions.length)} label="FORM ACCURACY" color="#00D9A6" dark />
                <ProgressBar value={Math.round(sessions.reduce((acc, s) => acc + (s.scoreResult?.consistency || 0), 0) / sessions.length)} label="JOINT STABILITY" color="#6366F1" dark />
                <ProgressBar value={Math.round(sessions.reduce((acc, s) => acc + (s.scoreResult?.consistency || 0), 0) / sessions.length)} label="TEMPO CONSISTENCY" color="#8B5CF6" dark />
                <ProgressBar value={Math.round(sessions.reduce((acc, s) => acc + (s.scoreResult?.romScore || 0), 0) / sessions.length)} label="RANGE OF MOTION" color="#F43F5E" dark />
              </View>
            </GlassCard>
          </Animated.View>
        )}

        <Animated.View entering={FadeInDown.delay(300).duration(500)}>
          <GlassCard variant="dark">
            <Text style={styles.sectionTitle}>Module Distribution</Text>
            {exerciseBarData.length > 0 ? (
              <MiniBarChart data={exerciseBarData} color="#00D9A6" />
            ) : (
              <Text style={styles.emptyText}>Start your first module to see distribution.</Text>
            )}
          </GlassCard>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(400).duration(500)}>
          <GlassCard variant="dark">
            <Text style={styles.sectionTitle}>AI Medical Assessment</Text>
            {clinicalInsights.length > 0 ? (
              clinicalInsights.map((insight, i) => (
                <View key={i} style={styles.fbRow}>
                  <View style={[styles.insightDot, { backgroundColor: insight.type === 'positive' ? '#10B981' : insight.type === 'warning' ? '#EF4444' : '#6C63FF' }]} />
                  <Text style={styles.fbText}>{insight.message}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.fbText}>Complete more sessions to unlock advanced AI diagnostics.</Text>
            )}
          </GlassCard>
        </Animated.View>

        {/* Recent Summary - Keep only last 5-6 with Show More */}
        <Animated.View entering={FadeInDown.delay(500).duration(500)}>
          <Text style={styles.sectionTitle}>Recent Summary</Text>
          {sessions.length > 0 ? (
            <>
              {sessions.slice().sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, showAll ? undefined : 6).map((session, idx) => (
                <GlassCard key={idx} variant="dark" style={styles.logCard}>
                  <View style={styles.logHeader}>
                    <Text style={styles.logExercise}>{session.exerciseName}</Text>
                    <Text style={styles.logDate}>{formatDate(session.createdAt)}</Text>
                  </View>
                  <View style={styles.logGrid}>
                     <View style={styles.logItem}><Text style={styles.logLabel}>SCORE</Text><Text style={[styles.logVal, {color: '#00D9A6'}]}>{session.scoreResult?.finalScore.toFixed(0)}</Text></View>
                     <View style={styles.logItem}><Text style={styles.logLabel}>ROM</Text><Text style={styles.logVal}>{session.scoreResult?.romScore.toFixed(0)}%</Text></View>
                     <View style={styles.logItem}><Text style={styles.logLabel}>FORM</Text><Text style={styles.logVal}>{session.scoreResult?.accuracy.toFixed(0)}%</Text></View>
                     <View style={styles.logItem}><Text style={styles.logLabel}>REPS</Text><Text style={styles.logVal}>{session.totalReps}</Text></View>
                  </View>
                </GlassCard>
              ))}
              {sessions.length > 6 && (
                <Pressable onPress={() => setShowAll(!showAll)} style={styles.showMoreBtn}>
                   <Text style={styles.showMoreText}>{showAll ? 'Show Less' : 'Show More'}</Text>
                   <Ionicons name={showAll ? "chevron-up" : "chevron-down"} size={16} color="#00D9A6" />
                </Pressable>
              )}
            </>
          ) : (
            <GlassCard variant="dark" style={{alignItems: 'center', padding: 20}}>
               <Text style={styles.emptyText}>No biomechanical logs found.</Text>
            </GlassCard>
          )}
        </Animated.View>

        {/* Report Generation */}
        <Animated.View entering={FadeInDown.delay(600).duration(500)} style={{ marginTop: 24 }}>
          <GlassCard variant="dark" style={styles.reportCard}>
            <View style={styles.reportHeader}>
              <View style={styles.reportIconBadge}>
                <Ionicons name="document-text" size={22} color="#00D9A6" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.reportTitle}>Clinical Report</Text>
                <Text style={styles.reportSub}>Full session summary & metrics</Text>
              </View>
            </View>

            <View style={styles.reportDivider} />

            <View style={styles.reportGrid}>
              <View style={styles.reportMetric}>
                <Text style={styles.reportMetricLabel}>PATIENT</Text>
                <Text style={styles.reportMetricVal}>{user?.name || 'N/A'}</Text>
              </View>
              <View style={styles.reportMetric}>
                <Text style={styles.reportMetricLabel}>REPORT DATE</Text>
                <Text style={styles.reportMetricVal}>{new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</Text>
              </View>
              <View style={styles.reportMetric}>
                <Text style={styles.reportMetricLabel}>TOTAL SESSIONS</Text>
                <Text style={[styles.reportMetricVal, { color: '#00D9A6' }]}>{sessions.length}</Text>
              </View>
              <View style={styles.reportMetric}>
                <Text style={styles.reportMetricLabel}>HEALTH INDEX</Text>
                <Text style={[styles.reportMetricVal, { color: '#00D9A6' }]}>{score.overall}%</Text>
              </View>
              <View style={styles.reportMetric}>
                <Text style={styles.reportMetricLabel}>AVG ACCURACY</Text>
                <Text style={styles.reportMetricVal}>{sessions.length > 0 ? Math.round(sessions.reduce((a, s) => a + (s.scoreResult?.accuracy || 0), 0) / sessions.length) : 0}%</Text>
              </View>
              <View style={styles.reportMetric}>
                <Text style={styles.reportMetricLabel}>AVG ROM</Text>
                <Text style={styles.reportMetricVal}>{sessions.length > 0 ? Math.round(sessions.reduce((a, s) => a + (s.scoreResult?.romScore || 0), 0) / sessions.length) : 0}%</Text>
              </View>
              <View style={styles.reportMetric}>
                <Text style={styles.reportMetricLabel}>CONSISTENCY</Text>
                <Text style={styles.reportMetricVal}>{sessions.length > 0 ? Math.round(sessions.reduce((a, s) => a + (s.scoreResult?.consistency || 0), 0) / sessions.length) : 0}%</Text>
              </View>
              <View style={styles.reportMetric}>
                <Text style={styles.reportMetricLabel}>RISK LEVEL</Text>
                <Text style={[styles.reportMetricVal, { color: sessions.some(s => s.scoreResult?.riskLevel === 'high') ? '#EF4444' : '#10B981' }]}>
                  {sessions.some(s => s.scoreResult?.riskLevel === 'high') ? 'High' : sessions.some(s => s.scoreResult?.riskLevel === 'moderate') ? 'Moderate' : 'Low'}
                </Text>
              </View>
            </View>

            {clinicalInsights.length > 0 && (
              <>
                <View style={styles.reportDivider} />
                <Text style={styles.reportInsightsTitle}>Clinical Assessment Summary</Text>
                {clinicalInsights.slice(0, 3).map((ins, i) => (
                  <View key={i} style={styles.reportInsightRow}>
                    <Text style={{ color: ins.type === 'positive' ? '#10B981' : ins.type === 'warning' ? '#EF4444' : '#6C63FF', fontSize: 12 }}>
                      {ins.type === 'positive' ? '✅' : ins.type === 'warning' ? '⚠️' : '💡'}
                    </Text>
                    <Text style={styles.reportInsightText}>{ins.message}</Text>
                  </View>
                ))}
              </>
            )}

            {sessions.length > 0 && (
              <>
                <View style={styles.reportDivider} />
                <Text style={styles.reportInsightsTitle}>Latest Neural Session (Deep Dive)</Text>
                {(() => {
                  const latest = [...sessions].sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
                  return (
                    <View style={styles.latestSessionMini}>
                       <View style={styles.miniHeader}>
                          <Text style={styles.miniExName}>{latest.exerciseName}</Text>
                          <View style={[styles.miniGradeBadge, { backgroundColor: getGradeColor(latest.scoreResult?.grade || 'F') }]}>
                             <Text style={styles.miniGradeText}>Grade {latest.scoreResult?.grade}</Text>
                          </View>
                       </View>
                       <View style={styles.miniGrid}>
                          <View style={styles.miniItem}><Text style={styles.miniLabel}>AVG ANGLE</Text><Text style={styles.miniVal}>{latest.avgAngle.toFixed(1)}°</Text></View>
                          <View style={styles.miniItem}><Text style={styles.miniLabel}>VARIATION</Text><Text style={styles.miniVal}>±{latest.angleVariation.toFixed(1)}°</Text></View>
                          <View style={styles.miniItem}><Text style={styles.miniLabel}>DURATION</Text><Text style={styles.miniVal}>{Math.floor(((latest.endTime || 0) - latest.startTime) / 1000)}s</Text></View>
                       </View>
                    </View>
                  );
                })()}
              </>
            )}

            <Pressable
              onPress={() => {
                const avgAcc = sessions.length > 0 ? Math.round(sessions.reduce((a, s) => a + (s.scoreResult?.accuracy || 0), 0) / sessions.length) : 0;
                const avgRom = sessions.length > 0 ? Math.round(sessions.reduce((a, s) => a + (s.scoreResult?.romScore || 0), 0) / sessions.length) : 0;
                const avgCon = sessions.length > 0 ? Math.round(sessions.reduce((a, s) => a + (s.scoreResult?.consistency || 0), 0) / sessions.length) : 0;
                
                const latest = [...sessions].sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
                
                const reportText = `
NEUROMOTION AI — CLINICAL REHABILITATION REPORT
--------------------------------------------------
PATIENT: ${user?.name || 'N/A'}
DATE: ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}
REHAB STATUS: ${sessions.some(s => s.scoreResult?.riskLevel === 'high') ? 'REQUIRES REVIEW' : 'PROGRESSING'}

1. OVERALL ANALYTICS (7-DAY TREND)
- Health Index: ${score.overall}%
- Functional Accuracy: ${avgAcc}%
- Range of Motion Performance: ${avgRom}%
- Neuromuscular Consistency: ${avgCon}%
- Total Training Volume: ${sessions.length} Sessions

2. PRECISE ANGLE ANALYSIS (LATEST SESSION)
- Exercise Type: ${latest?.exerciseName || 'N/A'}
- Grade Achieved: ${latest?.scoreResult?.grade || 'N/A'}
- Kinetic Score: ${latest?.scoreResult?.finalScore.toFixed(0)}/100
- Average Joint Angle: ${latest?.avgAngle.toFixed(1)}°
- Peak Range of Motion: ${latest?.maxAngle.toFixed(1)}°
- Stability Deviation: ±${latest?.angleVariation.toFixed(1)}°
- Session Duration: ${Math.floor(((latest?.endTime || 0) - (latest?.startTime || 0)) / 1000)} seconds

3. AI CLINICAL ASSESSMENT
${clinicalInsights.map(i => '• [' + i.type.toUpperCase() + '] ' + i.message).join('\n')}

4. TRANSCRIPT OF FEEDBACK
${latest?.scoreResult?.feedback?.map(f => '→ ' + f.replace('⚠️', '').replace('ℹ️', '').trim()).join('\n') || 'No specific form alerts recorded.'}

--------------------------------------------------
Generated by NeuroMotion AI Neural Engine.
Authorized for clinical review.
`;
                Alert.alert('📋 Full Clinical Report', reportText);
              }}
              style={styles.reportBtn}
            >
              <LinearGradient colors={['#00D9A6', '#009E79']} style={styles.reportBtnGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                <Ionicons name="download-outline" size={18} color="#001424" />
                <Text style={styles.reportBtnText}>Generate & Share Report</Text>
              </LinearGradient>
            </Pressable>
          </GlassCard>
        </Animated.View>

        <View style={styles.footerPad} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0E27' },
  scroll: { paddingHorizontal: spacing.lg, paddingBottom: 100 },
  header: { marginBottom: spacing.xl },
  greeting: { fontSize: 12, color: '#00D9A6', fontFamily: typography.fonts.bodySemiBold, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 4 },
  pageTitle: { fontSize: 28, fontFamily: typography.fonts.headingBold, color: '#FFFFFF' },
  scoreCard: { padding: spacing.xl },
  scoreRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xl },
  scoreInfo: { flex: 1, gap: 4 },
  scoreLabel: { fontSize: 18, fontFamily: typography.fonts.headingBold, color: '#FFFFFF' },
  sessions: { fontSize: 13, color: 'rgba(255,255,255,0.5)', fontFamily: typography.fonts.body },
  trend: { fontSize: 11, fontFamily: typography.fonts.bodySemiBold, marginTop: 4, letterSpacing: 1 },
  sectionTitle: { fontSize: 16, fontFamily: typography.fonts.headingBold, color: '#FFFFFF', marginBottom: spacing.xl },
  fbRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.md, alignItems: 'flex-start' },
  fbIconWrapper: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.05)', alignItems: 'center', justifyContent: 'center' },
  fbIcon: { fontSize: 14 },
  fbText: { flex: 1, fontSize: 13, color: 'rgba(255,255,255,0.7)', lineHeight: 20 },
  insightDot: { width: 6, height: 6, borderRadius: 3, marginTop: 7 },
  emptyText: { color: 'rgba(255,255,255,0.4)', textAlign: 'center', paddingVertical: 20, fontStyle: 'italic' },
  logCard: { padding: spacing.lg, marginBottom: spacing.sm },
  logHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  logExercise: { fontSize: 15, fontFamily: typography.fonts.headingBold, color: '#FFFFFF' },
  logDate: { fontSize: 11, color: 'rgba(255,255,255,0.4)' },
  logGrid: { flexDirection: 'row', justifyContent: 'space-between' },
  logItem: { alignItems: 'flex-start' },
  logLabel: { fontSize: 9, color: 'rgba(255,255,255,0.3)', marginBottom: 2, letterSpacing: 0.5 },
  logVal: { fontSize: 16, fontFamily: typography.fonts.headingBold, color: '#FFFFFF' },
  showMoreBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: spacing.md, marginTop: spacing.sm },
  showMoreText: { color: '#00D9A6', fontSize: 14, fontFamily: typography.fonts.bodySemiBold },
  footerPad: { height: 120 },

  reportCard: { padding: spacing.lg },
  reportHeader: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  reportIconBadge: { width: 48, height: 48, borderRadius: 16, backgroundColor: 'rgba(0, 217, 166, 0.1)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(0, 217, 166, 0.2)' },
  reportTitle: { fontSize: 18, fontFamily: typography.fonts.headingBold, color: '#FFFFFF' },
  reportSub: { fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 2 },
  reportDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.06)', marginVertical: 16 },
  reportGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 0 },
  reportMetric: { width: '50%', paddingVertical: 10 },
  reportMetricLabel: { fontSize: 10, color: 'rgba(255,255,255,0.3)', letterSpacing: 1, marginBottom: 4 },
  reportMetricVal: { fontSize: 16, fontFamily: typography.fonts.headingBold, color: '#FFFFFF' },
  reportInsightsTitle: { fontSize: 13, fontFamily: typography.fonts.bodySemiBold, color: 'rgba(255,255,255,0.6)', marginBottom: 10 },
  reportInsightRow: { flexDirection: 'row', gap: 8, marginBottom: 8, alignItems: 'flex-start' },
  reportInsightText: { flex: 1, fontSize: 12, color: 'rgba(255,255,255,0.6)', lineHeight: 18 },
  reportBtn: { borderRadius: 14, overflow: 'hidden', marginTop: 20 },
  reportBtnGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14 },
  reportBtnText: { fontSize: 15, fontFamily: typography.fonts.headingBold, color: '#001424' },

  latestSessionMini: { backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 12, padding: 12, marginTop: 4 },
  miniHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  miniExName: { fontSize: 14, fontFamily: typography.fonts.headingBold, color: '#FFFFFF' },
  miniGradeBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  miniGradeText: { color: '#FFFFFF', fontSize: 10, fontFamily: typography.fonts.headingBold },
  miniGrid: { flexDirection: 'row', justifyContent: 'space-between' },
  miniItem: { alignItems: 'flex-start' },
  miniLabel: { fontSize: 8, color: 'rgba(255,255,255,0.3)', marginBottom: 2, letterSpacing: 0.5 },
  miniVal: { fontSize: 14, fontFamily: typography.fonts.headingBold, color: '#FFFFFF' }
});

const getGradeColor = (grade: string) => {
  if (grade === 'A') return '#10B981';
  if (grade === 'B') return '#3B82F6';
  if (grade === 'C') return '#FBBF24';
  return '#EF4444';
};
