import { TestContext, createTestApp, resetDb, seedOrg, bearer } from './helpers';

describe('Task lifecycle and approvals (e2e)', () => {
  let ctx: TestContext;
  let org: Awaited<ReturnType<typeof seedOrg>>;

  const createTask = async (overrides: Record<string, any> = {}) => {
    const res = await ctx
      .http()
      .post('/tasks')
      .set(bearer(org.leadToken))
      .send({
        title: 'Ship the thing',
        teamId: org.teamId,
        assigneeId: org.employeeId,
        weightage: 4,
        difficulty: 3,
        estimatedMinutes: 120,
        deadline: new Date(Date.now() + 3 * 86_400_000).toISOString(),
        ...overrides,
      })
      .expect(201);
    return res.body;
  };

  beforeAll(async () => {
    ctx = await createTestApp();
    await resetDb(ctx.prisma);
    org = await seedOrg(ctx);
  });

  afterAll(async () => {
    await ctx.app.close();
  });

  it('lets a team lead create and assign work', async () => {
    const task = await createTask();
    expect(task.title).toBe('Ship the thing');
    expect(task.assignee.id).toBe(org.employeeId);
    expect(task.status).toBe('TODO');
    expect(task.approvalStatus).toBe('NOT_SUBMITTED');
  });

  it('stops an employee from creating tasks', async () => {
    await ctx
      .http()
      .post('/tasks')
      .set(bearer(org.employeeToken))
      .send({ title: 'Self assigned', teamId: org.teamId })
      .expect(403);
  });

  it('validates weightage and difficulty ranges', async () => {
    await ctx
      .http()
      .post('/tasks')
      .set(bearer(org.leadToken))
      .send({ title: 'Bad weights', teamId: org.teamId, weightage: 9, difficulty: 0 })
      .expect(400);
  });

  it('shows the employee only their own assigned work', async () => {
    await createTask({ title: 'Assigned to nobody', assigneeId: undefined });
    const mine = await ctx.http().get('/tasks/mine').set(bearer(org.employeeToken)).expect(200);
    expect(mine.body.every((t: any) => t.assignee?.id === org.employeeId)).toBe(true);
  });

  it('flags work for review when the employee submits it', async () => {
    const task = await createTask();
    const res = await ctx
      .http()
      .patch(`/tasks/${task.id}/status`)
      .set(bearer(org.employeeToken))
      .send({ status: 'IN_REVIEW' })
      .expect(200);
    expect(res.body.status).toBe('IN_REVIEW');
    expect(res.body.approvalStatus).toBe('PENDING');
  });

  it('does not let an employee mark their own work complete', async () => {
    const task = await createTask();
    const res = await ctx
      .http()
      .patch(`/tasks/${task.id}/status`)
      .set(bearer(org.employeeToken))
      .send({ status: 'DONE' })
      .expect(200);

    // Coerced into the review queue instead of silently completing.
    expect(res.body.status).toBe('IN_REVIEW');
    expect(res.body.approvalStatus).toBe('PENDING');
  });

  it('rejects an unknown status value', async () => {
    const task = await createTask();
    await ctx
      .http()
      .patch(`/tasks/${task.id}/status`)
      .set(bearer(org.employeeToken))
      .send({ status: 'ALMOST_DONE' })
      .expect(400);
  });

  it('completes the task once the lead approves it', async () => {
    const task = await createTask();
    await ctx
      .http()
      .patch(`/tasks/${task.id}/status`)
      .set(bearer(org.employeeToken))
      .send({ status: 'IN_REVIEW' })
      .expect(200);

    const approved = await ctx
      .http()
      .patch(`/tasks/${task.id}/approve`)
      .set(bearer(org.leadToken))
      .send({ decision: 'APPROVED' })
      .expect(200);

    expect(approved.body.status).toBe('DONE');
    expect(approved.body.approvalStatus).toBe('APPROVED');
    expect(approved.body.completedAt).toBeTruthy();
  });

  it('sends rejected work back to the employee instead of completing it', async () => {
    const task = await createTask();
    const rejected = await ctx
      .http()
      .patch(`/tasks/${task.id}/approve`)
      .set(bearer(org.leadToken))
      .send({ decision: 'REJECTED', note: 'Needs tests' })
      .expect(200);

    expect(rejected.body.status).toBe('IN_PROGRESS');
    expect(rejected.body.approvalStatus).toBe('REJECTED');
    expect(rejected.body.completedAt).toBeNull();
  });

  it('stops an employee from approving their own work', async () => {
    const task = await createTask();
    await ctx
      .http()
      .patch(`/tasks/${task.id}/approve`)
      .set(bearer(org.employeeToken))
      .send({ decision: 'APPROVED' })
      .expect(403);
  });

  it('lists what the lead still has to review', async () => {
    const task = await createTask({ title: 'Waiting on review' });
    await ctx
      .http()
      .patch(`/tasks/${task.id}/status`)
      .set(bearer(org.employeeToken))
      .send({ status: 'IN_REVIEW' })
      .expect(200);

    const queue = await ctx
      .http()
      .get('/tasks/pending-approvals')
      .set(bearer(org.leadToken))
      .expect(200);

    expect(queue.body.some((t: any) => t.id === task.id)).toBe(true);
    expect(queue.body.every((t: any) => t.approvalStatus === 'PENDING')).toBe(true);
  });

  it('tracks subtasks under a task', async () => {
    const task = await createTask();
    await ctx
      .http()
      .post(`/tasks/${task.id}/subtasks`)
      .set(bearer(org.leadToken))
      .send({ title: 'Write the migration', assigneeId: org.employeeId })
      .expect(201);

    const subtasks = await ctx
      .http()
      .get(`/tasks/${task.id}/subtasks`)
      .set(bearer(org.employeeToken))
      .expect(200);

    expect(subtasks.body).toHaveLength(1);

    const updated = await ctx
      .http()
      .patch(`/tasks/subtasks/${subtasks.body[0].id}/status`)
      .set(bearer(org.employeeToken))
      .send({ status: 'DONE' })
      .expect(200);
    expect(updated.body.status).toBe('DONE');
  });

  it('tags tasks with skills so they feed the skill metrics', async () => {
    const skill = await ctx
      .http()
      .post('/gamification/skills')
      .set(bearer(org.leadToken))
      .send({ name: 'Backend' })
      .expect(201);

    const task = await createTask({ skillIds: [skill.body.id] });
    expect(task.skills).toHaveLength(1);
    expect(task.skills[0].skill.name).toBe('Backend');
  });
});
