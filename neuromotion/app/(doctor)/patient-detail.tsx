// NeuroMotion AI — Patient Detail (Doctor)
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, Alert, ActivityIndicator, Modal, Pressable, Share } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams } from 'expo-router';
import { doc, getDoc, collection, query, getDocs } from 'firebase/firestore';
import { db, auth } from '../../src/services/firebase';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius } from '../../src/theme';
import GlassCard from '../../src/components/ui/GlassCard';
import GradientButton from '../../src/components/ui/GradientButton';
import ScoreRing from '../../src/components/ui/ScoreRing';
import Header from '../../src/components/shared/Header';
import { MiniLineChart } from '../../src/components/charts/Charts';
import { getGeminiInsights } from '../../src/services/geminiService';
import { generateKinematicClinicalInsights } from '../../src/services/feedbackEngine';

const GAME_META: Record<string, { icon: string; label: string; game: string }> = {
  memory:    { icon: '🃏', label: 'Memory Card', game: 'Card Match' },
  reaction:  { icon: '⚡', label: 'Quick Reaction', game: 'Reaction Test' },
  attention: { icon: '🎯', label: 'Attention Stability', game: 'Focus Challenge' },
};

function avg(arr: number[]) {
  if (arr.length === 0) return 0;
  return Math.round(arr.reduce((a, b) => a + b, 0) / arr.length);
}

function getGrade(v: number) {
  if (v >= 85) return { label: 'Excellent', color: '#10B981' };
  if (v >= 70) return { label: 'Good', color: '#3B82F6' };
  if (v >= 50) return { label: 'Fair', color: '#F59E0B' };
  return { label: 'Needs Work', color: '#EF4444' };
}

