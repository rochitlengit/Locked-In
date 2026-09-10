/**
 * Demo seed: builds a complete, believable company so every screen in the app
 * has real data behind it — org hierarchy, three months of finished work with
 * time logs, leave history, grievances, chat, newsletters, and the derived
 * performance scores, skill metrics and badges that follow from all of it.
 *
 * Deterministic: the same command always produces the same demo org.
 */
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { aggregateScores, DEFAULT_WEIGHTS, ScorableTask } from '../src/gamification/scoring';
import { BADGE_DEFINITIONS, BadgeStats, earnedBadgeRules } from '../src/gamification/badges';

const prisma = new PrismaClient();

// ---------------------------------------------------------------- utilities

let rngState = 20260904;
const rand = () => {
  rngState = (rngState * 1664525 + 1013904223) % 4294967296;
  return rngState / 4294967296;
};
const randInt = (min: number, max: number) => Math.floor(rand() * (max - min + 1)) + min;
const pick = <T>(items: T[]): T => items[Math.floor(rand() * items.length)];
const chance = (p: number) => rand() < p;

const DAY = 86_400_000;
const daysAgo = (days: number, hour = 10) => {
  const d = new Date(Date.now() - days * DAY);
  d.setHours(hour, randInt(0, 59), 0, 0);
  return d;
};
const daysAhead = (days: number) => new Date(Date.now() + days * DAY);

const PASSWORD = 'password123';

// ------------------------------------------------------------------ content

const TASK_TEMPLATES: [string, string[]][] = [
  ['Ship the new onboarding checklist', ['Frontend', 'UI Design']],
  ['Fix session expiry on the mobile app', ['Mobile', 'Backend']],
  ['Migrate reporting queries to read replica', ['Backend', 'Data']],
  ['Add audit logging to the approvals API', ['Backend']],
  ['Rework the empty states across dashboards', ['UI Design', 'Frontend']],
  ['Cut container image size for faster deploys', ['DevOps']],
  ['Write runbook for the payments incident', ['Documentation', 'DevOps']],
  ['Instrument the timer with usage analytics', ['Frontend', 'Data']],
  ['Support: clear the escalation backlog', ['Customer Support']],
  ['Add regression tests for leave approvals', ['QA', 'Backend']],
  ['Design the performance scorecard screen', ['UI Design']],
  ['Harden rate limiting on the public API', ['Backend', 'DevOps']],
  ['Offline mode for the mobile task list', ['Mobile']],
  ['Quarterly data quality audit', ['Data', 'QA']],
  ['Refresh the help centre articles', ['Documentation', 'Customer Support']],
  ['Speed up the org chart render', ['Frontend']],
  ['Set up staging environment parity', ['DevOps']],
  ['Accessibility pass on core screens', ['UI Design', 'QA']],
  ['Push notification delivery fixes', ['Mobile', 'Backend']],
  ['Customer feedback synthesis for Q3', ['Customer Support', 'Data']],
];

const SKILLS = [
  'Backend',
  'Frontend',
  'Mobile',
  'DevOps',
  'UI Design',
  'QA',
  'Documentation',
  'Data',
  'Customer Support',
];

const ANNOUNCEMENTS = [
  {
    title: 'Q3 all-hands: Thursday 4pm',
    body:
      'We will walk through the quarter\'s numbers, the roadmap for Q4, and open the floor for questions. ' +
      'Attendance is optional but recorded — the deck lands in the drive right after.',
    pinned: true,
    days: 2,
  },
  {
    title: 'New leave policy: carry-forward now capped at 5 days',
    body:
      'Starting next cycle, unused casual leave carries forward up to five days. Anything above that expires ' +
      'at year end, so plan your time off early. Reach out to HR with edge cases.',
    pinned: true,
    days: 9,
  },
  {
    title: 'Welcome to our three new joiners',
    body:
      'Please welcome the folks joining Platform, Mobile and Support this month. Their buddies have been assigned ' +
      'and first-week checklists are already in their task boards.',
    pinned: false,
    days: 18,
  },
  {
    title: 'Security training due by the end of the month',
    body: 'The annual security module takes about 40 minutes. Completion is tracked; managers can see team progress.',
    pinned: false,
    days: 27,
  },
  {
    title: 'Office wifi maintenance this weekend',
    body: 'Expect intermittent connectivity on Saturday between 9am and 1pm while the access points are replaced.',
    pinned: false,
    days: 41,
  },
];

