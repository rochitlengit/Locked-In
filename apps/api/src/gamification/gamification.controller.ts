import { Body, Controller, Get, Param, Post, Patch, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import { RolesGuard } from '../common/roles.guard';
import { Roles } from '../common/roles.decorator';
import { CurrentUser } from '../common/current-user.decorator';
import { GamificationService } from './gamification.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  ScoreQueryDto,
  AwardBadgeDto,
  CreateBadgeDto,
  CreateSkillDto,
  UpdateScoringConfigDto,
  RunPeriodCloseDto,
} from './dto';

@ApiTags('gamification')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('gamification')
export class GamificationController {
  constructor(private game: GamificationService, private prisma: PrismaService) {}

  private range(q: ScoreQueryDto) {
    return {
      from: q.from ? new Date(q.from) : undefined,
      to: q.to ? new Date(q.to) : undefined,
    };
  }

  @Get('me')
  me(@CurrentUser() user: any, @Query() q: ScoreQueryDto) {
    const { from, to } = this.range(q);
    return this.game.computeForUser(user.id, from, to);
  }

  @Get('me/history')
  history(@CurrentUser() user: any) {
    return this.game.history(user.id);
  }

  @Get('me/badges')
  myBadges(@CurrentUser() user: any) {
    return this.game.userBadges(user.id);
  }

  @Get('me/skills')
  mySkills(@CurrentUser() user: any) {
    return this.game.skillMetrics(user.id);
  }

  @Get('users/:userId')
  forUser(@Param('userId') userId: string, @Query() q: ScoreQueryDto) {
    const { from, to } = this.range(q);
    return this.game.computeForUser(userId, from, to);
  }

  @Get('users/:userId/skills')
  userSkills(@Param('userId') userId: string) {
    return this.game.skillMetrics(userId);
  }

  @Get('users/:userId/badges')
  userBadges(@Param('userId') userId: string) {
    return this.game.userBadges(userId);
  }

  @Get('users/:userId/history')
  userHistory(@Param('userId') userId: string) {
    return this.game.history(userId);
  }

  @Get('leaderboard/team/:teamId')
  async teamLeaderboard(@Param('teamId') teamId: string, @Query() q: ScoreQueryDto) {
    const { from, to } = this.range(q);
    const members = await this.prisma.user.findMany({ where: { teamId }, select: { id: true } });
    return this.game.leaderboard(members.map((m) => m.id), from, to);
  }

  @Get('leaderboard/org')
  async orgLeaderboard(@CurrentUser() user: any, @Query() q: ScoreQueryDto) {
    const { from, to } = this.range(q);
    const members = await this.prisma.user.findMany({
      where: { orgId: user.orgId },
      select: { id: true },
    });
    return this.game.leaderboard(members.map((m) => m.id), from, to);
  }

  /** Full team performance view used by the team lead dashboard. */
  @Roles('SUPER_ADMIN', 'HR', 'TEAM_LEAD')
  @Get('team/:teamId/overview')
  teamOverview(@Param('teamId') teamId: string, @Query() q: ScoreQueryDto) {
    const { from, to } = this.range(q);
    return this.game.teamOverview(teamId, from, to);
  }

  @Get('skills')
  listSkills(@CurrentUser() user: any) {
    return this.game.listSkills(user.orgId);
  }

  @Roles('SUPER_ADMIN', 'HR', 'TEAM_LEAD')
  @Post('skills')
  createSkill(@CurrentUser() user: any, @Body() dto: CreateSkillDto) {
    return this.game.createSkill(user.orgId, dto.name);
  }

  @Get('badges')
  listBadges() {
    return this.game.listBadges();
  }

  @Roles('SUPER_ADMIN', 'HR')
  @Post('badges')
  createBadge(@Body() dto: CreateBadgeDto) {
    return this.game.createBadge(dto);
  }

  @Roles('SUPER_ADMIN', 'HR', 'TEAM_LEAD')
  @Post('badges/award')
  award(@Body() dto: AwardBadgeDto) {
    return this.game.awardBadge(dto.userId, dto.badgeId);
  }

  /** Recompute skills + badges for one person on demand. */
  @Roles('SUPER_ADMIN', 'HR', 'TEAM_LEAD')
  @Post('users/:userId/recompute')
  async recompute(@Param('userId') userId: string) {
    await this.game.recomputeSkillMetrics(userId);
    return this.game.evaluateBadges(userId);
  }

  @Get('config')
  config(@CurrentUser() user: any) {
    return this.game.getConfig(user.orgId);
  }

  @Roles('SUPER_ADMIN')
  @Patch('config')
  updateConfig(@CurrentUser() user: any, @Body() dto: UpdateScoringConfigDto) {
    return this.game.updateConfig(user.orgId, dto);
  }

  /** Manually close a scoring period (the cron job does this weekly). */
  @Roles('SUPER_ADMIN')
  @Post('period-close')
  periodClose(@Body() dto: RunPeriodCloseDto) {
    return this.game.runPeriodClose(new Date(dto.periodStart), new Date(dto.periodEnd));
  }
}
