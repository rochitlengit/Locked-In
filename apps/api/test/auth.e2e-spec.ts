import { TestContext, createTestApp, resetDb, seedOrg, bearer } from './helpers';

describe('Authentication and access control (e2e)', () => {
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

  it('signs a new organization up and makes the first user the super admin', async () => {
    const res = await ctx
      .http()
      .post('/auth/register')
      .send({
        email: 'founder@another.dev',
        password: 'password123',
        fullName: 'Founder',
        orgName: 'Another Co',
      })
      .expect(201);

    expect(res.body.access_token).toBeDefined();

    const me = await ctx
      .http()
      .get('/auth/me')
      .set(bearer(res.body.access_token))
      .expect(200);
    expect(me.body.role).toBe('SUPER_ADMIN');
    expect(me.body.passwordHash).toBeUndefined();
  });

  it('refuses to register the same email twice', async () => {
    await ctx
      .http()
      .post('/auth/register')
      .send({ email: 'admin@test.dev', password: 'password123', fullName: 'Copy' })
      .expect(409);
  });

  it('rejects a wrong password', async () => {
    await ctx
      .http()
      .post('/auth/login')
      .send({ email: 'admin@test.dev', password: 'wrong-password' })
      .expect(401);
  });

  it('rejects a login for an unknown account', async () => {
    await ctx
      .http()
      .post('/auth/login')
      .send({ email: 'nobody@test.dev', password: 'password123' })
      .expect(401);
  });

  it('validates the signup payload', async () => {
    await ctx
      .http()
      .post('/auth/register')
      .send({ email: 'not-an-email', password: 'short', fullName: '' })
      .expect(400);
  });

  it('blocks unauthenticated access to protected routes', async () => {
    await ctx.http().get('/users').expect(401);
    await ctx.http().get('/tasks/mine').expect(401);
  });

  it('blocks a garbage token', async () => {
    await ctx.http().get('/users').set(bearer('not.a.real.token')).expect(401);
  });

  it('lets any signed-in role read the people directory', async () => {
    const res = await ctx.http().get('/users').set(bearer(org.employeeToken)).expect(200);
    expect(res.body.length).toBeGreaterThanOrEqual(4);
  });

  it('stops an employee from creating people', async () => {
    await ctx
      .http()
      .post('/users')
      .set(bearer(org.employeeToken))
      .send({
        email: 'sneaky@test.dev',
        fullName: 'Sneaky',
        password: 'password123',
        role: 'SUPER_ADMIN',
      })
      .expect(403);
  });

  it('stops a team lead from creating departments', async () => {
    await ctx
      .http()
      .post('/departments')
      .set(bearer(org.leadToken))
      .send({ name: 'Rogue Department' })
      .expect(403);
  });

  it('builds the org chart from the reporting hierarchy', async () => {
    const res = await ctx.http().get('/org-chart').set(bearer(org.adminToken)).expect(200);
    expect(res.body.length).toBeGreaterThan(0);
    const root = res.body[0];
    expect(root.children.length).toBeGreaterThan(0);
  });
});
