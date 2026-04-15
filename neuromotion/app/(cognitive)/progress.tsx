// NeuroMotion AI — Cognitive Analysis & Clinical Reporting
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Dimensions,
  Pressable, ActivityIndicator, RefreshControl, Share, Modal, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Rect, Text as SvgText, Line, Circle, Path, Defs, LinearGradient as SvgGrad, Stop } from 'react-native-svg';
import { colors, typography, spacing, borderRadius } from '../../src/theme';
import GlassCard from '../../src/components/ui/GlassCard';
import { MiniLineChart } from '../../src/components/charts/Charts';
import { useCognitive } from '../../src/contexts/CognitiveContext';
import { useApp } from '../../src/contexts/AppContext';
import { getGeminiInsights, GeminiRecommendation } from '../../src/services/geminiService';
import { doc, getDoc } from 'firebase/firestore';
import { db, auth } from '../../src/services/firebase';

const { width: SW } = Dimensions.get('window');
const CHART_W = SW - 48;

function avg(arr: number[]) {
  if (arr.length === 0) return 0;
  return Math.round(arr.reduce((a, b) => a + b, 0) / arr.length);
}

function getGrade(v: number) {
  if (v >= 85) return { label: 'Optimal', color: '#10B981', desc: 'Sustained neurological resilience.' };
  if (v >= 70) return { label: 'Functional', color: '#3B82F6', desc: 'Strong cognitive recovery curve.' };
  if (v >= 50) return { label: 'Compensating', color: '#F59E0B', desc: 'Consistency is increasing.' };
  return { label: 'Rehabilitating', color: '#EF4444', desc: 'Focus on base pattern stability.' };
}

const GAME_META: Record<string, { icon: string; accent: string; label: string; desc: string }> = {
  memory:    { icon: 'layers-outline', accent: '#FF6F91', label: 'Memory Card', desc: 'Measures neural pattern encoding and short-term recall stability.' },
  reaction:  { icon: 'flash-outline', accent: '#00D09E', label: 'Quick Reaction', desc: 'Tracks synaptic response latency and reflexive motor-cognitive speed.' },
  attention: { icon: 'eye-outline', accent: '#3B82F6', label: 'Attention Focus', desc: 'Evaluates sustained focus duration and inhibitory control precision.' },
};

