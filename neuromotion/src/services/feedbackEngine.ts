// NeuroMotion AI — Local Clinical Insight Engine (3-Game Edition)
import { CognitiveSession, CognitiveScore } from '../types/cognitive';

export const AI_DISCLAIMER = "Clinical insights are generated based on kinematic and cognitive session data and should be used as a reference for your specialist.";

/**
 * Calculates a single 'Unified Recovery Index' from multiple health modules.
 */
export function calculateUnifiedScore(physicalValue: number | null, cognitiveValue: number | null): number {
  const p = physicalValue ?? 0;
  const c = cognitiveValue ?? 0;
  if (physicalValue !== null && cognitiveValue !== null) return Math.round((p + c) / 2);
  return Math.round(p || c || 0);
}

/**
 * Generates clinical insights locally based on session performance for 3 core games.
 */
export function generateLocalCognitiveInsights(sessions: CognitiveSession[], currentScore: any) {
  const getAvg = (type: string) => {
    const filtered = sessions.filter(s => s.gameType === type);
    if (filtered.length === 0) return 0;
    return filtered.reduce((acc, s) => acc + (type === 'memory' ? s.accuracy : s.score), 0) / filtered.length;
  };

  const memAvg = getAvg('memory');
  const attAvg = getAvg('attention');
  const reaAvg = getAvg('reaction');

  const insights: Record<string, string> = {
    memory: memAvg > 80 ? "Memory encoding is optimal." : "Improve recall consistency.",
    attention: attAvg > 75 ? "Focus stability is high." : "Address focus fluctuations.",
    reaction: reaAvg > 70 ? "Neural reflexes are sharp." : "Reduce metabolic delay."
  };

  return {
    goal: "Cognitive Agility & Neuro-Plasticity",
    insights,
    tasks: [
      { id: 'memory', level: memAvg > 80 ? 'Hard' : 'Moderate' },
      { id: 'attention', level: attAvg > 80 ? 'Hard' : 'Moderate' },
      { id: 'reaction', level: reaAvg > 80 ? 'Hard' : 'Moderate' },
    ],
    suggestions: {
      how: "Maintain consistent training times.",
      why: "Regular stimulus cycles improve synaptic reinforcement."
    }
  };
}

/**
 * Legacy support for Unified Report feedback arrays.
 */
export function generateCognitiveFeedback(sessions: CognitiveSession[]) {
    if (sessions.length === 0) return [{ type: 'info', message: 'More sessions needed for clinical trends.' }];
    const avgScore = sessions.reduce((acc, s) => acc + s.score, 0) / sessions.length;
    
    const feedback = [];
    if (avgScore > 80) feedback.push({ type: 'positive', message: 'Cognitive resilience is trending above threshold.' });
    else feedback.push({ type: 'info', message: 'Consistent daily training will improve neural plasticity.' });
    
    return feedback;
}

/**
 * Physical Insight Engine (Kinematic Analysis)
 */
export function generateKinematicClinicalInsights(sessions: any[]) {
    if (!sessions || sessions.length === 0) return [{ type: 'info', message: 'No kinematic data found for analysis.' }];

    const insights = [];
    const latest = sessions[0];
    const avgRom = sessions.reduce((acc, s) => acc + (s.scoreResult?.romScore || 0), 0) / sessions.length;

    if (latest?.scoreResult?.accuracy > 90) insights.push({ type: 'positive', message: 'Movement precision is excellent.' });
    if (avgRom > 80) insights.push({ type: 'positive', message: 'Range of Motion (ROM) is stable.' });
    else insights.push({ type: 'info', message: 'Focus on full extension to maximize joint recovery.' });

    return insights;
}
