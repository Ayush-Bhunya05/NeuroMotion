// NeuroMotion AI — Cognitive Module Types
export type CognitiveGameType = 'memory' | 'reaction' | 'attention' | 'story';

export interface MemoryCard {
  id: number;
  symbol: string;
  isFlipped: boolean;
  isMatched: boolean;
}

export interface MemoryGameState {
  cards: MemoryCard[];
  flippedIndices: number[];
  matchedPairs: number;
  totalPairs: number;
  moves: number;
  startTime: number | null;
  elapsedTime: number;
  isComplete: boolean;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface ReactionTestState {
  phase: 'waiting' | 'ready' | 'go' | 'tooEarly' | 'result' | 'complete';
  reactionTimes: number[];
  currentRound: number;
  totalRounds: number;
  targetAppearTime: number | null;
  averageTime: number;
  bestTime: number;
  isComplete: boolean;
}

export interface CognitiveSession {
  id: string;
  gameType: CognitiveGameType;
  accuracy: number;
  responseTime: number; // avg ms
  mistakes: number;
  score: number;
  level: number;
  duration: number;
  timestamp: string;
  localDate: string;
}

export interface CognitiveScore {
  overall: number;
  memoryAccuracy: number;
  attentionScore: number;
  reactionSpeed: number;
  functionalScore: number;
  consistency: number;
  trend: 'improving' | 'stable' | 'declining';
  sessionsCompleted: number;
  lastSessionDate: string;
}

export interface BrainRegion {
  id: string;
  name: string;
  area: 'memory' | 'attention' | 'processing' | 'coordination';
  performance: number; // 0-100
  color: string;
  description: string;
}

export const MEMORY_SYMBOLS = [
  '🧠', '💡', '⚡', '🎯', '🔬', '💊', '🏥', '❤️',
  '🌟', '🔮', '🎨', '🎵', '🌈', '🦋', '🍀', '💎',
  '🔥', '🌙',
];

export const DIFFICULTY_CONFIG = {
  easy: { pairs: 6, gridCols: 3, timeBonus: 1.2 },
  medium: { pairs: 8, gridCols: 4, timeBonus: 1.0 },
  hard: { pairs: 12, gridCols: 4, timeBonus: 0.8 },
} as const;
