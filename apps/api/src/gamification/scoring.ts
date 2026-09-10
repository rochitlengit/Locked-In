/**
 * Pure scoring math for the performance engine.
 *
 * Everything here is a plain function over plain data so the formula can be
 * unit-tested (and tuned) without touching the database. All component scores
 * are on a 0-100 scale, and the total is their weighted average — also 0-100.
 */

export interface ScoringWeights {
  /** How much finishing within the estimate matters. */
  timeWeight: number;
  /** How much the difficulty/weightage of the work matters. */
  weightageWeight: number;
  /** How much hitting the deadline matters. */
  deadlineWeight: number;
  /** Points deducted per day late. */
  latePenaltyPerDay: number;
  /** Points added per day finished early. */
  earlyBonusPerDay: number;
}

export const DEFAULT_WEIGHTS: ScoringWeights = {
  timeWeight: 0.4,
  weightageWeight: 0.4,
  deadlineWeight: 0.2,
  latePenaltyPerDay: 12,
  earlyBonusPerDay: 8,
};

export interface ScorableTask {
  weightage: number;
  difficulty: number;
  estimatedMinutes?: number | null;
  deadline?: Date | null;
  completedAt?: Date | null;
  /** Total tracked time against this task, in minutes. */
  loggedMinutes: number;
}

export interface ScoreBreakdown {
  tasksCompleted: number;
  timeEfficiencyPts: number;
  weightagePts: number;
  deadlinePts: number;
  totalScore: number;
}

/** Neutral score used when a task carries no signal for a component. */
const NEUTRAL = 70;
const MS_PER_DAY = 86_400_000;

const clamp = (n: number, min = 0, max = 100) => Math.min(max, Math.max(min, n));
const round2 = (n: number) => Math.round(n * 100) / 100;

/**
 * Rewards harder, heavier work. A trivial task (1/1) scores 20; the hardest,
 * heaviest task (5/5) scores 100.
 */
export function weightagePoints(task: Pick<ScorableTask, 'weightage' | 'difficulty'>): number {
  const weightage = clamp(task.weightage, 1, 5);
  const difficulty = clamp(task.difficulty, 1, 5);
  return clamp(((weightage + difficulty) / 10) * 100);
}

/**
 * Rewards finishing before the deadline and penalises overruns. On time is 75,
 * early earns a bonus per day, late loses points per day. Tasks with no
 * deadline are neutral — the employee shouldn't gain or lose for that.
 */
export function deadlinePoints(
  task: Pick<ScorableTask, 'deadline' | 'completedAt'>,
  weights: ScoringWeights = DEFAULT_WEIGHTS,
): number {
  if (!task.deadline || !task.completedAt) return NEUTRAL;
  const daysEarly = (task.deadline.getTime() - task.completedAt.getTime()) / MS_PER_DAY;
  if (daysEarly >= 0) return clamp(75 + daysEarly * weights.earlyBonusPerDay);
  return clamp(75 + daysEarly * weights.latePenaltyPerDay);
}

/**
 * Compares tracked time against the lead's estimate. Comfortably inside the
 * estimate is full marks; double the estimate scores zero. No estimate or no
 * tracked time is neutral rather than punitive.
 */
export function timeEfficiencyPoints(
  task: Pick<ScorableTask, 'estimatedMinutes' | 'loggedMinutes'>,
): number {
  if (!task.estimatedMinutes || task.estimatedMinutes <= 0) return NEUTRAL;
  if (!task.loggedMinutes || task.loggedMinutes <= 0) return NEUTRAL;

  const ratio = task.loggedMinutes / task.estimatedMinutes;
  if (ratio <= 0.75) return 100;
  if (ratio <= 1) return 90;
  if (ratio >= 2) return 0;
  // Linear fall-off between 1x (90) and 2x (0) the estimate.
  return clamp(90 * (2 - ratio));
}

export function scoreTask(task: ScorableTask, weights: ScoringWeights = DEFAULT_WEIGHTS) {
  return {
    weightagePts: weightagePoints(task),
    deadlinePts: deadlinePoints(task, weights),
    timeEfficiencyPts: timeEfficiencyPoints(task),
  };
}

/** Averages per-task components, then combines them using the org's weights. */
export function aggregateScores(
  tasks: ScorableTask[],
  weights: ScoringWeights = DEFAULT_WEIGHTS,
): ScoreBreakdown {
  if (tasks.length === 0) {
    return {
      tasksCompleted: 0,
      timeEfficiencyPts: 0,
      weightagePts: 0,
      deadlinePts: 0,
      totalScore: 0,
    };
  }

  const totals = tasks.reduce(
    (acc, task) => {
      const s = scoreTask(task, weights);
      acc.weightagePts += s.weightagePts;
      acc.deadlinePts += s.deadlinePts;
      acc.timeEfficiencyPts += s.timeEfficiencyPts;
      return acc;
    },
    { weightagePts: 0, deadlinePts: 0, timeEfficiencyPts: 0 },
  );

  const n = tasks.length;
  const weightagePts = totals.weightagePts / n;
  const deadlinePts = totals.deadlinePts / n;
  const timeEfficiencyPts = totals.timeEfficiencyPts / n;

  const weightSum = weights.timeWeight + weights.weightageWeight + weights.deadlineWeight || 1;
  const totalScore =
    (weights.timeWeight * timeEfficiencyPts +
      weights.weightageWeight * weightagePts +
      weights.deadlineWeight * deadlinePts) /
    weightSum;

  return {
    tasksCompleted: n,
    timeEfficiencyPts: round2(timeEfficiencyPts),
    weightagePts: round2(weightagePts),
    deadlinePts: round2(deadlinePts),
    totalScore: round2(totalScore),
  };
}
