'use client';
import { useEffect, useState } from 'react';
import AppShell from '@/components/AppShell';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/auth';
import { Avatar, CapacityBar, Card, Empty, PageHeader, Pill } from '@/components/ui';
import { Icon, IconName } from '@/components/icons';

const LEAVE_TYPE_ICON: Record<string, IconName> = {
  casual: 'calendar',
  sick: 'flag',
  earned: 'trend',
  work: 'org',
};
function leaveIcon(name: string): IconName {
  const key = Object.keys(LEAVE_TYPE_ICON).find((k) => name.toLowerCase().includes(k));
  return key ? LEAVE_TYPE_ICON[key] : 'calendar';
}

export default function LeavePage() {
  const user = useAuthStore((s) => s.user);
  const [types, setTypes] = useState<any[]>([]);
  const [balances, setBalances] = useState<any[]>([]);
  const [mine, setMine] = useState<any[]>([]);
  const [pending, setPending] = useState<any[]>([]);
  const [pendingPerm, setPendingPerm] = useState<any[]>([]);
  const [leaveForm, setLeaveForm] = useState({ leaveTypeId: '', startDate: '', endDate: '', reason: '' });
  const [permForm, setPermForm] = useState({ date: '', fromTime: '', toTime: '', reason: '' });

  const canApprove = user?.role === 'TEAM_LEAD' || user?.role === 'HR' || user?.role === 'SUPER_ADMIN';

  async function load() {
    const [t, b, m] = await Promise.all([
      api.get('/hr/leave-types'),
      api.get('/hr/leave-balances/mine'),
      api.get('/hr/leave-requests/mine'),
    ]);
    setTypes(t.data); setBalances(b.data); setMine(m.data);
    if (canApprove) {
      const [p, pp] = await Promise.all([api.get('/hr/leave-requests/pending'), api.get('/hr/permission-requests/pending')]);
      setPending(p.data); setPendingPerm(pp.data);
    }
  }

  useEffect(() => { load(); }, [user]);

  async function submitLeave(e: React.FormEvent) {
    e.preventDefault();
    await api.post('/hr/leave-requests', leaveForm);
    setLeaveForm({ leaveTypeId: '', startDate: '', endDate: '', reason: '' });
    load();
  }
  async function submitPerm(e: React.FormEvent) {
    e.preventDefault();
    await api.post('/hr/permission-requests', permForm);
    setPermForm({ date: '', fromTime: '', toTime: '', reason: '' });
    load();
  }
  async function decideLeave(id: string, status: 'APPROVED' | 'REJECTED') {
    await api.patch(`/hr/leave-requests/${id}/decide`, { status });
    load();
  }
  async function decidePerm(id: string, status: 'APPROVED' | 'REJECTED') {
    await api.patch(`/hr/permission-requests/${id}/decide`, { status });
    load();
  }

  const pendingTotal = pending.length + pendingPerm.length;

  return (
    <AppShell>
      <PageHeader
        title="Leave & Permissions"
        subtitle="Request time off or a few hours away, track your balances, and clear approvals for your team."
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Request leave" icon="leave">
          <form onSubmit={submitLeave} className="space-y-3">
            <select className="input" value={leaveForm.leaveTypeId} onChange={(e) => setLeaveForm({ ...leaveForm, leaveTypeId: e.target.value })} required>
              <option value="">Leave type…</option>
              {types.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
            <div className="flex gap-2">
              <input type="date" className="input" value={leaveForm.startDate} onChange={(e) => setLeaveForm({ ...leaveForm, startDate: e.target.value })} required />
              <input type="date" className="input" value={leaveForm.endDate} onChange={(e) => setLeaveForm({ ...leaveForm, endDate: e.target.value })} required />
            </div>
            <input className="input" placeholder="Reason" value={leaveForm.reason} onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })} />
            <button className="btn-primary">Submit request</button>
          </form>
        </Card>

        <Card title="Request permission hours" icon="clock">
          <form onSubmit={submitPerm} className="space-y-3">
            <input type="date" className="input" value={permForm.date} onChange={(e) => setPermForm({ ...permForm, date: e.target.value })} required />
            <div className="flex gap-2">
              <input type="time" className="input" value={permForm.fromTime} onChange={(e) => setPermForm({ ...permForm, fromTime: e.target.value })} required />
              <input type="time" className="input" value={permForm.toTime} onChange={(e) => setPermForm({ ...permForm, toTime: e.target.value })} required />
            </div>
            <input className="input" placeholder="Reason" value={permForm.reason} onChange={(e) => setPermForm({ ...permForm, reason: e.target.value })} />
            <button className="btn-primary">Submit request</button>
          </form>
        </Card>
      </div>

      <Card title="My leave balances" icon="calendar" className="mt-6">
        {balances.length === 0 ? (
          <Empty icon="calendar">No leave taken yet this year.</Empty>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
            {balances.map((b) => (
              <CapacityBar
                key={b.id}
                label={b.leaveType.name}
                used={b.used}
                total={b.allocated}
                icon={leaveIcon(b.leaveType.name)}
              />
            ))}
          </div>
        )}
      </Card>

      <Card title="My requests" icon="board" className="mt-6">
        {mine.length === 0 ? (
          <Empty icon="board">No requests yet — submit one above.</Empty>
        ) : (
          <ul className="space-y-1.5 max-h-[320px] overflow-y-auto pr-1">
            {mine.map((r) => (
              <li
                key={r.id}
                className="flex items-center gap-3 px-2.5 py-2.5 rounded-xl transition-colors hover:bg-[var(--hover)]"
              >
                <span className="h-8 w-8 shrink-0 rounded-lg grid place-items-center bg-[var(--accent-soft)] text-[var(--accent)]">
                  <Icon name={leaveIcon(r.leaveType.name)} size={14} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-sm text-gray-800">{r.leaveType.name}</div>
                  <div className="text-[11px] text-gray-400 mt-0.5">
                    {new Date(r.startDate).toLocaleDateString()} → {new Date(r.endDate).toLocaleDateString()}
                  </div>
                </div>
                <Pill value={r.status} withIcon />
              </li>
            ))}
          </ul>
        )}
      </Card>

      {canApprove && (
        <Card
          title="Pending approvals"
          icon="flag"
          className="mt-6"
          action={pendingTotal > 0 ? <Pill value="PENDING" className="!text-[10px]" /> : undefined}
        >
          {pendingTotal === 0 ? (
            <Empty icon="check">Nothing pending — you're all caught up.</Empty>
          ) : (
            <ul className="space-y-1.5 max-h-[380px] overflow-y-auto pr-1">
              {pending.map((r) => (
                <li key={r.id} className="flex items-center gap-3 px-2.5 py-2.5 rounded-xl hover:bg-[var(--hover)] transition-colors">
                  <Avatar name={r.user.fullName} size={30} />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm text-gray-800 truncate">{r.user.fullName}</div>
                    <div className="text-[11px] text-gray-400 mt-0.5 flex items-center gap-1">
                      <Icon name={leaveIcon(r.leaveType.name)} size={11} />
                      {r.leaveType.name} · {new Date(r.startDate).toLocaleDateString()} → {new Date(r.endDate).toLocaleDateString()}
                    </div>
                  </div>
                  <span className="flex gap-2 shrink-0">
                    <button className="btn-approve" onClick={() => decideLeave(r.id, 'APPROVED')}>Approve</button>
                    <button className="btn-reject" onClick={() => decideLeave(r.id, 'REJECTED')}>Reject</button>
                  </span>
                </li>
              ))}
              {pendingPerm.map((r) => (
                <li key={r.id} className="flex items-center gap-3 px-2.5 py-2.5 rounded-xl hover:bg-[var(--hover)] transition-colors">
                  <Avatar name={r.user.fullName} size={30} />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm text-gray-800 truncate">{r.user.fullName}</div>
                    <div className="text-[11px] text-gray-400 mt-0.5 flex items-center gap-1">
                      <Icon name="clock" size={11} />
                      Permission · {new Date(r.date).toLocaleDateString()} {r.fromTime}-{r.toTime}
                    </div>
                  </div>
                  <span className="flex gap-2 shrink-0">
                    <button className="btn-approve" onClick={() => decidePerm(r.id, 'APPROVED')}>Approve</button>
                    <button className="btn-reject" onClick={() => decidePerm(r.id, 'REJECTED')}>Reject</button>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}
    </AppShell>
  );
}
