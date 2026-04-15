// NeuroMotion AI — Functional Recall (AI Dynamic Edition)
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Dimensions, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useLocalSearchParams, useRouter } from 'expo-router';
import Animated, { FadeIn, FadeInDown, SlideInRight } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius } from '../../src/theme';
import GlassCard from '../../src/components/ui/GlassCard';
import GradientButton from '../../src/components/ui/GradientButton';
import ScoreRing from '../../src/components/ui/ScoreRing';
import ProgressBar from '../../src/components/ui/ProgressBar';
import { useCognitive } from '../../src/contexts/CognitiveContext';
import { getRecommendedDifficulty } from '../../src/utils/adaptiveLogic';
import { generateGeminiStory, GeminiStory } from '../../src/services/geminiService';

const { width: SW } = Dimensions.get('window');

type Phase = 'menu' | 'ai_generating' | 'story_reading' | 'questioning' | 'results';

const STATIC_FALLBACK: GeminiStory = {
  id: 'f1',
  title: 'Daily Medication',
  content: 'Every morning at 8:15 AM, Sarah takes two red capsules with a full glass of apple juice. Her doctor, Dr. Peterson, reminded her to stay hydrated throughout the day.',
  readTime: 25,
  questions: [{ id: 'q1', text: 'At what time does she take her meds?', options: ['7:00 AM', '8:15 AM', '9:15 AM'], correct: 1 }]
};

