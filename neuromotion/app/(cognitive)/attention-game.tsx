// NeuroMotion AI — Attention Stability Game
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useLocalSearchParams } from 'expo-router';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius } from '../../src/theme';
import GlassCard from '../../src/components/ui/GlassCard';
import GradientButton from '../../src/components/ui/GradientButton';
import ScoreRing from '../../src/components/ui/ScoreRing';
import { useCognitive } from '../../src/contexts/CognitiveContext';
import { getRecommendedDifficulty } from '../../src/utils/adaptiveLogic';

type Phase = 'menu' | 'playing' | 'complete';

const ALL_COLORS = [
  { hex: colors.cognitive, name: 'PURPLE' },
  { hex: '#E53935', name: 'RED' },
  { hex: '#1E88E5', name: 'BLUE' },
  { hex: '#43A047', name: 'GREEN' },
  { hex: '#FB8C00', name: 'ORANGE' },
];

type AdaptiveLevel = 'easy' | 'medium' | 'hard';

const LEVEL_CONFIG = {
  easy:   { duration: 30, baseInterval: 1400, minInterval: 800, purpleChance: 0.45, label: 'Easy' },
  medium: { duration: 30, baseInterval: 1100, minInterval: 600, purpleChance: 0.38, label: 'Medium' },
  hard:   { duration: 30, baseInterval: 800,  minInterval: 400, purpleChance: 0.30, label: 'Hard' },
};

