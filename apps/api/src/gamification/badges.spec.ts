import { BADGE_DEFINITIONS, BadgeStats, earnedBadgeRules } from './badges';

const stats = (overrides: Partial<BadgeStats> = {}): BadgeStats => ({
  approvedTasks: 0,
  tasksBeatingDeadline: 0,
  tasksWithinEstimate: 0,
  heavyTasks: 0,
  rejectedTasks: 0,
  totalLoggedMinutes: 0,
  isTopScorerInTeam: false,
  ...overrides,
});

describe('badge rules', () => {
  it('awards nothing to someone who has not delivered yet', () => {
    expect(earnedBadgeRules(stats())).toEqual([]);
  });

  it('awards Early Bird after five on-time deliveries', () => {
    expect(earnedBadgeRules(stats({ tasksBeatingDeadline: 4 }))).not.toContain('EARLY_BIRD');
    expect(earnedBadgeRules(stats({ tasksBeatingDeadline: 5 }))).toContain('EARLY_BIRD');
  });

  it('awards On The Clock for ten tasks inside the estimate', () => {
    expect(earnedBadgeRules(stats({ tasksWithinEstimate: 10 }))).toContain('ON_THE_CLOCK');
  });

  it('awards Heavy Lifter for three maximum-weightage tasks', () => {
    expect(earnedBadgeRules(stats({ heavyTasks: 3 }))).toContain('HEAVY_LIFTER');
  });

  it('awards Marathoner past forty tracked hours', () => {
    expect(earnedBadgeRules(stats({ totalLoggedMinutes: 39 * 60 }))).not.toContain('MARATHONER');
    expect(earnedBadgeRules(stats({ totalLoggedMinutes: 40 * 60 }))).toContain('MARATHONER');
  });

  it('withholds Perfectionist if any work was sent back', () => {
    expect(earnedBadgeRules(stats({ approvedTasks: 12 }))).toContain('PERFECTIONIST');
    expect(earnedBadgeRules(stats({ approvedTasks: 12, rejectedTasks: 1 }))).not.toContain(
      'PERFECTIONIST',
    );
  });

  it('awards Sprint Champion only to the top scorer', () => {
    expect(earnedBadgeRules(stats({ isTopScorerInTeam: true }))).toContain('SPRINT_CHAMPION');
  });

  it('can award several badges at once', () => {
    const earned = earnedBadgeRules(
      stats({
        approvedTasks: 15,
        tasksBeatingDeadline: 8,
        tasksWithinEstimate: 12,
        heavyTasks: 4,
        totalLoggedMinutes: 50 * 60,
        isTopScorerInTeam: true,
      }),
    );
    expect(earned).toHaveLength(BADGE_DEFINITIONS.length);
  });

  it('gives every badge a unique rule key', () => {
    const keys = BADGE_DEFINITIONS.map((b) => b.rule);
    expect(new Set(keys).size).toBe(keys.length);
  });
});
