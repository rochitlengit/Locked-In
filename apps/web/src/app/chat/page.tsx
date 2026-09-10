'use client';
import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import AppShell from '@/components/AppShell';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/auth';
import { Avatar, Empty, PageHeader } from '@/components/ui';
import { Icon } from '@/components/icons';

export default function ChatPage() {
  const user = useAuthStore((s) => s.user);
  const [channels, setChannels] = useState<any[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState('');
  const [users, setUsers] = useState<any[]>([]);
  const [showNew, setShowNew] = useState(false);
  const [newName, setNewName] = useState('');
  const [memberIds, setMemberIds] = useState<string[]>([]);
  const socketRef = useRef<Socket | null>(null);
  const feedRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api.get('/chat/channels').then((r) => {
      setChannels(r.data);
      if (r.data[0]) setActiveId(r.data[0].id);
    });
    api.get('/users').then((r) => setUsers(r.data));

    const socket = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000');
    socketRef.current = socket;
    socket.on('new_message', (msg: any) => {
      setMessages((prev) => (msg.channelId === activeIdRef.current ? [...prev, msg] : prev));
    });
    return () => { socket.disconnect(); };
  }, []);

  const activeIdRef = useRef<string | null>(null);
  useEffect(() => { activeIdRef.current = activeId; }, [activeId]);

  useEffect(() => {
    if (!activeId) return;
    api.get(`/chat/channels/${activeId}/messages`).then((r) => setMessages(r.data));
    socketRef.current?.emit('join_channel', activeId);
    return () => { socketRef.current?.emit('leave_channel', activeId); };
  }, [activeId]);

  useEffect(() => {
    feedRef.current?.scrollTo({ top: feedRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  async function send() {
    if (!text.trim() || !activeId) return;
    await api.post(`/chat/channels/${activeId}/messages`, { content: text });
    setText('');
  }

  async function createChannel() {
    if (!newName.trim()) return;
    const { data } = await api.post('/chat/channels', { name: newName, memberIds });
    setChannels((c) => [data, ...c]);
    setActiveId(data.id);
    setShowNew(false);
    setNewName('');
    setMemberIds([]);
  }

  const activeChannel = channels.find((c) => c.id === activeId);

  // Group consecutive messages from the same sender so the feed reads like
  // a real chat thread — one avatar + name per run, not per line.
  const runs: { senderId: string; sender: any; items: any[] }[] = [];
  for (const m of messages) {
    const last = runs[runs.length - 1];
    if (last && last.senderId === m.senderId) last.items.push(m);
    else runs.push({ senderId: m.senderId, sender: m.sender, items: [m] });
  }

  return (
    <AppShell>
      <PageHeader title="Chat" subtitle="Direct messages and team channels, all in one place." />

      <div className="grid grid-cols-4 gap-4 h-[70vh]">
        <div className="card p-3 col-span-1 flex flex-col">
          <div className="flex items-center justify-between mb-2 px-1">
            <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Channels</span>
            <button
              className="h-6 w-6 grid place-items-center rounded-lg text-brand-500 hover:bg-brand-50 transition-colors"
              onClick={() => setShowNew(!showNew)}
              aria-label="New channel"
            >
              <Icon name={showNew ? 'check' : 'board'} size={13} />
            </button>
          </div>
          {showNew && (
            <div className="mb-2 space-y-2 border-b border-gray-100 pb-3">
              <input className="input text-xs" placeholder="Channel name" value={newName} onChange={(e) => setNewName(e.target.value)} />
              <select multiple className="input text-xs h-20" onChange={(e) => setMemberIds(Array.from(e.target.selectedOptions).map((o) => o.value))}>
                {users.map((u) => <option key={u.id} value={u.id}>{u.fullName}</option>)}
              </select>
              <button className="btn-primary text-xs w-full" onClick={createChannel}>Create</button>
            </div>
          )}
          <div className="flex-1 overflow-y-auto space-y-1 pr-0.5">
            {channels.map((c) => {
              const active = activeId === c.id;
              return (
                <button
                  key={c.id}
                  onClick={() => setActiveId(c.id)}
                  className={`w-full flex items-center gap-2 text-left text-sm px-2 py-1.5 rounded-lg transition-colors border-l-2 ${
                    active
                      ? 'bg-[var(--accent-soft)] text-[var(--accent-ink)] border-[var(--accent)]'
                      : 'border-transparent hover:bg-[var(--hover)] text-gray-700'
                  }`}
                >
                  {c.isDM ? (
                    <Avatar name={c.name} size={20} />
                  ) : (
                    <span className={`h-5 w-5 shrink-0 grid place-items-center rounded-md ${active ? 'bg-[var(--accent)] text-white' : 'bg-[var(--hover)] text-gray-400'}`}>
                      <Icon name="hash" size={10} />
                    </span>
                  )}
                  <span className="truncate">{c.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="card p-0 col-span-3 flex flex-col overflow-hidden">
          {activeChannel && (
            <div className="flex items-center gap-2 px-4 py-3 border-b border-[var(--line-soft)] shrink-0">
              {activeChannel.isDM ? (
                <Avatar name={activeChannel.name} size={26} />
              ) : (
                <span className="h-7 w-7 grid place-items-center rounded-lg bg-[var(--accent-soft)] text-[var(--accent)]">
                  <Icon name="hash" size={13} />
                </span>
              )}
              <span className="text-sm font-medium text-gray-800">{activeChannel.name}</span>
            </div>
          )}

          <div ref={feedRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
            {runs.length === 0 && <Empty icon="chat">No messages yet — say hello.</Empty>}
            {runs.map((run, i) => {
              const mine = run.senderId === user?.id;
              return (
                <div key={i} className={`flex gap-2.5 ${mine ? 'flex-row-reverse' : ''}`}>
                  <Avatar name={run.sender?.fullName || '?'} size={28} />
                  <div className={`flex flex-col gap-1 max-w-[70%] ${mine ? 'items-end' : 'items-start'}`}>
                    <div className={`flex items-baseline gap-2 ${mine ? 'flex-row-reverse' : ''}`}>
                      <span className="text-[12px] font-medium text-gray-700">{mine ? 'You' : run.sender?.fullName}</span>
                      <span className="text-[10.5px] text-gray-400">{new Date(run.items[0].createdAt).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}</span>
                    </div>
                    {run.items.map((m) => (
                      <div
                        key={m.id}
                        className={`text-sm px-3.5 py-2 rounded-2xl ${
                          mine
                            ? 'bg-[var(--accent)] text-white rounded-tr-sm'
                            : 'bg-[var(--hover)] text-gray-800 rounded-tl-sm'
                        }`}
                      >
                        {m.content}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex gap-2 px-4 py-3 border-t border-[var(--line-soft)] shrink-0">
            <input
              className="input flex-1"
              placeholder="Write a message…"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && send()}
            />
            <button className="btn-primary flex items-center gap-1.5 px-4" onClick={send}>
              <Icon name="send" size={13} />
              Send
            </button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
