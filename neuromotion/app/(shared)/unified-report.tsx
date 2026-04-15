// NeuroMotion AI — Unified Report Screen
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, typography, spacing, borderRadius } from '../../src/theme';
import GlassCard from '../../src/components/ui/GlassCard';
import GradientButton from '../../src/components/ui/GradientButton';
import ProgressBar from '../../src/components/ui/ProgressBar';
import ScoreRing from '../../src/components/ui/ScoreRing';
import Header from '../../src/components/shared/Header';
import { MiniLineChart } from '../../src/components/charts/Charts';
import { useApp } from '../../src/contexts/AppContext';
import { useCognitive } from '../../src/contexts/CognitiveContext';
import { calculateUnifiedScore, AI_DISCLAIMER, generateCognitiveFeedback, generateKinematicClinicalInsights } from '../../src/services/feedbackEngine';
import { getScoreColor, getScoreLabel, formatDate } from '../../src/utils/formatting';
import { getPhysicalSessions, StoredPhysicalSession } from '../../src/services/dbService';

export default function UnifiedReport() {
  const insets = useSafeAreaInsets();
  const { state: app } = useApp();
  const { state: cognitive } = useCognitive();
  const user = app.user;
  
  const [dbSections, setDbSections] = useState<StoredPhysicalSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPhysicalSessions().then(s => {
      setDbSections(s);
      setLoading(false);
    });
  }, []);

  if (!user || loading) return <View style={[styles.container, {justifyContent:'center', alignItems:'center'}]}><ActivityIndicator color={colors.primary} size="large" /></View>;

  const hasPhysical = user.rehabGoal === 'physical';
  const hasCognitive = user.rehabGoal === 'cognitive';

  // Calculate actual physical scores from cloud
  let romTot = 0, formsTot = 0, consTot = 0;
  dbSections.forEach(s => {
    if (s.scoreResult) {
      romTot += s.scoreResult.romScore || 0;
      formsTot += s.scoreResult.accuracy || 0;
      consTot += s.scoreResult.consistency || 0;
    }
  });
  const c = dbSections.length;
  const physCurrentScore = c > 0 ? {
    overall: Math.round((romTot + formsTot) / (c * 2)),
    accuracy: Math.round(formsTot / c),
    stability: Math.round(consTot / c),
    rangeOfMotion: Math.round(romTot / c),
    sessionsCompleted: c
  } : { overall: 0, accuracy: 0, stability: 0, rangeOfMotion: 0, sessionsCompleted: 0 };

  const physScore = hasPhysical ? (physCurrentScore.overall || 0) : null;
  const cogScore = hasCognitive ? (cognitive.currentScore?.overall || 0) : null;
  const unified = calculateUnifiedScore(physScore, cogScore);

  const physTrend = dbSections.slice(-5).map((s, i) => ({ label: `S${i+1}`, value: s.scoreResult?.finalScore || 0 }));
  const cogTrend = cognitive.sessions?.slice(0, 5).reverse().map((s, i) => ({ label: `S${i+1}`, value: s.score })) || [];

  const physFeedback = generateKinematicClinicalInsights(dbSections);
  const cogFeedback = generateCognitiveFeedback(cognitive.sessions || []);

  const shareReport = () => {
    Alert.alert('Share Report', `Report shared with connected providers.`);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Header title="Recovery Report" subtitle={`Generated ${formatDate(new Date().toISOString())}`} showBack />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Unified Score Hero */}
        <Animated.View entering={FadeInDown.duration(500)}>
          <LinearGradient colors={['rgba(108,99,255,0.2)', 'rgba(108,99,255,0.05)']} style={styles.heroCard}>
            <View style={styles.heroRow}>
              <View>
                <Text style={styles.heroLabel}>Unified Recovery Score</Text>
                <Text style={styles.heroSub}>AI-Assisted Performance Analysis</Text>
              </View>
              <ScoreRing score={unified} size={120} color={colors.primary} />
            </View>
            <View style={styles.pillRow}>
              {hasPhysical && (
                <View style={[styles.pill, { borderColor: 'rgba(0,217,166,0.3)' }]}>
                  <Text style={styles.pillIcon}>💪</Text>
                  <Text style={[styles.pillScore, { color: colors.physical }]}>{physScore}</Text>
                  <Text style={styles.pillLabel}>Physical</Text>
                </View>
              )}
              {hasCognitive && (
                <View style={[styles.pill, { borderColor: 'rgba(255,107,157,0.3)' }]}>
                  <Text style={styles.pillIcon}>🧠</Text>
                  <Text style={[styles.pillScore, { color: colors.cognitive }]}>{cogScore}</Text>
                  <Text style={styles.pillLabel}>Cognitive</Text>
                </View>
              )}
              <View style={[styles.pill, { borderColor: 'rgba(108,99,255,0.3)' }]}>
                <Text style={styles.pillIcon}>⚡</Text>
                <Text style={[styles.pillScore, { color: colors.primary }]}>{unified}</Text>
                <Text style={styles.pillLabel}>Unified</Text>
              </View>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Physical Summary */}
        {hasPhysical && (
          <Animated.View entering={FadeInDown.delay(100).duration(500)}>
            <GlassCard variant="physical">
              <Text style={styles.sectionTitle}>💪 Physical Rehabilitation</Text>
              <View style={styles.metricGroup}>
                <ProgressBar value={physCurrentScore.accuracy} label="Accuracy" color={colors.physical} />
                <View style={{height:spacing.sm}}/>
                <ProgressBar value={physCurrentScore.stability} label="Stability" color={colors.info} />
                <View style={{height:spacing.sm}}/>
                <ProgressBar value={physCurrentScore.rangeOfMotion} label="Range of Motion" color={colors.warning} />
              </View>
              {physTrend.length > 1 && (
                <>
                  <Text style={styles.chartLabel}>Score Trend</Text>
                  <MiniLineChart data={physTrend} color={colors.physical} height={120} />
                </>
              )}
              <Text style={styles.sessionCount}>📋 {physCurrentScore.sessionsCompleted} sessions completed</Text>
            </GlassCard>
          </Animated.View>
        )}

        {/* Cognitive Summary */}
        {hasCognitive && (
          <Animated.View entering={FadeInDown.delay(200).duration(500)}>
            <GlassCard variant="cognitive">
              <Text style={styles.sectionTitle}>🧠 Cognitive Training</Text>
              <View style={styles.metricGroup}>
                <ProgressBar value={cognitive.currentScore.memoryAccuracy} label="Memory Accuracy" color={colors.cognitive} />
                <View style={{height:spacing.sm}}/>
                <ProgressBar value={cognitive.currentScore.reactionSpeed} label="Quick Reaction" color={colors.info} />
                <View style={{height:spacing.sm}}/>
                <ProgressBar value={cognitive.currentScore.consistency} label="Consistency" color={colors.primary} />
              </View>
              {cogTrend.length > 1 && (
                <>
                  <Text style={styles.chartLabel}>Score Trend</Text>
                  <MiniLineChart data={cogTrend} color={colors.cognitive} height={120} />
                </>
              )}
              <Text style={styles.sessionCount}>📋 {cognitive.currentScore.sessionsCompleted} sessions completed</Text>
            </GlassCard>
          </Animated.View>
        )}

        {/* Combined AI Insights */}
        <Animated.View entering={FadeInDown.delay(300).duration(500)}>
          <GlassCard>
            <Text style={styles.sectionTitle}>🤖 AI Insights & Recommendations</Text>
            {[...physFeedback.slice(0, 2), ...cogFeedback.slice(0, 2)].map((f, i) => (
              <View key={i} style={styles.fbRow}>
                <Text style={styles.fbIcon}>{f.type === 'positive' ? '✅' : f.type === 'warning' ? '⚠️' : '💡'}</Text>
                <Text style={styles.fbText}>{f.message}</Text>
              </View>
            ))}
            <View style={styles.disclaimerBox}>
              <Text style={styles.disclaimerText}>{AI_DISCLAIMER}</Text>
            </View>
          </GlassCard>
        </Animated.View>

        {/* Patient Info for doctor */}
        <Animated.View entering={FadeInDown.delay(350).duration(500)}>
          <GlassCard>
            <Text style={styles.sectionTitle}>Patient Summary</Text>
            <View style={styles.patientRow}><Text style={styles.patientLabel}>Name</Text><Text style={styles.patientVal}>{user.name}</Text></View>
            <View style={styles.patientRow}><Text style={styles.patientLabel}>Report Date</Text><Text style={styles.patientVal}>{formatDate(new Date().toISOString())}</Text></View>
            <View style={styles.patientRow}><Text style={styles.patientLabel}>Overall Status</Text><Text style={[styles.patientVal, { color: getScoreColor(unified) }]}>{getScoreLabel(unified)}</Text></View>
          </GlassCard>
        </Animated.View>

        {/* Actions */}
        <Animated.View entering={FadeInDown.delay(400).duration(500)} style={styles.actions}>
          <GradientButton title="🏥  Share with Doctor" onPress={shareReport} variant="primary" fullWidth />
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgPrimary },
  scroll: { padding: spacing.xl, paddingBottom: 100, gap: spacing.lg },
  heroCard: { borderRadius: borderRadius.xl, borderWidth: 1, borderColor: 'rgba(108,99,255,0.2)', padding: spacing.xl },
  heroRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg },
  heroLabel: { fontSize: typography.sizes.h4, fontFamily: typography.fonts.heading, fontWeight: '600', color: colors.textPrimary },
  heroSub: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  pillRow: { flexDirection: 'row', gap: spacing.md, justifyContent: 'center' },
  pill: { flex: 1, alignItems: 'center', borderWidth: 1, borderRadius: borderRadius.lg, paddingVertical: spacing.md, gap: 2 },
  pillIcon: { fontSize: 18 },
  pillScore: { fontSize: 22, fontFamily: typography.fonts.headingBold, fontWeight: '700' },
  pillLabel: { fontSize: 10, color: colors.textMuted },
  sectionTitle: { fontSize: 15, fontFamily: typography.fonts.bodySemiBold, fontWeight: '600', color: colors.textPrimary, marginBottom: spacing.lg },
  metricGroup: { marginBottom: spacing.md },
  chartLabel: { fontSize: 12, color: colors.textMuted, marginTop: spacing.md, marginBottom: spacing.xs },
  sessionCount: { fontSize: 12, color: colors.textMuted, marginTop: spacing.md },
  fbRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  fbIcon: { fontSize: 15, marginTop: 2 },
  fbText: { flex: 1, fontSize: 13, color: colors.textSecondary, lineHeight: 19 },
  disclaimerBox: { backgroundColor: 'rgba(251,191,36,0.08)', borderRadius: borderRadius.md, padding: spacing.md, marginTop: spacing.md, borderWidth: 1, borderColor: 'rgba(251,191,36,0.2)' },
  disclaimerText: { fontSize: 11, color: colors.warning, lineHeight: 16 },
  patientRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.divider },
  patientLabel: { fontSize: 13, color: colors.textMuted },
  patientVal: { fontSize: 13, color: colors.textPrimary, fontFamily: typography.fonts.bodyMedium, fontWeight: '500' },
  actions: { gap: spacing.md },
});
