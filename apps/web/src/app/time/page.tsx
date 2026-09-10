'use client';
import { useEffect, useState } from 'react';
import AppShell from '@/components/AppShell';
import { api } from '@/lib/api';
import { Card, Empty, PageHeader } from '@/components/ui';
import { Icon } from '@/components/icons';

export default function TimePage() {
  const [active, setActive] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [taskId, setTaskId] = useState('');
  const [note, setNote] = useState('');
  const [now, setNow] = useState(Date.now());

  async function load() {
    const [a, l, t] = await Promise.all([
      api.get('/time/active'),
      api.get('/time/mine'),
      api.get('/tasks/mine'),
    ]);
    setActive(a.data);
    setLogs(l.data);
    setTasks(t.data);
  }

  useEffect(() => {
    load();
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  async function start() {
    await api.post('/time/start', { taskId: taskId || undefined, note });
    setNote('');
    load();
  }

  async function stop() {
    if (!active) return;
    await api.post(`/time/${active.id}/stop`);
    load();
  }

  const elapsed = active ? Math.floor((now - new Date(active.startedAt).getTime()) / 1000) : 0;
  const fmt = (s: number) => `${String(Math.floor(s / 3600)).padStart(2, '0')}:${String(Math.floor((s % 3600) / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  // Group logs by calendar day so the list reads like an activity feed
  // rather than a flat spreadsheet.
  const dayLabel = (d: Date) => {
    const today = new Date();
    const yest = new Date();
    yest.setDate(today.getDate() - 1);
    const sameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();
    if (sameDay(d, today)) return 'Today';
    if (sameDay(d, yest)) return 'Yesterday';
    return d.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'short' });
  };
  const groups: { label: string; rows: any[] }[] = [];
  for (const l of logs) {
    const label = dayLabel(new Date(l.startedAt));
    const g = groups.find((g) => g.label === label);
    if (g) g.rows.push(l);
    else groups.push({ label, rows: [l] });
  }

  return (
    <AppShell>
      <PageHeader title="Time Tracker" subtitle="Track focused work against a task, or just log the hours." />

      <Card className="max-w-lg">
        {active ? (
          <>
            <div className="flex items-center gap-3">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--accent)] opacity-60" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[var(--accent)]" />
              </span>
              <span className="text-[11px] uppercase tracking-wider text-gray-500 font-semibold">Tracking now</span>
            </div>
            <div className="text-[44px] leading-tight font-mono font-bold tracking-tight text-[var(--accent)] mt-2">{fmt(elapsed)}</div>
            <p className="text-sm text-gray-500 mt-1">{active.note || tasks.find((t) => t.id === active.taskId)?.title || 'General work'}</p>
            <button className="btn-primary mt-4" onClick={stop}>Stop timer</button>
          </>
        ) : (
          <div className="space-y-3">
            <select className="input" value={taskId} onChange={(e) => setTaskId(e.target.value)}>
              <option value="">No specific task</option>
              {tasks.map((t) => <option key={t.id} value={t.id}>{t.title}</option>)}
            </select>
            <input className="input" placeholder="What are you working on?" value={note} onChange={(e) => setNote(e.target.value)} />
            <button className="btn-primary" onClick={start}>Start timer</button>
          </div>
        )}
      </Card>

      <Card title="Recent logs" icon="clock" className="mt-6">
        {logs.length === 0 ? (
          <Empty>No time logged yet — start a timer above.</Empty>
        ) : (
          <div className="space-y-5 max-h-[560px] overflow-y-auto pr-1">
            {groups.map((g) => (
              <div key={g.label}>
                <div className="text-[11px] uppercase tracking-wider text-gray-400 font-semibold mb-1.5">{g.label}</div>
                <div className="rounded-xl border border-[var(--line-soft)] overflow-hidden divide-y divide-[var(--line-soft)]">
                  {g.rows.map((l) => {
                    const running = !l.durationSec;
                    return (
                      <div
                        key={l.id}
                        className="flex items-center gap-3 px-3.5 py-3 transition-colors hover:bg-[var(--hover)]"
                      >
                        <span
                          className={`h-8 w-8 shrink-0 rounded-lg grid place-items-center ${
                            running ? 'bg-[var(--accent-soft)] text-[var(--accent)]' : 'bg-[var(--hover)] text-gray-400'
                          }`}
                        >
                          <Icon name="clock" size={14} />
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="text-sm text-gray-800 truncate">{l.task?.title || l.note || 'General work'}</div>
                          <div className="text-[11px] text-gray-400 mt-0.5">
                            {new Date(l.startedAt).toLocaleString(undefined, { hour: 'numeric', minute: '2-digit' })}
                          </div>
                        </div>
                        <span
                          className={`shrink-0 font-mono text-xs font-semibold px-2.5 py-1 rounded-full ${
                            running
                              ? 'bg-[var(--accent-soft)] text-[var(--accent)] animate-pulse'
                              : 'bg-[var(--hover)] text-gray-600'
                          }`}
                        >
                          {l.durationSec ? fmt(l.durationSec) : 'running…'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </AppShell>
  );
}
