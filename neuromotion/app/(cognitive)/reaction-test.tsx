// NeuroMotion AI — Reaction Time Test
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useLocalSearchParams } from 'expo-router';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius } from '../../src/theme';
import GlassCard from '../../src/components/ui/GlassCard';
import GradientButton from '../../src/components/ui/GradientButton';
import ScoreRing from '../../src/components/ui/ScoreRing';
import { useCognitive } from '../../src/contexts/CognitiveContext';
import { getRecommendedDifficulty } from '../../src/utils/adaptiveLogic';

type ReactionLevel = 'easy' | 'medium' | 'hard';


const RX_LEVEL_CONFIG = {
  easy:   { rounds: 3, minDelay: 2000, maxDelay: 4500, label: 'Easy' },
  medium: { rounds: 5, minDelay: 1500, maxDelay: 3500, label: 'Medium' },
  hard:   { rounds: 7, minDelay: 1000, maxDelay: 2500, label: 'Hard' },
};

const { width: SW } = Dimensions.get('window');

type Phase = 'menu' | 'waiting' | 'ready' | 'go' | 'tooEarly' | 'result' | 'complete';

export default function ReactionTest() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { practice, level } = useLocalSearchParams();
  const isPractice = practice === 'true';
  const { state, dispatch } = useCognitive();

  const [phase, setPhase] = useState<Phase>('menu');
  const [difficulty, setDifficulty] = useState<ReactionLevel>('easy');
  
  useEffect(() => {
    if (phase === 'menu') {
      if (level && ['easy', 'medium', 'hard'].includes(String(level).toLowerCase())) {
        setDifficulty(String(level).toLowerCase() as ReactionLevel);
      } else {
        const aiRec = (state as any).aiRecommendation;
        const taskLevel = aiRec?.tasks?.find((t: any) => t.id === 'reaction')?.level;
        if (taskLevel && ['easy', 'medium', 'hard'].includes(taskLevel.toLowerCase())) {
          setDifficulty(taskLevel.toLowerCase() as ReactionLevel);
        } else {
          setDifficulty(getRecommendedDifficulty(state.sessions, 'reaction'));
        }
      }
    }
  }, [state.sessions, level, phase]);

  const [round, setRound] = useState(0);
  const [times, setTimes] = useState<number[]>([]);
  const [currentTime, setCurrentTime] = useState(0);
  const goTime = useRef(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const activeLevel = difficulty;
  const levelCfg = (RX_LEVEL_CONFIG as any)[activeLevel];
  const TOTAL_ROUNDS = levelCfg.rounds;

  const startRound = useCallback(() => {
    setPhase('waiting');
    const delay = levelCfg.minDelay + Math.random() * (levelCfg.maxDelay - levelCfg.minDelay);
    timeoutRef.current = setTimeout(() => {
      goTime.current = Date.now();
      setPhase('go');
    }, delay);
  }, [levelCfg]);

  const handleTap = useCallback(() => {
    if (phase === 'waiting') {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      setPhase('tooEarly');
    } else if (phase === 'go') {
      const reaction = Date.now() - goTime.current;
      setCurrentTime(reaction);
      const newTimes = [...times, reaction];
      setTimes(newTimes);
      setRound(r => r + 1);
      setPhase('result');
    }
  }, [phase, times]);

  const nextRound = () => {
    if (round >= TOTAL_ROUNDS) {
      completeTest();
    } else {
      startRound();
    }
  };

  const completeTest = () => {
    const avg = times.reduce((a, b) => a + b, 0) / times.length;
    const score = Math.round(Math.max(0, Math.min(100, 100 - (avg - 150) / 5)));
    setPhase('complete');
    if (!isPractice) {
      dispatch({
        type: 'ADD_SESSION',
        payload: { gameType: 'reaction', accuracy: Math.round((times.filter(t => t < 400).length / times.length) * 100), responseTime: Math.round(avg), mistakes: times.filter(t => t > 500).length, score, level: difficulty === 'easy' ? 1 : difficulty === 'medium' ? 2 : 3, duration: Math.round(times.reduce((a, b) => a + b, 0) / 1000) },
      });
    }
  };

  const reset = () => { setPhase('menu'); setRound(0); setTimes([]); setCurrentTime(0); };

  const finalAvg = times.length > 0 ? Math.round(times.reduce((a, b) => a + b, 0) / times.length) : 0;
  const finalBest = times.length > 0 ? Math.min(...times) : 0;
  const finalScore = times.length > 0 ? Math.round(Math.max(0, Math.min(100, 100 - (finalAvg - 150) / 5))) : 0;

  const getRating = (ms: number) => ms < 200 ? '⚡ Excellent' : ms < 300 ? '🔥 Great' : ms < 400 ? '👍 Good' : ms < 500 ? '😐 Average' : '🐢 Slow';

  useEffect(() => {
    navigation.setOptions({
      tabBarStyle: phase !== 'menu' && phase !== 'complete' ? { display: 'none' } : {
        backgroundColor: 'rgba(10, 14, 39, 0.95)',
        borderTopWidth: 1,
        borderTopColor: 'rgba(255, 107, 157, 0.15)',
        height: 65, paddingBottom: 8, paddingTop: 6,
      }
    });
  }, [phase, navigation]);

  // MENU
  if (phase === 'menu') {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.content}>
          <Animated.View entering={FadeInDown.duration(500)} style={styles.menuHeader}>
            <Text style={styles.bigEmoji}>⚡</Text>
            <Text style={styles.title}>{isPractice ? 'Reaction Practice' : 'Reaction Training'}</Text>
            <Text style={styles.sub}>{isPractice ? 'Practice mode: Scores will not be tracked' : 'AI adapts automatically to your reflexes'}</Text>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(200).duration(400)}>
            <GlassCard variant="cognitive" style={[styles.diffCard, styles.recommendedCard]}>
              <View style={styles.levelInfo}>
                <Text style={styles.diffName}>Level: {difficulty === 'easy' ? 'Low' : difficulty === 'medium' ? 'Moderate' : 'High'}</Text>
                <Text style={styles.diffInfo}>
                  {isPractice ? 'Concentration practice' : 'Recommended for your current focus level'}
                </Text>
              </View>
              <Ionicons name="sparkles" size={20} color="#fff" />
            </GlassCard>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(350).duration(400)}>
            <GradientButton 
              title="▶  Start Training" 
              onPress={() => { setRound(0); setTimes([]); startRound(); }} 
              variant="cognitive" 
              fullWidth 
              size="lg" 
            />
          </Animated.View>
        </View>
      </View>
    );
  }

  // COMPLETE
  if (phase === 'complete') {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.content}>
          <Animated.View entering={FadeIn.duration(600)} style={styles.center}>
            <Text style={styles.bigEmoji}>🏆</Text>
            <Text style={styles.title}>Test Complete!</Text>
            <ScoreRing score={finalScore} size={140} color={colors.cognitive} />
            <GlassCard variant="cognitive" style={styles.resultsCard}>
              <View style={styles.resultsRow}>
                <View style={styles.resultItem}><Text style={styles.resultVal}>{finalAvg}ms</Text><Text style={styles.resultLbl}>Average</Text></View>
                <View style={styles.resultItem}><Text style={styles.resultVal}>{finalBest}ms</Text><Text style={styles.resultLbl}>Best</Text></View>
                <View style={styles.resultItem}><Text style={styles.resultVal}>{TOTAL_ROUNDS}</Text><Text style={styles.resultLbl}>Rounds</Text></View>
              </View>
            </GlassCard>
            <GlassCard style={{width:'100%'}}>
              <Text style={styles.roundsTitle}>Round Details</Text>
              {times.map((t, i) => (
                <View key={i} style={styles.roundRow}>
                  <Text style={styles.roundNum}>Round {i + 1}</Text>
                  <Text style={[styles.roundTime, { color: t < 300 ? colors.success : t < 500 ? colors.warning : colors.error }]}>{t}ms</Text>
                  <Text style={styles.roundRating}>{getRating(t)}</Text>
                </View>
              ))}
            </GlassCard>
            <GradientButton title="Try Again" onPress={reset} variant="cognitive" fullWidth />
          </Animated.View>
        </View>
      </View>
    );
  }

  // GAME SCREENS
  const bgColor = phase === 'go' ? '#22C55E' : phase === 'tooEarly' ? '#EF4444' : phase === 'result' ? colors.bgSecondary : '#B45309';

  return (
    <Pressable style={[styles.gameScreen, { backgroundColor: bgColor }]} onPress={phase === 'go' || phase === 'waiting' ? handleTap : undefined}>
      <View style={styles.center}>
        {phase === 'waiting' && (
          <>
            <Text style={styles.gameEmoji}>🟡</Text>
            <Text style={styles.gameText}>Wait for green...</Text>
            <Text style={styles.gameSubtext}>Round {round + 1} of {TOTAL_ROUNDS}</Text>
          </>
        )}
        {phase === 'go' && (
          <>
            <Text style={styles.gameEmoji}>🟢</Text>
            <Text style={styles.gameText}>TAP NOW!</Text>
          </>
        )}
        {phase === 'tooEarly' && (
          <>
            <Text style={styles.gameEmoji}>🔴</Text>
            <Text style={styles.gameText}>Too early!</Text>
            <Pressable onPress={startRound} style={styles.retryBtn}><Text style={styles.retryText}>Try Again</Text></Pressable>
          </>
        )}
        {phase === 'result' && (
          <>
            <Text style={styles.gameEmoji}>⏱</Text>
            <Text style={styles.reactionTime}>{currentTime}ms</Text>
            <Text style={styles.gameText}>{getRating(currentTime)}</Text>
            <Pressable onPress={nextRound} style={styles.nextBtn}>
              <Text style={styles.nextText}>{round >= TOTAL_ROUNDS ? 'See Results' : 'Next Round →'}</Text>
            </Pressable>
          </>
        )}
        <Pressable onPress={reset} style={styles.quitBtnAbsolute}>
          <Text style={styles.quitText}>Quit Test</Text>
        </Pressable>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgPrimary },
  content: { flex: 1, padding: spacing.xl },
  menuHeader: { alignItems: 'center', marginBottom: spacing.xxl },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.lg },
  bigEmoji: { fontSize: 64 },
  title: { fontSize: typography.sizes.h2, fontFamily: typography.fonts.headingBold, fontWeight: '700', color: colors.textPrimary },
  sub: { fontSize: 14, color: colors.textSecondary },
  
  diffCard: { marginBottom: spacing.md, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.lg },
  recommendedCard: { borderColor: colors.cognitive, borderWidth: 1.5 },
  levelInfo: { flex: 1 },
  recBadge: { backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, marginRight: spacing.md },
  recText: { color: '#fff', fontSize: 9, fontWeight: '700', letterSpacing: 0.5 },
  diffName: { fontSize: 18, fontFamily: typography.fonts.headingBold, color: colors.textPrimary },
  diffInfo: { fontSize: 13, color: colors.textMuted, marginTop: 2 },

  gameScreen: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  gameEmoji: { fontSize: 72, marginBottom: spacing.lg },
  gameText: { fontSize: 28, fontFamily: typography.fonts.headingBold, fontWeight: '700', color: '#fff' },
  gameSubtext: { fontSize: 16, color: 'rgba(255,255,255,0.7)', marginTop: spacing.sm },
  reactionTime: { fontSize: 64, fontFamily: typography.fonts.headingBold, fontWeight: '700', color: '#fff' },
  retryBtn: { marginTop: spacing.xxl, backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 24, paddingVertical: 12, borderRadius: borderRadius.round },
  retryText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  nextBtn: { marginTop: spacing.xxl, backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 24, paddingVertical: 12, borderRadius: borderRadius.round, zIndex: 10 },
  nextText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  quitBtnAbsolute: { position: 'absolute', bottom: 40, alignItems: 'center', padding: 10, zIndex: 10 },
  quitText: { color: 'rgba(255,255,255,0.6)', fontSize: 14, fontWeight: '500' },
  resultsCard: { width: '100%' },
  resultsRow: { flexDirection: 'row', justifyContent: 'space-around' },
  resultItem: { alignItems: 'center', gap: 4 },
  resultVal: { fontSize: 22, fontFamily: typography.fonts.headingBold, fontWeight: '700', color: colors.cognitive },
  resultLbl: { fontSize: 11, color: colors.textMuted },
  roundsTitle: { fontSize: 15, fontFamily: typography.fonts.bodySemiBold, fontWeight: '600', color: colors.textPrimary, marginBottom: spacing.md },
  roundRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: colors.divider },
  roundNum: { fontSize: 13, color: colors.textSecondary, width: 70 },
  roundTime: { fontSize: 15, fontFamily: typography.fonts.bodySemiBold, fontWeight: '600' },
  roundRating: { fontSize: 12, color: colors.textMuted, width: 90, textAlign: 'right' },
});
