/**
 * Scoring Engine for Rehabilitation Exercises.
 *
 * Formula: finalScore = accuracy * 0.5 + romScore * 0.3 + consistency * 0.2
 *
 * Incorporates user biometrics (age, height, weight) for personalized scoring.
 */

import { ScoreBreakdown, PhysicalSessionData, UserMetrics } from '../types/physical';

/**
 * Calculate the complete score breakdown for a rehab session.
 */
export function calculateScore(session: PhysicalSessionData, userMetrics?: UserMetrics): ScoreBreakdown {
  const accuracy = calculateAccuracy(session);
  const romScore = calculateROMScore(session, userMetrics);
  const consistency = calculateConsistency(session);

  const finalScore = Math.round(accuracy * 0.5 + romScore * 0.3 + consistency * 0.2);

  const grade = getGrade(finalScore);
  const riskLevel = getRiskLevel(finalScore, session, userMetrics);
  const feedback = generateFeedback(accuracy, romScore, consistency, session, userMetrics);

  return {
    accuracy,
    romScore,
    consistency,
    finalScore,
    grade,
    feedback,
    riskLevel,
  };
}

/**
 * Accuracy = (correct reps / total reps) * 100
 */
function calculateAccuracy(session: PhysicalSessionData): number {
  if (session.totalReps === 0) return 0;
  return Math.round((session.correctReps / session.totalReps) * 100);
}

/**
 * ROM Score = How well the user achieves full range of motion.
 * Based on average angle achieved during bottom of reps.
 * Adjusts for age and BMI.
 */
function calculateROMScore(session: PhysicalSessionData, userMetrics?: UserMetrics): number {
  if (session.reps.length === 0) return 0;

  // Ideal bottom angle is ~90° for squat. Lower is better ROM.
  const idealAngle = 90;
  const avgBottomAngle = session.reps.reduce((sum, r) => sum + r.angle, 0) / session.reps.length;

  // Base ROM score: how close to ideal angle
  let romScore = 100 - Math.abs(avgBottomAngle - idealAngle);
  
  // Apply biometric adjustments
  if (userMetrics) {
    const ageBonus = getAgeBonus(userMetrics.age);
    const bmiBonus = getBMIBonus(userMetrics.height, userMetrics.weight);
    romScore += ageBonus + bmiBonus;
  }

  return Math.max(0, Math.min(100, Math.round(romScore)));
}

/**
 * Consistency = How uniform are the reps.
 * Measured via standard deviation of rep angles — lower variation = higher consistency.
 */
function calculateConsistency(session: PhysicalSessionData): number {
  if (session.reps.length < 2) return session.reps.length === 1 ? 75 : 0;

  const angles = session.reps.map(r => r.angle);
  const mean = angles.reduce((s, a) => s + a, 0) / angles.length;
  const variance = angles.reduce((s, a) => s + (a - mean) ** 2, 0) / angles.length;
  const stdDev = Math.sqrt(variance);

  // Perfect consistency = 0 stdDev = 100 score. 
  // Each degree of stdDev reduces score by 5 points.
  const score = 100 - stdDev * 5;
  return Math.max(0, Math.min(100, Math.round(score)));
}

/** Older users get leniency bonus */
function getAgeBonus(age: number): number {
  if (age > 60) return 15;
  if (age > 50) return 10;
  if (age > 40) return 5;
  return 0;
}

/** Higher BMI users get slight leniency */
function getBMIBonus(height: number, weight: number): number {
  const bmi = weight / ((height / 100) ** 2);
  if (bmi > 30) return 10;
  if (bmi > 25) return 5;
  return 0;
}

function getGrade(score: number): 'A' | 'B' | 'C' | 'D' | 'F' {
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  return 'F';
}

function getRiskLevel(
  score: number, 
  session: PhysicalSessionData, 
  userMetrics?: UserMetrics
): 'low' | 'moderate' | 'high' {
  let risk = 0;

  if (score < 50) risk += 2;
  else if (score < 70) risk += 1;

  if (session.angleVariation > 15) risk += 1;

  if (userMetrics) {
    if (userMetrics.age > 60) risk += 1;
    const bmi = userMetrics.weight / ((userMetrics.height / 100) ** 2);
    if (bmi > 30) risk += 1;
  }

  if (risk >= 3) return 'high';
  if (risk >= 1) return 'moderate';
  return 'low';
}

