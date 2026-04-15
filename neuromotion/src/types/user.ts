// NeuroMotion AI — User Types
export type UserRole = 'user' | 'doctor' | 'guardian';
export type ModuleType = 'physical' | 'cognitive' | 'dual';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  contact?: string;
  dateOfBirth?: string;
  role: UserRole;
  rehabGoal?: ModuleType;
  physicalProfile?: {
    height?: string;
    weight?: string;
    activityLevel?: string;
  } | null;
  physicalAssessment?: {
    selectedJoints?: string[];
    jointData?: Record<string, any>;
  } | null;
  cognitiveBaseline?: {
    memory?: { accuracy: number; mistakes: number; time: number };
    attentionScore?: number;
    reactionTimeMs?: number;
    sequence?: string[];
  } | null;
  progress?: { physical: number; cognitive: number };
  score?: { physical: number; cognitive: number };
  guardians: Guardian[];
  doctorId?: string | null; // Legacy support
  physicalDoctorId?: string | null; 
  cognitiveDoctorId?: string | null;
  avatarUrl?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface Guardian {
  id: string;
  name: string;
  email: string;
  contact?: string;
  relationship?: string;
  linkedPatientId?: string;
  addedAt?: string;
}

export interface DoctorProfile extends UserProfile {
  specialty?: string;
  module?: 'physical' | 'cognitive' | 'dual';
  patients?: string[]; // patient user IDs
}

// ==================== REHAB ONBOARDING TYPES ====================
// (Merged from EXERCISE project)

export interface BasicProfile {
  name: string;
  age: string;
  gender: 'Male' | 'Female' | 'Other' | 'Prefer not to say' | '';
}

export interface PhysicalContext {
  height: string; // cm
  weight: string; // kg
  activity_level: 'Low' | 'Moderate' | 'High' | '';
}

export interface GoalSelection {
  rehab_type: 'Joint' | 'Cognitive' | 'Both' | '';
}

export interface CommonJointFields {
  pain_level: number;
  pain_type: 'Aching' | 'Sharp' | 'Throbbing' | 'Burning' | 'Numbness' | '';
  pain_timing: 'Morning' | 'Night' | 'After Activity' | 'Constant' | '';
  mobility_level: 'Severely Limited' | 'Moderately Limited' | 'Slightly Limited' | 'Normal' | '';
  functional_issues: string[];
  injury_present: boolean;
  duration: 'Less than 1 week' | '1-4 weeks' | '1-6 months' | 'More than 6 months' | '';
  pain_triggers: string[];
}

export interface ShoulderFields extends CommonJointFields {
  arm_raise_level: 'Cannot raise' | 'Below shoulder' | 'Above shoulder' | 'Full range' | '';
  rotation_ability: 'Severely limited' | 'Slightly limited' | 'Normal' | '';
}

export interface KneeFields extends CommonJointFields {
  knee_bend_ability: 'Cannot bend' | 'Partially bend' | 'Fully bend' | '';
  knee_straighten_ability: 'Cannot straighten' | 'Partially straighten' | 'Fully straighten' | '';
  swelling: 'None' | 'Mild' | 'Moderate' | 'Severe' | '';
}

export interface ElbowFields extends CommonJointFields {
  elbow_bend_ability: 'Cannot bend' | 'Partially bend' | 'Fully bend' | '';
  elbow_straighten_ability: 'Cannot straighten' | 'Partially straighten' | 'Fully straighten' | '';
}

export type JointDetails = ShoulderFields | KneeFields | ElbowFields;

export interface UserRehabData {
  basicProfile: BasicProfile;
  physicalContext: PhysicalContext;
  goalSelection: GoalSelection;
  selectedJoints: string[];
  jointSpecificData: Record<string, JointDetails>;
}
