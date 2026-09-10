import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GamificationService } from '../gamification/gamification.service';
import {
  CreateTaskDto,
  UpdateTaskDto,
  UpdateTaskStatusDto,
  ApproveTaskDto,
  CreateSubtaskDto,
} from './dto';

const TASK_INCLUDE = {
  subtasks: { include: { assignee: { select: { id: true, fullName: true } } } },
  assignee: { select: { id: true, fullName: true, avatarUrl: true } },
  creator: { select: { id: true, fullName: true } },
  skills: { include: { skill: true } },
  timeLogs: true,
} as const;

@Injectable()
export class TasksService {
  constructor(private prisma: PrismaService, private gamification: GamificationService) {}

  async createTask(creatorId: string, dto: CreateTaskDto) {
    const { deadline, skillIds, ...rest } = dto;
    return this.prisma.task.create({
      data: {
        ...rest,
        creatorId,
        deadline: deadline ? new Date(deadline) : undefined,
        skills: skillIds?.length
          ? { create: skillIds.map((skillId) => ({ skillId })) }
          : undefined,
      },
      include: TASK_INCLUDE,
    });
  }

  async updateTask(taskId: string, dto: UpdateTaskDto) {
    const { deadline, ...rest } = dto;
    return this.prisma.task.update({
      where: { id: taskId },
      data: { ...rest, deadline: deadline ? new Date(deadline) : undefined },
      include: TASK_INCLUDE,
    });
  }

  findOne(taskId: string) {
    return this.prisma.task.findUnique({ where: { id: taskId }, include: TASK_INCLUDE });
  }

  listTasksForTeam(teamId: string) {
    return this.prisma.task.findMany({
      where: { teamId },
      include: TASK_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });
  }

  listMyTasks(userId: string) {
    return this.prisma.task.findMany({
      where: { assigneeId: userId },
      include: TASK_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });
  }

  /** Work submitted for review that this lead still has to sign off on. */
  listPendingApprovals(leadId: string) {
    return this.prisma.task.findMany({
      where: {
        approvalStatus: 'PENDING',
        team: { leadId },
      },
      include: TASK_INCLUDE,
      orderBy: { updatedAt: 'asc' },
    });
  }

  /**
   * Moves a task along the board. Submitting for review flags it for the lead;
   * a task only counts as complete once the lead approves it.
   */
  async updateStatus(taskId: string, userId: string, dto: UpdateTaskStatusDto) {
    const task = await this.prisma.task.findUnique({ where: { id: taskId } });
    if (!task) throw new NotFoundException('Task not found');

    const data: any = { status: dto.status };
    if (dto.status === 'IN_REVIEW') data.approvalStatus = 'PENDING';
    if (dto.status === 'TODO' || dto.status === 'IN_PROGRESS') {
      data.approvalStatus = 'NOT_SUBMITTED';
      data.completedAt = null;
    }
    if (dto.status === 'DONE' && task.approvalStatus !== 'APPROVED') {
      // Employees can't self-approve: mark it as awaiting the lead instead.
      data.status = 'IN_REVIEW';
      data.approvalStatus = 'PENDING';
    }

    return this.prisma.task.update({ where: { id: taskId }, data, include: TASK_INCLUDE });
  }

  /**
   * Team lead sign-off. Approving completes the task and refreshes the
   * assignee's skill metrics and badges so the scorecard stays current.
   */
  async approve(taskId: string, approverId: string, dto: ApproveTaskDto) {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      include: { team: true },
    });
    if (!task) throw new NotFoundException('Task not found');

    const approver = await this.prisma.user.findUnique({ where: { id: approverId } });
    const isLead = task.team.leadId === approverId;
    if (!isLead && approver?.role !== 'SUPER_ADMIN') {
      throw new ForbiddenException('Only the team lead can approve this task');
    }

    const approved = dto.decision === 'APPROVED';
    const updated = await this.prisma.task.update({
      where: { id: taskId },
      data: {
        approvalStatus: dto.decision,
        status: approved ? 'DONE' : 'IN_PROGRESS',
        completedAt: approved ? task.completedAt ?? new Date() : null,
      },
      include: TASK_INCLUDE,
    });

    if (approved && updated.assigneeId) {
      await this.gamification.recomputeSkillMetrics(updated.assigneeId);
      await this.gamification.evaluateBadges(updated.assigneeId);
    }

    return updated;
  }

  // -------------------------------------------------------------- subtasks

  createSubtask(taskId: string, dto: CreateSubtaskDto) {
    const { deadline, ...rest } = dto;
    return this.prisma.subtask.create({
      data: { ...rest, taskId, deadline: deadline ? new Date(deadline) : undefined },
    });
  }

  listSubtasks(taskId: string) {
    return this.prisma.subtask.findMany({ where: { taskId }, orderBy: { createdAt: 'asc' } });
  }

  updateSubtaskStatus(subtaskId: string, status: string) {
    return this.prisma.subtask.update({ where: { id: subtaskId }, data: { status } });
  }
}
