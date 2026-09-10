'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import AppShell from '@/components/AppShell';
import { Avatar, Card, Empty, PageHeader, Pill, ScoreBar, Stat } from '@/components/ui';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/auth';

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const [score, setScore] = useState<any>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [approvals, setApprovals] = useState<any[]>([]);
  const [pendingLeave, setPendingLeave] = useState<any[]>([]);
  const [grievances, setGrievances] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [activeTimer, setActiveTimer] = useState<any>(null);

  const isLead = user?.role === 'TEAM_LEAD' || user?.role === 'SUPER_ADMIN';
  const isHr = user?.role === 'HR' || user?.role === 'SUPER_ADMIN';

  useEffect(() => {
    if (!user) return;
    const guard = () => undefined;
    api.get('/gamification/me').then((r) => setScore(r.data)).catch(guard);
    api.get('/tasks/mine').then((r) => setTasks(r.data)).catch(guard);
    api.get('/announcements').then((r) => setAnnouncements(r.data)).catch(guard);
    api.get('/time/active').then((r) => setActiveTimer(r.data?.id ? r.data : null)).catch(guard);
    api.get('/gamification/leaderboard/org').then((r) => setLeaderboard(r.data)).catch(guard);
    if (isLead) api.get('/tasks/pending-approvals').then((r) => setApprovals(r.data)).catch(guard);
    if (isLead || isHr)
      api.get('/hr/leave-requests/pending').then((r) => setPendingLeave(r.data)).catch(guard);
    if (isHr)
      api
        .get('/grievances')
        .then((r) => setGrievances(r.data.filter((g: any) => g.status !== 'CLOSED' && g.status !== 'RESOLVED')))
        .catch(guard);
  }, [user]);

  const openTasks = tasks.filter((t) => t.status !== 'DONE');
  const overdue = openTasks.filter((t) => t.deadline && new Date(t.deadline) < new Date());
  const myRank = leaderboard.find((r) => r.userId === user?.id);

  return (
    <AppShell>
      <PageHeader
        title={`Welcome back, ${user?.fullName?.split(' ')[0] ?? ''}`}
        subtitle="Here's where things stand across your work and your team today."
      />

      {/* Bento: the score is the hero cell (2 rows tall), the rest tuck
          around it in a 2x2 grid — more hierarchy than an even row of four
          identical boxes. */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 lg:grid-rows-2 gap-4">
        <Stat
          size="lg"
          className="sm:col-span-2 lg:col-span-1 lg:row-span-2"
          label="Performance score"
          value={score ? score.totalScore.toFixed(1) : '—'}
          suffix="/100"
          hint={myRank ? `#${myRank.rank} in the company` : 'Complete a task to get scored'}
          tone="violet"
        />
        <Stat label="Open tasks" value={openTasks.length} hint="assigned to you" tone="default" />
        <Stat
          label={isLead ? 'Awaiting your approval' : 'Timer'}
          value={isLead ? approvals.length : activeTimer ? 'Running' : 'Stopped'}
          tone="warn"
          hint={isLead ? 'tasks submitted for review' : activeTimer ? 'tracking now' : 'not tracking'}
        />
        <Stat label="Tasks completed" value={score?.tasksCompleted ?? 0} hint="approved by your lead" tone="good" />
        <Stat
          label="Overdue"
          value={overdue.length}
          hint={overdue.length ? 'past their deadline' : 'nothing overdue'}
          tone={overdue.length ? 'warn' : 'default'}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        <Card
          title="My tasks"
          className="lg:col-span-2"
          action={
            <Link href="/tasks" className="text-xs text-brand-600 hover:underline">
              Open board
            </Link>
          }
        >
          {openTasks.length === 0 ? (
            <Empty>Nothing assigned right now.</Empty>
          ) : (
            <ul className="space-y-2">
              {openTasks.slice(0, 6).map((t) => (
                <li
                  key={t.id}
                  className="flex items-center justify-between border-b border-gray-100 pb-2 last:border-0"
                >
                  <div>
                    <div className="text-sm text-gray-800">{t.title}</div>
                    <div className="text-[11px] text-gray-400">
                      W{t.weightage} · D{t.difficulty}
                      {t.deadline ? ` · due ${new Date(t.deadline).toLocaleDateString()}` : ''}
                    </div>
                  </div>
                  <Pill value={t.status} />
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card
          title="Score breakdown"
          action={
            <Link href="/performance" className="text-xs text-brand-600 hover:underline">
              Details
            </Link>
          }
        >
          {score && score.tasksCompleted > 0 ? (
            <div className="space-y-3">
              <ScoreBar label="Time efficiency" score={score.timeEfficiencyPts} />
              <ScoreBar label="Task weight" score={score.weightagePts} />
              <ScoreBar label="Deadlines" score={score.deadlinePts} />
            </div>
          ) : (
            <Empty>Complete and get a task approved to see your score.</Empty>
          )}
        </Card>

        {isLead && (
          <Card
            title="Waiting on your review"
            action={
              <Link href="/team" className="text-xs text-brand-600 hover:underline">
                Team view
              </Link>
            }
          >
            {approvals.length === 0 ? (
              <Empty>Nothing pending.</Empty>
            ) : (
              <ul className="space-y-2">
                {approvals.slice(0, 5).map((t) => (
                  <li key={t.id} className="text-sm border-b border-gray-100 pb-2 last:border-0">
                    <div className="text-gray-800">{t.title}</div>
                    <div className="text-[11px] text-gray-400">{t.assignee?.fullName}</div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        )}

        {(isLead || isHr) && (
          <Card
            title="Leave approvals"
            action={
              <Link href="/leave" className="text-xs text-brand-600 hover:underline">
                Review
              </Link>
            }
          >
            {pendingLeave.length === 0 ? (
              <Empty>Nothing pending.</Empty>
            ) : (
              <ul className="space-y-2">
                {pendingLeave.slice(0, 5).map((l) => (
                  <li key={l.id} className="text-sm border-b border-gray-100 pb-2 last:border-0">
                    <div className="text-gray-800">{l.user?.fullName}</div>
                    <div className="text-[11px] text-gray-400">
                      {l.leaveType?.name} · {new Date(l.startDate).toLocaleDateString()} →{' '}
                      {new Date(l.endDate).toLocaleDateString()}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        )}

        {isHr && (
          <Card
            title="Open grievances"
            action={
              <Link href="/grievance" className="text-xs text-brand-600 hover:underline">
                Handle
              </Link>
            }
          >
            {grievances.length === 0 ? (
              <Empty>Nothing open.</Empty>
            ) : (
              <ul className="space-y-2">
                {grievances.slice(0, 5).map((g) => (
                  <li key={g.id} className="text-sm border-b border-gray-100 pb-2 last:border-0">
                    <div className="flex justify-between">
                      <span className="text-gray-800">{g.category}</span>
                      <Pill value={g.status} />
                    </div>
                    <div className="text-[11px] text-gray-400 truncate">{g.description}</div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        )}

        <Card title="Company leaderboard">
          {leaderboard.length === 0 ? (
            <Empty>No scores yet.</Empty>
          ) : (
            <ul className="space-y-2">
              {leaderboard.slice(0, 5).map((row) => (
                <li key={row.userId} className="flex items-center gap-2 text-sm">
                  <span className="w-4 text-gray-400 text-xs">{row.rank}</span>
                  <Avatar name={row.user.fullName} size={24} />
                  <span className="flex-1 text-gray-700 truncate">{row.user.fullName}</span>
                  <span className="font-medium text-gray-900">{row.totalScore.toFixed(1)}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card
          title="From HR"
          className="lg:col-span-2"
          action={
            <Link href="/announcements" className="text-xs text-brand-600 hover:underline">
              All updates
            </Link>
          }
        >
          {announcements.length === 0 ? (
            <Empty>No announcements yet.</Empty>
          ) : (
            <ul className="space-y-3">
              {announcements.slice(0, 3).map((a) => (
                <li key={a.id} className="border-b border-gray-100 pb-3 last:border-0">
                  <div className="flex items-center gap-2">
                    {a.pinned && (
                      <span className="text-[10px] bg-brand-50 text-brand-600 px-1.5 py-0.5 rounded-full">
                        pinned
                      </span>
                    )}
                    <span className="text-sm font-medium text-gray-800">{a.title}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">{a.body}</p>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </AppShell>
  );
}