const CHAT_LINES = [
  'Morning — starting on the approvals bug, should have a fix by lunch.',
  'Can someone review my PR when you get a minute?',
  'Deploy went out clean, no alerts so far.',
  'I am blocked on the staging credentials, raised it with ops.',
  'Nice work on the scorecard screen, it looks much clearer now.',
  'Standup moved to 10:15 tomorrow, calendar is updated.',
  'The estimate on that migration was optimistic, tracking a bit over.',
  'Customer flagged the same issue again — logging it as a bug.',
  'Pushed the fix, can you verify on your device?',
  'Taking a half day tomorrow, permission request is in.',
  'Numbers for the sprint review are in the shared doc.',
  'Thanks for picking that up so fast 🙌',
];

const GRIEVANCES = [
  {
    category: 'Workload',
    description:
      'I have been carrying weekend on-call for three cycles in a row and it is starting to affect my sleep. ' +
      'Could the rotation be rebalanced across the team?',
    status: 'IN_PROGRESS',
    days: 6,
  },
  {
    category: 'Conduct',
    description:
      'A review comment on my pull request last week felt personal rather than technical. I would like guidance ' +
      'on how to raise this with the person directly.',
    status: 'OPEN',
    days: 3,
  },
  {
    category: 'Facilities',
    description: 'The second-floor meeting room projector has been broken for a month and bookings keep failing.',
    status: 'RESOLVED',
    days: 34,
  },
  {
    category: 'Pay & Benefits',
    description: 'My reimbursement for the conference in July has not come through yet — raised with finance twice.',
    status: 'OPEN',
    days: 11,
  },
];

const REMARKS = [
  'Consistently picks up the unglamorous work without being asked. Ready for more scope.',
  'Estimates have improved a lot this quarter — much closer to actuals now.',
  'Strong technically; would like to see more written communication in design docs.',
  'Handled the incident calmly and documented it well afterwards.',
  'Deadlines slipped twice this month; we agreed on smaller task breakdowns.',
];

// --------------------------------------------------------------- people data

interface PersonSpec {
  name: string;
  email: string;
  title: string;
  role: string;
  team?: string;
  lead?: boolean;
}

const PEOPLE: PersonSpec[] = [
  { name: 'Aisha Khan', email: 'admin@lockedin.test', title: 'Chief Executive', role: 'SUPER_ADMIN' },
  { name: 'Ravi Menon', email: 'hr@lockedin.test', title: 'Head of People', role: 'HR' },

  { name: 'Sara Ahmed', email: 'lead@lockedin.test', title: 'Engineering Lead', role: 'TEAM_LEAD', team: 'Platform Team', lead: true },
  { name: 'Karthik Rao', email: 'karthik@lockedin.test', title: 'Mobile Lead', role: 'TEAM_LEAD', team: 'Mobile Team', lead: true },
  { name: 'Nadia Fernandes', email: 'nadia@lockedin.test', title: 'Design Lead', role: 'TEAM_LEAD', team: 'Design Team', lead: true },
  { name: 'Imran Sheikh', email: 'imran@lockedin.test', title: 'Support Lead', role: 'TEAM_LEAD', team: 'Support Team', lead: true },

  { name: 'Dev Patel', email: 'employee@lockedin.test', title: 'Senior Software Engineer', role: 'EMPLOYEE', team: 'Platform Team' },
  { name: 'Meera Iyer', email: 'meera@lockedin.test', title: 'Software Engineer', role: 'EMPLOYEE', team: 'Platform Team' },
  { name: 'Tobias Lind', email: 'tobias@lockedin.test', title: 'Platform Engineer', role: 'EMPLOYEE', team: 'Platform Team' },
  { name: 'Priya Nair', email: 'priya@lockedin.test', title: 'Software Engineer', role: 'EMPLOYEE', team: 'Platform Team' },

  { name: 'Jonas Weber', email: 'jonas@lockedin.test', title: 'Android Engineer', role: 'EMPLOYEE', team: 'Mobile Team' },
  { name: 'Lucia Moreno', email: 'lucia@lockedin.test', title: 'iOS Engineer', role: 'EMPLOYEE', team: 'Mobile Team' },
  { name: 'Arjun Bose', email: 'arjun@lockedin.test', title: 'Mobile Engineer', role: 'EMPLOYEE', team: 'Mobile Team' },

  { name: 'Hana Suzuki', email: 'hana@lockedin.test', title: 'Product Designer', role: 'EMPLOYEE', team: 'Design Team' },
  { name: 'Omar Haddad', email: 'omar@lockedin.test', title: 'Product Designer', role: 'EMPLOYEE', team: 'Design Team' },
  { name: 'Elena Petrova', email: 'elena@lockedin.test', title: 'UX Researcher', role: 'EMPLOYEE', team: 'Design Team' },

  { name: 'Grace Owusu', email: 'grace@lockedin.test', title: 'Support Specialist', role: 'EMPLOYEE', team: 'Support Team' },
  { name: 'Marco Rossi', email: 'marco@lockedin.test', title: 'Support Specialist', role: 'EMPLOYEE', team: 'Support Team' },
];

