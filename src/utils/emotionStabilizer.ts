import { DetectionResult, EmotionName, StabilizedMood } from '../types';

export { type StabilizedMood };

interface EmotionSample {
  timestamp: number;
  hasFace: boolean;
  dominantEmotion: EmotionName | null;
  confidence: number;
  allExpressions: Record<EmotionName, number>;
}

const NON_NEUTRAL_EMOTIONS: EmotionName[] = [
  'happy',
  'sad',
  'angry',
  'fearful',
  'surprised',
  'disgusted'
];

const ALL_EMOTIONS: EmotionName[] = [
  'happy',
  'sad',
  'angry',
  'fearful',
  'surprised',
  'disgusted',
  'neutral'
];

/**
 * Responsive emotion stabilization engine.
 * - Rolling window: ~1.2s (8–12 recent frames) for swift responsiveness.
 * - Weighted temporal averaging with recency prioritization.
 * - Strong-expression override: instantly transitions when an intentional expression is detected.
 * - Neutral de-biasing: neutral is only selected when the face is genuinely neutral or non-neutral evidence is weak.
 * - Minimum hold period: keeps a selected non-neutral mood for ~1s to eliminate rapid flicker.
 */
export class EmotionStabilizer {
  private windowDurationMs: number;
  private maxWindowSamples: number;
  private minHoldDurationMs: number;
  private candidatePersistenceMs: number;

  private samples: EmotionSample[] = [];
  private currentStabilizedEmotion: EmotionName | null = null;
  private emotionEstablishedTime: number = 0;
  private candidateEmotion: EmotionName | null = null;
  private candidateFirstSeenTime: number = 0;

  constructor(
    windowDurationMs = 1200,
    maxWindowSamples = 12,
    minHoldDurationMs = 1000,
    candidatePersistenceMs = 350
  ) {
    this.windowDurationMs = windowDurationMs;
    this.maxWindowSamples = maxWindowSamples;
    this.minHoldDurationMs = minHoldDurationMs;
    this.candidatePersistenceMs = candidatePersistenceMs;
  }

  /**
   * Reset stabilizer state
   */
  public reset(): void {
    this.samples = [];
    this.currentStabilizedEmotion = null;
    this.emotionEstablishedTime = 0;
    this.candidateEmotion = null;
    this.candidateFirstSeenTime = 0;
  }