export default function PatientDetail() {
  const insets = useSafeAreaInsets();
  const { patientId } = useLocalSearchParams<{ patientId: string }>();
  const [loading, setLoading] = useState(true);
  const [patient, setPatient] = useState<any>(null);
  const [aiLoading, setAiLoading] = useState(false);
  
  const [reportVisible, setReportVisible] = useState(false);
  const [reportText, setReportText] = useState('');

  useEffect(() => {
    if (!patientId) return;
    
    // Aggressively clear stale context on route switch 
    setLoading(true);
    setPatient(null);
    setAiLoading(false);

    const fetchFullData = async () => {
      try {
        const uDoc = await getDoc(doc(db, 'users', patientId));
        const userData = uDoc.exists() ? uDoc.data() : { name: 'Unknown', rehabGoal: 'unknown' };
        
        let modData: any = { sessions: [], currentScore: { overall: 0 } };
        let aiRecommendation = null;

        if (userData.rehabGoal === 'cognitive') {
          const mDoc = await getDoc(doc(db, 'users', patientId, 'moduleData', 'cognitive'));
          modData = mDoc.exists() ? mDoc.data() : { sessions: [], currentScore: { overall: 0 } };
          aiRecommendation = modData.aiRecommendation;
        } else if (userData.rehabGoal === 'physical') {
          const physQ = query(collection(db, 'users', patientId, 'physicalSessions'));
          const physSnap = await getDocs(physQ);
          const sessions: any[] = [];
          physSnap.forEach(snap => sessions.push(snap.data()));
          
          let romTot = 0, formTot = 0, consTot = 0;
          sessions.forEach(s => {
            if (s.scoreResult) {
              romTot += s.scoreResult.romScore || 0;
              formTot += s.scoreResult.accuracy || 0;
              consTot += s.scoreResult.consistency || 0;
            }
          });
          const c = sessions.length;
          const currentScore = c > 0 ? {
            overall: Math.round((romTot + formTot) / (c * 2)),
            rom: Math.round(romTot / c),
            form: Math.round(formTot / c),
            consistency: Math.round(consTot / c)
          } : { overall: 0, rom: 0, form: 0, consistency: 0 };
          
          modData = { sessions, currentScore };
        }
        
        setPatient({
          ...userData,
          score: userData.score?.[userData.rehabGoal as string] || modData.currentScore?.overall || 0,
          moduleData: modData,
        });

        // Trigger AI background fetch for cognitive (if not already cached)
        if (userData.rehabGoal === 'cognitive' && !aiRecommendation && modData.sessions && modData.sessions.length > 0) {
          setAiLoading(true);
          getGeminiInsights(modData.currentScore, modData.sessions)
            .then(ai => {
              setPatient((prev: any) => ({
                ...prev,
                moduleData: { ...prev.moduleData, aiRecommendation: ai }
              }));
            })
            .catch(console.error)
            .finally(() => setAiLoading(false));
        }

      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchFullData();
  }, [patientId]);

  if (loading || !patient) {
    return (
      <View style={[styles.container, styles.center, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const { overall = 0, memoryAccuracy = 0, attentionScore = 0, reactionSpeed = 0, functionalScore = 0 } = patient.moduleData?.currentScore || {};
  const sessions = patient.moduleData?.sessions || [];
  const activeDays = new Set(sessions.map((s:any) => s.localDate || s.timestamp?.split('T')[0])).size;
  const grade = getGrade(overall);
  const aiData = patient.moduleData?.aiRecommendation;

  // Process game stats dynamically to match Patient Portal exact calculations
  const types = ['memory', 'reaction', 'attention'];
  const gameStats = types.map(t => {
    const rows = sessions.filter((s:any) => s.gameType === t);
    return {
      type: t,
      count: rows.length,
      avgScore: avg(rows.map((r:any) => r.score)),
      best: rows.length > 0 ? Math.max(...rows.map((r:any) => r.score)) : 0,
    };
  });

  const getSuggScore = (id: string) => gameStats.find(g => g.type === id)?.avgScore || 0;

  const handleGenerateReport = () => {
    const now = new Date().toLocaleString();
    const line = '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
    let txt = `🧠 NEUROMOTION AI — CLINICAL PATIENT REPORT\n${line}\nGenerated: ${now}\n\n`;

    txt += `📋 PATIENT INFORMATION\n${line}\n`;
    txt += `Name: ${patient.name || '—'}\n`;
    txt += `Email: ${patient.email || '—'}\n`;
    txt += `Date of Birth: ${patient.dateOfBirth || '—'}\n\n`;

    txt += `📊 OVERALL COGNITIVE: ${overall}% (${grade.label})\n`;
    txt += `Sessions: ${sessions.length} | Active Days: ${activeDays}\n\n`;

    txt += `🎮 TEST AVERAGES\n${line}\n`;
    gameStats.forEach(g => {
      const meta = GAME_META[g.type];
      txt += `${meta.icon} ${meta.label}: ${g.avgScore}% (Best: ${g.best}%)\n`;
    });

    txt += `\n🤖 AI CLINICAL INSIGHTS\n${line}\n`;
    if (aiData) {
      txt += `Goal: ${aiData.goal}\n\n`;
      if (aiData.insights) {
        Object.entries(aiData.insights).forEach(([k, v]) => {
          const m = GAME_META[k];
          if (m) txt += `${m.icon} ${m.label}: ${v}\n`;
        });
      }
      if (aiData.suggestions) {
        txt += `\n💡 Clinical Rec: ${aiData.suggestions.how}\n`;
        txt += `   Reason: ${aiData.suggestions.why}\n`;
      }
    } else {
      txt += `Insufficient data.\n`;
    }

    txt += `\n${line}\n⚕️ Generated by NeuroMotion AI for clinical review.\n`;

    setReportText(txt);
    setReportVisible(true);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Header title={patient.name} subtitle="Patient Analysis" showBack />
      
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Hero Section */}
        <Animated.View entering={FadeInDown.duration(500)}>
          <View style={styles.heroCard}>
            <View style={styles.heroTop}>
              <LinearGradient colors={[colors.primary, colors.primaryDark]} style={styles.avatar}>
                <Text style={styles.avatarText}>{(patient.name || 'U').charAt(0).toUpperCase()}</Text>
              </LinearGradient>
              <View style={styles.heroInfo}>
                <Text style={styles.heroName} numberOfLines={1}>{patient.name || 'Unknown Patient'}</Text>
                <Text style={styles.heroMeta}>{sessions.length} sessions · {activeDays} active days</Text>
              </View>
              {sessions.length > 0 ? (
                <ScoreRing score={overall} size={70} color={colors.primary} label="Overall" />
              ) : (
                <View style={styles.noDataRing}>
                  <Text style={styles.noDataText}>NO DATA</Text>
                </View>
              )}
            </View>

            <View style={styles.heroDivider} />

            <View style={styles.heroBottom}>
              <View style={styles.profileMetaItem}>
                <Ionicons name="mail" size={14} color={colors.textSecondary} />
                <Text style={styles.profileMetaTxt} numberOfLines={1}>{patient.email || 'No email'}</Text>
              </View>
              <View style={styles.profileMetaItem}>
                <Ionicons name="calendar" size={14} color={colors.textSecondary} />
                <Text style={styles.profileMetaTxt}>DOB: {patient.dateOfBirth || 'Unknown'}</Text>
              </View>
              {patient.createdAt && (
                <View style={[styles.profileMetaItem, { borderRightWidth: 0 }]}>
                  <Ionicons name="time" size={14} color={colors.textSecondary} />
                  <Text style={styles.profileMetaTxt}>Joined: {patient.createdAt.split('T')[0]}</Text>
                </View>
              )}
            </View>
          </View>
        </Animated.View>

        {/* Cognitive Trend */}
        {sessions.length > 0 && (
          <Animated.View entering={FadeInDown.delay(50).duration(500)}>
            <View style={styles.standardCard}>
              <Text style={styles.sectionTitle}>Cognitive Trend (Recent)</Text>
              <MiniLineChart 
                data={sessions.slice(-10).map((s:any, i:number) => ({ label: `S${i+1}`, value: s.score }))} 
                color={colors.primary} 
                height={120} 
              />
            </View>
          </Animated.View>
        )}

        {/* Domains Grid */}
        <Animated.View entering={FadeInDown.delay(100).duration(500)}>
          <Text style={styles.sectionTitle}>{patient.rehabGoal === 'physical' ? 'Kinematic Domains' : 'Cognitive Domains'}</Text>
          
          {patient.rehabGoal === 'physical' ? (
             <View style={styles.gridRow}>
               <View style={styles.gridCard}>
                 <View style={styles.gridHeader}>
                   <Text style={styles.gridIcon}>🏋️</Text>
                   <View style={styles.gridTextWrap}>
                     <Text style={styles.gridLbl} numberOfLines={1}>Joint ROM</Text>
                     <Text style={styles.gridSubLbl} numberOfLines={1}>Flexion Score</Text>
                   </View>
                 </View>
                 <Text style={[styles.gridVal, { color: sessions.length > 0 ? getGrade(patient.moduleData.currentScore?.rom).color : colors.textMuted }]}>
                   {sessions.length > 0 ? `${patient.moduleData.currentScore?.rom}%` : '--'}
                 </Text>
               </View>

               <View style={styles.gridCard}>
                 <View style={styles.gridHeader}>
                   <Text style={styles.gridIcon}>🎯</Text>
                   <View style={styles.gridTextWrap}>
                     <Text style={styles.gridLbl} numberOfLines={1}>Form Accuracy</Text>
                     <Text style={styles.gridSubLbl} numberOfLines={1}>Pose Alignment</Text>
                   </View>
                 </View>
                 <Text style={[styles.gridVal, { color: sessions.length > 0 ? getGrade(patient.moduleData.currentScore?.form).color : colors.textMuted }]}>
                   {sessions.length > 0 ? `${patient.moduleData.currentScore?.form}%` : '--'}
                 </Text>
               </View>
             </View>
          ) : (
            <>
              <View style={styles.gridRow}>
                {[
                  { id: 'memory', val: getSuggScore('memory') },
                  { id: 'attention', val: getSuggScore('attention') }
                ].map(d => (
                  <View key={d.id} style={styles.gridCard}>
                    <View style={styles.gridHeader}>
                      <Text style={styles.gridIcon}>{GAME_META[d.id].icon}</Text>
                      <View style={styles.gridTextWrap}>
                        <Text style={styles.gridLbl} numberOfLines={1}>{GAME_META[d.id].label}</Text>
                        <Text style={styles.gridSubLbl} numberOfLines={1}>{GAME_META[d.id].game}</Text>
                      </View>
                    </View>
                    <Text style={[styles.gridVal, { color: sessions.length > 0 ? getGrade(d.val).color : colors.textMuted }]}>
                      {sessions.length > 0 ? `${d.val}%` : '--'}
                    </Text>
                  </View>
                ))}
              </View>

              <View style={styles.gridRow}>
                <View style={styles.gridCard}>
                  <View style={styles.gridHeader}>
                    <Text style={styles.gridIcon}>{GAME_META['reaction'].icon}</Text>
                    <View style={styles.gridTextWrap}>
                      <Text style={styles.gridLbl} numberOfLines={1}>{GAME_META['reaction'].label}</Text>
                      <Text style={styles.gridSubLbl} numberOfLines={1}>{GAME_META['reaction'].game}</Text>
                    </View>
                  </View>
                  <Text style={[styles.gridVal, { color: sessions.length > 0 ? getGrade(getSuggScore('reaction')).color : colors.textMuted }]}>
                    {sessions.length > 0 ? `${getSuggScore('reaction')}%` : '--'}
                  </Text>
                </View>
                <View style={[styles.gridCard, { backgroundColor: 'rgba(43,94,234,0.03)' }]}>
                  <View style={styles.gridHeader}>
                    <Text style={styles.gridIcon}>📊</Text>
                    <View style={styles.gridTextWrap}>
                      <Text style={styles.gridLbl} numberOfLines={1}>Overall</Text>
                      <Text style={styles.gridSubLbl} numberOfLines={1}>Combined Score</Text>
                    </View>
                  </View>
                  <Text style={[styles.gridVal, { color: sessions.length > 0 ? getGrade(overall).color : colors.textMuted }]}>
                    {sessions.length > 0 ? `${overall}%` : '--'}
                  </Text>
                </View>
              </View>
            </>
          )}
        </Animated.View>

        {/* AI Insights & Clinical Notes */}
        <Animated.View entering={FadeInDown.delay(300).duration(500)}>
          <View style={styles.standardCard}>
            <Text style={styles.sectionTitle}>AI Analysis & Insights</Text>
            {aiLoading ? (
              <View style={{ paddingVertical: 20, alignItems: 'center' }}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={{ marginTop: 8, fontSize: 12, color: colors.textSecondary }}>Generating insights...</Text>
              </View>
            ) : patient.rehabGoal === 'cognitive' && aiData ? (
              <View>
                {Object.entries(aiData.insights).map(([k, v], i) => (
                  <View key={k} style={styles.aiRow}>
                    <Text style={styles.aiIcon}>{GAME_META[k]?.icon || '✨'}</Text>
                    <Text style={styles.aiText}>{v as string}</Text>
                  </View>
                ))}
              </View>
            ) : patient.rehabGoal === 'physical' && sessions.length > 0 ? (
               <View>
                 {generateKinematicClinicalInsights(sessions).map((insight, idx) => (
                   <View key={idx} style={styles.aiRow}>
                     <Text style={styles.aiIcon}>{insight.type === 'positive' ? '✅' : insight.type === 'warning' ? '⚠️' : '💡'}</Text>
                     <Text style={styles.aiText}>{insight.message}</Text>
                   </View>
                 ))}
               </View>
            ) : (
              <Text style={{ color: colors.textMuted }}>No AI insights available for this patient yet.</Text>
            )}
          </View>
        </Animated.View>

        {/* Actions */}
        <Animated.View entering={FadeInDown.delay(500).duration(500)} style={styles.actions}>
          <GradientButton title="📋  Generate Full Report" onPress={handleGenerateReport} variant="primary" fullWidth />
        </Animated.View>
      </ScrollView>

      {/* REPORT MODAL */}
      <Modal visible={reportVisible} animationType="slide" presentationStyle="pageSheet">
        <View style={[styles.modalRoot, { paddingTop: insets.top + 12 }]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Clinical Report</Text>
            <Pressable onPress={() => setReportVisible(false)}>
              <Ionicons name="close-circle" size={30} color="#94A3B8" />
            </Pressable>
          </View>
          <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
            <Text style={styles.reportContent}>{reportText}</Text>
          </ScrollView>
          <View style={styles.modalActions}>
            <Pressable
              style={styles.shareBtn}
              onPress={async () => {
                try {
                  await Share.share({ message: reportText, title: 'Patient Report' });
                } catch (e) {}
              }}
            >
              <Ionicons name="share-outline" size={18} color="white" />
              <Text style={styles.shareBtnText}>Share Report</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgPrimary },
  center: { justifyContent: 'center', alignItems: 'center' },
  scroll: { padding: spacing.xl, paddingBottom: 100, gap: spacing.lg },
  
  // Clean Native Card Containers
  heroCard: { backgroundColor: '#FFFFFF', borderRadius: 24, overflow: 'hidden' },
  standardCard: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: spacing.xl },
  gridCard: { flex: 1, backgroundColor: '#FFFFFF', borderRadius: 20, padding: spacing.lg, minHeight: 120, justifyContent: 'space-between' },

  // Hero UI
  heroTop: { flexDirection: 'row', alignItems: 'center', padding: spacing.xl },
  avatar: { width: 54, height: 54, borderRadius: 27, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
  avatarText: { fontSize: 22, fontWeight: '700', color: '#fff' },
  heroInfo: { flex: 1, justifyContent: 'center' },
  heroName: { fontSize: typography.sizes.h4, fontFamily: typography.fonts.heading, fontWeight: '600', color: colors.textPrimary, marginBottom: 4 },
  heroMeta: { fontSize: 13, color: colors.textSecondary },
  
  noDataRing: { alignItems: 'center', justifyContent: 'center', width: 70, height: 70, borderRadius: 35, backgroundColor: 'rgba(0,0,0,0.04)' },
  noDataText: { fontSize: 10, color: colors.textMuted, fontWeight: '700' },
  
  heroDivider: { height: 1, backgroundColor: 'rgba(0,0,0,0.04)' },
  heroBottom: { flexDirection: 'row', backgroundColor: 'rgba(0,0,0,0.015)' },
  
  profileMetaItem: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRightWidth: 1, borderRightColor: 'rgba(0,0,0,0.04)', gap: 6 },
  profileMetaTxt: { fontSize: 11, color: colors.textSecondary, fontFamily: typography.fonts.bodyMedium, fontWeight: '500' },
  
  sectionTitle: { fontSize: 16, fontFamily: typography.fonts.bodySemiBold, fontWeight: '600', color: colors.textPrimary, marginBottom: spacing.md },
  
  // Grids
  gridRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.md },
  gridHeader: { flexDirection: 'column', alignItems: 'flex-start' },
  gridTextWrap: { flexShrink: 1, marginTop: 4 },
  gridIcon: { fontSize: 24 },
  gridVal: { fontSize: 32, fontFamily: typography.fonts.headingBold, fontWeight: '700' },
  gridLbl: { fontSize: 13, color: colors.textPrimary, fontWeight: '600' },
  gridSubLbl: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  
  aiRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  aiIcon: { fontSize: 16, marginRight: 10, marginTop: 2 },
  aiText: { flex: 1, fontSize: 14, color: colors.textSecondary, lineHeight: 22, fontFamily: typography.fonts.bodyMedium },
  
  actions: { marginTop: spacing.lg },
  
  // Modal
  modalRoot: { flex: 1, backgroundColor: colors.bgPrimary },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)' },
  modalTitle: { fontSize: 18, fontFamily: typography.fonts.headingBold, color: colors.textPrimary, fontWeight: '700' },
  modalScroll: { flex: 1, padding: 24 },
  reportContent: { fontSize: 13, fontFamily: typography.fonts.mono, color: colors.textSecondary, lineHeight: 22 },
  modalActions: { flexDirection: 'row', padding: 24, paddingTop: 16, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.05)', backgroundColor: colors.bgPrimary, justifyContent: 'center' },
  shareBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.primary, paddingVertical: 14, borderRadius: 12, gap: 8, paddingHorizontal: 40 },
  shareBtnText: { color: 'white', fontSize: 15, fontFamily: typography.fonts.bodySemiBold, fontWeight: '600' },
});
