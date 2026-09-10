'use client';
import { useEffect, useState } from 'react';
import AppShell from '@/components/AppShell';
import { Avatar, Card, Empty, PageHeader } from '@/components/ui';
import { api } from '@/lib/api';

const TABS = ['People', 'Teams', 'Leave types', 'Skills', 'Scoring', 'Leaderboard'] as const;
type Tab = (typeof TABS)[number];

export default function AdminPage() {
  const [tab, setTab] = useState<Tab>('People');
  const [departments, setDepartments] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<any[]>([]);
  const [skills, setSkills] = useState<any[]>([]);
  const [config, setConfig] = useState<any>(null);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [message, setMessage] = useState('');

  const [deptName, setDeptName] = useState('');
  const [teamForm, setTeamForm] = useState({ name: '', departmentId: '', leadId: '' });
  const [userForm, setUserForm] = useState({
    email: '',
    fullName: '',
    password: '',
    role: 'EMPLOYEE',
    teamId: '',
    managerId: '',
    title: '',
  });
  const [leaveTypeForm, setLeaveTypeForm] = useState({ name: '', defaultDaysPerYear: 12 });
  const [skillName, setSkillName] = useState('');

  function load() {
    api.get('/departments').then((r) => setDepartments(r.data)).catch(() => {});
    api.get('/teams').then((r) => setTeams(r.data)).catch(() => {});
    api.get('/users').then((r) => setUsers(r.data)).catch(() => {});
    api.get('/hr/leave-types').then((r) => setLeaveTypes(r.data)).catch(() => {});
    api.get('/gamification/skills').then((r) => setSkills(r.data)).catch(() => {});
    api.get('/gamification/config').then((r) => setConfig(r.data)).catch(() => {});
    api.get('/gamification/leaderboard/org').then((r) => setLeaderboard(r.data)).catch(() => {});
  }
  useEffect(load, []);

  const notify = (text: string) => {
    setMessage(text);
    setTimeout(() => setMessage(''), 2500);
  };

  async function submit(fn: () => Promise<any>, successText: string) {
    try {
      await fn();
      notify(successText);
      load();
    } catch (err: any) {
      notify(err?.response?.data?.message || 'Something went wrong');
    }
  }

  return (
    <AppShell>
      <PageHeader
        title="Admin Console"
        subtitle="Organization structure, people, policies and how performance is scored."
      />

      <div className="flex flex-wrap gap-2 mb-6">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
              tab === t ? 'bg-brand-500 on-accent' : 'bg-gray-100 border border-gray-200 text-gray-600 hover:text-gray-900'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {message && (
        <div className="mb-4 text-sm bg-brand-50 text-brand-700 rounded-lg px-3 py-2">{message}</div>
      )}

      {tab === 'People' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card title="Add a person">
            <form
              className="space-y-2"
              onSubmit={(e) => {
                e.preventDefault();
                submit(
                  () =>
                    api.post('/users', {
                      ...userForm,
                      teamId: userForm.teamId || undefined,
                      managerId: userForm.managerId || undefined,
                    }),
                  `${userForm.fullName} added`,
                ).then(() =>
                  setUserForm({
                    email: '',
                    fullName: '',
                    password: '',
                    role: 'EMPLOYEE',
                    teamId: '',
                    managerId: '',
                    title: '',
                  }),
                );
              }}
            >
              <input className="input" placeholder="Full name" value={userForm.fullName} onChange={(e) => setUserForm({ ...userForm, fullName: e.target.value })} required />
              <input className="input" type="email" placeholder="Email" value={userForm.email} onChange={(e) => setUserForm({ ...userForm, email: e.target.value })} required />
              <input className="input" type="password" placeholder="Temporary password (min 8 chars)" value={userForm.password} onChange={(e) => setUserForm({ ...userForm, password: e.target.value })} required minLength={8} />
              <input className="input" placeholder="Job title" value={userForm.title} onChange={(e) => setUserForm({ ...userForm, title: e.target.value })} />
              <select className="input" value={userForm.role} onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}>
                {['EMPLOYEE', 'TEAM_LEAD', 'HR', 'SUPER_ADMIN'].map((r) => (
                  <option key={r} value={r}>{r.replace(/_/g, ' ')}</option>
                ))}
              </select>
              <select className="input" value={userForm.teamId} onChange={(e) => setUserForm({ ...userForm, teamId: e.target.value })}>
                <option value="">Team (optional)…</option>
                {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
              <select className="input" value={userForm.managerId} onChange={(e) => setUserForm({ ...userForm, managerId: e.target.value })}>
                <option value="">Reports to (optional)…</option>
                {users.map((u) => <option key={u.id} value={u.id}>{u.fullName}</option>)}
              </select>
              <button className="btn-primary w-full">Add person</button>
            </form>
          </Card>

          <Card title={`People (${users.length})`}>
            <ul className="space-y-1 max-h-[28rem] overflow-y-auto">
              {users.map((u) => (
                <li key={u.id} className="flex items-center gap-3 border-b border-gray-100 py-2 last:border-0">
                  <Avatar name={u.fullName} size={28} />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm text-gray-800">{u.fullName}</div>
                    <div className="text-[11px] text-gray-400 truncate">
                      {u.title || '—'} · {u.team?.name || 'no team'}
                      {u.manager ? ` · reports to ${u.manager.fullName}` : ''}
                    </div>
                  </div>
                  <span className="text-[10px] uppercase tracking-wide text-gray-400">
                    {u.role.replace(/_/g, ' ')}
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      )}

      {tab === 'Teams' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card title="Departments">
            <form
              className="flex gap-2 mb-3"
              onSubmit={(e) => {
                e.preventDefault();
                submit(() => api.post('/departments', { name: deptName }), 'Department created').then(() => setDeptName(''));
              }}
            >
              <input className="input" placeholder="Department name" value={deptName} onChange={(e) => setDeptName(e.target.value)} required />
              <button className="btn-primary">Add</button>
            </form>
            <ul className="text-sm space-y-1 max-h-[280px] overflow-y-auto pr-1">
              {departments.map((d) => (
                <li key={d.id} className="border-b border-gray-100 py-1.5 last:border-0">
                  {d.name} <span className="text-gray-400 text-xs">· {d.teams.length} teams</span>
                </li>
              ))}
            </ul>
          </Card>

          <Card title="Teams">
            <form
              className="space-y-2 mb-3"
              onSubmit={(e) => {
                e.preventDefault();
                submit(
                  () => api.post('/teams', { ...teamForm, leadId: teamForm.leadId || undefined }),
                  'Team created',
                ).then(() => setTeamForm({ name: '', departmentId: '', leadId: '' }));
              }}
            >
              <input className="input" placeholder="Team name" value={teamForm.name} onChange={(e) => setTeamForm({ ...teamForm, name: e.target.value })} required />
              <select className="input" value={teamForm.departmentId} onChange={(e) => setTeamForm({ ...teamForm, departmentId: e.target.value })} required>
                <option value="">Department…</option>
                {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
              <select className="input" value={teamForm.leadId} onChange={(e) => setTeamForm({ ...teamForm, leadId: e.target.value })}>
                <option value="">Team lead (optional)…</option>
                {users.filter((u) => u.role === 'TEAM_LEAD' || u.role === 'SUPER_ADMIN').map((u) => (
                  <option key={u.id} value={u.id}>{u.fullName}</option>
                ))}
              </select>
              <button className="btn-primary w-full">Add team</button>
            </form>
            <ul className="text-sm space-y-1 max-h-[280px] overflow-y-auto pr-1">
              {teams.map((t) => (
                <li key={t.id} className="border-b border-gray-100 py-1.5 last:border-0">
                  {t.name}
                  <span className="text-gray-400 text-xs">
                    {' '}· lead {t.lead?.fullName || 'unassigned'} · {t.members.length} members
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      )}

      {tab === 'Leave types' && (
        <Card title="Leave types" className="max-w-lg">
          <form
            className="flex gap-2 mb-3"
            onSubmit={(e) => {
              e.preventDefault();
              submit(() => api.post('/hr/leave-types', leaveTypeForm), 'Leave type created').then(() =>
                setLeaveTypeForm({ name: '', defaultDaysPerYear: 12 }),
              );
            }}
          >
            <input className="input" placeholder="e.g. Sick Leave" value={leaveTypeForm.name} onChange={(e) => setLeaveTypeForm({ ...leaveTypeForm, name: e.target.value })} required />
            <input className="input w-24" type="number" min={0} value={leaveTypeForm.defaultDaysPerYear} onChange={(e) => setLeaveTypeForm({ ...leaveTypeForm, defaultDaysPerYear: +e.target.value })} />
            <button className="btn-primary">Add</button>
          </form>
          <ul className="text-sm space-y-1 max-h-[280px] overflow-y-auto pr-1">
            {leaveTypes.map((t) => (
              <li key={t.id} className="border-b border-gray-100 py-1.5 last:border-0">
                {t.name} <span className="text-gray-400 text-xs">· {t.defaultDaysPerYear} days/year</span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {tab === 'Skills' && (
        <Card title="Skills" className="max-w-lg">
          <p className="text-xs text-gray-500 mb-3">
            Skills are tagged on tasks. Once work is approved, each person&apos;s skill scores are built from
            the tasks they delivered.
          </p>
          <form
            className="flex gap-2 mb-3"
            onSubmit={(e) => {
              e.preventDefault();
              submit(() => api.post('/gamification/skills', { name: skillName }), 'Skill added').then(() => setSkillName(''));
            }}
          >
            <input className="input" placeholder="e.g. Backend" value={skillName} onChange={(e) => setSkillName(e.target.value)} required />
            <button className="btn-primary">Add</button>
          </form>
          <div className="flex flex-wrap gap-2">
            {skills.map((s) => (
              <span key={s.id} className="text-xs bg-gray-100 rounded-full px-2.5 py-1 text-gray-600">
                {s.name}
              </span>
            ))}
            {skills.length === 0 && <Empty>No skills defined yet.</Empty>}
          </div>
        </Card>
      )}

      {tab === 'Scoring' && config && (
        <Card title="Scoring formula" className="max-w-xl">
          <p className="text-xs text-gray-500 mb-4">
            The overall score is a weighted average of three components, each scored 0-100. Weights should
            add up to 1.
          </p>
          <form
            className="space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              submit(
                () =>
                  api.patch('/gamification/config', {
                    timeWeight: config.timeWeight,
                    weightageWeight: config.weightageWeight,
                    deadlineWeight: config.deadlineWeight,
                    latePenaltyPerDay: config.latePenaltyPerDay,
                    earlyBonusPerDay: config.earlyBonusPerDay,
                  }),
                'Scoring formula updated',
              );
            }}
          >
            {[
              ['timeWeight', 'Time efficiency weight', 0, 1, 0.05],
              ['weightageWeight', 'Task weight & difficulty weight', 0, 1, 0.05],
              ['deadlineWeight', 'Deadline weight', 0, 1, 0.05],
              ['earlyBonusPerDay', 'Bonus points per day early', 0, 40, 1],
              ['latePenaltyPerDay', 'Penalty points per day late', 0, 40, 1],
            ].map(([key, label, min, max, step]: any) => (
              <label key={key} className="block">
                <div className="flex justify-between text-xs text-gray-600 mb-1">
                  <span>{label}</span>
                  <span className="font-medium text-gray-900">{config[key]}</span>
                </div>
                <input
                  type="range"
                  className="w-full"
                  min={min}
                  max={max}
                  step={step}
                  value={config[key]}
                  onChange={(e) => setConfig({ ...config, [key]: +e.target.value })}
                />
              </label>
            ))}
            <div className="text-xs text-gray-400">
              Weights total:{' '}
              {(config.timeWeight + config.weightageWeight + config.deadlineWeight).toFixed(2)}
            </div>
            <button className="btn-primary">Save formula</button>
          </form>
        </Card>
      )}

      {tab === 'Leaderboard' && (
        <Card title="Company leaderboard">
          <div className="overflow-x-auto max-h-[460px] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="text-xs text-gray-400 text-left">
              <tr>
                <th className="pb-2 font-medium">#</th>
                <th className="pb-2 font-medium">Name</th>
                <th className="pb-2 font-medium">Score</th>
                <th className="pb-2 font-medium">Time</th>
                <th className="pb-2 font-medium">Weight</th>
                <th className="pb-2 font-medium">Deadlines</th>
                <th className="pb-2 font-medium">Completed</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((r) => (
                <tr key={r.userId} className="border-t border-gray-100">
                  <td className="py-2 text-gray-400">{r.rank}</td>
                  <td className="py-2">
                    <div className="flex items-center gap-2">
                      <Avatar name={r.user.fullName} size={24} />
                      <span className="text-gray-800">{r.user.fullName}</span>
                    </div>
                  </td>
                  <td className="py-2 font-medium">{r.totalScore.toFixed(1)}</td>
                  <td className="py-2 text-gray-500">{r.timeEfficiencyPts.toFixed(0)}</td>
                  <td className="py-2 text-gray-500">{r.weightagePts.toFixed(0)}</td>
                  <td className="py-2 text-gray-500">{r.deadlinePts.toFixed(0)}</td>
                  <td className="py-2 text-gray-500">{r.tasksCompleted}</td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </Card>
      )}
    </AppShell>
  );
}
