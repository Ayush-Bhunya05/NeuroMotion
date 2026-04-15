// NeuroMotion AI — Math Utilities for Joint Angles
import { PoseLandmark } from '../types/physical';

export interface Point3D {
  x: number;
  y: number;
  z: number;
}

/**
 * Calculate angle between three points (in degrees)
 * b is the vertex point
 */
export function calculateAngle(a: Point3D, b: Point3D, c: Point3D): number {
  const ba = { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
  const bc = { x: c.x - b.x, y: c.y - b.y, z: c.z - b.z };

  const dot = ba.x * bc.x + ba.y * bc.y + ba.z * bc.z;
  const magBA = Math.sqrt(ba.x ** 2 + ba.y ** 2 + ba.z ** 2);
  const magBC = Math.sqrt(bc.x ** 2 + bc.y ** 2 + bc.z ** 2);

  if (magBA === 0 || magBC === 0) return 0;

  const cosAngle = Math.max(-1, Math.min(1, dot / (magBA * magBC)));
  return Math.acos(cosAngle) * (180 / Math.PI);
}

/**
 * Calculate distance between two 3D points
 */
export function distance3D(a: Point3D, b: Point3D): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2 + (a.z - b.z) ** 2);
}

/**
 * MediaPipe Pose Landmark indices
 */
export const LANDMARK_INDICES = {
  nose: 0,
  leftEye: 2,
  rightEye: 5,
  leftEar: 7,
  rightEar: 8,
  leftShoulder: 11,
  rightShoulder: 12,
  leftElbow: 13,
  rightElbow: 14,
  leftWrist: 15,
  rightWrist: 16,
  leftHip: 23,
  rightHip: 24,
  leftKnee: 25,
  rightKnee: 26,
  leftAnkle: 27,
  rightAnkle: 28,
} as const;

/**
 * Calculate all joint angles from pose landmarks
 */
export function calculateJointAngles(landmarks: PoseLandmark[]) {
  if (landmarks.length < 33) {
    return {
      leftKnee: 180,
      rightKnee: 180,
      leftElbow: 180,
      rightElbow: 180,
      leftShoulder: 0,
      rightShoulder: 0,
      leftHip: 180,
      rightHip: 180,
    };
  }

  const lm = (i: number) => landmarks[i];

  return {
    leftKnee: calculateAngle(lm(23), lm(25), lm(27)),     // hip-knee-ankle
    rightKnee: calculateAngle(lm(24), lm(26), lm(28)),
    leftElbow: calculateAngle(lm(11), lm(13), lm(15)),     // shoulder-elbow-wrist
    rightElbow: calculateAngle(lm(12), lm(14), lm(16)),
    leftShoulder: calculateAngle(lm(13), lm(11), lm(23)),  // elbow-shoulder-hip
    rightShoulder: calculateAngle(lm(14), lm(12), lm(24)),
    leftHip: calculateAngle(lm(11), lm(23), lm(25)),       // shoulder-hip-knee
    rightHip: calculateAngle(lm(12), lm(24), lm(26)),
  };
}

/**
 * Calculate deviation from ideal angle (0-100 score)
 */
export function angleAccuracy(actual: number, ideal: number, tolerance: number): number {
  const deviation = Math.abs(actual - ideal);
  if (deviation <= tolerance) return 100;
  const maxDeviation = 60; // beyond this = 0 score
  const score = Math.max(0, 100 - ((deviation - tolerance) / (maxDeviation - tolerance)) * 100);
  return Math.round(score);
}

/**
 * Calculate stability score from a series of angle readings
 */
export function stabilityScore(readings: number[]): number {
  if (readings.length < 2) return 100;
  const mean = readings.reduce((a, b) => a + b, 0) / readings.length;
  const variance = readings.reduce((s, r) => s + (r - mean) ** 2, 0) / readings.length;
  const stdDev = Math.sqrt(variance);
  // Lower std dev = higher stability. Cap at 30 degrees
  return Math.round(Math.max(0, 100 - (stdDev / 30) * 100));
}
