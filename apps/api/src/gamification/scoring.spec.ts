import {
  weightagePoints,
  deadlinePoints,
  timeEfficiencyPoints,
  aggregateScores,
  DEFAULT_WEIGHTS,
  ScorableTask,
} from './scoring';

const DAY = 86_400_000;
const at = (offsetDays: number) => new Date(Date.now() + offsetDays * DAY);

const task = (overrides: Partial<ScorableTask> = {}): ScorableTask => ({
  weightage: 3,
  difficulty: 3,
  estimatedMinutes: 120,
  deadline: at(0),
  completedAt: at(0),
  loggedMinutes: 120,
  ...overrides,
});

describe('weightagePoints', () => {
  it('scores the lightest work lowest and the heaviest highest', () => {
    expect(weightagePoints({ weightage: 1, difficulty: 1 })).toBe(20);
    expect(weightagePoints({ weightage: 5, difficulty: 5 })).toBe(100);
  });

  it('scores mid-range work in between', () => {
    expect(weightagePoints({ weightage: 3, difficulty: 3 })).toBe(60);
  });

  it('clamps out-of-range input rather than exploding', () => {
    expect(weightagePoints({ weightage: 99, difficulty: 99 })).toBe(100);
    expect(weightagePoints({ weightage: 0, difficulty: 0 })).toBe(20);
  });
});

describe('deadlinePoints', () => {
  it('gives a solid score for finishing exactly on time', () => {
    expect(deadlinePoints({ deadline: at(0), completedAt: at(0) })).toBe(75);
  });

  it('rewards finishing early', () => {
    const score = deadlinePoints({ deadline: at(3), completedAt: at(0) });
    expect(score).toBeGreaterThan(75);
    expect(score).toBeLessThanOrEqual(100);
  });

  it('penalises finishing late', () => {
    expect(deadlinePoints({ deadline: at(-2), completedAt: at(0) })).toBeLessThan(75);
  });

  it('never returns a negative score, however late the work is', () => {
    expect(deadlinePoints({ deadline: at(-60), completedAt: at(0) })).toBe(0);
  });

  it('stays neutral when no deadline was set', () => {
    expect(deadlinePoints({ deadline: null, completedAt: at(0) })).toBe(70);
  });
});

describe('timeEfficiencyPoints', () => {
  it('gives full marks for comfortably beating the estimate', () => {
    expect(timeEfficiencyPoints({ estimatedMinutes: 100, loggedMinutes: 60 })).toBe(100);
  });

  it('rewards landing just inside the estimate', () => {
    expect(timeEfficiencyPoints({ estimatedMinutes: 100, loggedMinutes: 95 })).toBe(90);
  });

  it('falls off as the overrun grows', () => {
    const mild = timeEfficiencyPoints({ estimatedMinutes: 100, loggedMinutes: 130 });
    const bad = timeEfficiencyPoints({ estimatedMinutes: 100, loggedMinutes: 180 });
    expect(mild).toBeGreaterThan(bad);
    expect(bad).toBeGreaterThanOrEqual(0);
  });

  it('bottoms out at double the estimate', () => {
    expect(timeEfficiencyPoints({ estimatedMinutes: 100, loggedMinutes: 250 })).toBe(0);
  });

  it('stays neutral when there is no estimate or no tracked time', () => {
    expect(timeEfficiencyPoints({ estimatedMinutes: null, loggedMinutes: 300 })).toBe(70);
    expect(timeEfficiencyPoints({ estimatedMinutes: 120, loggedMinutes: 0 })).toBe(70);
  });
});

describe('aggregateScores', () => {
  it('returns zeros when there is no completed work', () => {
    expect(aggregateScores([])).toEqual({
      tasksCompleted: 0,
      timeEfficiencyPts: 0,
      weightagePts: 0,
      deadlinePts: 0,
      totalScore: 0,
    });
  });

  it('counts every task it was given', () => {
    expect(aggregateScores([task(), task(), task()]).tasksCompleted).toBe(3);
  });

  it('ranks a strong performer above a weak one', () => {
    const strong = aggregateScores([
      task({ weightage: 5, difficulty: 5, deadline: at(3), completedAt: at(0), loggedMinutes: 60 }),
    ]);
    const weak = aggregateScores([
      task({ weightage: 1, difficulty: 1, deadline: at(-4), completedAt: at(0), loggedMinutes: 300 }),
    ]);
    expect(strong.totalScore).toBeGreaterThan(weak.totalScore);
  });

  it('keeps the total within the 0-100 scale', () => {
    const best = aggregateScores([
      task({ weightage: 5, difficulty: 5, deadline: at(30), completedAt: at(0), loggedMinutes: 1 }),
    ]);
    expect(best.totalScore).toBeLessThanOrEqual(100);
    expect(best.totalScore).toBeGreaterThanOrEqual(0);
  });

  it('honours the org weights when combining components', () => {
    const tasks = [
      task({ weightage: 5, difficulty: 5, deadline: at(-10), completedAt: at(0), loggedMinutes: 60 }),
    ];
    const weightageHeavy = aggregateScores(tasks, {
      ...DEFAULT_WEIGHTS,
      weightageWeight: 1,
      timeWeight: 0,
      deadlineWeight: 0,
    });
    const deadlineHeavy = aggregateScores(tasks, {
      ...DEFAULT_WEIGHTS,
      weightageWeight: 0,
      timeWeight: 0,
      deadlineWeight: 1,
    });
    // Same work, different priorities: heavy/complex scores high, lateness scores low.
    expect(weightageHeavy.totalScore).toBe(100);
    expect(deadlineHeavy.totalScore).toBeLessThan(50);
  });

  it('averages across tasks rather than summing them', () => {
    const one = aggregateScores([task()]);
    const five = aggregateScores([task(), task(), task(), task(), task()]);
    expect(five.totalScore).toBeCloseTo(one.totalScore, 5);
  });
});