export default function FunctionalRecallScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const router = useRouter();
  const { practice, level } = useLocalSearchParams();
  const isPractice = practice === 'true';
  const { state, dispatch } = useCognitive();

  const [phase, setPhase] = useState<Phase>('menu');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('easy');
  const [sessionStory, setSessionStory] = useState<GeminiStory | null>(null);
  const [userAnswers, setUserAnswers] = useState<Record<string, number>>({});
  const [qIndex, setQIndex] = useState(0);
  const [timer, setTimer] = useState(0);
  const [startTime, setStartTime] = useState(0);
  const [finalScore, setFinalScore] = useState(0);

  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (phase === 'menu') {
      const rec = level && ['easy', 'medium', 'hard'].includes(String(level).toLowerCase())
        ? String(level).toLowerCase() as any : getRecommendedDifficulty(state.sessions, 'story');
      setDifficulty(rec);
    }
  }, [state.sessions, level, phase]);

  const onStartMission = async () => {
    setPhase('ai_generating');
    
    // 🧠 AI Dynamic Call
    const aiResult = !isPractice ? await generateGeminiStory(difficulty) : null;
    const finalStory = aiResult || STATIC_FALLBACK;
    
    // Safety check content
    if (!finalStory.content) {
       setSessionStory(STATIC_FALLBACK);
    } else {
       setSessionStory(finalStory);
    }

    setPhase('story_reading');
    setTimer(finalStory.readTime || 25);
    setUserAnswers({});
    setQIndex(0);
    setStartTime(Date.now());

    if (countdownRef.current) clearInterval(countdownRef.current);
    countdownRef.current = setInterval(() => {
      setTimer(prev => {
        if (prev <= 1) { 
          if (countdownRef.current) clearInterval(countdownRef.current);
          setPhase('questioning');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const skipReading = () => {
    if (countdownRef.current) clearInterval(countdownRef.current);
    setPhase('questioning');
  };

  const onSelectOption = (idx: number) => {
    const qId = sessionStory?.questions[qIndex].id || '';
    setUserAnswers(prev => ({ ...prev, [qId]: idx }));
    setTimeout(() => {
      if (qIndex < (sessionStory?.questions?.length || 0) - 1) {
        setQIndex(i => i + 1);
      } else {
        processResults();
      }
    }, 300);
  };

  const processResults = () => {
    if (!sessionStory) return;
    let correctTotal = 0;
    sessionStory.questions.forEach(q => { if (Number(userAnswers[q.id]) === Number(q.correct)) correctTotal++; });
    const acc = Math.round((correctTotal / sessionStory.questions.length) * 100);
    const lapsed = (Date.now() - startTime) / 1000;
    const score = Math.round(acc * 0.9 + Math.max(0, 100 - lapsed) * 0.1);
    setFinalScore(score);
    setPhase('results');

    if (!isPractice) {
      dispatch({ 
        type: 'ADD_SESSION',
        payload: { gameType: 'story', accuracy: acc, responseTime: Math.round(lapsed * 1000 / sessionStory.questions.length), mistakes: sessionStory.questions.length - correctTotal, score, level: difficulty === 'easy' ? 1 : difficulty === 'medium' ? 2 : 3, duration: Math.round(lapsed) }
      });
    }
  };

  useEffect(() => {
    const hidden = ['ai_generating', 'story_reading', 'questioning'].includes(phase);
    navigation.setOptions({ tabBarStyle: hidden ? { display: 'none' } : undefined });
    return () => { if (countdownRef.current) clearInterval(countdownRef.current); };
  }, [phase, navigation]);

  if (phase === 'menu') {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.paddingBox}>
          <Animated.View entering={FadeInDown.duration(600)} style={styles.heroBox}>
             <View style={styles.iconCircle}><Text style={{fontSize: 48}}>📄</Text></View>
             <Text style={styles.title}>Functional Recall</Text>
             <Text style={styles.subtitle}>AI-Driven Memory Challenges</Text>
          </Animated.View>
          <Animated.View entering={FadeInDown.delay(200).duration(500)} style={{ flex: 1, justifyContent: 'flex-end', paddingBottom: 20 }}>
            <GlassCard variant="cognitive" style={styles.diffCard}>
               <View style={{ flex: 1, gap: 2 }}>
                 <Text style={styles.diffLabel}>Daily Goal: {difficulty.toUpperCase()}</Text>
                 <Text style={styles.diffInfo}>Gemini AI crafts unique comprehension missions for you.</Text>
               </View>
               <Ionicons name="sparkles" size={24} color={colors.cognitive} />
            </GlassCard>
            <GradientButton title="▶  Initialize Session" onPress={onStartMission} size="lg" fullWidth variant="cognitive" />
          </Animated.View>
        </View>
      </View>
    );
  }

  if (phase === 'ai_generating') {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={colors.cognitive} />
        <Text style={styles.loadingTitle}>🤖 Processing Scenario...</Text>
        <Text style={styles.loadingSub}>Personalizing AI story for mission {difficulty.toUpperCase()}</Text>
      </View>
    );
  }

  if (phase === 'story_reading') {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.paddingBox}>
          <View style={styles.timerHeader}>
             <View style={{flexDirection:'row', justifyContent:'space-between', marginBottom: 12}}>
               <Text style={styles.timerTitle}>Retention Time</Text>
               <Text style={styles.timerValue}>{timer}s</Text>
             </View>
             <ProgressBar value={(timer / (sessionStory?.readTime || 25)) * 100} color={colors.cognitive} />
          </View>
          <Animated.View entering={FadeIn.duration(800)} style={{ flex: 1 }}>
            <GlassCard variant="cognitive" style={styles.paperBox}>
               <Text style={styles.paperTitle}>{sessionStory?.title || 'Memory Task'}</Text>
               <ScrollView showsVerticalScrollIndicator={false}>
                  <Text style={styles.paperContent}>{sessionStory?.content || "AI generation completed but content is null. Click button to retry."}</Text>
               </ScrollView>
            </GlassCard>
            <View style={{marginTop: 24}}>
              <GradientButton title="I Have Memorized This" onPress={skipReading} variant="primary" />
            </View>
          </Animated.View>
        </View>
      </View>
    );
  }

  if (phase === 'questioning') {
    const currentQ = sessionStory?.questions[qIndex];
    if (!currentQ) return null;
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.paddingBox}>
          <View style={styles.qHeader}>
             <Text style={styles.qStatus}>{qIndex + 1} of {sessionStory?.questions.length}</Text>
             <View style={styles.dotRow}>{sessionStory?.questions.map((_, i) => (
                 <View key={i} style={[styles.dot, i === qIndex && styles.dotActive, i < qIndex && styles.dotDone]} />
               ))}</View>
          </View>
          <Animated.View key={qIndex} entering={SlideInRight.duration(400)} style={{ flex: 1 }}>
            <Text style={styles.questionText}>{currentQ.text}</Text>
            <View style={{ gap: 12 }}>{currentQ.options.map((opt, i) => (
                <Pressable key={i} onPress={() => onSelectOption(i)} style={styles.optionBtn}>
                  <View style={styles.optLetter}><Text style={styles.optLetterTxt}>{String.fromCharCode(65+i)}</Text></View>
                  <Text style={styles.optTxt}>{opt}</Text>
                </Pressable>
              ))}</View>
          </Animated.View>
        </View>
      </View>
    );
  }

  if (phase === 'results') {
    return (
       <View style={[styles.container, styles.center]}>
          <Animated.View entering={FadeIn.duration(800)} style={{ alignItems: 'center', width:'100%' }}>
             <Text style={{fontSize: 64}}>🎯</Text>
             <Text style={styles.resultsTitle}>Recall Speed: {finalScore}%</Text>
             <ScoreRing score={finalScore} size={150} color={colors.cognitive} />
             <View style={{width: '100%', gap: 12, marginTop: 40}}>
                <GradientButton title="Confirm Results" onPress={() => router.replace('/(cognitive)/tests')} variant="cognitive" fullWidth />
             </View>
          </Animated.View>
       </View>
    );
  }
  return null;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgPrimary },
  paddingBox: { flex: 1, padding: spacing.xl },
  center: { justifyContent: 'center', alignItems: 'center', padding: spacing.xxl },

  heroBox: { alignItems: 'center', marginVertical: 60 },
  iconCircle: { width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(142, 36, 170, 0.1)', alignItems: 'center', justifyContent: 'center', marginBottom: spacing.lg, borderWidth: 1, borderColor: 'rgba(142, 36, 170, 0.2)' },
  title: { fontSize: 32, fontFamily: typography.fonts.headingBold, color: colors.textPrimary },
  subtitle: { fontSize: 16, color: colors.textSecondary, marginTop: 4, textAlign: 'center' },

  diffCard: { marginBottom: spacing.xl, flexDirection: 'row', alignItems: 'center', padding: spacing.lg, borderColor: 'rgba(142, 36, 170, 0.3)', borderWidth: 1, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.05)' },
  diffLabel: { fontSize: 13, color: colors.cognitive, fontWeight: '700', textTransform: 'uppercase' },
  diffInfo: { fontSize: 13, color: colors.textSecondary, lineHeight: 18 },

  loadingTitle: { fontSize: 22, fontWeight: '700', color: colors.textPrimary, marginTop: 20 },
  loadingSub: { color: colors.textMuted, marginTop: 8 },

  timerHeader: { marginBottom: 30 },
  timerTitle: { fontSize: 13, color: colors.textSecondary, fontWeight: '600' },
  timerValue: { fontSize: 18, color: colors.cognitive, fontWeight: '700' },
  
  paperBox: { flex: 1, padding: 24, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: 'rgba(142, 36, 170, 0.15)', borderRadius: 20 },
  paperTitle: { fontSize: 24, fontFamily: typography.fonts.headingBold, color: colors.cognitive, marginBottom: 16 },
  paperContent: { fontSize: 18, lineHeight: 30, color: '#1A1D28', fontFamily: typography.fonts.bodyMedium },

  qHeader: { marginBottom: 40 },
  qStatus: { fontSize: 12, color: colors.textMuted, marginBottom: 10, fontWeight: '700' },
  dotRow: { flexDirection: 'row', gap: 6 },
  dot: { flex: 1, height: 4, borderRadius: 2, backgroundColor: 'rgba(0,0,0,0.05)' },
  dotActive: { backgroundColor: colors.cognitive },
  dotDone: { backgroundColor: 'rgba(142, 36, 170, 0.3)' },
  questionText: { fontSize: 26, fontFamily: typography.fonts.headingBold, color: colors.textPrimary, marginBottom: 40 },
  optionBtn: { flexDirection: 'row', alignItems: 'center', padding: 18, backgroundColor: 'rgba(255,255,255,1)', borderRadius: 20, borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)' },
  optLetter: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(142, 36, 170, 0.1)', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  optLetterTxt: { color: colors.cognitive, fontWeight: '700' },
  optTxt: { flex: 1, fontSize: 16, color: colors.textSecondary },

  resultsTitle: { fontSize: 22, fontWeight: '700', color: colors.textPrimary, marginBottom: 20 },
});
