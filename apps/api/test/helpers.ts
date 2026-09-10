import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

export interface TestContext {
  app: INestApplication;
  prisma: PrismaService;
  http: () => ReturnType<typeof request>;
}

export async function createTestApp(): Promise<TestContext> {
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
  const app = moduleRef.createNestApplication();
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  await app.init();
  const prisma = app.get(PrismaService);
  return { app, prisma, http: () => request(app.getHttpServer()) };
}

/** Empties every table so each suite starts from a known state. */
export async function resetDb(prisma: PrismaService) {
  await prisma.message.deleteMany();
  await prisma.channelMember.deleteMany();
  await prisma.channel.deleteMany();
  await prisma.timeLog.deleteMany();
  await prisma.taskSkill.deleteMany();
  await prisma.subtask.deleteMany();
  await prisma.task.deleteMany();
  await prisma.skillMetric.deleteMany();
  await prisma.skill.deleteMany();
  await prisma.userBadge.deleteMany();
  await prisma.badge.deleteMany();
  await prisma.scoreRecord.deleteMany();
  await prisma.remark.deleteMany();
  await prisma.leaveRequest.deleteMany();
  await prisma.leaveBalance.deleteMany();
  await prisma.leaveType.deleteMany();
  await prisma.permissionRequest.deleteMany();
  await prisma.grievance.deleteMany();
  await prisma.announcement.deleteMany();
  await prisma.scoringConfig.deleteMany();
  await prisma.user.updateMany({ data: { teamId: null, managerId: null } });
  await prisma.team.updateMany({ data: { leadId: null } });
  await prisma.team.deleteMany();
  await prisma.department.deleteMany();
  await prisma.user.deleteMany();
  await prisma.organization.deleteMany();
}

export const bearer = (token: string) => ({ Authorization: `Bearer ${token}` });

/**
 * Builds a minimal but complete org: admin + HR + a team with a lead and one
 * employee. Returns tokens and ids the specs can drive the API with.
 */
export async function seedOrg(ctx: TestContext) {
  const { http } = ctx;

  const admin = await http()
    .post('/auth/register')
    .send({
      email: 'admin@test.dev',
      password: 'password123',
      fullName: 'Admin User',
      orgName: 'Test Org',
    })
    .expect(201);
  const adminToken = admin.body.access_token;

  const adminMe = await http().get('/auth/me').set(bearer(adminToken)).expect(200);
  const adminId = adminMe.body.id as string;

  const dept = await http()
    .post('/departments')
    .set(bearer(adminToken))
    .send({ name: 'Engineering' })
    .expect(201);

  const hr = await http()
    .post('/users')
    .set(bearer(adminToken))
    .send({
      email: 'hr@test.dev',
      fullName: 'HR User',
      password: 'password123',
      role: 'HR',
      managerId: adminId,
    })
    .expect(201);

  const lead = await http()
    .post('/users')
    .set(bearer(adminToken))
    .send({
      email: 'lead@test.dev',
      fullName: 'Lead User',
      password: 'password123',
      role: 'TEAM_LEAD',
      managerId: adminId,
    })
    .expect(201);

  const team = await http()
    .post('/teams')
    .set(bearer(adminToken))
    .send({ name: 'Platform', departmentId: dept.body.id, leadId: lead.body.id })
    .expect(201);

  const employee = await http()
    .post('/users')
    .set(bearer(adminToken))
    .send({
      email: 'employee@test.dev',
      fullName: 'Employee User',
      password: 'password123',
      role: 'EMPLOYEE',
      teamId: team.body.id,
      managerId: lead.body.id,
    })
    .expect(201);

  await http()
    .patch(`/users/${lead.body.id}`)
    .set(bearer(adminToken))
    .send({ teamId: team.body.id })
    .expect(200);

  const login = async (email: string) => {
    const res = await http()
      .post('/auth/login')
      .send({ email, password: 'password123' })
      .expect(201);
    return res.body.access_token as string;
  };

  return {
    adminToken,
    hrToken: await login('hr@test.dev'),
    leadToken: await login('lead@test.dev'),
    employeeToken: await login('employee@test.dev'),
    adminId,
    hrId: hr.body.id as string,
    leadId: lead.body.id as string,
    employeeId: employee.body.id as string,
    teamId: team.body.id as string,
    departmentId: dept.body.id as string,
  };
}
