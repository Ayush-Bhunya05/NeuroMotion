/**
 * Streak Tracker — Gamification system for daily exercise engagement.
 * 
 * Tracks:
 * - Current & longest streaks (consecutive days)
 * - Total sessions completed
 * - User level (Bronze → Silver → Gold → Platinum → Diamond)
 * - Milestone achievements
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const STREAK_KEY = 'user_streak_data';

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastExerciseDate: string | null;  // ISO date string (YYYY-MM-DD)
  totalSessions: number;
  level: UserLevel;
  milestones: string[];  // achieved milestone IDs
}

export type UserLevel = 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Diamond';

export interface LevelInfo {
  level: UserLevel;
  emoji: string;
  color: string;
  minSessions: number;
  nextLevel: UserLevel | null;
  nextLevelSessions: number | null;
}

const LEVEL_THRESHOLDS: LevelInfo[] = [
  { level: 'Bronze', emoji: '🥉', color: '#CD7F32', minSessions: 0, nextLevel: 'Silver', nextLevelSessions: 10 },
  { level: 'Silver', emoji: '🥈', color: '#C0C0C0', minSessions: 10, nextLevel: 'Gold', nextLevelSessions: 30 },
  { level: 'Gold', emoji: '🥇', color: '#FFD700', minSessions: 30, nextLevel: 'Platinum', nextLevelSessions: 75 },
  { level: 'Platinum', emoji: '💎', color: '#E5E4E2', minSessions: 75, nextLevel: 'Diamond', nextLevelSessions: 150 },
  { level: 'Diamond', emoji: '💠', color: '#B9F2FF', minSessions: 150, nextLevel: null, nextLevelSessions: null },
];

export interface MilestoneInfo {
  id: string;
  name: string;
  emoji: string;
  description: string;
  check: (data: StreakData) => boolean;
}

export const MILESTONES: MilestoneInfo[] = [
  { id: 'first_session', name: 'First Steps', emoji: '👣', description: 'Complete your first session', check: (d) => d.totalSessions >= 1 },
  { id: 'streak_3', name: 'Hat Trick', emoji: '🎩', description: '3-day streak', check: (d) => d.currentStreak >= 3 || d.longestStreak >= 3 },
  { id: 'streak_7', name: 'Week Warrior', emoji: '⚔️', description: '7-day streak', check: (d) => d.currentStreak >= 7 || d.longestStreak >= 7 },
  { id: 'streak_14', name: 'Fortnight Strong', emoji: '💪', description: '14-day streak', check: (d) => d.currentStreak >= 14 || d.longestStreak >= 14 },
  { id: 'streak_30', name: 'Monthly Master', emoji: '🏆', description: '30-day streak', check: (d) => d.currentStreak >= 30 || d.longestStreak >= 30 },
  { id: 'sessions_10', name: 'Getting Serious', emoji: '🔥', description: '10 total sessions', check: (d) => d.totalSessions >= 10 },
  { id: 'sessions_50', name: 'Half Century', emoji: '🌟', description: '50 total sessions', check: (d) => d.totalSessions >= 50 },
  { id: 'sessions_100', name: 'Centurion', emoji: '👑', description: '100 total sessions', check: (d) => d.totalSessions >= 100 },
];

const DEFAULT_STREAK: StreakData = {
  currentStreak: 0,
  longestStreak: 0,
  lastExerciseDate: null,
  totalSessions: 0,
  level: 'Bronze',
  milestones: [],
};

function getTodayDateStr(): string {
  return new Date().toISOString().split('T')[0];  // YYYY-MM-DD
}

function getYesterdayDateStr(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split('T')[0];
}

function calculateLevel(totalSessions: number): UserLevel {
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (totalSessions >= LEVEL_THRESHOLDS[i].minSessions) {
      return LEVEL_THRESHOLDS[i].level;
    }
  }
  return 'Bronze';
}

/**
 * Load streak data from storage.
 */
export async function loadStreakData(): Promise<StreakData> {
  try {
    const json = await AsyncStorage.getItem(STREAK_KEY);
    if (json) {
      const data = JSON.parse(json) as StreakData;
      
      // Check if streak is broken (last exercise was not today or yesterday)
      const today = getTodayDateStr();
      const yesterday = getYesterdayDateStr();
      
      if (data.lastExerciseDate && data.lastExerciseDate !== today && data.lastExerciseDate !== yesterday) {
        // Streak broken!
        data.currentStreak = 0;
        await saveStreakData(data);
      }
      
      return data;
    }
    return { ...DEFAULT_STREAK };
  } catch {
    return { ...DEFAULT_STREAK };
  }
}

/**
 * Save streak data to storage.
 */
async function saveStreakData(data: StreakData): Promise<void> {
  try {
    await AsyncStorage.setItem(STREAK_KEY, JSON.stringify(data));
  } catch {
    // Silently fail
  }
}

/**
 * Record a completed session. Updates streak, level, and milestones.
 * Returns newly unlocked milestones (if any).
 */
export async function recordSession(): Promise<{ data: StreakData; newMilestones: MilestoneInfo[] }> {
  const data = await loadStreakData();
  const today = getTodayDateStr();
  const yesterday = getYesterdayDateStr();

  // Increment total sessions
  data.totalSessions++;

  // Update streak
  if (data.lastExerciseDate === today) {
    // Already exercised today — no streak change, just session count
  } else if (data.lastExerciseDate === yesterday) {
    // Consecutive day!
    data.currentStreak++;
  } else if (data.lastExerciseDate === null) {
    // First ever session
    data.currentStreak = 1;
  } else {
    // Gap in days — streak resets
    data.currentStreak = 1;
  }

  data.lastExerciseDate = today;

  // Update longest streak
  if (data.currentStreak > data.longestStreak) {
    data.longestStreak = data.currentStreak;
  }

  // Update level
  data.level = calculateLevel(data.totalSessions);

  // Check milestones
  const newMilestones: MilestoneInfo[] = [];
  for (const m of MILESTONES) {
    if (!data.milestones.includes(m.id) && m.check(data)) {
      data.milestones.push(m.id);
      newMilestones.push(m);
    }
  }

  await saveStreakData(data);
  return { data, newMilestones };
}

/**
 * Get the current level info with progress to next level.
 */
export function getLevelInfo(data: StreakData): LevelInfo & { progress: number } {
  const currentIdx = LEVEL_THRESHOLDS.findIndex(l => l.level === data.level);
  const current = LEVEL_THRESHOLDS[currentIdx] || LEVEL_THRESHOLDS[0];
  
  let progress = 1;
  if (current.nextLevelSessions) {
    progress = Math.min(1, (data.totalSessions - current.minSessions) / (current.nextLevelSessions - current.minSessions));
  }

  return { ...current, progress };
}

/**
 * Check if streak is about to break (exercised yesterday but not today, and it's evening).
 */
export function isStreakAtRisk(data: StreakData): boolean {
  if (data.currentStreak === 0) return false;
  
  const today = getTodayDateStr();
  const yesterday = getYesterdayDateStr();
  const hour = new Date().getHours();
  
  // If last exercise was yesterday and it's after 6 PM, streak is at risk
  if (data.lastExerciseDate === yesterday && hour >= 18) {
    return true;
  }
  
  // If last exercise was today, streak is safe
  if (data.lastExerciseDate === today) {
    return false;
  }
  
  return false;
}
