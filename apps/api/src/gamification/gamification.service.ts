import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import {
  aggregateScores,
  DEFAULT_WEIGHTS,
  ScorableTask,
  ScoreBreakdown,
  ScoringWeights,
} from './scoring';
import { BADGE_DEFINITIONS, BadgeStats, earnedBadgeRules } from './badges';
import { CreateBadgeDto, UpdateScoringConfigDto } from './dto';

@Injectable()
export class GamificationService {
  private readonly logger = new Logger(GamificationService.name);

  constructor(private prisma: PrismaService) {}

  // ---------------------------------------------------------------- config

  /** Returns the org's scoring weights, creating defaults on first use. */
  async getWeights(orgId: string): Promise<ScoringWeights> {
    const existing = await this.prisma.scoringConfig.findUnique({ where: { orgId } });
    if (existing) {
      return {
        timeWeight: existing.timeWeight,
        weightageWeight: existing.weightageWeight,
        deadlineWeight: existing.deadlineWeight,
        latePenaltyPerDay: existing.latePenaltyPerDay,
        earlyBonusPerDay: existing.earlyBonusPerDay,
      };
    }
    await this.prisma.scoringConfig.create({ data: { orgId } });
    return { ...DEFAULT_WEIGHTS };
  }

  async getConfig(orgId: string) {
    await this.getWeights(orgId);
    return this.prisma.scoringConfig.findUnique({ where: { orgId } });
  }

  async updateConfig(orgId: string, dto: UpdateScoringConfigDto) {
    await this.getWeights(orgId);
    return this.prisma.scoringConfig.update({ where: { orgId }, data: dto });
  }

  // ----------------------------------------------------------------- score

  /** Approved, completed work for a user within an optional date window. */
  private async loadScorableTasks(userId: string, from?: Date, to?: Date) {
    const where: any = { assigneeId: userId, status: 'DONE', approvalStatus: 'APPROVED' };
    if (from || to) {
      where.completedAt = {};
      if (from) where.completedAt.gte = from;
      if (to) where.completedAt.lte = to;
    }
    return this.prisma.task.findMany({
      where,
      include: { timeLogs: true, skills: true },
      orderBy: { completedAt: 'desc' },
    });
  }

  private toScorable(task: any): ScorableTask {
    const loggedMinutes =
      task.timeLogs.reduce((sum: number, log: any) => sum + (log.durationSec || 0), 0) / 60;
    return {
      weightage: task.weightage,
      difficulty: task.difficulty,
      estimatedMinutes: task.estimatedMinutes,
      deadline: task.deadline,
      completedAt: task.completedAt,
      loggedMinutes,
    };
  }

