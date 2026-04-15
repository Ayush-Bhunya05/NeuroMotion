// NeuroMotion AI — Cognitive Dashboard (3-Game Edition)
import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, Dimensions, ActivityIndicator } from 'react-native';
const { width: SCREEN_WIDTH } = Dimensions.get('window');
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { colors, typography, spacing, borderRadius } from '../../src/theme';
import GlassCard from '../../src/components/ui/GlassCard';
import ScoreRing from '../../src/components/ui/ScoreRing';
import ProgressBar from '../../src/components/ui/ProgressBar';
import { MiniLineChart } from '../../src/components/charts/Charts';
import { useCognitive } from '../../src/contexts/CognitiveContext';
import { useApp } from '../../src/contexts/AppContext';
import { Ionicons } from '@expo/vector-icons';
import { getGeminiInsights } from '../../src/services/geminiService';
import DoctorSelectionModal from '../../src/components/shared/DoctorSelectionModal';

export default function CognitiveDashboard() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { state: cognitive, dispatch: cogniDispatch } = useCognitive();
  const { state: app } = useApp();
  const score = cognitive.currentScore;
  const [showDoctorModal, setShowDoctorModal] = useState(false);

  const aiRec = cognitive.aiRecommendation;

  React.useEffect(() => {
    if (!cognitive.hasHydrated || cognitive.sessions.length === 0 || cognitive.aiRecommendation) return;
    let cancelled = false;
    getGeminiInsights(score, cognitive.sessions).then(result => {
      if (!cancelled && result) cogniDispatch({ type: 'SET_AI_RECOMMENDATION', payload: result });
    });
    return () => { cancelled = true; };
  }, [cognitive.sessions.length, cognitive.hasHydrated, cognitive.aiRecommendation]);

  React.useEffect(() => {
    if (app.user?.cognitiveBaseline && cognitive.sessions.length === 0 && cognitive.hasHydrated) {
      cogniDispatch({ type: 'INITIALIZE_FROM_PROFILE', payload: app.user.cognitiveBaseline });
    }
  }, [app.user?.cognitiveBaseline, cognitive.sessions.length, cognitive.hasHydrated]);

  if (!cognitive.hasHydrated) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.cognitive} />
      </View>
    );
  }

  const getTrendData = (type: string) => {
    return cognitive.sessions
      .filter(s => s.gameType === type)
      .slice(0, 6).reverse()
      .map((s, i) => ({ label: `T${i+1}`, value: type === 'memory' ? s.accuracy : s.score }));
  };

  const memoryTrend = getTrendData('memory');
  const attentionTrend = getTrendData('attention');
  const reactionTrend = getTrendData('reaction');

  const todayLocal = new Date().toLocaleDateString('en-CA');
  const todaySessions = cognitive.sessions.filter(s => s.localDate === todayLocal || (s.timestamp && s.timestamp.startsWith(todayLocal)));
  
  const completedGames = {
    memory: todaySessions.some(s => s.gameType === 'memory'),
    attention: todaySessions.some(s => s.gameType === 'attention'),
    reaction: todaySessions.some(s => s.gameType === 'reaction'),
  };

  const tasksCompletedCount = Object.values(completedGames).filter(Boolean).length;
  const totalTasksCount = Object.keys(completedGames).length;
  const dailyProgressPercent = Math.round((tasksCompletedCount / totalTasksCount) * 100);

  const displayTasks = (aiRec?.tasks || [])
    .filter((t: any) => ['memory', 'attention', 'reaction'].includes(t.id)) // Filter to 3
    .map((task: any) => ({
      ...task,
      name: task.id === 'memory' ? 'Memory Card' : task.id === 'attention' ? 'Attention Stability' : 'Quick Reaction',
      route: `/(cognitive)/${task.id === 'memory' ? 'memory-game' : task.id === 'attention' ? 'attention-game' : 'reaction-test'}`,
      icon: task.id === 'memory' ? '🃏' : task.id === 'attention' ? '🎯' : '⚡',
      done: completedGames[task.id as keyof typeof completedGames]
    })).sort((a: any, b: any) => (a.done === b.done ? 0 : a.done ? 1 : -1));

  const nextTask = displayTasks.find((t: any) => !t.done);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        
        <Animated.View entering={FadeInDown.duration(500)} style={styles.headerSection}>
          <View style={styles.headerRow}>
            <View style={{flex: 1}}>
              <Text style={styles.greeting}>Cognitive Training</Text>
              <Text style={styles.userName}>Hi, {app.user?.name || 'Patient'} 🧠</Text>
            </View>
            <View style={{flexDirection: 'row', gap: spacing.md, alignItems: 'center'}}>
               <Pressable onPress={() => setShowDoctorModal(true)} style={styles.iconBtn}>
                 <Ionicons name="medical-outline" size={20} color={colors.cognitive} />
               </Pressable>
               <Pressable onPress={() => router.push('/(shared)/profile')} style={styles.avatar}>
                <LinearGradient colors={[colors.cognitive, colors.cognitiveDark]} style={styles.avatar}>
                  <Text style={styles.avatarText}>{app.user?.name?.charAt(0) || 'U'}</Text>
                </LinearGradient>
              </Pressable>
            </View>
          </View>
        </Animated.View>

        <DoctorSelectionModal 
           visible={showDoctorModal} 
           onClose={() => setShowDoctorModal(false)} 
           module="cognitive"
        />

        <Animated.View entering={FadeInDown.delay(100).duration(500)}>
          <GlassCard variant="accent" style={styles.aiPlanCard}>
            <View style={styles.aiHeader}>
              <View style={styles.aiIconBadge}><Text style={{fontSize: 18}}>🤖</Text></View>
              <Text style={styles.aiTitle}>Daily Training Plan</Text>
            </View>
            <Text style={styles.aiDesc}>Complete 3 sessions to improve cognitive resilience.</Text>
            <View style={styles.dailyProgressBar}><View style={[styles.dailyProgressFill, { width: `${dailyProgressPercent}%` }]} /></View>
            <View style={styles.aiTasksContainer}>
              {displayTasks.map((task: any, idx: number) => (
                <View key={idx} style={[styles.aiTaskRow, task.done && { opacity: 0.5 }]}>
                  <Text style={styles.aiTaskIcon}>{task.icon}</Text>
                  <View style={styles.aiTaskInfo}>
                    <Text style={[styles.aiTaskName, task.done && { textDecorationLine: 'line-through' }]}>{task.name}</Text>
                    <Text style={styles.aiTaskLevel}>Level: {task.done ? 'Completed' : task.level}</Text>
                  </View>
                  <Ionicons name={task.done ? "checkmark-circle" : "ellipse-outline"} size={22} color={task.done ? colors.success : colors.textMuted} />
                </View>
              ))}
            </View>
            {nextTask ? (
              <Pressable onPress={() => router.push(nextTask.route as any)} style={styles.aiStartBtn}>
                <LinearGradient colors={[colors.primary, colors.primaryDark]} style={styles.aiStartGradient} start={{x: 0, y: 0}} end={{x: 1, y: 0}}>
                  <Text style={styles.aiStartText}>Next: {nextTask.name}</Text>
                </LinearGradient>
              </Pressable>
            ) : (
              <View style={styles.allDoneBadge}><Text style={styles.allDoneText}>🎉 All tasks completed!</Text></View>
            )}
          </GlassCard>
        </Animated.View>

        <View style={styles.trendView}>
          <Text style={styles.sectionTitle}>Stability Trends</Text>
          <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false} style={styles.trendScroll} contentContainerStyle={styles.trendScrollContent}>
             {[ { t: 'Memory Card', d: memoryTrend, c: '#FF6B9D', i: '🃏' }, { t: 'Attention Stability', d: attentionTrend, c: '#4D96FF', i: '🎯' }, { t: 'Quick Reaction', d: reactionTrend, c: '#6BCB77', i: '⚡' } ].map((item, idx) => (
              <View key={idx} style={styles.chartPage}>
                <GlassCard style={styles.chartCard}>
                  <Text style={styles.chartPageTitle}>{item.i} {item.t}</Text>
                  {item.d.length > 0 ? ( <MiniLineChart data={item.d} color={item.c} width={SCREEN_WIDTH - 64} /> ) : (
                    <View style={styles.emptyChart}><Text style={styles.emptyText}>Play a session to see trend</Text></View>
                  )}
                </GlassCard>
              </View>
            ))}
          </ScrollView>
        </View>

        {aiRec && (
          <Animated.View entering={FadeInDown.delay(200).duration(500)}>
            <Text style={[styles.sectionTitle, {marginTop: spacing.xl}]}>🧠 AI Guide Insights</Text>
            <GlassCard style={styles.aiGuidanceCard}>
              <View style={styles.insightGrid}>
                {Object.entries(aiRec.insights)
                  .filter(([k]) => ['memory', 'attention', 'reaction'].includes(k))
                  .map(([key, val], i) => {
                    const ic = key === 'memory' ? '🃏' : key === 'attention' ? '🎯' : '⚡';
                    const title = key === 'memory' ? 'Memory Profile' : key === 'attention' ? 'Focus & Stability' : 'Reflex Response';
                    return (
                      <View key={i} style={styles.insightCard}>
                         <View style={{flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4}}>
                            <Text style={{fontSize: 14}}>{ic}</Text>
                            <Text style={styles.insightLabel}>{title}</Text>
                         </View>
                         <Text style={styles.insightSummary}>{val as string}</Text>
                      </View>
                    );
                  })}
              </View>
            </GlassCard>
          </Animated.View>
        )}

        <Text style={styles.disclaimer}>NeuroMotion AI · Progressive Clinical Architecture</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgPrimary },
  scroll: { padding: spacing.xl, paddingBottom: 100 },
  headerSection: { marginBottom: spacing.md },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  greeting: { fontSize: 13, color: colors.cognitive, fontWeight: '600' },
  userName: { fontSize: 24, color: colors.textPrimary, fontWeight: '700', marginTop: 2 },
  iconBtn: { 
    width: 44, 
    height: 44, 
    borderRadius: 14, 
    backgroundColor: 'rgba(142, 36, 170, 0.06)', 
    alignItems: 'center', 
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(142, 36, 170, 0.1)'
  },
  avatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 18, fontWeight: '700', color: '#fff' },
  
  aiPlanCard: { padding: spacing.lg, borderColor: 'rgba(0,0,0,0.05)', borderWidth: 1 },
  aiHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  aiIconBadge: { backgroundColor: 'rgba(142, 36, 170, 0.1)', padding: 6, borderRadius: 12 },
  aiTitle: { fontSize: 18, fontWeight: '700', color: colors.textPrimary },
  aiDesc: { fontSize: 14, color: colors.textSecondary, marginBottom: 12 },
  dailyProgressBar: { height: 6, backgroundColor: 'rgba(0,0,0,0.04)', borderRadius: 3, marginBottom: 16, overflow: 'hidden' },
  dailyProgressFill: { height: '100%', backgroundColor: colors.primary },
  aiTasksContainer: { gap: 8, marginBottom: 16 },
  aiTaskRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.02)', padding: 12, borderRadius: 14, gap: 12 },
  aiTaskIcon: { fontSize: 24 },
  aiTaskInfo: { flex: 1 },
  aiTaskName: { fontSize: 14, fontWeight: '600', color: colors.textPrimary },
  aiTaskLevel: { fontSize: 11, color: colors.cognitive, marginTop: 2 },
  aiStartBtn: { borderRadius: 14, overflow: 'hidden' },
  aiStartGradient: { paddingVertical: 14, alignItems: 'center' },
  aiStartText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  allDoneBadge: { backgroundColor: 'rgba(74, 222, 128, 0.1)', padding: 14, borderRadius: 12, alignItems: 'center' },
  allDoneText: { color: colors.success, fontWeight: '700' },

  trendView: { marginTop: spacing.xl },
  sectionTitle: { fontSize: 15, fontWeight: '600', color: colors.textPrimary, marginBottom: 12 },
  trendScroll: { marginHorizontal: -spacing.xl },
  trendScrollContent: { paddingHorizontal: spacing.xl },
  chartPage: { width: SCREEN_WIDTH - 32, paddingRight: 16 },
  chartCard: { width: '100%', padding: spacing.lg },
  chartPageTitle: { fontSize: 14, fontWeight: '700', color: colors.textPrimary, marginBottom: 16 },
  emptyChart: { height: 160, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.02)', borderRadius: 12 },
  emptyText: { color: colors.textMuted, fontSize: 12 },

  aiGuidanceCard: { padding: spacing.lg, backgroundColor: 'rgba(255,255,255,0.02)' },
  insightGrid: { gap: 10 },
  insightCard: { backgroundColor: 'rgba(0,0,0,0.02)', padding: 14, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(0,0,0,0.03)' },
  insightLabel: { fontSize: 12, color: colors.cognitive, fontWeight: '800', textTransform: 'uppercase' },
  insightSummary: { fontSize: 13, color: colors.textSecondary, lineHeight: 18, marginTop: 4 },
  disclaimer: { textAlign: 'center', fontSize: 11, color: colors.textMuted, marginTop: 40 },
});
