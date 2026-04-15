// NeuroMotion AI — Memory Card Game
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useLocalSearchParams } from 'expo-router';
import Animated, { FadeIn, FadeInDown, useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius } from '../../src/theme';
import GlassCard from '../../src/components/ui/GlassCard';
import GradientButton from '../../src/components/ui/GradientButton';
import ScoreRing from '../../src/components/ui/ScoreRing';
import { useCognitive } from '../../src/contexts/CognitiveContext';
import { DIFFICULTY_CONFIG } from '../../src/types/cognitive';
import { getRecommendedDifficulty } from '../../src/utils/adaptiveLogic';

const { width: SW } = Dimensions.get('window');

type Difficulty = 'easy' | 'medium' | 'hard';
type Phase = 'menu' | 'preview' | 'playing' | 'complete';

// Hardcoded Ionicons symbols specifically for the game
const IONICON_SYMBOLS = [
  'star', 'heart', 'sunny', 'moon', 'leaf', 'bulb', 
  'flash', 'flame', 'water', 'snow', 'flower', 'cloud',
  'bicycle', 'airplane', 'rocket', 'car'
];

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const MemoryCard = ({ icon, isOpen, onPress, disabled, style }: { icon: string, isOpen: boolean, onPress: () => void, disabled?: boolean, style?: any }) => {
  const rotation = useSharedValue(0);

  React.useEffect(() => {
    rotation.value = withTiming(isOpen ? 180 : 0, { duration: 400 });
  }, [isOpen]);

  const frontStyle = useAnimatedStyle(() => ({
    transform: [{ rotateY: `${rotation.value}deg` }],
    backfaceVisibility: 'hidden',
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
  }));

  const backStyle = useAnimatedStyle(() => ({
    transform: [{ rotateY: `${rotation.value + 180}deg` }],
    backfaceVisibility: 'hidden',
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  }));

  return (
    <Pressable 
      onPress={onPress} 
      disabled={disabled}
      style={[style, { margin: 4 }]}
    >
      <Animated.View style={[styles.memoryBtn, frontStyle, { borderColor: 'rgba(255,255,255,0.08)', backgroundColor: '#0F111A' }]}>
        <Ionicons name="help" size={26} color="rgba(255,255,255,0.15)" />
      </Animated.View>
      <Animated.View style={[styles.memoryBtn, backStyle, { borderColor: colors.cognitive, backgroundColor: 'rgba(108, 93, 211, 0.2)' }]}>
        <Ionicons name={icon as any} size={30} color={colors.cognitive} />
      </Animated.View>
    </Pressable>
  );
};