  async computeForUser(
    userId: string,
    from?: Date,
    to?: Date,
    weights?: ScoringWeights,
  ): Promise<ScoreBreakdown> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const resolved = weights ?? (user ? await this.getWeights(user.orgId) : DEFAULT_WEIGHTS);
    const tasks = await this.loadScorableTasks(userId, from, to);
    return aggregateScores(tasks.map((t) => this.toScorable(t)), resolved);
  }

  async leaderboard(userIds: string[], from?: Date, to?: Date) {
    if (userIds.length === 0) return [];
    const users = await this.prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, fullName: true, title: true, role: true, teamId: true, orgId: true },
    });
    const weights = users[0] ? await this.getWeights(users[0].orgId) : DEFAULT_WEIGHTS;

    const rows = await Promise.all(
      users.map(async (user) => ({
        userId: user.id,
        user,
        ...(await this.computeForUser(user.id, from, to, weights)),
      })),
    );

    return rows
      .sort((a, b) => b.totalScore - a.totalScore)
      .map((row, index) => ({ ...row, rank: index + 1 }));
  }

  /** Everything a team lead needs on one screen. */
  async teamOverview(teamId: string, from?: Date, to?: Date) {
    const team = await this.prisma.team.findUnique({
      where: { id: teamId },
      include: { members: true, lead: true },
    });
    if (!team) return null;

    const memberIds = team.members.map((m) => m.id);
    const board = await this.leaderboard(memberIds, from, to);

    const detailed = await Promise.all(
      board.map(async (row) => ({
        ...row,
        skills: await this.skillMetrics(row.userId),
        badges: await this.userBadges(row.userId),
        openTasks: await this.prisma.task.count({
          where: { assigneeId: row.userId, status: { not: 'DONE' } },
        }),
        pendingReview: await this.prisma.task.count({
          where: { assigneeId: row.userId, approvalStatus: 'PENDING' },
        }),
      })),
    );

    const teamAverage =
      detailed.length > 0
        ? Math.round((detailed.reduce((s, m) => s + m.totalScore, 0) / detailed.length) * 100) / 100
        : 0;

    return {
      team: { id: team.id, name: team.name, lead: team.lead },
      teamAverage,
      totalTasksCompleted: detailed.reduce((s, m) => s + m.tasksCompleted, 0),
      members: detailed,
    };
  }

  // ---------------------------------------------------------------- skills

  /**
   * Rebuilds a user's per-skill scores from their approved work. A skill's
   * score is the average total score of the tasks tagged with that skill.
   */
  async recomputeSkillMetrics(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) return [];
    const weights = await this.getWeights(user.orgId);
    const tasks = await this.loadScorableTasks(userId);

    const bySkill = new Map<string, ScorableTask[]>();
    for (const task of tasks) {
      for (const link of task.skills) {
        const bucket = bySkill.get(link.skillId) || [];
        bucket.push(this.toScorable(task));
        bySkill.set(link.skillId, bucket);
      }
    }

    const results: any[] = [];
    for (const [skillId, scorables] of bySkill.entries()) {
      const agg = aggregateScores(scorables, weights);
      results.push(
        await this.prisma.skillMetric.upsert({
          where: { userId_skillId: { userId, skillId } },
          create: {
            userId,
            skillId,
            score: agg.totalScore,
            tasksCompleted: agg.tasksCompleted,
          },
          update: { score: agg.totalScore, tasksCompleted: agg.tasksCompleted },
        }),
      );
    }
    return results;
  }

  skillMetrics(userId: string) {
    return this.prisma.skillMetric.findMany({
      where: { userId },
      include: { skill: true },
      orderBy: { score: 'desc' },
    });
  }

  listSkills(orgId: string) {
    return this.prisma.skill.findMany({ where: { orgId }, orderBy: { name: 'asc' } });
  }

  createSkill(orgId: string, name: string) {
    return this.prisma.skill.create({ data: { orgId, name } });
  }

  // ---------------------------------------------------------------- badges

  /** Raw counters the badge rules are evaluated against. */
  async statsForUser(userId: string, isTopScorerInTeam = false): Promise<BadgeStats> {
    const tasks = await this.prisma.task.findMany({
      where: { assigneeId: userId },
      include: { timeLogs: true },
    });

    const approved = tasks.filter((t) => t.approvalStatus === 'APPROVED');
    const logs = await this.prisma.timeLog.findMany({ where: { userId } });

    return {
      approvedTasks: approved.length,
      tasksBeatingDeadline: approved.filter(
        (t) => t.deadline && t.completedAt && t.completedAt <= t.deadline,
      ).length,
      tasksWithinEstimate: approved.filter((t) => {
        if (!t.estimatedMinutes) return false;
        const minutes = t.timeLogs.reduce((s, l) => s + (l.durationSec || 0), 0) / 60;
        return minutes > 0 && minutes <= t.estimatedMinutes;
      }).length,
      heavyTasks: approved.filter((t) => t.weightage >= 5).length,
      rejectedTasks: tasks.filter((t) => t.approvalStatus === 'REJECTED').length,
      totalLoggedMinutes: logs.reduce((s, l) => s + (l.durationSec || 0), 0) / 60,
      isTopScorerInTeam,
    };
  }

  /** Ensures every catalogue badge exists, then awards any newly earned ones. */
  async evaluateBadges(userId: string, isTopScorerInTeam = false) {
    const stats = await this.statsForUser(userId, isTopScorerInTeam);
    const earned = earnedBadgeRules(stats);
    const awarded: string[] = [];

    for (const rule of earned) {
      const definition = BADGE_DEFINITIONS.find((b) => b.rule === rule)!;
      const badge = await this.prisma.badge.upsert({
        where: { name: definition.name },
        create: {
          name: definition.name,
          description: definition.description,
          icon: definition.icon,
          rule: definition.rule,
        },
        update: {},
      });

      const existing = await this.prisma.userBadge.findUnique({
        where: { userId_badgeId: { userId, badgeId: badge.id } },
      });
      if (!existing) {
        await this.prisma.userBadge.create({ data: { userId, badgeId: badge.id } });
        awarded.push(definition.name);
      }
    }

    return { stats, earned, newlyAwarded: awarded };
  }

  createBadge(dto: CreateBadgeDto) {
    return this.prisma.badge.create({ data: dto });
  }

  listBadges() {
    return this.prisma.badge.findMany({ orderBy: { name: 'asc' } });
  }

  awardBadge(userId: string, badgeId: string) {
    return this.prisma.userBadge.upsert({
      where: { userId_badgeId: { userId, badgeId } },
      create: { userId, badgeId },
      update: {},
    });
  }

  userBadges(userId: string) {
    return this.prisma.userBadge.findMany({
      where: { userId },
      include: { badge: true },
      orderBy: { awardedAt: 'desc' },
    });
  }

  // ------------------------------------------------------------- snapshots

  async snapshot(userId: string, periodStart: Date, periodEnd: Date) {
    const breakdown = await this.computeForUser(userId, periodStart, periodEnd);
    return this.prisma.scoreRecord.create({
      data: {
        userId,
        periodStart,
        periodEnd,
        tasksCompleted: breakdown.tasksCompleted,
        timeEfficiencyPts: breakdown.timeEfficiencyPts,
        weightagePts: breakdown.weightagePts,
        deadlinePts: breakdown.deadlinePts,
        totalScore: breakdown.totalScore,
      },
    });
  }

  history(userId: string) {
    return this.prisma.scoreRecord.findMany({
      where: { userId },
      orderBy: { periodStart: 'asc' },
    });
  }

  /**
   * Snapshots every active user for the period, refreshes skill metrics and
   * re-evaluates badges (marking the top scorer on each team).
   */
  async runPeriodClose(periodStart: Date, periodEnd: Date) {
    const users = await this.prisma.user.findMany({ where: { isActive: true } });
    const topScorerByTeam = new Map<string, string>();

    const teams = await this.prisma.team.findMany({ include: { members: true } });
    for (const team of teams) {
      const board = await this.leaderboard(
        team.members.map((m) => m.id),
        periodStart,
        periodEnd,
      );
      if (board.length > 0 && board[0].totalScore > 0) {
        topScorerByTeam.set(team.id, board[0].userId);
      }
    }

    let snapshots = 0;
    for (const user of users) {
      await this.snapshot(user.id, periodStart, periodEnd);
      await this.recomputeSkillMetrics(user.id);
      const isTop = user.teamId ? topScorerByTeam.get(user.teamId) === user.id : false;
      await this.evaluateBadges(user.id, isTop);
      snapshots += 1;
    }

    this.logger.log(`Period close complete: ${snapshots} snapshots written.`);
    return { snapshots, periodStart, periodEnd };
  }

  /** Weekly close, Sundays at 23:00 server time. */
  @Cron(CronExpression.EVERY_WEEK)
  async weeklyClose() {
    const periodEnd = new Date();
    const periodStart = new Date(periodEnd.getTime() - 7 * 86_400_000);
    await this.runPeriodClose(periodStart, periodEnd);
  }
}
