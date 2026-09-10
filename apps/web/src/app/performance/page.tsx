'use client';
import { useEffect, useState } from 'react';
import AppShell from '@/components/AppShell';
import { BadgeIcon, Card, PageHeader, ScoreBar, Sparkline, Stat, Empty, Pill } from '@/components/ui';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/auth';

export default function PerformancePage() {
  const user = useAuthStore((s) => s.user);
  const [score, setScore] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [skills, setSkills] = useState<any[]>([]);
  const [badges, setBadges] = useState<any[]>([]);
  const [remarks, setRemarks] = useState<any[]>([]);
  const [rank, setRank] = useState<any>(null);

  useEffect(() => {
    if (!user) return;
    api.get('/gamification/me').then((r) => setScore(r.data)).catch(() => {});
    api.get('/gamification/me/history').then((r) => setHistory(r.data)).catch(() => {});
    api.get('/gamification/me/skills').then((r) => setSkills(r.data)).catch(() => {});
    api.get('/gamification/me/badges').then((r) => setBadges(r.data)).catch(() => {});
    api.get(`/remarks/${user.id}`).then((r) => setRemarks(r.data)).catch(() => {});
    if (user.teamId) {
      api
        .get(`/gamification/leaderboard/team/${user.teamId}`)
        .then((r) => setRank(r.data.find((row: any) => row.userId === user.id)))
        .catch(() => {});
    }
  }, [user]);

  const historyPoints = history.map((h) => ({
    label: new Date(h.periodStart).toLocaleDateString(undefined, { month: 'short' }),
    value: h.totalScore,
  }));

  const trend =
    history.length >= 2
      ? history[history.length - 1].totalScore - history[history.length - 2].totalScore
      : 0;

  return (
    <AppShell>
      <PageHeader
        title="My Performance"
        subtitle="How your completed work is scored — time efficiency, task weight, and deadlines."
      />

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Stat
          label="Overall score"
          value={score ? score.totalScore.toFixed(1) : '—'}
          suffix="/100"
          tone={score && score.totalScore >= 75 ? 'good' : 'default'}
        />
        <Stat label="Tasks completed" value={score?.tasksCompleted ?? 0} />
        <Stat
          label="Team rank"
          value={rank ? `#${rank.rank}` : '—'}
          hint={user?.teamId ? 'within your team' : 'not on a team'}
        />
        <Stat
          label="Trend vs last period"
          value={`${trend >= 0 ? '+' : ''}${trend.toFixed(1)}`}
          tone={trend >= 0 ? 'good' : 'warn'}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <Card title="Score breakdown">
          {score ? (
            <div className="space-y-4">
              <ScoreBar
                label="Time efficiency"
                score={score.timeEfficiencyPts}
                hint="Tracked time against the estimate on each task"
              />
              <ScoreBar
                label="Task weight & difficulty"
                score={score.weightagePts}
                hint="How heavy and complex your completed work was"
              />
              <ScoreBar
                label="Deadline performance"
                score={score.deadlinePts}
                hint="Delivered early, on time, or late"
              />
            </div>
          ) : (
            <Empty>No approved work yet — your score appears once your lead signs off on a task.</Empty>
          )}
        </Card>

        <Card title="Score history">
          <Sparkline points={historyPoints} />
        </Card>

        <Card title="Skill metrics">
          {skills.length === 0 ? (
            <Empty>No skills tagged on your completed work yet.</Empty>
          ) : (
            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
              {skills.map((s) => (
                <ScoreBar
                  key={s.id}
                  label={`${s.skill.name} · ${s.tasksCompleted} task${s.tasksCompleted === 1 ? '' : 's'}`}
                  score={s.score}
                />
              ))}
            </div>
          )}
        </Card>

        <Card title="Badges">
          {badges.length === 0 ? (
            <Empty>No badges yet — they unlock automatically as you hit milestones.</Empty>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {badges.map((b) => (
                <div key={b.id} className="flex items-start gap-3 border border-gray-100 rounded-lg p-3">
                  <BadgeIcon name={b.badge.name} size="md" />
                  <div>
                    <div className="text-sm font-medium text-gray-800">{b.badge.name}</div>
                    <div className="text-[11px] text-gray-400">{b.badge.description}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <Card title="Remarks from your lead" className="mt-6">
        {remarks.length === 0 ? (
          <Empty>No remarks recorded.</Empty>
        ) : (
          <ul className="space-y-3 max-h-[320px] overflow-y-auto pr-1">
            {remarks.map((r) => (
              <li key={r.id} className="border-b border-gray-100 pb-3 last:border-0">
                <p className="text-sm text-gray-700">{r.content}</p>
                <p className="text-[11px] text-gray-400 mt-1">
                  {r.author.fullName} · {new Date(r.createdAt).toLocaleDateString()}
                </p>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </AppShell>
  );
}
