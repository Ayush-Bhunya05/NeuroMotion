// NeuroMotion AI — Adaptive Logic (Cognitive & Physical)
import { CognitiveSession } from '../types/cognitive';

type Difficulty = 'easy' | 'medium' | 'hard';

/**
 * Advanced CLINICAL Difficulty Logic (Cognitive)
 * This determines the next recommended training level based on historical trends.
 */
export function getRecommendedDifficulty(
  sessions: any[],
  gameType: 'memory' | 'reaction' | 'attention' | 'story'
): Difficulty {
  const gameSessions = sessions.filter(s => s.gameType === gameType);
  if (gameSessions.length === 0) return 'easy';

  // Make sure we evaluate the most recent session
  const sortedSessions = [...gameSessions].sort((a, b) => b.createdAt - a.createdAt);
  const latest = sortedSessions[0];
  const lastScore = latest.score;
  const lastLevel = latest.level; // 1 = easy, 2 = medium, 3 = hard

  // Classic Staircase Adaptability Logic
  // Step DOWN a level if poor performance
  if (lastScore < 50) {
    if (lastLevel === 3) return 'medium';
    return 'easy'; 
  }
  
  // Step UP a level if excellent performance
  if (lastScore > 80) {
    if (lastLevel === 1) return 'medium';
    return 'hard';
  }

  // Preserve the current difficulty tier if performance is average
  if (lastLevel === 3) return 'hard';
  if (lastLevel === 2) return 'medium';
  return 'easy';
}

/**
 * Physical Adaptability Logic
 * This determines target REPS and SETS based on physical session history.
 */
export function getRecommendedPhysicalSettings(
  sessions: any[],
  exerciseId: string,
  base: { reps: number; sets: number }
) {
  const exerciseSessions = sessions
    .filter(s => s.exerciseName?.toLowerCase()?.includes(exerciseId.toLowerCase().replace('_', '')))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  if (exerciseSessions.length === 0) return base;

  const latest = exerciseSessions[0];
  const accuracy = latest.scoreResult?.accuracy || 0;
  const romScore = latest.scoreResult?.romScore || 0;

  let newReps = base.reps;
  let newSets = base.sets;

  // 1. Performance-based increment
  if (accuracy > 90 && romScore > 85) {
    newReps += 2;
  } else if (accuracy < 50) {
    newReps = Math.max(base.reps - 2, 5);
  }

  // 2. Volume-based adjustment
  if (exerciseSessions.length >= 5 && accuracy > 80) {
     newSets = Math.min(base.sets + 1, 5);
  }

  return { reps: newReps, sets: newSets };
}
