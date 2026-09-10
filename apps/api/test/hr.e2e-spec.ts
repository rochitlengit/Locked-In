import { TestContext, createTestApp, resetDb, seedOrg, bearer } from './helpers';

describe('HR: leave, permissions and grievances (e2e)', () => {
  let ctx: TestContext;
  let org: Awaited<ReturnType<typeof seedOrg>>;
  let leaveTypeId: string;

  const day = (offset: number) => new Date(Date.now() + offset * 86_400_000).toISOString();

  beforeAll(async () => {
    ctx = await createTestApp();
    await resetDb(ctx.prisma);
    org = await seedOrg(ctx);

    const type = await ctx
      .http()
      .post('/hr/leave-types')
      .set(bearer(org.hrToken))
      .send({ name: 'Casual Leave', defaultDaysPerYear: 12 })
      .expect(201);
    leaveTypeId = type.body.id;
  });

  afterAll(async () => {
    await ctx.app.close();
  });

  it('only lets HR or an admin define leave types', async () => {
    await ctx
      .http()
      .post('/hr/leave-types')
      .set(bearer(org.employeeToken))
      .send({ name: 'Unlimited Holiday' })
      .expect(403);
  });

  it('lets an employee request leave', async () => {
    const res = await ctx
      .http()
      .post('/hr/leave-requests')
      .set(bearer(org.employeeToken))
      .send({ leaveTypeId, startDate: day(7), endDate: day(9), reason: 'Family event' })
      .expect(201);

    expect(res.body.status).toBe('PENDING');
    expect(res.body.approverId).toBeNull();
  });

  it('validates the dates on a leave request', async () => {
    await ctx
      .http()
      .post('/hr/leave-requests')
      .set(bearer(org.employeeToken))
      .send({ leaveTypeId, startDate: 'next tuesday', endDate: day(2) })
      .expect(400);
  });

  it('surfaces the request in the approval queue', async () => {
    const queue = await ctx
      .http()
      .get('/hr/leave-requests/pending')
      .set(bearer(org.leadToken))
      .expect(200);
    expect(queue.body).toHaveLength(1);
    expect(queue.body[0].user.fullName).toBe('Employee User');
  });

  it('keeps the approval queue away from employees', async () => {
    await ctx
      .http()
      .get('/hr/leave-requests/pending')
      .set(bearer(org.employeeToken))
      .expect(403);
  });

  it('deducts the balance when leave is approved', async () => {
    const queue = await ctx
      .http()
      .get('/hr/leave-requests/pending')
      .set(bearer(org.leadToken))
      .expect(200);

    const approved = await ctx
      .http()
      .patch(`/hr/leave-requests/${queue.body[0].id}/decide`)
      .set(bearer(org.leadToken))
      .send({ status: 'APPROVED' })
      .expect(200);

    expect(approved.body.status).toBe('APPROVED');
    expect(approved.body.approverId).toBe(org.leadId);

    const balances = await ctx
      .http()
      .get('/hr/leave-balances/mine')
      .set(bearer(org.employeeToken))
      .expect(200);

    // Three-day request (inclusive) against a fresh 12-day allocation.
    expect(balances.body).toHaveLength(1);
    expect(balances.body[0].used).toBe(3);
    expect(balances.body[0].allocated).toBe(12);
  });

  it('does not deduct anything when leave is rejected', async () => {
    const created = await ctx
      .http()
      .post('/hr/leave-requests')
      .set(bearer(org.employeeToken))
      .send({ leaveTypeId, startDate: day(20), endDate: day(21) })
      .expect(201);

    await ctx
      .http()
      .patch(`/hr/leave-requests/${created.body.id}/decide`)
      .set(bearer(org.hrToken))
      .send({ status: 'REJECTED' })
      .expect(200);

    const balances = await ctx
      .http()
      .get('/hr/leave-balances/mine')
      .set(bearer(org.employeeToken))
      .expect(200);
    expect(balances.body[0].used).toBe(3);
  });

  it('handles permission-hour requests', async () => {
    const created = await ctx
      .http()
      .post('/hr/permission-requests')
      .set(bearer(org.employeeToken))
      .send({ date: day(1), fromTime: '14:00', toTime: '16:00', reason: 'Doctor visit' })
      .expect(201);
    expect(created.body.status).toBe('PENDING');

    const decided = await ctx
      .http()
      .patch(`/hr/permission-requests/${created.body.id}/decide`)
      .set(bearer(org.leadToken))
      .send({ status: 'APPROVED' })
      .expect(200);
    expect(decided.body.status).toBe('APPROVED');
  });

  it('lets an employee raise a grievance and keeps the full list HR-only', async () => {
    await ctx
      .http()
      .post('/grievances')
      .set(bearer(org.employeeToken))
      .send({ category: 'Workload', description: 'On-call rotation is unbalanced' })
      .expect(201);

    const mine = await ctx.http().get('/grievances/mine').set(bearer(org.employeeToken)).expect(200);
    expect(mine.body).toHaveLength(1);

    await ctx.http().get('/grievances').set(bearer(org.employeeToken)).expect(403);
    await ctx.http().get('/grievances').set(bearer(org.leadToken)).expect(403);

    const all = await ctx.http().get('/grievances').set(bearer(org.hrToken)).expect(200);
    expect(all.body).toHaveLength(1);
  });

  it('lets HR move a grievance through to resolution', async () => {
    const all = await ctx.http().get('/grievances').set(bearer(org.hrToken)).expect(200);
    const resolved = await ctx
      .http()
      .patch(`/grievances/${all.body[0].id}`)
      .set(bearer(org.hrToken))
      .send({ status: 'RESOLVED' })
      .expect(200);

    expect(resolved.body.status).toBe('RESOLVED');
    expect(resolved.body.resolvedAt).toBeTruthy();
  });

  it('lets HR publish a newsletter that everyone can read', async () => {
    await ctx
      .http()
      .post('/announcements')
      .set(bearer(org.hrToken))
      .send({ title: 'All hands Thursday', body: 'See you at 4pm.', pinned: true })
      .expect(201);

    await ctx
      .http()
      .post('/announcements')
      .set(bearer(org.employeeToken))
      .send({ title: 'Free lunch', body: 'For everyone' })
      .expect(403);

    const feed = await ctx
      .http()
      .get('/announcements')
      .set(bearer(org.employeeToken))
      .expect(200);
    expect(feed.body).toHaveLength(1);
    expect(feed.body[0].author.fullName).toBe('HR User');
  });
});
