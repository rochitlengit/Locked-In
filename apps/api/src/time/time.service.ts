import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StartTimerDto } from './dto';

@Injectable()
export class TimeService {
  constructor(private prisma: PrismaService) {}

  async start(userId: string, dto: StartTimerDto) {
    const open = await this.prisma.timeLog.findFirst({
      where: { userId, endedAt: null },
    });
    if (open) throw new BadRequestException('A timer is already running. Stop it first.');
    return this.prisma.timeLog.create({
      data: { userId, taskId: dto.taskId, subtaskId: dto.subtaskId, note: dto.note, startedAt: new Date() },
    });
  }

  async stop(userId: string, timeLogId: string) {
    const log = await this.prisma.timeLog.findUnique({ where: { id: timeLogId } });
    if (!log || log.userId !== userId) throw new BadRequestException('Timer not found');
    const endedAt = new Date();
    const durationSec = Math.round((endedAt.getTime() - log.startedAt.getTime()) / 1000);
    return this.prisma.timeLog.update({ where: { id: timeLogId }, data: { endedAt, durationSec } });
  }

  active(userId: string) {
    return this.prisma.timeLog.findFirst({ where: { userId, endedAt: null } });
  }

  myLogs(userId: string) {
    return this.prisma.timeLog.findMany({
      where: { userId },
      orderBy: { startedAt: 'desc' },
      include: { task: true, subtask: true },
      take: 100,
    });
  }

  logsForTask(taskId: string) {
    return this.prisma.timeLog.findMany({ where: { taskId }, include: { user: true } });
  }
}