export default function CognitiveAnalysis() {
  const insets = useSafeAreaInsets();
  const { state, dispatch } = useCognitive();
  const { state: appState } = useApp();
  const { currentScore: score, sessions, hasHydrated } = state;

  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [reportVisible, setReportVisible] = useState(false);
  const [reportText, setReportText] = useState('');

  const onRefresh = useCallback(async () => {
    if (!auth.currentUser) return;
    setRefreshing(true);
    try {
      const snap = await getDoc(doc(db, 'users', auth.currentUser.uid, 'moduleData', 'cognitive'));
      if (snap.exists()) dispatch({ type: 'HYDRATE_FROM_DB', payload: snap.data() });
    } catch (e) {
      console.error('Refresh failed', e);
    } finally {
      setRefreshing(false);
    }
  }, [dispatch]);

  const aiData = useMemo(() => state.aiRecommendation, [state.aiRecommendation]);

  useEffect(() => {
    if (!hasHydrated || sessions.length === 0) return;
    let cancelled = false;
    (async () => {
      try {
        const result = await getGeminiInsights(score, sessions);
        if (!cancelled && result) {
          dispatch({ type: 'SET_AI_RECOMMENDATION', payload: result });
        }
      } catch (e) {
        console.warn('Groq fetch skipped due to error');
      }
    })();
    return () => { cancelled = true; };
  }, [sessions.length, hasHydrated]);

  const gameStats = useMemo(() => {
    const types = ['memory', 'reaction', 'attention'] as const;
    return types.map(t => {
      const rows = sessions.filter(s => s.gameType === t);
      return {
        type: t,
        count: rows.length,
        avgScore: avg(rows.map(r => r.score)),
        avgAccuracy: avg(rows.map(r => r.accuracy)),
        avgTime: avg(rows.map(r => r.responseTime)),
        best: rows.length > 0 ? Math.max(...rows.map(r => r.score)) : 0,
        recent: rows.slice(0, 6).reverse(),
      };
    });
  }, [sessions]);

  const activeDays = useMemo(
    () => new Set(sessions.map(s => s.localDate || s.timestamp?.split('T')[0])).size,
    [sessions],
  );

  if (!hasHydrated) {
    return (
      <View style={[s.root, s.center, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color="#8E24AA" />
      </View>
    );
  }

  const grade = getGrade(score.overall);

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <ScrollView
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#8E24AA" />}
      >
        {/* Header and Index Card remain high-contrast purple... */}
        <Animated.View entering={FadeInDown.duration(600)} style={s.header}>
          <View>
             <View style={s.badgeLabel}><Text style={s.badgeLabelText}>Neuro-Diagnostic AI</Text></View>
             <Text style={s.title}>Cognitive Profile</Text>
             <Text style={s.subtitle}>Comprehensive clinical performance analysis</Text>
          </View>
          <Pressable onPress={() => router.replace('/(cognitive)/dashboard')} style={s.closeIcon}>
             <Ionicons name="apps-outline" size={24} color={colors.textSecondary} />
          </Pressable>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(100).duration(600)}>
          <GlassCard variant="cognitive" style={[s.overallCard, { backgroundColor: '#F3E5F5' }]}>
             <View style={s.overallRow}>
                <View style={{ flex: 1 }}>
                   <Text style={[s.indexLabel, { color: '#8E24AA' }]}>Cognitive Stability Index</Text>
                   <Text style={[s.indexValue, { color: '#6A1B9A' }]}>{score.overall}<Text style={{fontSize: 20}}> %</Text></Text>
                   <View style={[s.statusLine, { backgroundColor: grade.color }]} />
                   <Text style={[s.indexDesc, { color: '#4A5568' }]}>{grade.desc}</Text>
                </View>
                <View style={[s.indexCircle, { backgroundColor: '#8E24AA' }]}>
                   <Ionicons name="analytics" size={32} color="#FFFFFF" />
                </View>
             </View>
             <View style={[s.statGrid, { backgroundColor: 'rgba(142, 36, 170, 0.1)' }]}>
                <View style={s.statItem}><Text style={[s.statVal, { color: '#8E24AA' }]}>{sessions.length}</Text><Text style={[s.statLbl, { color: 'rgba(142, 36, 170, 0.6)' }]}>Trials</Text></View>
                <View style={[s.dividerV, { backgroundColor: 'rgba(142, 36, 170, 0.1)' }]} />
                <View style={s.statItem}><Text style={[s.statVal, { color: '#8E24AA' }]}>{activeDays}</Text><Text style={[s.statLbl, { color: 'rgba(142, 36, 170, 0.6)' }]}>Days Active</Text></View>
                <View style={[s.dividerV, { backgroundColor: 'rgba(142, 36, 170, 0.1)' }]} />
                <View style={s.statItem}><Text style={[s.statVal, { color: '#8E24AA' }]}>{score.overall}</Text><Text style={[s.statLbl, { color: 'rgba(142, 36, 170, 0.6)' }]}>Baseline</Text></View>
             </View>
          </GlassCard>
        </Animated.View>

        {/* Game Detail Cards */}
        {gameStats.map((gs, idx) => {
          const meta = GAME_META[gs.type];
          const g = getGrade(gs.avgScore);
          return (
            <Animated.View key={gs.type} entering={FadeInRight.delay(idx * 150 + 200).duration(600)}>
              <GlassCard style={s.detailCard}>
                 <View style={s.detailHeader}>
                    <View style={[s.iconBox, { backgroundColor: meta.accent + '10' }]}>
                       <Ionicons name={meta.icon as any} size={22} color={meta.accent} />
                    </View>
                    <View style={{ flex: 1 }}>
                       <Text style={s.detailName}>{meta.label}</Text>
                       <Text style={s.detailSummary}>{meta.desc}</Text>
                    </View>
                 </View>
                 <View style={s.metricStrip}>
                    <View style={s.metItem}><Text style={s.metVal}>{gs.avgScore}%</Text><Text style={s.metLbl}>Accuracy</Text></View>
                    <View style={s.metItem}><Text style={s.metVal}>{gs.avgTime}ms</Text><Text style={s.metLbl}>Latency</Text></View>
                    <View style={s.metItem}><Text style={s.metVal}>{gs.best}%</Text><Text style={s.metLbl}>Peak</Text></View>
                 </View>
                 
                 {gs.recent.length > 0 && (
                   <View style={{ marginTop: 16 }}>
                     <MiniLineChart 
                       data={gs.recent.slice().reverse().map((r: any, i: number) => ({ label: `S${i+1}`, value: r.score }))} 
                       height={100}
                       width={CHART_W - 40}
                       color={meta.accent}
                       showArea={true}
                     />
                   </View>
                 )}
              </GlassCard>
            </Animated.View>
          );
        })}

        {/* AI Insight Section */}
        {aiData && (
          <Animated.View entering={FadeInDown.delay(700).duration(600)}>
             <Text style={s.sectionTitle}>Clinical Insights (AI)</Text>
             <LinearGradient colors={['rgba(142,36,170,0.06)', 'transparent']} style={s.aiGuidanceCard}>
                <View style={s.aiTitleRow}>
                   <Ionicons name="infinite-outline" size={20} color="#8E24AA" />
                   <Text style={s.aiGoalTxt}>{aiData.goal}</Text>
                </View>
                <View style={s.insightStack}>
                   {Object.entries(aiData.insights)
                    .filter(([k]) => ['memory', 'reaction', 'attention'].includes(k))
                    .map(([key, val], i) => (
                      <View key={i} style={s.insightRow}>
                         <Ionicons name={GAME_META[key]?.icon as any} size={16} color={GAME_META[key]?.accent || colors.primary} />
                         <Text style={s.insightTxt}>{val as string}</Text>
                      </View>
                   ))}
                </View>
             </LinearGradient>
          </Animated.View>
        )}

        <View style={s.exportSection}>
           <Pressable style={s.primaryReportBtn} onPress={() => {
              const user = appState.user;
              const line = '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
              let txt = `🧠 NEUROMOTION AI — CLINICAL ANALYSIS REPORT\n${line}\nPatient Profile: ${user?.name || 'Local User'}\nOverall Stability: ${score.overall}%\n\n`;
              txt += `3 CORE PILLARS PERFORMANCE:\n`;
              gameStats.forEach(g => { txt += `- ${GAME_META[g.type].label}: ${g.avgScore}%\n`; });
              txt += `\nAI RECOMMENDATION:\n${aiData?.suggestions.how || 'Maintain 3x daily sessions.'}\n\n`;
              txt += `⚕️ Analysis provided via NeuroMotion local engine.\n`;
              setReportText(txt);
              setReportVisible(true);
           }}>
              <LinearGradient colors={['#8E24AA', '#6A1B9A']} style={s.reportBtnInner}>
                 <Ionicons name="document-attach-outline" size={20} color="white" />
                 <Text style={s.reportBtnText}>Generate Detailed Neural Report</Text>
              </LinearGradient>
           </Pressable>
        </View>

      </ScrollView>

      {/* Modal remains same... */}
      <Modal visible={reportVisible} animationType="slide">
         <View style={[s.modalRoot, { paddingTop: insets.top + 20 }]}>
            <View style={s.modalHeader}>
               <Text style={s.modalTitle}>Progress Analysis</Text>
               <Pressable onPress={() => setReportVisible(false)}><Ionicons name="close-circle" size={32} color="#CBD5E1" /></Pressable>
            </View>
            <ScrollView style={s.modalBody} showsVerticalScrollIndicator={false}><Text style={s.modalTxt}>{reportText}</Text></ScrollView>
            <View style={s.modalFooter}>
               <Pressable style={s.shareBtn} onPress={() => Share.share({ message: reportText })}>
                  <Ionicons name="cloud-upload-outline" size={18} color="white" />
                  <Text style={s.shareBtnText}>Export Clinical Data</Text>
               </Pressable>
            </View>
         </View>
      </Modal>
    </View>
  );
}