function generateFeedback(
  accuracy: number,
  romScore: number,
  consistency: number,
  session: PhysicalSessionData,
  userMetrics?: UserMetrics
): string[] {
  const feedback: string[] = [];

  // Accuracy feedback
  if (accuracy >= 90) feedback.push('Excellent form accuracy! Keep it up.');
  else if (accuracy >= 70) feedback.push('Good accuracy. Focus on controlled movements.');
  else feedback.push('Try to maintain proper form throughout each rep.');

  // ROM feedback
  if (romScore >= 90) feedback.push('Great range of motion achieved.');
  else if (romScore >= 70) feedback.push('Try to go a little deeper for better ROM.');
  else feedback.push('Focus on reaching full range of motion safely.');

  // Consistency feedback
  if (consistency >= 90) feedback.push('Very consistent reps — showing great control.');
  else if (consistency >= 70) feedback.push('Fairly consistent. Try to make each rep identical.');
  else feedback.push('Work on making each repetition more uniform.');

  // Biometric feedback
  if (userMetrics) {
    if (userMetrics.age > 50) {
      feedback.push('Remember to warm up thoroughly before exercises.');
    }
    const bmi = userMetrics.weight / ((userMetrics.height / 100) ** 2);
    if (bmi > 25) {
      feedback.push('Consider starting with fewer reps and building up gradually.');
    }
  }

  // Session specific
  if (session.totalReps < 5) {
    feedback.push('Try to complete at least 8-10 reps for better assessment.');
  }

  // ============== SQUAT-SPECIFIC PERFORMANCE & RECOMMENDATIONS ==============
  if (session.exerciseName.toLowerCase() === 'squat') {
    feedback.push('--- SQUAT PERFORMANCE ANALYSIS ---');
    
    // Depth Performance
    if (session.avgAngle > 105) {
      feedback.push(`Result: Shallow squat depth (Avg Angle: ${Math.round(session.avgAngle)}°). You did not reach parallel.`);
      feedback.push('Recommendation: Focus on ankle and hip mobility stretches. Try "Box Squats" to build confidence descending lower.');
    } else if (session.avgAngle < 70) {
      feedback.push(`Result: Deep squat achieved (Avg Angle: ${Math.round(session.avgAngle)}°).`);
      feedback.push('Recommendation: Excellent depth! Just ensure your lower back doesn\'t round ("butt wink") at the very bottom. If you feel lower back pain, stop slightly higher.');
    } else {
      feedback.push(`Result: Optimal squat depth (Avg Angle: ${Math.round(session.avgAngle)}°).`);
      feedback.push('Recommendation: You have great range of motion. Keep your chest up and focus on adding progressive resistance (weights) to challenge yourself.');
    }

    // Consistency Performance
    if (session.angleVariation > 15) {
      feedback.push(`Result: High rep inconsistency (Angle Variance: ${Math.round(session.angleVariation)}°).`);
      feedback.push('Recommendation: Your reps look very different from one another. Slow down your eccentric (lowering) tempo to 3 seconds to build better neuromuscular control.');
    } else {
      feedback.push(`Result: High movement consistency.`);
      feedback.push('Recommendation: Great motor control! Your reps are identical. You are ready to increase the difficulty.');
    }
  }
  // ========================================================================

  return feedback;
}

/**
 * Generate a mock/demo session for UI development and demo purposes.
 */
export function generateDemoSession(exerciseName: string = 'squat'): PhysicalSessionData {
  const repCount = 10;
  const reps = Array.from({ length: repCount }, (_, i) => ({
    repNumber: i + 1,
    angle: 85 + Math.random() * 20, // 85-105 degree range
    duration: 1.5 + Math.random() * 1.5,
    formScore: 70 + Math.floor(Math.random() * 30),
    timestamp: Date.now() - (repCount - i) * 3000,
  }));

  const angles = reps.map(r => r.angle);
  const avgAngle = angles.reduce((s, a) => s + a, 0) / angles.length;
  const correctReps = reps.filter(r => r.formScore >= 75).length;

  return {
    exerciseName,
    joint: 'knee',
    startTime: Date.now() - 45000,
    endTime: Date.now(),
    totalReps: repCount,
    correctReps,
    reps,
    avgAngle: Math.round(avgAngle * 10) / 10,
    maxAngle: Math.round(Math.max(...angles) * 10) / 10,
    minAngle: Math.round(Math.min(...angles) * 10) / 10,
    angleVariation: Math.round(
      Math.sqrt(angles.reduce((s, a) => s + (a - avgAngle) ** 2, 0) / angles.length) * 10
    ) / 10,
  };
}