export default function AttentionGame() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { practice, level } = useLocalSearchParams();
  const isPractice = practice === 'true';
  const { state, dispatch } = useCognitive();

  const [phase, setPhase] = useState<Phase>('menu');
  const [difficulty, setDifficulty] = useState<AdaptiveLevel>('easy');
  
  useEffect(() => {
    if (phase === 'menu') {
      if (level && ['easy', 'medium', 'hard'].includes(String(level).toLowerCase())) {
        setDifficulty(String(level).toLowerCase() as AdaptiveLevel);
      } else {
        const aiRec = (state as any).aiRecommendation;
        const taskLevel = aiRec?.tasks?.find((t: any) => t.id === 'attention')?.level;
        if (taskLevel && ['easy', 'medium', 'hard'].includes(taskLevel.toLowerCase())) {
          setDifficulty(taskLevel.toLowerCase() as AdaptiveLevel);
        } else {
          setDifficulty(getRecommendedDifficulty(state.sessions, 'attention'));
        }
      }
    }
  }, [state.sessions, level, phase]);

  const [currentColor, setCurrentColor] = useState<string>(colors.textMuted);
  const [targetColor, setTargetColor] = useState(ALL_COLORS[0]);
  const [hits, setHits] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [missedTargets, setMissedTargets] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [errorMsg, setErrorMsg] = useState('');
  
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const gameLoopRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wasTargetRef = useRef<boolean>(false);
  const hitCurrentTargetRef = useRef<boolean>(false);
  const targetColorRef = useRef(ALL_COLORS[0]);

  const activeLevel = difficulty;
  const levelCfg = (LEVEL_CONFIG as any)[activeLevel];

  const startGame = () => {
    const randomTarget = ALL_COLORS[Math.floor(Math.random() * ALL_COLORS.length)];
    setTargetColor(randomTarget);
    targetColorRef.current = randomTarget;

    setHits(0);
    setMistakes(0);
    setMissedTargets(0);
    setTimeLeft(levelCfg.duration);
    setPhase('playing');
    setCurrentColor(colors.textMuted);
    wasTargetRef.current = false;
    hitCurrentTargetRef.current = false;
    setErrorMsg('');

    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          endGame();
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    let nextColorTime = levelCfg.baseInterval;

    const gameLoop = () => {
      if (wasTargetRef.current && !hitCurrentTargetRef.current) {
        setMissedTargets(m => m + 1);
      }

      const isTarget = Math.random() < levelCfg.purpleChance;
      const distractorColors = ALL_COLORS.filter(c => c.hex !== targetColorRef.current.hex);
      const nextColor = isTarget ? targetColorRef.current.hex : distractorColors[Math.floor(Math.random() * distractorColors.length)].hex;
      
      setCurrentColor(nextColor);
      wasTargetRef.current = isTarget;
      hitCurrentTargetRef.current = false;

      nextColorTime = Math.max(levelCfg.minInterval, levelCfg.baseInterval - ((levelCfg.duration - (timeLeft || levelCfg.duration)) * 15));
      gameLoopRef.current = setTimeout(gameLoop, nextColorTime);
    };

    setTimeout(() => {
      gameLoopRef.current = setTimeout(gameLoop, 1000);
    }, 500);
  };

  const endGame = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (gameLoopRef.current) clearTimeout(gameLoopRef.current);

    setPhase('complete');
  };

  useEffect(() => {
    if (phase === 'complete') {
      const totalPossible = hits + missedTargets || 1;
      const accuracy = hits > 0 ? Math.max(0, Math.round((hits / totalPossible) * 100) - (mistakes * 5)) : 0;
      const gameScore = Math.max(0, Math.min(100, accuracy));

      if (!isPractice) {
        dispatch({
          type: 'ADD_SESSION',
          payload: {
            gameType: 'attention',
            accuracy: gameScore,
            responseTime: 0, 
            mistakes: mistakes + missedTargets,
            score: gameScore,
            level: difficulty === 'easy' ? 1 : difficulty === 'medium' ? 2 : 3,
            duration: levelCfg.duration
          }
        });
      }
    }
  }, [phase]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (gameLoopRef.current) clearTimeout(gameLoopRef.current);
    };
  }, []);

  useEffect(() => {
    navigation.setOptions({
      tabBarStyle: phase === 'playing' ? { display: 'none' } : {
        backgroundColor: 'rgba(10, 14, 39, 0.95)',
        borderTopWidth: 1,
        borderTopColor: 'rgba(255, 107, 157, 0.15)',
        height: 65, paddingBottom: 8, paddingTop: 6,
      }
    });
  }, [phase, navigation]);

  const handleTap = () => {
    if (phase !== 'playing') return;

    if (currentColor === targetColor.hex && !hitCurrentTargetRef.current) {
      setHits(h => h + 1);
      hitCurrentTargetRef.current = true;
    } else if (currentColor !== colors.textMuted && !hitCurrentTargetRef.current) {
      setMistakes(m => m + 1);
      setErrorMsg(`Wait for ${targetColor.name}!`);
      setTimeout(() => setErrorMsg(''), 600);
    }
  };

  // MENU
  if (phase === 'menu') {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.content}>
          <Animated.View entering={FadeInDown.duration(500)} style={styles.menuHeader}>
            <Text style={styles.menuEmoji}>🎯</Text>
            <Text style={styles.menuTitle}>{isPractice ? 'Attention Practice' : 'Attention Training'}</Text>
            <Text style={styles.menuSub}>{isPractice ? 'Practice mode: Scores will not be tracked' : 'AI adapts automatically to your recovery'}</Text>
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
              onPress={startGame} 
              variant="cognitive" 
              fullWidth 
              size="lg" 
            />
          </Animated.View>
        </View>
      </View>
    );
  }

  if (phase === 'complete') {
    const totalPossible = hits + missedTargets;
    const finalScore = hits > 0 ? Math.max(0, Math.round((hits / (totalPossible || 1)) * 100) - (mistakes * 5)) : 0;
    
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.content}>
          <Animated.View entering={FadeIn.duration(600)} style={styles.completeCenter}>
            <Text style={styles.completeEmoji}>🎉</Text>
            <Text style={styles.completeTitle}>Test Complete!</Text>
            <ScoreRing score={finalScore} size={140} color={colors.cognitive} />
            <GlassCard variant="cognitive" style={styles.statsCard}>
              <View style={styles.statsRow}>
                <View style={styles.statItem}><Text style={styles.statVal}>{hits}</Text><Text style={styles.statLbl}>Hits</Text></View>
                <View style={styles.statItem}><Text style={[styles.statVal, {color: colors.error}]}>{mistakes}</Text><Text style={styles.statLbl}>Mistakes</Text></View>
                <View style={styles.statItem}><Text style={[styles.statVal, {color: colors.warning}]}>{missedTargets}</Text><Text style={styles.statLbl}>Missed</Text></View>
              </View>
            </GlassCard>
            <GradientButton title="Play Again" onPress={() => setPhase('menu')} variant="cognitive" fullWidth />
          </Animated.View>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.playingContent}>
        <View style={styles.playingHeader}>
          <Text style={styles.timerText}>00:{timeLeft.toString().padStart(2, '0')}</Text>
          <View style={styles.scoreRow}>
             <Text style={styles.hitText}>Hits: {hits}</Text>
             <Text style={styles.errorText}>Errors: {mistakes}</Text>
          </View>
        </View>

        <View style={styles.targetIndicator}>
          <Text style={styles.targetLabel}>TAP ONLY:</Text>
          <View style={[styles.targetSwatch, { backgroundColor: targetColor.hex }]} />
          <Text style={[styles.targetName, { color: targetColor.hex }]}>{targetColor.name}</Text>
        </View>

        <View style={styles.gameArea}>
          <Pressable 
            onPress={handleTap}
            style={[styles.targetCircle, { backgroundColor: currentColor }]}
          >
             {errorMsg ? <Text style={styles.errorFeedback}>{errorMsg}</Text> : null}
          </Pressable>
        </View>

         <Pressable onPress={() => { endGame(); setPhase('menu'); }} style={styles.quitBtn}>
          <Text style={styles.quitText}>Quit Test</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgPrimary },
  content: { flex: 1, padding: spacing.xl, justifyContent: 'center' },
  menuHeader: { alignItems: 'center', marginBottom: spacing.xl },
  menuEmoji: { fontSize: 64, marginBottom: spacing.md },
  menuTitle: { fontSize: typography.sizes.h2, fontFamily: typography.fonts.headingBold, color: colors.textPrimary },
  menuSub: { fontSize: 16, color: colors.textSecondary, marginTop: 4, textAlign: 'center' },
  
  diffCard: { marginBottom: spacing.md, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.lg },
  recommendedCard: { borderColor: colors.cognitive, borderWidth: 1.5 },
  levelInfo: { flex: 1 },
  recBadge: { backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, marginRight: spacing.md },
  recText: { color: '#fff', fontSize: 9, fontWeight: '700', letterSpacing: 0.5 },
  diffName: { fontSize: 18, fontFamily: typography.fonts.headingBold, color: colors.textPrimary },
  diffInfo: { fontSize: 13, color: colors.textMuted, marginTop: 2 },

  playingContent: { flex: 1, padding: spacing.xl },
  playingHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xxl },
  timerText: { fontSize: 24, fontFamily: typography.fonts.headingBold, color: colors.textPrimary },
  scoreRow: { alignItems: 'flex-end' },
  hitText: { fontSize: 16, fontFamily: typography.fonts.headingBold, color: colors.success },
  errorText: { fontSize: 14, fontFamily: typography.fonts.bodySemiBold, color: colors.error },
  
  gameArea: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  targetCircle: { width: 240, height: 240, borderRadius: 120, justifyContent: 'center', alignItems: 'center' },
  errorFeedback: { position: 'absolute', top: -30, color: colors.error, fontSize: 16, fontWeight: '700' },
  
  targetIndicator: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 12, paddingHorizontal: 20, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', marginBottom: spacing.lg, alignSelf: 'center' },
  targetLabel: { fontSize: 14, fontFamily: typography.fonts.bodySemiBold, color: colors.textSecondary, letterSpacing: 1 },
  targetSwatch: { width: 24, height: 24, borderRadius: 12 },
  targetName: { fontSize: 18, fontFamily: typography.fonts.headingBold, fontWeight: '700' },
  
  quitBtn: { alignItems: 'center', paddingVertical: spacing.lg },
  quitText: { color: colors.textMuted, fontSize: 14, fontFamily: typography.fonts.bodyMedium },
  
  completeCenter: { alignItems: 'center', justifyContent: 'center', flex: 1, gap: spacing.xl },
  completeEmoji: { fontSize: 56 },
  completeTitle: { fontSize: typography.sizes.h2, fontFamily: typography.fonts.headingBold, color: colors.textPrimary },
  statsCard: { width: '100%' },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around' },
  statItem: { alignItems: 'center', gap: 4 },
  statVal: { fontSize: 22, fontFamily: typography.fonts.headingBold, color: colors.cognitive },
  statLbl: { fontSize: 13, color: colors.textMuted },
});
