import { TestContext, createTestApp, resetDb, seedOrg, bearer } from './helpers';

describe('Chat (e2e)', () => {
  let ctx: TestContext;
  let org: Awaited<ReturnType<typeof seedOrg>>;
  let channelId: string;

  beforeAll(async () => {
    ctx = await createTestApp();
    await resetDb(ctx.prisma);
    org = await seedOrg(ctx);
  });

  afterAll(async () => {
    await ctx.app.close();
  });

  it('creates a channel with the chosen members plus the creator', async () => {
    const res = await ctx
      .http()
      .post('/chat/channels')
      .set(bearer(org.leadToken))
      .send({ name: 'platform-team', memberIds: [org.employeeId] })
      .expect(201);

    channelId = res.body.id;
    expect(res.body.members).toHaveLength(2);
  });

  it('lists channels the person belongs to', async () => {
    const mine = await ctx.http().get('/chat/channels').set(bearer(org.employeeToken)).expect(200);
    expect(mine.body.some((c: any) => c.id === channelId)).toBe(true);

    const hrView = await ctx.http().get('/chat/channels').set(bearer(org.hrToken)).expect(200);
    expect(hrView.body.some((c: any) => c.id === channelId)).toBe(false);
  });

  it('posts and reads messages in order', async () => {
    await ctx
      .http()
      .post(`/chat/channels/${channelId}/messages`)
      .set(bearer(org.leadToken))
      .send({ content: 'Morning all' })
      .expect(201);

    await ctx
      .http()
      .post(`/chat/channels/${channelId}/messages`)
      .set(bearer(org.employeeToken))
      .send({ content: 'Morning!' })
      .expect(201);

    const messages = await ctx
      .http()
      .get(`/chat/channels/${channelId}/messages`)
      .set(bearer(org.employeeToken))
      .expect(200);

    expect(messages.body).toHaveLength(2);
    expect(messages.body[0].content).toBe('Morning all');
    expect(messages.body[0].sender.fullName).toBe('Lead User');
  });

  it('rejects an empty message', async () => {
    await ctx
      .http()
      .post(`/chat/channels/${channelId}/messages`)
      .set(bearer(org.employeeToken))
      .send({})
      .expect(400);
  });

  it('requires authentication', async () => {
    await ctx.http().get('/chat/channels').expect(401);
  });
});
