/**
 * Rep Counter — Robust 2-phase model for rep counting.
 *
 * Uses a simple UP/DOWN phase system instead of a complex FSM,
 * making it reliable even at low frame rates (2-3 fps).
 *
 * Cycle:  UP → angle drops below downThreshold → DOWN
 *         DOWN → angle rises above upThreshold  → UP  (= 1 rep)
 *
 * This avoids the problem of multi-state FSMs missing intermediate
 * states when frames are captured infrequently.
 */

import { ExerciseMovementState, RepData } from '../types/physical';

// Alias for the string literal union used by the rep counter
type ExerciseState = ExerciseMovementState;

interface RepCounterConfig {
  topAngleThreshold: number;    // Angle above which the limb is "extended" (standing)
  bottomAngleThreshold: number; // Angle below which the limb is "folded" (squat bottom)
  minRepDuration: number;       // Minimum seconds for a rep to be valid
}

const DEFAULT_CONFIG: RepCounterConfig = {
  topAngleThreshold: 150,
  bottomAngleThreshold: 120,
  minRepDuration: 0.8,
};

export class RepCounter {
  private phase: 'up' | 'down' = 'up';
  private counter: number = 0;
  private correctCounter: number = 0;
  private config: RepCounterConfig;

  // Per-rep tracking
  private repStartTime: number = 0;
  private repAngles: number[] = [];
  private reps: RepData[] = [];
  private lastCountTime: number = 0;

  // Global angle tracking
  private allAngles: number[] = [];

  // Track whether we've been down at least once (prevents counting on startup)
  private hasBeenDown: boolean = false;

  constructor(config?: Partial<RepCounterConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Process a new angle reading and return whether a rep was just completed.
   *
   * The 2-phase model:
   *  - UP:   angle >= topAngleThreshold    (standing position)
   *  - DOWN: angle <= bottomAngleThreshold (squat bottom)
   *  - Between thresholds: transitioning (no phase change)
   *
   * A rep is counted when transitioning from DOWN → UP.
   */
  processAngle(angle: number): { counted: boolean; state: ExerciseState; repData?: RepData } {
    this.allAngles.push(angle);

    const now = Date.now();
    let counted = false;
    let repData: RepData | undefined;
    let displayState: ExerciseState;

    if (angle >= this.config.topAngleThreshold) {
      // ========== UP POSITION (standing) ==========
      if (this.hasBeenDown && this.phase === 'down') {
        // We were down and now we're back up — that's a rep!
        const timeSinceLastCount = (now - this.lastCountTime) / 1000;

        if (timeSinceLastCount >= this.config.minRepDuration || this.counter === 0) {
          this.counter++;
          this.lastCountTime = now;
          counted = true;

          const duration = this.repStartTime > 0
            ? (now - this.repStartTime) / 1000
            : 1.5; // fallback

          const minAngle = this.repAngles.length > 0
            ? Math.min(...this.repAngles)
            : angle;

          // A rep is "correct" if the user went deep enough
          const isCorrect = minAngle <= this.config.bottomAngleThreshold + 15;
          if (isCorrect) this.correctCounter++;

          const formScore = this.calculateRepFormScore(minAngle, duration);

          repData = {
            repNumber: this.counter,
            angle: minAngle,
            duration,
            formScore,
            timestamp: now,
          };
          this.reps.push(repData);
        }

        this.hasBeenDown = false;
        this.repAngles = [];
      }

      this.phase = 'up';
      displayState = 'top';

    } else if (angle <= this.config.bottomAngleThreshold) {
      // ========== DOWN POSITION (squat bottom) ==========
      if (this.phase === 'up' && !this.hasBeenDown) {
        // Just started going down — mark rep start time
        this.repStartTime = now;
        this.repAngles = [];
      }

      this.hasBeenDown = true;
      this.phase = 'down';
      this.repAngles.push(angle);
      displayState = 'bottom';

    } else {
      // ========== TRANSITION ZONE ==========
      this.repAngles.push(angle);

      if (this.phase === 'up' && !this.hasBeenDown) {
        displayState = 'descending';
      } else if (this.phase === 'up') {
        displayState = 'descending';
      } else {
        // phase === 'down', angle is rising back up
        displayState = 'ascending';
      }
    }

    return { counted, state: displayState, repData };
  }

  /**
   * Score a single rep based on depth achieved and duration.
   */
  private calculateRepFormScore(minAngle: number, duration: number): number {
    let score = 100;

    // Depth penalty: how far from ideal bottom position
    // Lower angle = deeper squat = better (for knee angle)
    const depthDelta = Math.abs(minAngle - this.config.bottomAngleThreshold);
    if (depthDelta > 30) score -= 25;
    else if (depthDelta > 20) score -= 15;
    else if (depthDelta > 10) score -= 5;

    // If they went BELOW the threshold, that's actually good — give bonus
    if (minAngle < this.config.bottomAngleThreshold) {
      score += 5;
    }

    // Speed penalty: too fast or too slow
    if (duration < this.config.minRepDuration) score -= 15;
    if (duration > 6) score -= 10;

    return Math.max(0, Math.min(100, score));
  }

  // ==================== Getters ====================

  getCounter(): number {
    return this.counter;
  }

  getCorrectCounter(): number {
    return this.correctCounter;
  }

  getState(): ExerciseState {
    if (this.phase === 'up') return 'top';
    return 'bottom';
  }

  getReps(): RepData[] {
    return [...this.reps];
  }

  getAllAngles(): number[] {
    return [...this.allAngles];
  }

  getAvgAngle(): number {
    if (this.allAngles.length === 0) return 0;
    return this.allAngles.reduce((s, a) => s + a, 0) / this.allAngles.length;
  }

  getAngleVariation(): number {
    if (this.reps.length < 2) return 0;
    const repAngles = this.reps.map(r => r.angle);
    const mean = repAngles.reduce((s, a) => s + a, 0) / repAngles.length;
    const variance = repAngles.reduce((s, a) => s + (a - mean) ** 2, 0) / repAngles.length;
    return Math.sqrt(variance);
  }

  reset(): void {
    this.phase = 'up';
    this.counter = 0;
    this.correctCounter = 0;
    this.repStartTime = 0;
    this.repAngles = [];
    this.reps = [];
    this.allAngles = [];
    this.lastCountTime = 0;
    this.hasBeenDown = false;
  }
}
