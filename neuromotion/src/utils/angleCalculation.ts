/**
 * Angle Calculation Utility
 * 
 * Calculates the angle between 3 points using vector math.
 * Ported from fitness-trainer-pose-estimation/pose_estimation/angle_calculation.py
 * and enhanced with additional squat-specific utilities.
 */

import { Keypoint } from '../types/physical';

/**
 * Calculate angle between 3 points (B is the vertex).
 * Uses vector dot product for accurate angle computation.
 * 
 * @param a - First point {x, y}
 * @param b - Vertex point {x, y}
 * @param c - Third point {x, y}
 * @returns Angle in degrees (0-180)
 */
export function calculateAngle(
    a: { x: number; y: number },
    b: { x: number; y: number },
    c: { x: number; y: number }
): number {
    const ba = { x: a.x - b.x, y: a.y - b.y };
    const bc = { x: c.x - b.x, y: c.y - b.y };

    const dotProduct = ba.x * bc.x + ba.y * bc.y;
    const magnitudeBA = Math.sqrt(ba.x ** 2 + ba.y ** 2);
    const magnitudeBC = Math.sqrt(bc.x ** 2 + bc.y ** 2);

    if (magnitudeBA === 0 || magnitudeBC === 0) return 0;

    const cosAngle = Math.max(-1, Math.min(1, dotProduct / (magnitudeBA * magnitudeBC)));
    const angle = Math.abs((Math.acos(cosAngle) * 180) / Math.PI);

    return angle;
}

/**
 * Calculate knee angle during a squat.
 * Points: Hip → Knee → Ankle
 */
export function calculateKneeAngle(
    hip: Keypoint,
    knee: Keypoint,
    ankle: Keypoint
): number {
    return calculateAngle(hip, knee, ankle);
}

/**
 * Calculate hip angle during a squat.
 * Points: Shoulder → Hip → Knee
 */
export function calculateHipAngle(
    shoulder: Keypoint,
    hip: Keypoint,
    knee: Keypoint
): number {
    return calculateAngle(shoulder, hip, knee);
}

/**
 * Calculate spine angle (forward lean detection).
 * Points: Shoulder → Hip → vertical reference
 */
export function calculateSpineAngle(
    shoulder: Keypoint,
    hip: Keypoint
): number {
    // Create a vertical reference point directly above hip
    const verticalRef: Keypoint = { x: hip.x, y: hip.y - 100 };
    return calculateAngle(shoulder, hip, verticalRef);
}

/**
 * Smooth angle values using a moving average filter.
 * Reduces jitter from pose detection noise.
 */
export class AngleSmoother {
    private history: number[] = [];
    private windowSize: number;

    constructor(windowSize: number = 5) {
        this.windowSize = windowSize;
    }

    smooth(angle: number): number {
        this.history.push(angle);
        if (this.history.length > this.windowSize) {
            this.history.shift();
        }
        return this.history.reduce((sum, a) => sum + a, 0) / this.history.length;
    }

    reset(): void {
        this.history = [];
    }
}

/**
 * Adjust angle thresholds based on user biometrics.
 * Older users and those with higher BMI get more generous thresholds.
 */
export function getAdjustedThresholds(
    baseThresholds: { topAngle: number; bottomAngle: number; tolerance: number },
    age: number,
    height: number, // cm
    weight: number  // kg
): { topAngle: number; bottomAngle: number; tolerance: number } {
    const bmi = weight / ((height / 100) ** 2);

    // Age factor: older users get more lenient thresholds
    let ageFactor = 0;
    if (age > 50) ageFactor = 10;
    else if (age > 40) ageFactor = 5;
    else if (age > 30) ageFactor = 2;

    // BMI factor: higher BMI gets slightly more lenient
    let bmiFactor = 0;
    if (bmi > 30) bmiFactor = 8;
    else if (bmi > 25) bmiFactor = 4;

    return {
        topAngle: baseThresholds.topAngle - ageFactor,   // slightly lower top
        bottomAngle: baseThresholds.bottomAngle + ageFactor + bmiFactor, // don't need to go as deep
        tolerance: baseThresholds.tolerance + Math.floor(ageFactor / 2) + Math.floor(bmiFactor / 2),
    };
}