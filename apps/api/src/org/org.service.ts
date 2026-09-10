import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDepartmentDto, CreateTeamDto, CreateUserDto, UpdateUserDto, CreateRemarkDto } from './dto';

@Injectable()
export class OrgService {
  constructor(private prisma: PrismaService) {}

  // Departments
  createDepartment(orgId: string, dto: CreateDepartmentDto) {
    return this.prisma.department.create({ data: { ...dto, orgId } });
  }
  listDepartments(orgId: string) {
    return this.prisma.department.findMany({ where: { orgId }, include: { teams: true } });
  }

  // Teams
  createTeam(dto: CreateTeamDto) {
    return this.prisma.team.create({ data: dto });
  }
  listTeams(orgId: string) {
    return this.prisma.team.findMany({
      where: { department: { orgId } },
      include: { lead: true, members: true, department: true },
    });
  }

  // Users
  async createUser(orgId: string, dto: CreateUserDto) {
    const passwordHash = await bcrypt.hash(dto.password, 10);
    const { password, ...rest } = dto as any;
    return this.prisma.user.create({
      data: { ...rest, passwordHash, orgId },
    });
  }

  listUsers(orgId: string) {
    return this.prisma.user.findMany({
      where: { orgId },
      select: {
        id: true, email: true, fullName: true, role: true, title: true,
        teamId: true, managerId: true, isActive: true, avatarUrl: true, joinedAt: true,
        team: { select: { id: true, name: true } },
        manager: { select: { id: true, fullName: true } },
      },
      orderBy: { fullName: 'asc' },
    });
  }

  /** Full profile for the people/performance screens. */
  getUser(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true, email: true, fullName: true, role: true, title: true, avatarUrl: true,
        teamId: true, managerId: true, isActive: true, joinedAt: true,
        team: { select: { id: true, name: true, lead: { select: { id: true, fullName: true } } } },
        manager: { select: { id: true, fullName: true } },
        reports: { select: { id: true, fullName: true, title: true } },
      },
    });
  }

  listTeamMembers(teamId: string) {
    return this.prisma.user.findMany({
      where: { teamId },
      select: { id: true, fullName: true, title: true, role: true, avatarUrl: true },
      orderBy: { fullName: 'asc' },
    });
  }

  updateUser(id: string, dto: UpdateUserDto) {
    return this.prisma.user.update({ where: { id }, data: dto as any });
  }

  // Org chart: nested tree by manager hierarchy
  async orgChart(orgId: string) {
    const users = await this.prisma.user.findMany({
      where: { orgId },
      select: { id: true, fullName: true, title: true, role: true, managerId: true, teamId: true, avatarUrl: true },
    });
    const byId = new Map(users.map((u) => [u.id, { ...u, children: [] as any[] }]));
    const roots: any[] = [];
    for (const u of byId.values()) {
      if (u.managerId && byId.has(u.managerId)) {
        byId.get(u.managerId)!.children.push(u);
      } else {
        roots.push(u);
      }
    }
    return roots;
  }

  // Remarks (TL/HR notes on an employee)
  addRemark(authorId: string, dto: CreateRemarkDto) {
    return this.prisma.remark.create({ data: { authorId, ...dto } });
  }
  listRemarks(subjectId: string) {
    return this.prisma.remark.findMany({ where: { subjectId }, include: { author: true }, orderBy: { createdAt: 'desc' } });
  }
}