export default function MemoryGame() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { practice, level } = useLocalSearchParams();
  const isPractice = practice === 'true';
  const { state, dispatch } = useCognitive();
  
  const [phase, setPhase] = useState<Phase>('menu');
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  
  useEffect(() => {
    if (phase === 'menu') {
      if (level && ['easy', 'medium', 'hard'].includes(String(level).toLowerCase())) {
        setDifficulty(String(level).toLowerCase() as Difficulty);
      } else {
        const aiRec = (state as any).aiRecommendation;
        const taskLevel = aiRec?.tasks?.find((t: any) => t.id === 'memory')?.level;
        if (taskLevel && ['easy', 'medium', 'hard'].includes(taskLevel.toLowerCase())) {
          setDifficulty(taskLevel.toLowerCase() as Difficulty);
        } else {
          setDifficulty(getRecommendedDifficulty(state.sessions, 'memory'));
        }
      }
    }
  }, [state.sessions, level, phase]);

  const [cards, setCards] = useState<{ id: number; symbol: string; flipped: boolean; matched: boolean }[]>([]);
  const [flipped, setFlipped] = useState<number[]>([]);
  const [matches, setMatches] = useState(0);
  const [moves, setMoves] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [startTime, setStartTime] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [score, setScore] = useState(0);
  
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const previewTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isLocked = useRef(false);

  const config = DIFFICULTY_CONFIG[difficulty];

  const startGame = (diff: Difficulty) => {
    setDifficulty(diff);
    const cfg = DIFFICULTY_CONFIG[diff];
    const symbols = shuffleArray(IONICON_SYMBOLS).slice(0, cfg.pairs);
    const deck = shuffleArray([...symbols, ...symbols].map((s, i) => ({ id: i, symbol: s, flipped: false, matched: false })));
    setCards(deck);
    setFlipped([]);
    setMatches(0);
    setMoves(0);
    setMistakes(0);
    setElapsed(0);
    setPhase('preview');

    const previewDuration = diff === 'easy' ? 6000 : diff === 'medium' ? 10000 : 15000;
    
    previewTimerRef.current = setTimeout(() => {
      setPhase('playing');
      setStartTime(Date.now());
      timerRef.current = setInterval(() => setElapsed(Date.now()), 1000);
    }, previewDuration);
  };

  const flipCard = useCallback((index: number) => {
    if (phase !== 'playing') return;
    if (isLocked.current) return;
    if (cards[index].flipped || cards[index].matched) return;
    if (flipped.length >= 2) return;

    const newCards = [...cards];
    newCards[index].flipped = true;
    setCards(newCards);
    const newFlipped = [...flipped, index];
    setFlipped(newFlipped);

    if (newFlipped.length === 2) {
      setMoves(m => m + 1);
      isLocked.current = true;
      const [a, b] = newFlipped;
      if (newCards[a].symbol === newCards[b].symbol) {
        setTimeout(() => {
          const updated = [...newCards];
          updated[a].matched = true;
          updated[b].matched = true;
          setCards(updated);
          setMatches(m => m + 1);
          setFlipped([]);
          isLocked.current = false;
          if (matches + 1 >= config.pairs) completeGame(moves + 1, mistakes);
        }, 400);
      } else {
        setMistakes(m => m + 1);
        setTimeout(() => {
          const updated = [...newCards];
          updated[a].flipped = false;
          updated[b].flipped = false;
          setCards(updated);
          setFlipped([]);
          isLocked.current = false;
        }, 800);
      }
    }
  }, [cards, flipped, matches, moves, mistakes, config.pairs, phase]);

  const completeGame = (totalMoves: number, totalMistakes: number) => {
    if (timerRef.current) clearInterval(timerRef.current);
    const duration = (Date.now() - startTime) / 1000;
    const accuracy = Math.round((config.pairs / Math.max(totalMoves, config.pairs)) * 100);
    const timeBonus = Math.max(0, 100 - duration);
    const gameScore = Math.round(accuracy * 0.6 + Math.min(100, timeBonus) * 0.4 * config.timeBonus);
    setScore(gameScore);
    setPhase('complete');
    if (!isPractice) {
      dispatch({
        type: 'ADD_SESSION',
        payload: { gameType: 'memory', accuracy, responseTime: Math.round(duration * 1000 / totalMoves), mistakes: totalMistakes, score: gameScore, level: difficulty === 'easy' ? 1 : difficulty === 'medium' ? 2 : 3, duration: Math.round(duration) },
      });
    }
  };

  useEffect(() => {
    return () => { 
      if (timerRef.current) clearInterval(timerRef.current); 
      if (previewTimerRef.current) clearTimeout(previewTimerRef.current);
    };
  }, []);

  useEffect(() => {
    navigation.setOptions({
      tabBarStyle: phase === 'playing' || phase === 'preview' ? { display: 'none' } : {
        backgroundColor: 'rgba(10, 14, 39, 0.95)',
        borderTopWidth: 1,
        borderTopColor: 'rgba(255, 107, 157, 0.15)',
        height: 65, paddingBottom: 8, paddingTop: 6,
      }
    });
  }, [phase, navigation]);

  const elapsedSec = startTime > 0 && phase === 'playing' ? Math.floor(((elapsed || Date.now()) - startTime) / 1000) : 0;
  const cardMargin = 4;
  const cardSize = Math.floor((SW - 40 - (config.gridCols * cardMargin * 2)) / config.gridCols) - 1;

  const activeDiff = difficulty;

  // MENU
  if (phase === 'menu') {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.content}>
          <Animated.View entering={FadeInDown.duration(500)} style={styles.menuHeader}>
            <Text style={styles.menuEmoji}>🃏</Text>
            <Text style={styles.menuTitle}>{isPractice ? 'Memory Practice' : 'Memory Training'}</Text>
            <Text style={styles.menuSub}>{isPractice ? 'Practice mode: Scores will not be tracked' : 'AI adapts automatically to your recovery'}</Text>
          </Animated.View>
          
          <Animated.View entering={FadeInDown.delay(200).duration(400)}>
            <GlassCard variant="cognitive" style={[styles.diffCard, styles.recommendedCard]}>
               <View style={styles.levelInfo}>
                <Text style={styles.diffName}>Level: {activeDiff === 'easy' ? 'Low' : activeDiff === 'medium' ? 'Moderate' : 'High'}</Text>
                <Text style={styles.diffInfo}>
                  {isPractice ? 'Practice mode session' : 'Recommended based on your recent recovery'}
                </Text>
              </View>
              <Ionicons name="sparkles" size={20} color="#fff" />
            </GlassCard>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(350).duration(400)}>
            <GradientButton 
              title="▶  Start Training" 
              onPress={() => startGame(activeDiff)} 
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
          <Animated.View entering={FadeIn.duration(600)} style={styles.completeCenter}>
            <Text style={styles.completeEmoji}>🎉</Text>
            <Text style={styles.completeTitle}>Game Complete!</Text>
            <ScoreRing score={score} size={140} color={colors.cognitive} />
            <GlassCard variant="cognitive" style={styles.statsCard}>
               <View style={styles.statsRow}>
                <View style={styles.statItem}><Text style={styles.statVal}>{moves}</Text><Text style={styles.statLbl}>Moves</Text></View>
                <View style={styles.statItem}><Text style={[styles.statVal, { color: mistakes > 3 ? colors.error : colors.cognitive }]}>{mistakes}</Text><Text style={styles.statLbl}>Mistakes</Text></View>
                <View style={styles.statItem}><Text style={styles.statVal}>{elapsedSec}s</Text><Text style={styles.statLbl}>Time</Text></View>
              </View>
            </GlassCard>
            <GradientButton title="Play Again" onPress={() => setPhase('menu')} variant="cognitive" fullWidth />
          </Animated.View>
        </View>
      </View>
    );
  }

  // PLAYING & PREVIEW
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.content}>
        <View style={styles.gameStatsHeader}>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>TIME</Text>
            <Text style={[styles.statValue, { color: '#000' }]}>{elapsedSec}s</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>MATCHES</Text>
            <Text style={[styles.statValue, { color: '#000' }]}>{matches} <Text style={{fontSize: 12, color: 'rgba(0,0,0,0.5)'}}>/{config.pairs}</Text></Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>ERRORS</Text>
            <Text style={[styles.statValue, { color: mistakes > 3 ? colors.error : colors.cognitive }]}>{mistakes}</Text>
          </View>
        </View>

        <Text style={[styles.stepSubtitle, { marginBottom: spacing.md, marginTop: -spacing.sm }]}>
          {phase === 'preview' ? "Memorize card locations!" : "Find all matching pairs"}
        </Text>

        <View style={[styles.grid, { gap: 0 }]}>
          {cards.map((card, i) => (
            <MemoryCard 
              key={card.id}
              icon={card.symbol}
              isOpen={phase === 'preview' || card.flipped || card.matched}
              onPress={() => flipCard(i)}
              disabled={phase === 'preview'}
              style={{ width: cardSize, height: cardSize * 1.2 }}
            />
          ))}
        </View>
        <Pressable onPress={() => { 
            if (timerRef.current) clearInterval(timerRef.current); 
            if (previewTimerRef.current) clearTimeout(previewTimerRef.current);
            setPhase('menu'); 
          }} style={styles.quitBtn}>
          <Text style={styles.quitText}>Quit Game</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgPrimary },
  content: { flex: 1, padding: spacing.xl },
  menuHeader: { alignItems: 'center', marginBottom: spacing.xxl },
  menuEmoji: { fontSize: 56, marginBottom: spacing.md },
  menuTitle: { fontSize: typography.sizes.h2, fontFamily: typography.fonts.headingBold, fontWeight: '700', color: colors.textPrimary },
  menuSub: { fontSize: 14, color: colors.textSecondary, marginTop: 4 },
  
  diffCard: { marginBottom: spacing.md, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.lg },
  recommendedCard: { borderColor: colors.cognitive, borderWidth: 1.5 },
  levelInfo: { flex: 1 },
  recBadge: { backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, marginRight: spacing.md },
  recText: { color: '#fff', fontSize: 9, fontWeight: '700', letterSpacing: 0.5 },
  diffName: { fontSize: 18, fontFamily: typography.fonts.headingBold, color: colors.textPrimary },
  diffInfo: { fontSize: 13, color: colors.textMuted, marginTop: 2 },

  gameStatsHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.xl },
  statBox: { alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.03)', paddingVertical: 10, paddingHorizontal: 20, borderRadius: borderRadius.md, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  statLabel: { fontSize: 10, color: colors.textMuted, letterSpacing: 1, fontFamily: typography.fonts.bodySemiBold, marginBottom: 4 },
  statValue: { fontSize: 18, color: '#fff', fontFamily: typography.fonts.headingBold },
  stepSubtitle: { fontSize: 15, color: colors.textSecondary, textAlign: 'center' },
  
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' },
  memoryBtn: { borderRadius: borderRadius.md, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  
  quitBtn: { alignItems: 'center', marginTop: spacing.xl },
  quitText: { color: colors.textMuted, fontSize: 14 },
  
  completeCenter: { alignItems: 'center', justifyContent: 'center', flex: 1, gap: spacing.xl },
  completeEmoji: { fontSize: 56 },
  completeTitle: { fontSize: typography.sizes.h2, fontFamily: typography.fonts.headingBold, fontWeight: '700', color: colors.textPrimary },
  statsCard: { width: '100%' },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around' },
  statItem: { alignItems: 'center', gap: 4 },
  statVal: { fontSize: 22, fontFamily: typography.fonts.headingBold, fontWeight: '700', color: colors.cognitive },
  statLbl: { fontSize: 11, color: colors.textMuted },
});