  /**
   * Add a new raw detection frame and compute responsive stabilized mood
   */
  public addSample(result: DetectionResult): StabilizedMood {
    const now = result.timestamp || Date.now();

    // Determine raw top emotion and probability from this single frame for diagnostics
    let rawTopEmotion: EmotionName | null = null;
    let rawTopProbability = 0;

    if (result.hasFace && result.allExpressions) {
      let maxRawScore = -1;
      for (const emo of ALL_EMOTIONS) {
        const score = result.allExpressions[emo] || 0;
        if (score > maxRawScore) {
          maxRawScore = score;
          rawTopEmotion = emo;
        }
      }
      rawTopProbability = Math.round(Math.max(0, maxRawScore) * 100);
    }

    // Push new sample if face is detected
    this.samples.push({
      timestamp: now,
      hasFace: result.hasFace,
      dominantEmotion: result.dominantEmotion,
      confidence: result.confidence,
      allExpressions: { ...result.allExpressions }
    });

    // Prune samples older than rolling window duration (~1.2s)
    const cutoff = now - this.windowDurationMs;
    this.samples = this.samples.filter((s) => s.timestamp >= cutoff);

    // Keep only the most recent N samples (8–15 frames max)
    if (this.samples.length > this.maxWindowSamples) {
      this.samples = this.samples.slice(-this.maxWindowSamples);
    }

    const validFaceSamples = this.samples.filter((s) => s.hasFace && s.dominantEmotion);

    // Handle no-face state
    if (validFaceSamples.length === 0 || !result.hasFace) {
      if (this.samples.filter((s) => s.hasFace).length === 0) {
        this.currentStabilizedEmotion = null;
        this.emotionEstablishedTime = 0;
        this.candidateEmotion = null;
        this.candidateFirstSeenTime = 0;
      }

      return {
        hasFace: false,
        dominantEmotion: null,
        confidence: 0,
        stabilityScore: 0,
        stabilityLabel: 'No Face',
        allExpressions: {
          happy: 0,
          sad: 0,
          angry: 0,
          fearful: 0,
          surprised: 0,
          disgusted: 0,
          neutral: 0
        },
        sampleCount: 0,
        lastUpdated: now,
        rawTopEmotion: null,
        rawTopProbability: 0
      };
    }

    // 1. TEMPORAL SMOOTHING: Weighted probability averaging with recency bias
    const N = validFaceSamples.length;
    const weightedScores: Record<EmotionName, number> = {
      happy: 0,
      sad: 0,
      angry: 0,
      fearful: 0,
      surprised: 0,
      disgusted: 0,
      neutral: 0
    };
    let totalWeight = 0;

    validFaceSamples.forEach((sample, index) => {
      // Recency weighting: frames later in the window receive higher weight (0.6 -> 1.0)
      const recencyFactor = N > 1 ? 0.6 + 0.4 * (index / (N - 1)) : 1.0;
      const confWeight = Math.max(0.3, sample.confidence / 100);
      const weight = recencyFactor * confWeight;
      totalWeight += weight;

      for (const emo of ALL_EMOTIONS) {
        weightedScores[emo] += (sample.allExpressions[emo] || 0) * weight;
      }
    });

    const smoothedExpressions: Record<EmotionName, number> = {
      happy: 0,
      sad: 0,
      angry: 0,
      fearful: 0,
      surprised: 0,
      disgusted: 0,
      neutral: 0
    };

    for (const emo of ALL_EMOTIONS) {
      const avgScore = totalWeight > 0 ? weightedScores[emo] / totalWeight : 0;
      smoothedExpressions[emo] = Number(avgScore.toFixed(3));
    }

    // 2. FIND TOP NON-NEUTRAL EMOTION vs NEUTRAL IN SMOOTHED WINDOW
    let topNonNeutralEmotion: EmotionName = 'happy';
    let topNonNeutralSmoothed = -1;

    for (const emo of NON_NEUTRAL_EMOTIONS) {
      const score = smoothedExpressions[emo];
      if (score > topNonNeutralSmoothed) {
        topNonNeutralSmoothed = score;
        topNonNeutralEmotion = emo;
      }
    }

    const neutralSmoothed = smoothedExpressions.neutral;

    // 3. STRONG-EXPRESSION OVERRIDE (Requirement 5)
    // If the latest raw frame has a clearly strong non-neutral expression,
    // immediately override without waiting for the full rolling window.
    let rawTopNonNeutral: EmotionName = 'happy';
    let rawTopNonNeutralScore = -1;

    for (const emo of NON_NEUTRAL_EMOTIONS) {
      const score = result.allExpressions[emo] || 0;
      if (score > rawTopNonNeutralScore) {
        rawTopNonNeutralScore = score;
        rawTopNonNeutral = emo;
      }
    }

    const rawNeutralScore = result.allExpressions.neutral || 0;

    // Strong expression condition:
    // Non-neutral is sufficiently prominent (>= 0.45) and clearly above neutral,
    // OR exceptionally strong (>= 0.60)
    const isStrongOverride =
      (rawTopNonNeutralScore >= 0.45 && rawTopNonNeutralScore > rawNeutralScore * 1.15) ||
      rawTopNonNeutralScore >= 0.60;

    if (isStrongOverride) {
      if (this.currentStabilizedEmotion !== rawTopNonNeutral) {
        this.currentStabilizedEmotion = rawTopNonNeutral;
        this.emotionEstablishedTime = now;
        this.candidateEmotion = null;
        this.candidateFirstSeenTime = now;
      }
    }

    // 4. WINDOW-BASED DOMINANT EMOTION SELECTION (Requirements 3 & 4)
    // Neutral is ONLY selected when the face is genuinely neutral or no other emotion has evidence.
    let windowDominantEmotion: EmotionName = 'neutral';

    if (topNonNeutralSmoothed >= 0.22) {
      // If non-neutral has clear probability:
      if (topNonNeutralSmoothed >= neutralSmoothed * 0.75 || topNonNeutralSmoothed > neutralSmoothed) {
        windowDominantEmotion = topNonNeutralEmotion;
      } else if (neutralSmoothed >= 0.50 && neutralSmoothed > topNonNeutralSmoothed + 0.15) {
        windowDominantEmotion = 'neutral';
      } else {
        windowDominantEmotion = topNonNeutralEmotion;
      }
    } else {
      // Non-neutral evidence is very weak (< 0.22) -> genuine neutral
      windowDominantEmotion = 'neutral';
    }

    // 5. HYSTERESIS & MINIMUM HOLD PERIOD (Requirement 6)
    // Keep selected non-neutral mood for ~1s minimum hold period unless another emotion is clearly dominant.
    if (!isStrongOverride) {
      if (!this.currentStabilizedEmotion) {
        this.currentStabilizedEmotion = windowDominantEmotion;
        this.emotionEstablishedTime = now;
        this.candidateEmotion = null;
        this.candidateFirstSeenTime = now;
      } else if (this.currentStabilizedEmotion !== windowDominantEmotion) {
        const isNonNeutralCurrent = this.currentStabilizedEmotion !== 'neutral';
        const holdActive = isNonNeutralCurrent && (now - this.emotionEstablishedTime < this.minHoldDurationMs);

        // Can break hold early ONLY if another non-neutral emotion becomes clearly dominant
        const canBreakHoldEarly =
          windowDominantEmotion !== 'neutral' &&
          windowDominantEmotion !== this.currentStabilizedEmotion &&
          topNonNeutralSmoothed >= 0.45;

        if (holdActive && !canBreakHoldEarly) {
          // Keep current stabilized emotion during hold period
          this.candidateEmotion = windowDominantEmotion;
          this.candidateFirstSeenTime = now;
        } else {
          // Transition candidate
          if (this.candidateEmotion !== windowDominantEmotion) {
            this.candidateEmotion = windowDominantEmotion;
            this.candidateFirstSeenTime = now;
          } else {
            const candidateDuration = now - this.candidateFirstSeenTime;
            // Check agreement in rolling window
            const agreeingCount = validFaceSamples.filter((s) => {
              const eScore = s.allExpressions[windowDominantEmotion] || 0;
              return s.dominantEmotion === windowDominantEmotion || eScore >= 0.28;
            }).length;
            const agreementPct = Math.round((agreeingCount / validFaceSamples.length) * 100);

            // Fast transition: 350ms persistence or >= 55% agreement in window
            if (candidateDuration >= this.candidatePersistenceMs || agreementPct >= 55) {
              this.currentStabilizedEmotion = windowDominantEmotion;
              this.emotionEstablishedTime = now;
              this.candidateEmotion = null;
            }
          }
        }
      } else {
        // Matching current stabilized emotion
        this.candidateEmotion = null;
        this.candidateFirstSeenTime = now;
      }
    }

    const finalEmotion = this.currentStabilizedEmotion || windowDominantEmotion;

    // 6. CONFIDENCE & STABILITY METRICS
    const finalScore = smoothedExpressions[finalEmotion] || 0;
    const supportingSamples = validFaceSamples.filter(
      (s) => s.dominantEmotion === finalEmotion || (s.allExpressions[finalEmotion] || 0) >= 0.25
    );

    let avgSampleConf = result.confidence;
    if (supportingSamples.length > 0) {
      const sumConf = supportingSamples.reduce((acc, s) => acc + s.confidence, 0);
      avgSampleConf = Math.round(sumConf / supportingSamples.length);
    }

    // Blend smoothed expression probability with detector confidence
    const smoothedConf = Math.round(finalScore * 100);
    const blendedConfidence = Math.max(
      20,
      Math.min(99, Math.round(smoothedConf * 0.65 + avgSampleConf * 0.35))
    );

    const stabilityPct = Math.round((supportingSamples.length / validFaceSamples.length) * 100);
    const stabilityScore = Math.min(100, Math.max(15, stabilityPct));

    let stabilityLabel: 'High' | 'Moderate' | 'Transitioning' | 'No Face' = 'Moderate';
    if (stabilityScore >= 70) {
      stabilityLabel = 'High';
    } else if (stabilityScore >= 40) {
      stabilityLabel = 'Moderate';
    } else {
      stabilityLabel = 'Transitioning';
    }

    return {
      hasFace: true,
      dominantEmotion: finalEmotion,
      confidence: blendedConfidence,
      stabilityScore,
      stabilityLabel,
      allExpressions: smoothedExpressions,
      sampleCount: validFaceSamples.length,
      lastUpdated: now,
      rawTopEmotion: rawTopEmotion || result.dominantEmotion,
      rawTopProbability: rawTopProbability || result.confidence
    };
  }
}
