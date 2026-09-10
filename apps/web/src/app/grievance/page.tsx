'use client';
import { useEffect, useState } from 'react';
import AppShell from '@/components/AppShell';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/auth';

export default function GrievancePage() {
  const user = useAuthStore((s) => s.user);
  const [mine, setMine] = useState<any[]>([]);
  const [all, setAll] = useState<any[]>([]);
  const [form, setForm] = useState({ category: '', description: '', confidential: true });
  const isHr = user?.role === 'HR' || user?.role === 'SUPER_ADMIN';

  function load() {
    api.get('/grievances/mine').then((r) => setMine(r.data));
    if (isHr) api.get('/grievances').then((r) => setAll(r.data));
  }
  useEffect(load, [user]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    await api.post('/grievances', form);
    setForm({ category: '', description: '', confidential: true });
    load();
  }

  async function updateStatus(id: string, status: string) {
    await api.patch(`/grievances/${id}`, { status });
    load();
  }

  return (
    <AppShell>
      <h1 className="text-2xl font-semibold text-gray-900 mb-4">Grievances</h1>

      <form onSubmit={submit} className="card p-5 space-y-3 max-w-lg">
        <h2 className="font-medium text-gray-900">Raise a grievance</h2>
        <input className="input" placeholder="Category (e.g. workload, conduct, pay)" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} required />
        <textarea className="input" rows={4} placeholder="Describe the issue…" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required />
        <button className="btn-primary">Submit confidentially to HR</button>
      </form>

      <div className="card p-5 mt-6">
        <h2 className="font-medium text-gray-900 mb-3">My submissions</h2>
        <ul className="space-y-2 text-sm max-h-[320px] overflow-y-auto pr-1">
          {mine.map((g) => (
            <li key={g.id} className="flex justify-between border-b border-gray-100 pb-2">
              <span>{g.category}: {g.description.slice(0, 50)}</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100">{g.status}</span>
            </li>
          ))}
          {mine.length === 0 && <p className="text-sm text-gray-400">Nothing submitted.</p>}
        </ul>
      </div>

      {isHr && (
        <div className="card p-5 mt-6">
          <h2 className="font-medium text-gray-900 mb-3">All grievances (HR only)</h2>
          <ul className="space-y-2 text-sm max-h-[380px] overflow-y-auto pr-1">
            {all.map((g) => (
              <li key={g.id} className="flex justify-between items-center border-b border-gray-100 pb-2">
                <span>{g.raisedBy?.fullName} · {g.category}: {g.description.slice(0, 50)}</span>
                <select className="input text-xs w-36" value={g.status} onChange={(e) => updateStatus(g.id, e.target.value)}>
                  {['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'].map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </li>
            ))}
          </ul>
        </div>
      )}
    </AppShell>
  );
}
