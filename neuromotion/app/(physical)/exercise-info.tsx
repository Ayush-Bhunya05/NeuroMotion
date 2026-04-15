// NeuroMotion AI — Exercise Info Screen (Dark Edition)
import React from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { typography, spacing } from '../../src/theme';
import GlassCard from '../../src/components/ui/GlassCard';
import GradientButton from '../../src/components/ui/GradientButton';
import { ExerciseType, EXERCISE_CONFIG } from '../../src/types/physical';

export default function ExerciseInfoScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const exerciseId = (id as ExerciseType) || 'squats';
  const config = EXERCISE_CONFIG[exerciseId];

  const STEPS: Record<string, string[]> = {
    squats: [
      "Stand with your feet shoulder-width apart.",
      "Keep your back straight and your core engaged.",
      "Lower your hips as if sitting in a chair, pushing weight into heels.",
      "Aim for a 90-degree bend at your knees.",
      "Push back up to the starting position."
    ],
    arm_raises: [
      "Stand straight with good posture.",
      "Keep your arms straight at your sides.",
      "Slowly raise arms out to the sides until shoulder height.",
      "Hold for a brief pause at the top.",
      "Slowly lower your arms back down."
    ]
  };

  const stepsList = STEPS[exerciseId as string] || [
    "Follow the on-screen posture guide.",
    "Perform the movement smoothly and continuously.",
    "Return to starting position."
  ];

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#0A0E27', '#161B33']} style={StyleSheet.absoluteFill} />
      
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <View style={styles.backBtnInner}>
            <Ionicons name="chevron-back" size={22} color="#00D9A6" />
          </View>
        </Pressable>
        <Text style={styles.headerTitle}>Module Intelligence</Text>
        <View style={{ width: 44 }} />
      </View>
      
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.duration(400)}>
          <GlassCard style={styles.mainCard} variant="dark">
            <View style={styles.iconContainer}>
              <Text style={styles.headerIcon}>{config?.icon || '💪'}</Text>
            </View>
            <Text style={styles.exerciseName}>{config?.name || 'Exercise'}</Text>
            <Text style={styles.exerciseDesc}>{config?.description || 'Get ready to move and strengthen your body.'}</Text>
            
            <View style={styles.metaRow}>
              <View style={styles.metaBox}>
                <Text style={styles.metaVal}>{config?.targetSets || 3}</Text>
                <Text style={styles.metaLabel}>Sets</Text>
              </View>
              <View style={styles.metaSeparator} />
              <View style={styles.metaBox}>
                <Text style={styles.metaVal}>{config?.targetReps || 10}</Text>
                <Text style={styles.metaLabel}>Reps</Text>
              </View>
              <View style={styles.metaSeparator} />
              <View style={styles.metaBox}>
                <Text style={[styles.metaVal, { textTransform: 'capitalize' }]}>{config?.difficulty || 'Medium'}</Text>
                <Text style={styles.metaLabel}>Level</Text>
              </View>
            </View>
          </GlassCard>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(100).duration(400)}>
          <Text style={styles.sectionHeader}>Execution Protocol</Text>
          <GlassCard variant="dark" style={styles.stepsCard}>
            {stepsList.map((step, idx) => (
              <View key={idx} style={styles.stepRow}>
                <View style={styles.stepNumberBadge}>
                  <Text style={styles.stepNumber}>{idx + 1}</Text>
                </View>
                <Text style={styles.stepText}>{step}</Text>
              </View>
            ))}
          </GlassCard>
          
          <GlassCard variant="dark" style={styles.tipsCard}>
            <View style={styles.tipsHeader}>
              <Ionicons name="shield-checkmark-outline" size={18} color="#00D9A6" />
              <Text style={styles.tipsTitle}>Safety Protocol</Text>
            </View>
            <Text style={styles.tipsText}>The AI tracks joint alignment in real-time. Move smoothly and stop if you experience acute pain.</Text>
          </GlassCard>
        </Animated.View>

        <View style={styles.bottomPad} />
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, spacing.lg) }]}>
        {exerciseId === 'squats' ? (
          <GradientButton 
            title="Initialize Squat Tracking" 
            variant="physical" 
            fullWidth 
            size="lg"
            onPress={() => router.push(`/(physical)/exercise?id=${id}` as any)} 
          />
        ) : (
          <GradientButton 
            title="AI Tracking Restricted" 
            variant="outline" 
            fullWidth 
            size="lg"
            disabled
            onPress={() => {}}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0E27' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingBottom: spacing.md },
  backBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  backBtnInner: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.05)', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 16, fontFamily: typography.fonts.headingBold, color: '#FFFFFF', letterSpacing: 1 },
  scroll: { padding: spacing.lg },
  mainCard: { alignItems: 'center', padding: spacing.xl, marginBottom: spacing.xl },
  iconContainer: { width: 84, height: 84, borderRadius: 42, backgroundColor: 'rgba(0, 217, 166, 0.1)', alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md, borderWidth: 1, borderColor: 'rgba(0, 217, 166, 0.2)' },
  headerIcon: { fontSize: 44 },
  exerciseName: { fontSize: 28, fontFamily: typography.fonts.headingBold, color: '#FFFFFF', marginBottom: 4 },
  exerciseDesc: { fontSize: 14, color: 'rgba(255,255,255,0.6)', textAlign: 'center', marginBottom: spacing.xl, paddingHorizontal: spacing.md, lineHeight: 20 },
  metaRow: { flexDirection: 'row', alignItems: 'center', width: '100%', justifyContent: 'space-evenly', backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 20, paddingVertical: spacing.lg },
  metaBox: { alignItems: 'center', flex: 1 },
  metaVal: { fontSize: 20, fontFamily: typography.fonts.headingBold, color: '#00D9A6', marginBottom: 2 },
  metaLabel: { fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 1 },
  metaSeparator: { width: 1, height: 32, backgroundColor: 'rgba(255,255,255,0.1)' },
  sectionHeader: { fontSize: 18, fontFamily: typography.fonts.headingBold, color: '#FFFFFF', marginBottom: spacing.md, marginTop: spacing.sm },
  stepsCard: { padding: spacing.lg, marginBottom: spacing.md },
  stepRow: { flexDirection: 'row', marginBottom: spacing.lg, alignItems: 'flex-start', gap: spacing.md },
  stepNumberBadge: { width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(0, 217, 166, 0.15)', alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  stepNumber: { fontSize: 14, fontFamily: typography.fonts.headingBold, color: '#00D9A6' },
  stepText: { flex: 1, fontSize: 14, color: 'rgba(255,255,255,0.8)', lineHeight: 22 },
  tipsCard: { borderColor: 'rgba(0, 217, 166, 0.2)', borderWidth: 1, padding: spacing.lg },
  tipsHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  tipsTitle: { fontSize: 15, fontFamily: typography.fonts.headingBold, color: '#00D9A6' },
  tipsText: { fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 20 },
  bottomPad: { height: 120 },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(10, 14, 39, 0.95)', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)', padding: spacing.xl }
});
