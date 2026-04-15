// NeuroMotion AI — Report Types
export type ReportType = 'physical' | 'cognitive' | 'unified';

export interface Report {
  id: string;
  type: ReportType;
  userId: string;
  physicalScore: number | null;
  cognitiveScore: number | null;
  unifiedScore: number | null;
  summary: string;
  insights: string[];
  recommendations: string[];
  sharedWith: string[];
  createdAt: string;
  exportUrl: string | null;
}

export interface ProgressDataPoint {
  date: string;
  score: number;
  label?: string;
}

export interface UnifiedRecoveryScore {
  physical: number | null;
  cognitive: number | null;
  unified: number;
  breakdown: {
    category: string;
    score: number;
    weight: number;
  }[];
  lastUpdated: string;
}
