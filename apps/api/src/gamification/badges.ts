/**
 * Badge catalogue and the rules that award them.
 *
 * Rules are pure predicates over a stats object so they can be unit-tested and
 * so new badges are a one-line addition rather than a service change.
 */

export interface BadgeStats {
  approvedTasks: number;
  tasksBeatingDeadline: number;
  tasksWithinEstimate: number;
  heavyTasks: number; // weightage 5
  rejectedTasks: number;
  totalLoggedMinutes: number;
  isTopScorerInTeam: boolean;
}

export interface BadgeDefinition {
  rule: string;
  name: string;
  description: string;
  icon: string;
  earned: (stats: BadgeStats) => boolean;
}

export const BADGE_DEFINITIONS: BadgeDefinition[] = [
  {
    rule: 'EARLY_BIRD',
    name: 'Early Bird',
    description: 'Delivered 5 tasks ahead of their deadline',
    icon: '🌅',
    earned: (s) => s.tasksBeatingDeadline >= 5,
  },
  {
    rule: 'ON_THE_CLOCK',
    name: 'On The Clock',
    description: 'Finished 10 tasks inside the estimated time',
    icon: '⏱️',
    earned: (s) => s.tasksWithinEstimate >= 10,
  },
  {
    rule: 'HEAVY_LIFTER',
    name: 'Heavy Lifter',
    description: 'Completed 3 maximum-weightage tasks',
    icon: '🏋️',
    earned: (s) => s.heavyTasks >= 3,
  },
  {
    rule: 'MARATHONER',
    name: 'Marathoner',
    description: 'Tracked over 40 hours of focused work',
    icon: '🏃',
    earned: (s) => s.totalLoggedMinutes >= 40 * 60,
  },
  {
    rule: 'PERFECTIONIST',
    name: 'Perfectionist',
    description: '10 approved tasks with nothing sent back for rework',
    icon: '💎',
    earned: (s) => s.approvedTasks >= 10 && s.rejectedTasks === 0,
  },
  {
    rule: 'SPRINT_CHAMPION',
    name: 'Sprint Champion',
    description: 'Highest performance score on the team',
    icon: '🏆',
    earned: (s) => s.isTopScorerInTeam,
  },
];

/** Returns the rule keys the given stats have earned. */
export function earnedBadgeRules(stats: BadgeStats): string[] {
  return BADGE_DEFINITIONS.filter((b) => b.earned(stats)).map((b) => b.rule);
}
