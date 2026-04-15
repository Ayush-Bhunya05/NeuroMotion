// NeuroMotion AI — Constants
import { ModuleType } from '../types/user';

export const APP_NAME = 'NeuroMotion AI';
export const APP_VERSION = '1.0.0';

export const MODULE_LABELS: Record<ModuleType, { name: string; icon: string; color: string }> = {
  physical: { name: 'Physical Rehab', icon: '💪', color: '#00D9A6' },
  cognitive: { name: 'Cognitive Training', icon: '🧠', color: '#FF6B9D' },
};

export const JOINT_ANGLE_THRESHOLDS = {
  knee: { min: 10, ideal: 90, max: 180, tolerance: 15 },
  elbow: { min: 10, ideal: 90, max: 170, tolerance: 12 },
  shoulder: { min: 0, ideal: 180, max: 180, tolerance: 20 },
  hip: { min: 10, ideal: 90, max: 180, tolerance: 15 },
};

export const SCORING_WEIGHTS = {
  physical: { accuracy: 0.4, stability: 0.3, consistency: 0.3 },
  cognitive: { memoryAccuracy: 0.4, reactionSpeed: 0.3, consistency: 0.3 },
  unified: { physical: 0.5, cognitive: 0.5 },
};

export const REACTION_TIME_RATINGS = {
  excellent: 200,
  good: 350,
  average: 500,
  slow: 700,
};

export const DUMMY_USER = {
  id: 'user_001',
  name: 'Alex Johnson',
  email: 'alex@neuromotion.ai',
  phone: '+1 (555) 012-3456',
  dateOfBirth: '1990-06-15',
  role: 'user' as const,
  modules: ['physical', 'cognitive'] as ModuleType[],
  guardians: [
    { id: 'g1', name: 'Sarah Johnson', email: 'sarah@email.com', relationship: 'Spouse', addedAt: '2026-01-15' },
  ],
  doctorId: 'doc_001',
  avatarUrl: null,
  createdAt: '2026-01-01',
  updatedAt: '2026-04-04',
  cognitiveBaseline: {
    memory: { accuracy: 82, mistakes: 2, time: 45 },
    attentionScore: 90,
    reactionTimeMs: 380,
    functionalScore: 78, // Added to mock direct data fetching
  }
};

export const GOOGLE_MAPS_API_KEY = 'YOUR_GOOGLE_MAPS_API_KEY_HERE';
