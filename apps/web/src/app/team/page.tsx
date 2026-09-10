'use client';
import { useEffect, useState } from 'react';
import AppShell from '@/components/AppShell';
import { Avatar, BadgeIcon, Card, Empty, PageHeader, Pill, ScoreBar, Stat } from '@/components/ui';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/auth';

export default function TeamPerformancePage() {
  const user = useAuthStore((s) => s.user);
  const [teams, setTeams] = useState<any[]>([]);
  const [teamId, setTeamId] = useState<string>('');
  const [overview, setOverview] = useState<any>(null);
  const [approvals, setApprovals] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [remarks, setRemarks] = useState<any[]>([]);
  const [remarkText, setRemarkText] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/teams').then((r) => {
      setTeams(r.data);
      const mine = r.data.find((t: any) => t.leadId === user?.id) || r.data[0];
      if (mine) setTeamId(mine.id);
    });
    api.get('/tasks/pending-approvals').then((r) => setApprovals(r.data)).catch(() => {});
  }, [user]);

  async function loadOverview(id: string) {
    setLoading(true);
    const res = await api.get(`/gamification/team/${id}/overview`);
    setOverview(res.data);
    setLoading(false);
  }

  useEffect(() => {
    if (teamId) loadOverview(teamId);
  }, [teamId]);

  async function openMember(member: any) {
    setSelected(member);
    const res = await api.get(`/remarks/${member.userId}`);
    setRemarks(res.data);
  }

  async function addRemark() {
    if (!remarkText.trim() || !selected) return;
    await api.post('/remarks', { subjectId: selected.userId, content: remarkText });
    setRemarkText('');
    const res = await api.get(`/remarks/${selected.userId}`);
    setRemarks(res.data);
  }

  async function decide(taskId: string, decision: 'APPROVED' | 'REJECTED') {
    await api.patch(`/tasks/${taskId}/approve`, { decision });
    const [queue] = await Promise.all([api.get('/tasks/pending-approvals')]);
    setApprovals(queue.data);
    if (teamId) loadOverview(teamId);
  }

  return (
    <AppShell>
      <PageHeader
        title="Team Performance"
        subtitle="Scorecards, skills and workload for everyone reporting into this team."
        action={
          <select className="input w-56" value={teamId} onChange={(e) => setTeamId(e.target.value)}>
            {teams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        }
      />

      {loading && !overview ? (
        <Empty>Loading team data…</Empty>
      ) : overview ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <Stat
              label="Team average score"
              value={overview.teamAverage.toFixed(1)}
              suffix="/100"
              tone={overview.teamAverage >= 70 ? 'good' : 'default'}
            />
            <Stat label="Team members" value={overview.members.length} />
            <Stat label="Tasks completed" value={overview.totalTasksCompleted} />
            <Stat
              label="Awaiting your approval"
              value={approvals.length}
              tone={approvals.length > 0 ? 'warn' : 'default'}
            />
          </div>

          {approvals.length > 0 && (
            <Card title="Waiting on your review" className="mt-6">
              <ul className="space-y-2 max-h-[340px] overflow-y-auto pr-1">
                {approvals.map((task) => (
                  <li
                    key={task.id}
                    className="flex items-center justify-between border-b border-gray-100 pb-2 last:border-0"
                  >
                    <div>
                      <div className="text-sm text-gray-800">{task.title}</div>
                      <div className="text-[11px] text-gray-400">
                        {task.assignee?.fullName} · weight {task.weightage} · difficulty {task.difficulty}
                        {task.deadline
                          ? ` · due ${new Date(task.deadline).toLocaleDateString()}`
                          : ''}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button className="btn-primary text-xs py-1" onClick={() => decide(task.id, 'APPROVED')}>
                        Approve
                      </button>
                      <button className="btn-secondary text-xs py-1" onClick={() => decide(task.id, 'REJECTED')}>
                        Send back
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          <Card title="Scorecards" className="mt-6">
            <div className="overflow-x-auto max-h-[420px] overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="text-xs text-gray-400 text-left">
                  <tr>
                    <th className="pb-2 font-medium">#</th>
                    <th className="pb-2 font-medium">Member</th>
                    <th className="pb-2 font-medium">Score</th>
                    <th className="pb-2 font-medium">Time</th>
                    <th className="pb-2 font-medium">Weight</th>
                    <th className="pb-2 font-medium">Deadlines</th>
                    <th className="pb-2 font-medium">Done</th>
                    <th className="pb-2 font-medium">Open</th>
                    <th className="pb-2 font-medium">Badges</th>
                    <th className="pb-2" />
                  </tr>
                </thead>
                <tbody>
                  {overview.members.map((m: any) => (
                    <tr key={m.userId} className="border-t border-gray-100">
                      <td className="py-2">
                        {m.rank <= 3 ? (
                          <span
                            className={`inline-grid place-items-center h-6 w-6 rounded-full text-[11px] font-bold ${
                              m.rank === 1
                                ? 'bg-amber-100 text-amber-700'
                                : m.rank === 2
                                ? 'bg-gray-200 text-gray-600'
                                : 'bg-orange-100 text-orange-700'
                            }`}
                          >
                            {m.rank}
                          </span>
                        ) : (
                          <span className="text-gray-400 pl-1.5">{m.rank}</span>
                        )}
                      </td>
                      <td className="py-2">
                        <div className="flex items-center gap-2">
                          <Avatar name={m.user.fullName} size={26} />
                          <div>
                            <div className="text-gray-800">{m.user.fullName}</div>
                            <div className="text-[11px] text-gray-400">{m.user.title}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-2">
                        <div className="flex items-center gap-2 min-w-[92px]">
                          <span className="font-medium text-gray-900 tabular-nums w-9">{m.totalScore.toFixed(1)}</span>
                          <span className="h-1.5 flex-1 rounded-full bg-gray-200 overflow-hidden hidden sm:block">
                            <span
                              className={`block h-full rounded-full ${
                                m.totalScore >= 75 ? 'bg-emerald-500' : m.totalScore >= 50 ? 'bg-brand-500' : m.totalScore >= 25 ? 'bg-amber-500' : 'bg-red-500'
                              }`}
                              style={{ width: `${Math.max(0, Math.min(100, m.totalScore))}%` }}
                            />
                          </span>
                        </div>
                      </td>
                      <td className="py-2 text-gray-500">{m.timeEfficiencyPts.toFixed(0)}</td>
                      <td className="py-2 text-gray-500">{m.weightagePts.toFixed(0)}</td>
                      <td className="py-2 text-gray-500">{m.deadlinePts.toFixed(0)}</td>
                      <td className="py-2 text-gray-500">{m.tasksCompleted}</td>
                      <td className="py-2 text-gray-500">
                        {m.openTasks}
                        {m.pendingReview > 0 && (
                          <span className="ml-1 text-amber-600">({m.pendingReview} in review)</span>
                        )}
                      </td>
                      <td className="py-2">
                        {m.badges.length === 0 ? (
                          <span className="text-gray-300 text-xs">—</span>
                        ) : (
                          <div className="flex items-center gap-1">
                            {m.badges.map((b: any) => (
                              <BadgeIcon key={b.id} name={b.badge.name} />
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="py-2 text-right">
                        <button className="text-xs text-brand-600 hover:underline" onClick={() => openMember(m)}>
                          Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {selected && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
              <Card
                title={`${selected.user.fullName} — skills`}
                action={
                  <button className="text-xs text-gray-400 hover:text-gray-600" onClick={() => setSelected(null)}>
                    Close
                  </button>
                }
              >
                {selected.skills.length === 0 ? (
                  <Empty>No skill data yet — tag skills on tasks to build this up.</Empty>
                ) : (
                  <div className="space-y-3">
                    {selected.skills.map((s: any) => (
                      <ScoreBar
                        key={s.id}
                        label={`${s.skill.name} · ${s.tasksCompleted} tasks`}
                        score={s.score}
                      />
                    ))}
                  </div>
                )}
              </Card>

              <Card title="Remarks">
                <div className="flex gap-2 mb-3">
                  <input
                    className="input"
                    placeholder="Add a remark about this person…"
                    value={remarkText}
                    onChange={(e) => setRemarkText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addRemark()}
                  />
                  <button className="btn-primary text-xs" onClick={addRemark}>
                    Add
                  </button>
                </div>
                {remarks.length === 0 ? (
                  <Empty>No remarks yet.</Empty>
                ) : (
                  <ul className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
                    {remarks.map((r) => (
                      <li key={r.id} className="border-b border-gray-100 pb-2 last:border-0">
                        <p className="text-sm text-gray-700">{r.content}</p>
                        <p className="text-[11px] text-gray-400 mt-0.5">
                          {r.author.fullName} · {new Date(r.createdAt).toLocaleDateString()}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            </div>
          )}
        </>
      ) : (
        <Empty>No team selected.</Empty>
      )}
    </AppShell>
  );
}
