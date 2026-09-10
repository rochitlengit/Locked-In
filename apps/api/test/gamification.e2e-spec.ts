import { TestContext, createTestApp, resetDb, seedOrg, bearer } from './helpers';

describe('Performance scoring (e2e)', () => {
  let ctx: TestContext;
  let org: Awaited<ReturnType<typeof seedOrg>>;

  const DAY = 86_400_000;

  /**
   * Creates a task, logs time against it and takes it all the way through
   * approval — the only path that makes work count towards a score.
   */
  const deliverTask = async (opts: {
    weightage?: number;
    difficulty?: number;
    estimatedMinutes?: number;
    loggedMinutes?: number;
    daysLate?: number;
    skillIds?: string[];
  }) => {
    const {
      weightage = 3,
      difficulty = 3,
      estimatedMinutes = 120,
      loggedMinutes = 100,
      daysLate = -1,
      skillIds,
    } = opts;

    const task = await ctx
      .http()
      .post('/tasks')
      .set(bearer(org.leadToken))
      .send({
        title: 'Scored work',
        teamId: org.teamId,
        assigneeId: org.employeeId,
        weightage,
        difficulty,
        estimatedMinutes,
        deadline: new Date(Date.now() - daysLate * DAY).toISOString(),
        skillIds,
      })
      .expect(201);

    await ctx.prisma.timeLog.create({
      data: {
        userId: org.employeeId,
        taskId: task.body.id,
        startedAt: new Date(Date.now() - loggedMinutes * 60_000),
        endedAt: new Date(),
        durationSec: loggedMinutes * 60,
      },
    });

    await ctx
      .http()
      .patch(`/tasks/${task.body.id}/approve`)
      .set(bearer(org.leadToken))
      .send({ decision: 'APPROVED' })
      .expect(200);

    return task.body;
  };

  beforeAll(async () => {
    ctx = await createTestApp();
    await resetDb(ctx.prisma);
    org = await seedOrg(ctx);
  });

  afterAll(async () => {
    await ctx.app.close();
  });

  it('starts everyone at zero with no completed work', async () => {
    const res = await ctx.http().get('/gamification/me').set(bearer(org.employeeToken)).expect(200);
    expect(res.body).toMatchObject({ tasksCompleted: 0, totalScore: 0 });
  });

  it('ignores work that has not been approved yet', async () => {
    await ctx
      .http()
      .post('/tasks')
      .set(bearer(org.leadToken))
      .send({ title: 'Not approved', teamId: org.teamId, assigneeId: org.employeeId })
      .expect(201);

    const res = await ctx.http().get('/gamification/me').set(bearer(org.employeeToken)).expect(200);
    expect(res.body.tasksCompleted).toBe(0);
  });

  it('scores approved work across all three components', async () => {
    await deliverTask({ weightage: 5, difficulty: 5, estimatedMinutes: 200, loggedMinutes: 100 });

    const res = await ctx.http().get('/gamification/me').set(bearer(org.employeeToken)).expect(200);
    expect(res.body.tasksCompleted).toBe(1);
    expect(res.body.weightagePts).toBe(100);
    expect(res.body.timeEfficiencyPts).toBe(100);
    expect(res.body.deadlinePts).toBeGreaterThan(75);
    expect(res.body.totalScore).toBeGreaterThan(80);
  });

  it('drags the score down when work runs late and over estimate', async () => {
    const before = await ctx.http().get('/gamification/me').set(bearer(org.employeeToken)).expect(200);

    await deliverTask({
      weightage: 1,
      difficulty: 1,
      estimatedMinutes: 60,
      loggedMinutes: 200,
      daysLate: 4,
    });

    const after = await ctx.http().get('/gamification/me').set(bearer(org.employeeToken)).expect(200);
    expect(after.body.tasksCompleted).toBe(2);
    expect(after.body.totalScore).toBeLessThan(before.body.totalScore);
  });

  it('ranks the team leaderboard by score', async () => {
    const board = await ctx
      .http()
      .get(`/gamification/leaderboard/team/${org.teamId}`)
      .set(bearer(org.leadToken))
      .expect(200);

    expect(board.body.length).toBeGreaterThanOrEqual(2);
    expect(board.body[0].rank).toBe(1);
    for (let i = 1; i < board.body.length; i++) {
      expect(board.body[i - 1].totalScore).toBeGreaterThanOrEqual(board.body[i].totalScore);
    }
  });

  it('builds a team overview a lead can act on', async () => {
    const res = await ctx
      .http()
      .get(`/gamification/team/${org.teamId}/overview`)
      .set(bearer(org.leadToken))
      .expect(200);

    expect(res.body.team.name).toBe('Platform');
    expect(res.body.members.length).toBeGreaterThanOrEqual(2);
    expect(res.body.teamAverage).toBeGreaterThan(0);
    expect(res.body.members[0]).toHaveProperty('skills');
    expect(res.body.members[0]).toHaveProperty('badges');
    expect(res.body.members[0]).toHaveProperty('openTasks');
  });

  it('keeps the team overview away from employees', async () => {
    await ctx
      .http()
      .get(`/gamification/team/${org.teamId}/overview`)
      .set(bearer(org.employeeToken))
      .expect(403);
  });

  it('builds skill metrics from the skills tagged on completed work', async () => {
    const skill = await ctx
      .http()
      .post('/gamification/skills')
      .set(bearer(org.leadToken))
      .send({ name: 'Backend' })
      .expect(201);

    await deliverTask({ skillIds: [skill.body.id], weightage: 4, difficulty: 4 });

    const skills = await ctx
      .http()
      .get('/gamification/me/skills')
      .set(bearer(org.employeeToken))
      .expect(200);

    expect(skills.body).toHaveLength(1);
    expect(skills.body[0].skill.name).toBe('Backend');
    expect(skills.body[0].tasksCompleted).toBe(1);
    expect(skills.body[0].score).toBeGreaterThan(0);
  });

  it('awards badges automatically as milestones are hit', async () => {
    // Five deliveries inside the deadline earns Early Bird.
    for (let i = 0; i < 5; i++) {
      await deliverTask({ daysLate: -2 });
    }

    const badges = await ctx
      .http()
      .get('/gamification/me/badges')
      .set(bearer(org.employeeToken))
      .expect(200);

    const names = badges.body.map((b: any) => b.badge.name);
    expect(names).toContain('Early Bird');
  });

  it('never awards the same badge twice', async () => {
    await ctx
      .http()
      .post(`/gamification/users/${org.employeeId}/recompute`)
      .set(bearer(org.leadToken))
      .expect(201);

    const badges = await ctx
      .http()
      .get('/gamification/me/badges')
      .set(bearer(org.employeeToken))
      .expect(200);

    const names = badges.body.map((b: any) => b.badge.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it('exposes scoring weights and lets only the super admin change them', async () => {
    const config = await ctx.http().get('/gamification/config').set(bearer(org.leadToken)).expect(200);
    expect(config.body.timeWeight).toBeCloseTo(0.4);

    await ctx
      .http()
      .patch('/gamification/config')
      .set(bearer(org.leadToken))
      .send({ timeWeight: 0.9 })
      .expect(403);

    const updated = await ctx
      .http()
      .patch('/gamification/config')
      .set(bearer(org.adminToken))
      .send({ timeWeight: 0.6, weightageWeight: 0.2, deadlineWeight: 0.2 })
      .expect(200);
    expect(updated.body.timeWeight).toBeCloseTo(0.6);
  });

  it('recomputes scores using the updated weights', async () => {
    const res = await ctx.http().get('/gamification/me').set(bearer(org.employeeToken)).expect(200);
    expect(res.body.totalScore).toBeGreaterThan(0);
    expect(res.body.totalScore).toBeLessThanOrEqual(100);
  });

  it('writes score snapshots when a period is closed', async () => {
    const periodEnd = new Date().toISOString();
    const periodStart = new Date(Date.now() - 30 * DAY).toISOString();

    const res = await ctx
      .http()
      .post('/gamification/period-close')
      .set(bearer(org.adminToken))
      .send({ periodStart, periodEnd })
      .expect(201);

    expect(res.body.snapshots).toBeGreaterThan(0);

    const history = await ctx
      .http()
      .get('/gamification/me/history')
      .set(bearer(org.employeeToken))
      .expect(200);
    expect(history.body.length).toBeGreaterThan(0);
    expect(history.body[0]).toHaveProperty('totalScore');
  });

  it('lets only the super admin close a period', async () => {
    await ctx
      .http()
      .post('/gamification/period-close')
      .set(bearer(org.hrToken))
      .send({
        periodStart: new Date(Date.now() - DAY).toISOString(),
        periodEnd: new Date().toISOString(),
      })
      .expect(403);
  });
});