const TEAM_TO_DEPARTMENT: Record<string, string> = {
  'Platform Team': 'Engineering',
  'Mobile Team': 'Engineering',
  'Design Team': 'Product & Design',
  'Support Team': 'Operations',
};

// --------------------------------------------------------------------- seed

async function wipe() {
  // Order matters: children before parents.
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

async function main() {
  console.log('Clearing existing data…');
  await wipe();

  console.log('Creating organization…');
  const org = await prisma.organization.create({ data: { name: 'Northwind Technologies' } });
  await prisma.scoringConfig.create({ data: { orgId: org.id } });

  const departments: Record<string, string> = {};
  for (const name of ['Engineering', 'Product & Design', 'Operations']) {
    const dept = await prisma.department.create({ data: { name, orgId: org.id } });
    departments[name] = dept.id;
  }

  const teams: Record<string, string> = {};
  for (const [teamName, deptName] of Object.entries(TEAM_TO_DEPARTMENT)) {
    const team = await prisma.team.create({
      data: { name: teamName, departmentId: departments[deptName] },
    });
    teams[teamName] = team.id;
  }

  console.log('Creating skills…');
  const skills: Record<string, string> = {};
  for (const name of SKILLS) {
    const skill = await prisma.skill.create({ data: { name, orgId: org.id } });
    skills[name] = skill.id;
  }

  console.log(`Creating ${PEOPLE.length} people…`);
  const passwordHash = await bcrypt.hash(PASSWORD, 10);
  const users: Record<string, any> = {};

  // Admin and HR first so everyone else can report into them.
  for (const spec of PEOPLE) {
    const user = await prisma.user.create({
      data: {
        email: spec.email,
        passwordHash,
        fullName: spec.name,
        role: spec.role,
        title: spec.title,
        orgId: org.id,
        teamId: spec.team ? teams[spec.team] : null,
        joinedAt: daysAgo(randInt(120, 900)),
      },
    });
    users[spec.email] = { ...user, spec };
  }

  const admin = users['admin@lockedin.test'];
  const hr = users['hr@lockedin.test'];

  // Hierarchy: leads report to the CEO, HR reports to the CEO, ICs to their lead.
  await prisma.user.update({ where: { id: hr.id }, data: { managerId: admin.id } });
  const leadByTeam: Record<string, any> = {};
  for (const spec of PEOPLE.filter((p) => p.lead)) {
    const lead = users[spec.email];
    leadByTeam[spec.team!] = lead;
    await prisma.user.update({ where: { id: lead.id }, data: { managerId: admin.id } });
    await prisma.team.update({ where: { id: teams[spec.team!] }, data: { leadId: lead.id } });
  }
  for (const spec of PEOPLE.filter((p) => p.role === 'EMPLOYEE')) {
    await prisma.user.update({
      where: { id: users[spec.email].id },
      data: { managerId: leadByTeam[spec.team!].id },
    });
  }

  console.log('Creating tasks, subtasks and time logs…');
  const employees = PEOPLE.filter((p) => p.role === 'EMPLOYEE').map((p) => users[p.email]);
  let taskCount = 0;
  let logCount = 0;

  // Everyone with a board: the ICs plus the leads, who carry work of their own.
  const workers = [
    ...employees,
    ...PEOPLE.filter((p) => p.lead).map((p) => users[p.email]),
  ];

  for (const employee of workers) {
    const teamName = employee.spec.team!;
    const lead = leadByTeam[teamName];
    const isLead = employee.spec.lead === true;
    // Leads carry a lighter load; the CEO assigns their work.
    const creator = isLead ? admin : lead;

    // Finished, approved work spread evenly across the last three months so
    // every monthly period in the score history has something in it.
    const completedCount = isLead ? randInt(3, 5) : randInt(9, 14);
    for (let i = 0; i < completedCount; i++) {
      const [title, taskSkills] = pick(TASK_TEMPLATES);
      const weightage = randInt(1, 5);
      const difficulty = randInt(1, 5);
      const estimatedMinutes = pick([60, 120, 180, 240, 360, 480, 600]);
      // Rotate through the three 30-day windows.
      const bucket = i % 3;
      const deadlineDaysAgo = randInt(bucket * 28 + 3, bucket * 28 + 28);
      const createdDaysAgo = deadlineDaysAgo + randInt(4, 14);
      // Most people land on time; some run early, some late.
      const finishOffset = chance(0.45) ? randInt(1, 4) : chance(0.6) ? 0 : -randInt(1, 5);
      const completedDaysAgo = Math.max(1, deadlineDaysAgo + finishOffset);

      const task = await prisma.task.create({
        data: {
          title: `${title}`,
          description: 'Seeded demo work item with a full delivery history.',
          teamId: teams[teamName],
          creatorId: creator.id,
          assigneeId: employee.id,
          status: 'DONE',
          approvalStatus: 'APPROVED',
          weightage,
          difficulty,
          estimatedMinutes,
          deadline: daysAgo(deadlineDaysAgo, 18),
          completedAt: daysAgo(completedDaysAgo, randInt(10, 19)),
          createdAt: daysAgo(createdDaysAgo),
          skills: {
            create: taskSkills
              .filter((s) => skills[s])
              .map((s) => ({ skillId: skills[s] })),
          },
        },
      });
      taskCount++;

      // Tracked time: usually near the estimate, sometimes well over or under.
      const efficiency = chance(0.35) ? 0.7 : chance(0.7) ? 1.0 : 1.6;
      const totalMinutes = Math.round(estimatedMinutes * efficiency * (0.85 + rand() * 0.3));
      const sessions = randInt(1, 3);
      for (let s = 0; s < sessions; s++) {
        const minutes = Math.round(totalMinutes / sessions);
        const startedAt = daysAgo(completedDaysAgo + (sessions - s - 1), randInt(9, 16));
        await prisma.timeLog.create({
          data: {
            userId: employee.id,
            taskId: task.id,
            startedAt,
            endedAt: new Date(startedAt.getTime() + minutes * 60_000),
            durationSec: minutes * 60,
            note: 'Focused session',
          },
        });
        logCount++;
      }
    }

    // Live board: work in flight right now.
    const openStatuses = ['TODO', 'TODO', 'IN_PROGRESS', 'IN_PROGRESS', 'IN_REVIEW'];
    for (const status of openStatuses.slice(0, isLead ? randInt(1, 2) : randInt(3, 5))) {
      const [title, taskSkills] = pick(TASK_TEMPLATES);
      const task = await prisma.task.create({
        data: {
          title,
          description: 'Active work item on the current board.',
          teamId: teams[teamName],
          creatorId: creator.id,
          assigneeId: employee.id,
          status,
          approvalStatus: status === 'IN_REVIEW' ? 'PENDING' : 'NOT_SUBMITTED',
          weightage: randInt(1, 5),
          difficulty: randInt(1, 5),
          estimatedMinutes: pick([90, 120, 240, 300, 480]),
          deadline: daysAhead(randInt(1, 14)),
          createdAt: daysAgo(randInt(1, 12)),
          skills: {
            create: taskSkills
              .filter((s) => skills[s])
              .map((s) => ({ skillId: skills[s] })),
          },
        },
      });
      taskCount++;

      if (status !== 'TODO') {
        for (const subtitle of ['Draft the approach', 'Implement', 'Write tests']) {
          await prisma.subtask.create({
            data: {
              taskId: task.id,
              title: subtitle,
              assigneeId: employee.id,
              status: chance(0.5) ? 'DONE' : 'IN_PROGRESS',
            },
          });
        }
        const startedAt = daysAgo(randInt(0, 3), randInt(9, 15));
        const minutes = randInt(45, 220);
        await prisma.timeLog.create({
          data: {
            userId: employee.id,
            taskId: task.id,
            startedAt,
            endedAt: new Date(startedAt.getTime() + minutes * 60_000),
            durationSec: minutes * 60,
            note: 'Work in progress',
          },
        });
        logCount++;
      }
    }
  }

  console.log('Creating leave types, balances and requests…');
  const leaveTypes: Record<string, any> = {};
  for (const [name, days] of [
    ['Casual Leave', 12],
    ['Sick Leave', 8],
    ['Earned Leave', 15],
    ['Work From Home', 24],
  ] as [string, number][]) {
    leaveTypes[name] = await prisma.leaveType.create({
      data: { orgId: org.id, name, defaultDaysPerYear: days },
    });
  }

  const year = new Date().getFullYear();
  const allStaff = PEOPLE.map((p) => users[p.email]);
  for (const person of allStaff) {
    for (const type of Object.values(leaveTypes) as any[]) {
      await prisma.leaveBalance.create({
        data: {
          userId: person.id,
          leaveTypeId: type.id,
          year,
          allocated: type.defaultDaysPerYear,
          used: randInt(0, Math.max(1, Math.floor(type.defaultDaysPerYear / 2))),
        },
      });
    }
  }

  for (const employee of employees) {
    const historyCount = randInt(1, 3);
    for (let i = 0; i < historyCount; i++) {
      const type = pick(Object.values(leaveTypes) as any[]);
      const start = daysAgo(randInt(10, 80));
      const decided = chance(0.8);
      await prisma.leaveRequest.create({
        data: {
          userId: employee.id,
          leaveTypeId: type.id,
          startDate: start,
          endDate: new Date(start.getTime() + randInt(0, 3) * DAY),
          reason: pick(['Family function', 'Not feeling well', 'Personal errand', 'Short trip']),
          status: decided ? (chance(0.85) ? 'APPROVED' : 'REJECTED') : 'PENDING',
          approverId: decided ? leadByTeam[employee.spec.team!].id : null,
          decidedAt: decided ? new Date(start.getTime() - 2 * DAY) : null,
          createdAt: new Date(start.getTime() - 5 * DAY),
        },
      });
    }
  }

  // A handful of live requests waiting on approval, so the queue isn't empty.
  for (const employee of employees.slice(0, 5)) {
    const type = pick(Object.values(leaveTypes) as any[]);
    const start = daysAhead(randInt(3, 20));
    await prisma.leaveRequest.create({
      data: {
        userId: employee.id,
        leaveTypeId: type.id,
        startDate: start,
        endDate: new Date(start.getTime() + randInt(0, 2) * DAY),
        reason: pick(['Wedding in the family', 'Medical appointment', 'Moving house']),
        status: 'PENDING',
      },
    });
  }

  for (const employee of employees.slice(0, 6)) {
    await prisma.permissionRequest.create({
      data: {
        userId: employee.id,
        date: daysAhead(randInt(1, 10)),
        fromTime: pick(['09:00', '11:30', '14:00']),
        toTime: pick(['11:00', '13:30', '16:00']),
        reason: pick(['School pickup', 'Bank work', 'Doctor visit']),
        status: chance(0.5) ? 'PENDING' : 'APPROVED',
        approverId: chance(0.5) ? leadByTeam[employee.spec.team!].id : null,
      },
    });
  }

  console.log('Creating grievances, announcements and remarks…');
  for (let i = 0; i < GRIEVANCES.length; i++) {
    const g = GRIEVANCES[i];
    await prisma.grievance.create({
      data: {
        raisedById: employees[i % employees.length].id,
        category: g.category,
        description: g.description,
        status: g.status,
        ownerId: g.status === 'OPEN' ? null : hr.id,
        createdAt: daysAgo(g.days),
        resolvedAt: g.status === 'RESOLVED' ? daysAgo(Math.max(1, g.days - 5)) : null,
      },
    });
  }

  for (const a of ANNOUNCEMENTS) {
    await prisma.announcement.create({
      data: {
        title: a.title,
        body: a.body,
        pinned: a.pinned,
        authorId: hr.id,
        orgId: org.id,
        publishedAt: daysAgo(a.days),
      },
    });
  }

  for (let i = 0; i < employees.length; i++) {
    if (!chance(0.6)) continue;
    const employee = employees[i];
    await prisma.remark.create({
      data: {
        subjectId: employee.id,
        authorId: leadByTeam[employee.spec.team!].id,
        content: REMARKS[i % REMARKS.length],
        createdAt: daysAgo(randInt(5, 60)),
      },
    });
  }

  console.log('Creating chat channels and messages…');
  const everyone = allStaff;
  const general = await prisma.channel.create({
    data: {
      name: 'general',
      members: { create: everyone.map((u: any) => ({ userId: u.id })) },
    },
  });
  const announcementsChannel = await prisma.channel.create({
    data: {
      name: 'announcements',
      members: { create: everyone.map((u: any) => ({ userId: u.id })) },
    },
  });

  const channels = [general, announcementsChannel];
  for (const [teamName, teamId] of Object.entries(teams)) {
    const members = everyone.filter((u: any) => u.teamId === teamId || u.role !== 'EMPLOYEE');
    const channel = await prisma.channel.create({
      data: {
        name: teamName.toLowerCase().replace(/\s+/g, '-'),
        teamId,
        members: { create: members.map((u: any) => ({ userId: u.id })) },
      },
    });
    channels.push(channel);
  }

  // One direct message thread so DMs aren't empty either.
  const dm = await prisma.channel.create({
    data: {
      name: 'Sara Ahmed & Dev Patel',
      isDM: true,
      members: {
        create: [
          { userId: users['lead@lockedin.test'].id },
          { userId: users['employee@lockedin.test'].id },
        ],
      },
    },
  });
  channels.push(dm);

  let messageCount = 0;
  for (const channel of channels) {
    const members = await prisma.channelMember.findMany({ where: { channelId: channel.id } });
    const count = channel.isDM ? 8 : randInt(10, 18);
    for (let i = count; i > 0; i--) {
      const member = pick(members);
      await prisma.message.create({
        data: {
          channelId: channel.id,
          senderId: member.userId,
          content: pick(CHAT_LINES),
          createdAt: daysAgo(i * 0.4, randInt(9, 18)),
        },
      });
      messageCount++;
    }
  }

  console.log('Computing scores, skill metrics and badges…');
  await computeDerivedData();

  const counts = {
    people: await prisma.user.count(),
    teams: await prisma.team.count(),
    tasks: taskCount,
    timeLogs: logCount,
    messages: messageCount,
    leaveRequests: await prisma.leaveRequest.count(),
    scoreRecords: await prisma.scoreRecord.count(),
    badgesAwarded: await prisma.userBadge.count(),
  };

  console.log('\nDemo organization ready:');
  console.table(counts);
  console.log(`\nEveryone's password is: ${PASSWORD}`);
  console.log('  admin@lockedin.test     Super Admin  (Aisha Khan)');
  console.log('  hr@lockedin.test        HR           (Ravi Menon)');
  console.log('  lead@lockedin.test      Team Lead    (Sara Ahmed, Platform Team)');
  console.log('  employee@lockedin.test  Employee     (Dev Patel, Platform Team)');
}

/**
 * Recreates exactly what the running app computes: per-skill metrics, monthly
 * score snapshots and earned badges — using the same scoring functions the API
 * uses, so the demo data is consistent with live behaviour.
 */
async function computeDerivedData() {
  const users = await prisma.user.findMany();

  const toScorable = (task: any): ScorableTask => ({
    weightage: task.weightage,
    difficulty: task.difficulty,
    estimatedMinutes: task.estimatedMinutes,
    deadline: task.deadline,
    completedAt: task.completedAt,
    loggedMinutes: task.timeLogs.reduce((s: number, l: any) => s + (l.durationSec || 0), 0) / 60,
  });

  // Monthly snapshots for the last three closed months.
  const monthlyTop = new Map<string, { userId: string; score: number }>();

  for (const user of users) {
    const tasks = await prisma.task.findMany({
      where: { assigneeId: user.id, status: 'DONE', approvalStatus: 'APPROVED' },
      include: { timeLogs: true, skills: true },
    });

    // Skill metrics
    const bySkill = new Map<string, ScorableTask[]>();
    for (const task of tasks) {
      for (const link of task.skills) {
        const bucket = bySkill.get(link.skillId) || [];
        bucket.push(toScorable(task));
        bySkill.set(link.skillId, bucket);
      }
    }
    for (const [skillId, scorables] of bySkill.entries()) {
      const agg = aggregateScores(scorables, DEFAULT_WEIGHTS);
      await prisma.skillMetric.create({
        data: { userId: user.id, skillId, score: agg.totalScore, tasksCompleted: agg.tasksCompleted },
      });
    }

    // Score history: three monthly periods
    for (let monthsBack = 3; monthsBack >= 1; monthsBack--) {
      const periodEnd = new Date(Date.now() - (monthsBack - 1) * 30 * DAY);
      const periodStart = new Date(Date.now() - monthsBack * 30 * DAY);
      const inPeriod = tasks
        .filter((t) => t.completedAt && t.completedAt >= periodStart && t.completedAt <= periodEnd)
        .map(toScorable);
      const agg = aggregateScores(inPeriod, DEFAULT_WEIGHTS);
      await prisma.scoreRecord.create({
        data: {
          userId: user.id,
          periodStart,
          periodEnd,
          tasksCompleted: agg.tasksCompleted,
          timeEfficiencyPts: agg.timeEfficiencyPts,
          weightagePts: agg.weightagePts,
          deadlinePts: agg.deadlinePts,
          totalScore: agg.totalScore,
        },
      });
    }

    // Track the best scorer per team for the Sprint Champion badge.
    if (user.teamId) {
      const overall = aggregateScores(tasks.map(toScorable), DEFAULT_WEIGHTS);
      const current = monthlyTop.get(user.teamId);
      if (!current || overall.totalScore > current.score) {
        monthlyTop.set(user.teamId, { userId: user.id, score: overall.totalScore });
      }
    }
  }

  // Badge catalogue
  const badgeIds: Record<string, string> = {};
  for (const definition of BADGE_DEFINITIONS) {
    const badge = await prisma.badge.create({
      data: {
        name: definition.name,
        description: definition.description,
        icon: definition.icon,
        rule: definition.rule,
      },
    });
    badgeIds[definition.rule] = badge.id;
  }

  for (const user of users) {
    const tasks = await prisma.task.findMany({
      where: { assigneeId: user.id },
      include: { timeLogs: true },
    });
    const approved = tasks.filter((t) => t.approvalStatus === 'APPROVED');
    const logs = await prisma.timeLog.findMany({ where: { userId: user.id } });

    const stats: BadgeStats = {
      approvedTasks: approved.length,
      tasksBeatingDeadline: approved.filter(
        (t) => t.deadline && t.completedAt && t.completedAt <= t.deadline,
      ).length,
      tasksWithinEstimate: approved.filter((t) => {
        if (!t.estimatedMinutes) return false;
        const minutes = t.timeLogs.reduce((s, l) => s + (l.durationSec || 0), 0) / 60;
        return minutes > 0 && minutes <= t.estimatedMinutes;
      }).length,
      heavyTasks: approved.filter((t) => t.weightage >= 5).length,
      rejectedTasks: tasks.filter((t) => t.approvalStatus === 'REJECTED').length,
      totalLoggedMinutes: logs.reduce((s, l) => s + (l.durationSec || 0), 0) / 60,
      isTopScorerInTeam: user.teamId ? monthlyTop.get(user.teamId)?.userId === user.id : false,
    };

    for (const rule of earnedBadgeRules(stats)) {
      await prisma.userBadge.create({
        data: {
          userId: user.id,
          badgeId: badgeIds[rule],
          awardedAt: daysAgo(randInt(1, 45)),
        },
      });
    }
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
