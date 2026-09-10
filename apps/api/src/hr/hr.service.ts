import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLeaveTypeDto, CreateLeaveRequestDto, DecideLeaveDto, CreatePermissionRequestDto } from './dto';

@Injectable()
export class HrService {
  constructor(private prisma: PrismaService) {}

  createLeaveType(orgId: string, dto: CreateLeaveTypeDto) {
    return this.prisma.leaveType.create({ data: { orgId, name: dto.name, defaultDaysPerYear: dto.defaultDaysPerYear ?? 12 } });
  }
  listLeaveTypes(orgId: string) {
    return this.prisma.leaveType.findMany({ where: { orgId } });
  }

  requestLeave(userId: string, dto: CreateLeaveRequestDto) {
    return this.prisma.leaveRequest.create({
      data: {
        userId,
        leaveTypeId: dto.leaveTypeId,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
        reason: dto.reason,
      },
    });
  }

  myLeaveRequests(userId: string) {
    return this.prisma.leaveRequest.findMany({ where: { userId }, include: { leaveType: true }, orderBy: { createdAt: 'desc' } });
  }

  pendingLeaveRequests(orgId: string) {
    return this.prisma.leaveRequest.findMany({
      where: { status: 'PENDING', user: { orgId } },
      include: { user: true, leaveType: true },
      orderBy: { createdAt: 'asc' },
    });
  }

  async decideLeave(id: string, approverId: string, dto: DecideLeaveDto) {
    const updated = await this.prisma.leaveRequest.update({
      where: { id },
      data: { status: dto.status, approverId, decidedAt: new Date() },
      include: { leaveType: true },
    });
    if (dto.status === 'APPROVED') {
      const days = Math.ceil((updated.endDate.getTime() - updated.startDate.getTime()) / 86400000) + 1;
      const year = updated.startDate.getFullYear();
      await this.prisma.leaveBalance.upsert({
        where: { userId_leaveTypeId_year: { userId: updated.userId, leaveTypeId: updated.leaveTypeId, year } },
        create: { userId: updated.userId, leaveTypeId: updated.leaveTypeId, year, allocated: updated.leaveType.defaultDaysPerYear, used: days },
        update: { used: { increment: days } },
      });
    }
    return updated;
  }

  myBalances(userId: string) {
    return this.prisma.leaveBalance.findMany({ where: { userId }, include: { leaveType: true } });
  }

  requestPermission(userId: string, dto: CreatePermissionRequestDto) {
    return this.prisma.permissionRequest.create({ data: { userId, ...dto, date: new Date(dto.date) } });
  }

  myPermissionRequests(userId: string) {
    return this.prisma.permissionRequest.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } });
  }

  pendingPermissionRequests(orgId: string) {
    return this.prisma.permissionRequest.findMany({
      where: { status: 'PENDING', user: { orgId } },
      include: { user: true },
    });
  }

  decidePermission(id: string, approverId: string, dto: DecideLeaveDto) {
    return this.prisma.permissionRequest.update({ where: { id }, data: { status: dto.status, approverId } });
  }
}
