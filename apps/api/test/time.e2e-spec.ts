import { TestContext, createTestApp, resetDb, seedOrg, bearer } from './helpers';

describe('Time tracking (e2e)', () => {
  let ctx: TestContext;
  let org: Awaited<ReturnType<typeof seedOrg>>;

  beforeAll(async () => {
    ctx = await createTestApp();
    await resetDb(ctx.prisma);
    org = await seedOrg(ctx);
  });

  afterAll(async () => {
    await ctx.app.close();
  });

  it('starts a timer and reports it as the active one', async () => {
    const started = await ctx
      .http()
      .post('/time/start')
      .set(bearer(org.employeeToken))
      .send({ note: 'Working on the API' })
      .expect(201);

    expect(started.body.endedAt).toBeNull();

    const active = await ctx.http().get('/time/active').set(bearer(org.employeeToken)).expect(200);
    expect(active.body.id).toBe(started.body.id);
  });

  it('refuses to run two timers at once', async () => {
    await ctx
      .http()
      .post('/time/start')
      .set(bearer(org.employeeToken))
      .send({ note: 'Second timer' })
      .expect(400);
  });

  it('stops the timer and records a duration', async () => {
    const active = await ctx.http().get('/time/active').set(bearer(org.employeeToken)).expect(200);
    const stopped = await ctx
      .http()
      .post(`/time/${active.body.id}/stop`)
      .set(bearer(org.employeeToken))
      .expect(201);

    expect(stopped.body.endedAt).toBeTruthy();
    expect(stopped.body.durationSec).toBeGreaterThanOrEqual(0);
  });

  it('clears the active timer once stopped', async () => {
    const res = await ctx.http().get('/time/active').set(bearer(org.employeeToken)).expect(200);
    expect(res.body).toEqual({});
  });

  it('will not let someone stop a timer that is not theirs', async () => {
    const started = await ctx
      .http()
      .post('/time/start')
      .set(bearer(org.employeeToken))
      .send({ note: 'Mine' })
      .expect(201);

    await ctx
      .http()
      .post(`/time/${started.body.id}/stop`)
      .set(bearer(org.leadToken))
      .expect(400);

    await ctx.http().post(`/time/${started.body.id}/stop`).set(bearer(org.employeeToken)).expect(201);
  });

  it('returns the history for the signed-in person', async () => {
    const logs = await ctx.http().get('/time/mine').set(bearer(org.employeeToken)).expect(200);
    expect(logs.body.length).toBeGreaterThanOrEqual(2);
  });
});
