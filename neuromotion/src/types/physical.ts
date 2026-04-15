// NeuroMotion AI — Physical Module Types
export interface JointAngles {
  leftKnee: number;
  rightKnee: number;
  leftShoulder: number;
  rightShoulder: number;
  leftHip: number;
  rightHip: number;
}

export interface PoseLandmark {
  x: number;
  y: number;
  z: number;
  visibility: number;
}

export interface PoseData {
  landmarks: PoseLandmark[];
  jointAngles: JointAngles;
  timestamp: number;
}

export type ExerciseType = 'squats' | 'arm_raises' | 'shoulder_rotation' | 'knee_bends' | 'lunges';

export interface ExerciseState {
  type: ExerciseType;
  phase: 'idle' | 'starting' | 'active' | 'rest' | 'completed';
  currentRep: number;
  targetReps: number;
  currentSet: number;
  targetSets: number;
  repPhase: 'up' | 'down' | 'hold' | 'transition';
}

export interface ExerciseSession {
  id: string;
  exerciseType: ExerciseType;
  reps: number;
  sets: number;
  duration: number; // seconds
  jointAngles: JointAngles;
  scoreResult?: {
    accuracy: number;
    romScore: number;
    consistency: number;
    finalScore: number;
    grade: string;
    feedback: string[];
    riskLevel: string;
  };
  feedback: string[];
  timestamp: string;
}

export interface PhysicalScore {
  overall: number;
  accuracy: number;
  stability: number;
  consistency: number;
  rangeOfMotion: number;
  trend: 'improving' | 'stable' | 'declining';
  sessionsCompleted: number;
  lastSessionDate: string;
}

export interface JointHealth {
  joint: string;
  currentAngle: number;
  idealAngle: number;
  deviation: number;
  status: 'good' | 'moderate' | 'poor';
  recommendation: string;
}

export const EXERCISE_CONFIG: Record<ExerciseType, {
  name: string;
  description: string;
  icon: string;
  targetReps: number;
  targetSets: number;
  primaryJoints: string[];
  difficulty: 'easy' | 'medium' | 'hard';
}> = {
  squats: {
    name: 'Squats',
    description: 'Lower body strength and knee rehabilitation',
    icon: '🏋️',
    targetReps: 10,
    targetSets: 3,
    primaryJoints: ['leftKnee', 'rightKnee', 'leftHip', 'rightHip'],
    difficulty: 'medium',
  },
  arm_raises: {
    name: 'Arm Raises',
    description: 'Shoulder mobility and upper body recovery',
    icon: '🙌',
    targetReps: 12,
    targetSets: 3,
    primaryJoints: ['leftShoulder', 'rightShoulder'],
    difficulty: 'easy',
  },
  shoulder_rotation: {
    name: 'Shoulder Rotation',
    description: 'Rotator cuff rehabilitation and mobility',
    icon: '🔄',
    targetReps: 10,
    targetSets: 2,
    primaryJoints: ['leftShoulder', 'rightShoulder'],
    difficulty: 'easy',
  },
  knee_bends: {
    name: 'Knee Bends',
    description: 'Knee joint flexibility and strength',
    icon: '🦿',
    targetReps: 15,
    targetSets: 2,
    primaryJoints: ['leftKnee', 'rightKnee'],
    difficulty: 'easy',
  },
  lunges: {
    name: 'Lunges',
    description: 'Balance, coordination, and leg strength',
    icon: '🏃',
    targetReps: 8,
    targetSets: 3,
    primaryJoints: ['leftKnee', 'rightKnee', 'leftHip', 'rightHip'],
    difficulty: 'hard',
  },
};

// ==================== REHAB / POSE DETECTION TYPES ====================
// (Merged from EXERCISE project — rehabTypes.ts)

export type JointName = 'shoulder' | 'knee';

export interface Keypoint {
  x: number;
  y: number;
  score?: number;
  name?: string;
}

// Re-export ExerciseState name used by repCounter (string literal union)
export type ExerciseMovementState = 'idle' | 'descending' | 'bottom' | 'ascending' | 'top';

export interface ExerciseConfigRehab {
  name: string;
  displayName: string;
  joint: JointName;
  targetMuscles: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  defaultReps: number;
  defaultSets: number;
  restTime: number;
  description: string;
  anglePoints: [string, string, string];
  thresholds: {
    topAngle: number;
    bottomAngle: number;
    tolerance: number;
  };
  feedbackRules: FeedbackRule[];
}

export interface FeedbackRule {
  name: string;
  condition: string;
  message: string;
  severity: 'info' | 'warning' | 'error';
}

// ==================== SESSION TYPES ====================

export interface RepData {
  repNumber: number;
  angle: number;
  duration: number;
  formScore: number;
  timestamp: number;
}

export interface PhysicalSessionData {
  id?: string;
  userId?: string;
  exerciseName: string;
  joint: JointName;
  startTime: number;
  endTime?: number;
  totalReps: number;
  correctReps: number;
  reps: RepData[];
  avgAngle: number;
  maxAngle: number;
  minAngle: number;
  angleVariation: number;
  coachingEvents?: any[];
  createdAt?: any;
}

// ==================== SCORING TYPES ====================

export interface ScoreBreakdown {
  accuracy: number;
  romScore: number;
  consistency: number;
  finalScore: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  feedback: string[];
  riskLevel: 'low' | 'moderate' | 'high';
}

export interface UserMetrics {
  age: number;
  height: number;
  weight: number;
  activityLevel: 'Low' | 'Moderate' | 'High';
}

// ==================== DASHBOARD TYPES ====================

export interface DailyProgress {
  date: string;
  score: number;
  reps: number;
  sessions: number;
}

export interface ExerciseHistory {
  exerciseName: string;
  sessions: PhysicalSessionData[];
  bestScore: number;
  lastScore: number;
  totalReps: number;
}

// ==================== STREAK / GAMIFICATION ====================

export type UserLevel = 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Diamond';

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastExerciseDate: string | null;
  totalSessions: number;
  level: UserLevel;
  milestones: string[];
}