// Removed PerformanceBarChart completely
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FFFFFF' },
  center: { justifyContent: 'center', alignItems: 'center' },
  scroll: { padding: 24, paddingBottom: 100, gap: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  badgeLabel: { backgroundColor: 'rgba(142,36,170,0.1)', alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, marginBottom: 8 },
  badgeLabelText: { color: '#8E24AA', fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  title: { fontSize: 28, fontFamily: typography.fonts.headingBold, color: '#0F172A' },
  subtitle: { fontSize: 13, color: '#64748B', fontWeight: '500' },
  closeIcon: { padding: 8, backgroundColor: '#F8FAFC', borderRadius: 12 },
  overallCard: { padding: 24, borderRadius: 32, overflow: 'hidden' },
  overallRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  indexLabel: { fontSize: 14, fontWeight: '600' },
  indexValue: { fontSize: 52, fontWeight: '900', marginVertical: 4 },
  statusLine: { width: 40, height: 4, borderRadius: 2, marginBottom: 8 },
  indexDesc: { fontSize: 13, fontWeight: '500' },
  indexCircle: { width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
  statGrid: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 20 },
  statItem: { flex: 1, alignItems: 'center' },
  statVal: { fontSize: 18, fontWeight: '800' },
  statLbl: { fontSize: 10, fontWeight: '600', textTransform: 'uppercase', marginTop: 2 },
  dividerV: { width: 1, height: 20 },
  sectionTitle: { fontSize: 17, fontWeight: '800', color: '#0F172A', marginTop: 12, marginBottom: 4 },
  detailCard: { padding: 20, borderRadius: 24, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#F1F5F9' },
  detailHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 14, marginBottom: 20 },
  iconBox: { width: 42, height: 42, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  detailName: { fontSize: 17, fontWeight: '700', color: '#1E293B' },
  detailSummary: { fontSize: 12, color: '#64748B', lineHeight: 18, marginTop: 2 },
  metricStrip: { flexDirection: 'row', gap: 12, backgroundColor: '#F8FAFC', padding: 14, borderRadius: 16 },
  metItem: { flex: 1, alignItems: 'center' },
  metVal: { fontSize: 16, fontWeight: '800', color: '#0F172A' },
  metLbl: { fontSize: 10, color: '#94A3B8', fontWeight: '700', textTransform: 'uppercase', marginTop: 2 },
  aiGuidanceCard: { padding: 24, borderRadius: 32, borderWidth: 1, borderColor: '#F1F5F9' },
  aiTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 20 },
  aiGoalTxt: { fontSize: 15, fontWeight: '700', color: '#1E293B', fontStyle: 'italic' },
  insightStack: { gap: 12 },
  insightRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#F8FAFC', padding: 12, borderRadius: 14 },
  insightTxt: { flex: 1, fontSize: 13, color: '#475569', lineHeight: 18, fontWeight: '500' },
  exportSection: { marginTop: 20 },
  primaryReportBtn: { borderRadius: 24, overflow: 'hidden' },
  reportBtnInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, paddingVertical: 20 },
  reportBtnText: { fontSize: 16, fontWeight: '800', color: 'white' },
  modalRoot: { flex: 1, backgroundColor: '#FFFFFF', paddingHorizontal: 24 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 24, fontWeight: '900', color: '#0F172A' },
  modalBody: { flex: 1, backgroundColor: '#F8FAFC', borderRadius: 24, padding: 20 },
  modalTxt: { fontSize: 13, fontFamily: 'monospace', color: '#334155', lineHeight: 20 },
  modalFooter: { paddingVertical: 24 },
  shareBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: '#8E24AA', paddingVertical: 18, borderRadius: 24 },
  shareBtnText: { fontSize: 16, fontWeight: '800', color: 'white' },
});
