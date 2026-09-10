'use client';
import { useEffect, useState } from 'react';
import AppShell from '@/components/AppShell';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/auth';
import { Avatar, Card, Empty, PageHeader } from '@/components/ui';
import { Icon } from '@/components/icons';

export default function AnnouncementsPage() {
  const user = useAuthStore((s) => s.user);
  const [list, setList] = useState<any[]>([]);
  const [form, setForm] = useState({ title: '', body: '', pinned: false });
  const canPost = user?.role === 'HR' || user?.role === 'SUPER_ADMIN';

  function load() {
    api.get('/announcements').then((r) => setList(r.data));
  }
  useEffect(load, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    await api.post('/announcements', form);
    setForm({ title: '', body: '', pinned: false });
    load();
  }

  return (
    <AppShell>
      <PageHeader
        title="Company Newsletter"
        subtitle="Updates, policy changes and news from HR and leadership."
      />

      {canPost && (
        <Card title="Publish an update" icon="news" className="mb-6">
          <form onSubmit={submit} className="space-y-3">
            <input className="input" placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
            <textarea className="input" rows={4} placeholder="Write your update…" value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} required />
            <label className="flex items-center gap-2 text-sm text-gray-600 select-none cursor-pointer w-fit">
              <input type="checkbox" className="accent-[var(--accent)]" checked={form.pinned} onChange={(e) => setForm({ ...form, pinned: e.target.checked })} />
              <Icon name="pin" size={13} className={form.pinned ? 'text-[var(--accent)]' : 'text-gray-400'} />
              Pin to top
            </label>
            <button className="btn-primary">Publish</button>
          </form>
        </Card>
      )}

      {list.length === 0 ? (
        <Card>
          <Empty icon="news">No announcements yet.</Empty>
        </Card>
      ) : (
        <div className="space-y-4">
          {list.map((a) => (
            <section
              key={a.id}
              className={`card card-hover p-5 animate-rise ${a.pinned ? 'border-l-4 border-l-[var(--accent)]' : ''}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    {a.pinned && (
                      <span className="inline-flex items-center gap-1 text-[10.5px] font-semibold uppercase tracking-wide bg-[var(--accent-soft)] text-[var(--accent-ink)] px-2 py-0.5 rounded-full">
                        <Icon name="pin" size={10} />
                        Pinned
                      </span>
                    )}
                  </div>
                  <h2 className="text-[16px] font-semibold text-gray-900 font-display">{a.title}</h2>
                </div>
                <span className="h-9 w-9 shrink-0 grid place-items-center rounded-xl bg-[var(--accent-soft)] text-[var(--accent)]">
                  <Icon name="news" size={15} />
                </span>
              </div>

              <p className="text-[13.5px] text-gray-600 leading-relaxed mt-3 whitespace-pre-wrap">{a.body}</p>

              <div className="flex items-center gap-2 mt-4 pt-3 border-t border-[var(--line-soft)]">
                <Avatar name={a.author?.fullName || '?'} size={22} />
                <span className="text-[12px] text-gray-500">
                  {a.author?.fullName} · {new Date(a.publishedAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              </div>
            </section>
          ))}
        </div>
      )}
    </AppShell>
  );
}
