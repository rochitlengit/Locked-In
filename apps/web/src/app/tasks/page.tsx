'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useDroppable } from '@dnd-kit/core';
import { AnimatePresence, motion } from 'framer-motion';
import AppShell from '@/components/AppShell';
import { Avatar, Empty, PageHeader, Pill, Toast } from '@/components/ui';
import { Icon, skillIcon } from '@/components/icons';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/auth';

const COLUMNS = ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'] as const;
type Column = (typeof COLUMNS)[number];

const COLUMN_META: Record<Column, { label: string; dot: string; edge: string; hint: string; icon: 'flag' | 'clock' | 'grievance' | 'check' }> = {
  TODO: { label: 'To do', dot: 'bg-gray-400', edge: 'border-t-gray-300', hint: 'Not started', icon: 'flag' },
  IN_PROGRESS: { label: 'In progress', dot: 'bg-blue-400', edge: 'border-t-blue-400', hint: 'Being worked on', icon: 'clock' },
  IN_REVIEW: { label: 'In review', dot: 'bg-amber-400', edge: 'border-t-amber-400', hint: 'Waiting on the lead', icon: 'grievance' },
  DONE: { label: 'Done', dot: 'bg-emerald-400', edge: 'border-t-emerald-400', hint: 'Approved and scored', icon: 'check' },
};

const SPRING = { type: 'spring' as const, stiffness: 480, damping: 32, mass: 0.9 };

const emptyForm = {
  title: '', description: '', assigneeId: '', weightage: 3, difficulty: 3, deadline: '', estimatedMinutes: 120,
  skillIds: [] as string[],
};

function loggedMinutes(task: any) {
  return Math.round(task.timeLogs?.reduce((s: number, l: any) => s + (l.durationSec || 0), 0) / 60) || 0;
}

/** One draggable card. Framer handles the layout reflow; dnd-kit handles the pointer. */
function TaskCard({
  task, open, onToggle, onStartTimer, onDecide, onAddSubtask, onToggleSubtask, canManage,
  subtaskTitle, setSubtaskTitle, onManualMove,
}: any) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useSortable({ id: task.id });
  const logged = loggedMinutes(task);
  const est = task.estimatedMinutes || 0;
  const overdue = task.deadline && new Date(task.deadline) < new Date() && task.status !== 'DONE';

  return (
    <motion.article
      ref={setNodeRef}
      layoutId={task.id}
      layout
      transition={SPRING}
      initial={{ opacity: 0, y: 10, scale: 0.97 }}
      animate={{ opacity: isDragging ? 0.35 : 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      style={{
        transform: transform ? CSS.Translate.toString(transform) : undefined,
      }}
      {...(!open ? { ...attributes, ...listeners } : {})}
      className={`card p-3 border-t-[3px] ${COLUMN_META[task.status as Column].edge} ${open ? '' : 'cursor-grab active:cursor-grabbing'}`}
      whileHover={!open && !isDragging ? { y: -2, boxShadow: '0 10px 26px -14px rgba(30,32,36,.28)' } : undefined}
    >
      <button className="text-[13px] font-semibold text-gray-900 text-left w-full leading-snug font-display" onClick={() => onToggle(task.id)}>
        {task.title}
      </button>

      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-2 text-[11px] text-gray-400 font-mono">
        <span className="tabular-nums text-gray-500">W{task.weightage}·D{task.difficulty}</span>
        {task.deadline && (
          <span className={overdue ? 'text-red-500 font-semibold' : ''}>
            {overdue ? 'overdue ' : 'due '}
            {new Date(task.deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
          </span>
        )}
        {task.approvalStatus !== 'NOT_SUBMITTED' && <Pill value={task.approvalStatus} withIcon />}
      </div>

      {est > 0 && (
        <div className="mt-2">
          <div className="h-1 rounded-full bg-gray-200 overflow-hidden">
            <motion.div
              className={`h-full rounded-full ${logged > est ? 'bg-red-500' : logged > est * 0.75 ? 'bg-amber-500' : 'bg-brand-500'}`}
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, (logged / est) * 100)}%` }}
              transition={{ duration: 0.5, ease: [0.34, 1.1, 0.4, 1] }}
            />
          </div>
          <div className="text-[10px] text-gray-400 mt-1 tabular-nums font-mono">{logged}m logged of ~{est}m</div>
        </div>
      )}

      <div className="flex items-center justify-between mt-2.5">
        <div className="flex flex-wrap gap-1">
          {task.skills?.slice(0, 2).map((s: any) => (
            <span key={s.id} className="text-[10px] bg-gray-100 border border-gray-200 rounded-full pl-1.5 pr-2 py-0.5 text-gray-500 flex items-center gap-1">
              <Icon name={skillIcon(s.skill.name)} size={9} />
              {s.skill.name}
            </span>
          ))}
          {task.skills?.length > 2 && <span className="text-[10px] text-gray-400 px-1 py-0.5">+{task.skills.length - 2}</span>}
        </div>
        {task.assignee && <Avatar name={task.assignee.fullName} size={22} />}
      </div>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.34, 1, 0.4, 1] }}
            className="overflow-hidden"
          >
            <div className="mt-3 pt-3 border-t border-gray-200 space-y-3">
              {task.description && <p className="text-xs text-gray-600 leading-relaxed">{task.description}</p>}
              <div className="text-[11px] text-gray-400">{task.assignee ? `Assigned to ${task.assignee.fullName}` : 'Unassigned'}</div>

              <div>
                <div className="text-[11px] font-medium text-gray-500 mb-1">Subtasks</div>
                {task.subtasks?.length === 0 && <p className="text-[11px] text-gray-400">None yet.</p>}
                {task.subtasks?.map((s: any) => (
                  <label key={s.id} className="flex items-center gap-2 text-xs text-gray-600 py-0.5 cursor-pointer">
                    <input type="checkbox" checked={s.status === 'DONE'} onChange={() => onToggleSubtask(s.id, s.status)} />
                    <span className={s.status === 'DONE' ? 'line-through text-gray-400' : ''}>{s.title}</span>
                  </label>
                ))}
                <div className="flex gap-1 mt-1.5">
                  <input
                    className="input text-xs py-1"
                    placeholder="Add subtask"
                    value={subtaskTitle}
                    onChange={(e: any) => setSubtaskTitle(e.target.value)}
                    onKeyDown={(e: any) => e.key === 'Enter' && onAddSubtask(task.id)}
                  />
                  <button className="btn-secondary text-xs py-1 px-2.5" onClick={() => onAddSubtask(task.id)} type="button">Add</button>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 items-center">
                {task.status !== 'DONE' && (
                  <button className="btn-secondary text-xs py-1 px-2.5" onClick={() => onStartTimer(task.id)} type="button">
                    <Icon name="clock" size={12} /> Start timer
                  </button>
                )}
                {task.approvalStatus === 'PENDING' && canManage && (
                  <>
                    <button className="btn-primary text-xs py-1 px-2.5" onClick={() => onDecide(task.id, 'APPROVED')} type="button">
                      <Icon name="check" size={12} /> Approve
                    </button>
                    <button className="btn-secondary text-xs py-1 px-2.5" onClick={() => onDecide(task.id, 'REJECTED')} type="button">Send back</button>
                  </>
                )}
                <button className="btn-ghost text-xs ml-auto" onClick={() => onToggle(null)} type="button">Close</button>
              </div>

              <label className="block">
                <span className="text-[11px] text-gray-500">Move to</span>
                <select className="input text-xs mt-1" value={task.status} onChange={(e) => onManualMove(task.id, e.target.value as Column)}>
                  {COLUMNS.map((c) => <option key={c} value={c}>{COLUMN_META[c].label}</option>)}
                </select>
              </label>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.article>
  );
}

function BoardColumn({ id, children, blocked }: { id: Column; children: React.ReactNode; blocked: boolean }) {
  const { setNodeRef, isOver } = useDroppable({ id });
  const meta = COLUMN_META[id];
  return (
    <section
      ref={setNodeRef}
      className={`kanban-col p-3 flex flex-col min-h-[320px] max-h-[calc(100vh-230px)] w-[302px] shrink-0 snap-start overflow-hidden ${isOver ? (blocked ? 'is-blocked' : 'is-over') : ''}`}
    >
      <header className="flex items-center justify-between px-1 pb-3">
        <div className="flex items-center gap-2">
          <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
          <h3 className="text-[12px] font-semibold tracking-wide text-gray-700 font-display">{meta.label}</h3>
        </div>
      </header>
      {children}
      <AnimatePresence>
        {isOver && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 56 }}
            exit={{ opacity: 0, height: 0 }}
            className="drop-hint mt-2 grid place-items-center text-[11px] text-gray-500 overflow-hidden"
          >
            {blocked ? 'Goes to review first — a lead approves it' : `Drop in ${meta.label.toLowerCase()}`}
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

export default function TasksPage() {
  const user = useAuthStore((s) => s.user);
  const [tasks, setTasks] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [skills, setSkills] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [teamId, setTeamId] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [subtaskTitle, setSubtaskTitle] = useState('');
  const [busy, setBusy] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; tone: 'info' | 'good' | 'bad' }>({ msg: '', tone: 'info' });

  const canManage = user?.role === 'TEAM_LEAD' || user?.role === 'SUPER_ADMIN';
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));
  const clearToast = useCallback(() => setToast({ msg: '', tone: 'info' }), []);

  async function load() {
    if (!user) return;
    if (canManage) {
      const teamsRes = await api.get('/teams');
      setTeams(teamsRes.data);
      const active = teamId || teamsRes.data.find((t: any) => t.leadId === user.id)?.id || teamsRes.data[0]?.id;
      if (active) {
        setTeamId(active);
        const [tasksRes, membersRes] = await Promise.all([api.get(`/tasks/team/${active}`), api.get(`/teams/${active}/members`)]);
        setTasks(tasksRes.data);
        setMembers(membersRes.data);
      }
    } else {
      const res = await api.get('/tasks/mine');
      setTasks(res.data);
    }
    api.get('/gamification/skills').then((r) => setSkills(r.data)).catch(() => {});
  }

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [user, teamId]);

  const byColumn = useMemo(() => {
    const map: Record<Column, any[]> = { TODO: [], IN_PROGRESS: [], IN_REVIEW: [], DONE: [] };
    tasks.forEach((t) => map[t.status as Column]?.push(t));
    return map;
  }, [tasks]);

  const activeTask = tasks.find((t) => t.id === activeId);

  async function createTask(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await api.post('/tasks', {
        ...form, teamId, assigneeId: form.assigneeId || undefined,
        deadline: form.deadline ? new Date(form.deadline).toISOString() : undefined,
        skillIds: form.skillIds.length ? form.skillIds : undefined,
      });
      setForm(emptyForm);
      setShowCreate(false);
      setToast({ msg: 'Task created.', tone: 'good' });
      await load();
    } finally { setBusy(false); }
  }

  async function moveStatus(id: string, status: Column) {
    const task = tasks.find((t) => t.id === id);
    if (!task || task.status === status) return;
    const snapshot = tasks;
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, status } : t)));
    try {
      const res = await api.patch(`/tasks/${id}/status`, { status });
      const landed = res.data?.status as Column | undefined;
      if (landed && landed !== status) {
        setToast({ msg: `Sent to ${COLUMN_META[landed].label.toLowerCase()} — a lead approves it from there.`, tone: 'info' });
      } else if (status === 'DONE') {
        setToast({ msg: 'Marked done.', tone: 'good' });
      } else if (status === 'IN_PROGRESS') {
        setToast({ msg: 'Moved to in progress.', tone: 'info' });
      }
      await load();
    } catch (err: any) {
      setTasks(snapshot);
      setToast({ msg: err?.response?.data?.message || 'Could not move that task.', tone: 'bad' });
    }
  }

  async function decide(id: string, decision: 'APPROVED' | 'REJECTED') {
    try {
      await api.patch(`/tasks/${id}/approve`, { decision });
      setToast({ msg: decision === 'APPROVED' ? 'Approved — score updated.' : 'Sent back for changes.', tone: decision === 'APPROVED' ? 'good' : 'info' });
      await load();
    } catch (err: any) {
      setToast({ msg: err?.response?.data?.message || 'Could not record that decision.', tone: 'bad' });
    }
  }

  async function addSubtask(taskId: string) {
    if (!subtaskTitle.trim()) return;
    await api.post(`/tasks/${taskId}/subtasks`, { title: subtaskTitle });
    setSubtaskTitle('');
    load();
  }

  async function toggleSubtask(subtaskId: string, status: string) {
    await api.patch(`/tasks/subtasks/${subtaskId}/status`, { status: status === 'DONE' ? 'TODO' : 'DONE' });
    load();
  }

  async function startTimer(taskId: string) {
    try {
      await api.post('/time/start', { taskId });
      window.location.href = '/time';
    } catch (err: any) {
      setToast({ msg: err?.response?.data?.message || 'Could not start the timer', tone: 'bad' });
    }
  }

  function columnBlocked(col: Column) {
    return !!activeTask && col === 'DONE' && activeTask.approvalStatus !== 'APPROVED';
  }

  function handleDragStart(e: DragStartEvent) {
    setActiveId(String(e.active.id));
  }

  function handleDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    setActiveId(null);
    if (!over) return;
    const task = tasks.find((t) => t.id === active.id);
    if (!task) return;

    // `over.id` is either a column id (dropped on empty space) or another card's id.
    const overCol = (COLUMNS as readonly string[]).includes(String(over.id))
      ? (over.id as Column)
      : tasks.find((t) => t.id === over.id)?.status;
    if (!overCol || overCol === task.status) return;
    moveStatus(task.id, overCol as Column);
  }

  return (
    <AppShell>
      <PageHeader
        title="Tasks"
        subtitle={canManage ? 'Drag a card between columns to move it. Assign weight and deadlines, approve what comes back.' : 'Drag your cards across the board as you work — the timer and your score follow along.'}
        action={
          <div className="flex gap-2">
            {canManage && teams.length > 0 && (
              <select className="input w-44" value={teamId} onChange={(e) => setTeamId(e.target.value)}>
                {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            )}
            {canManage && (
              <button className="btn-primary whitespace-nowrap" onClick={() => setShowCreate(!showCreate)}>
                <Icon name="bolt" size={13} /> {showCreate ? 'Cancel' : 'New task'}
              </button>
            )}
          </div>
        }
      />

      <AnimatePresence>
        {showCreate && (
          <motion.form
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.26, ease: [0.34, 1, 0.4, 1] }}
            onSubmit={createTask} className="card p-5 mb-6 grid grid-cols-2 gap-3 overflow-hidden"
          >
            <input className="input col-span-2" placeholder="Task title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
            <textarea className="input col-span-2" rows={2} placeholder="Requirements / context for the assignee" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            <select className="input" value={form.assigneeId} onChange={(e) => setForm({ ...form, assigneeId: e.target.value })}>
              <option value="">Assign to…</option>
              {members.map((m) => <option key={m.id} value={m.id}>{m.fullName}</option>)}
            </select>
            <input type="date" className="input" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} />
            <label className="text-xs text-gray-500 flex items-center gap-2">Weightage (1-5)
              <input type="number" min={1} max={5} className="input w-20" value={form.weightage} onChange={(e) => setForm({ ...form, weightage: +e.target.value })} />
            </label>
            <label className="text-xs text-gray-500 flex items-center gap-2">Difficulty (1-5)
              <input type="number" min={1} max={5} className="input w-20" value={form.difficulty} onChange={(e) => setForm({ ...form, difficulty: +e.target.value })} />
            </label>
            <label className="text-xs text-gray-500 flex items-center gap-2">Estimated minutes
              <input type="number" min={0} className="input w-28" value={form.estimatedMinutes} onChange={(e) => setForm({ ...form, estimatedMinutes: +e.target.value })} />
            </label>
            <div className="text-xs text-gray-500">Skills exercised
              <select multiple className="input h-20 mt-1" value={form.skillIds} onChange={(e) => setForm({ ...form, skillIds: Array.from(e.target.selectedOptions).map((o) => o.value) })}>
                {skills.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <button className="btn-primary col-span-2" disabled={busy}>{busy ? 'Creating…' : 'Create task'}</button>
          </motion.form>
        )}
      </AnimatePresence>

      <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="flex gap-4 overflow-x-auto snap-x snap-proximity pb-3 -mx-1 px-1" style={{ scrollbarGutter: 'stable' }}>
          {COLUMNS.map((col) => {
            const columnTasks = byColumn[col];
            return (
              <BoardColumn key={col} id={col} blocked={columnBlocked(col)}>
                <SortableContext items={columnTasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
                  <motion.div layout className="space-y-2 flex-1 min-h-0 overflow-y-auto pr-1">
                    {columnTasks.length === 0 && <Empty icon={COLUMN_META[col].icon}>{COLUMN_META[col].hint}</Empty>}
                    <AnimatePresence initial={false}>
                      {columnTasks.map((task) => (
                        <TaskCard
                          key={task.id}
                          task={task}
                          open={expanded === task.id}
                          onToggle={(id: string | null) => setExpanded(expanded === id ? null : id)}
                          onStartTimer={startTimer}
                          onDecide={decide}
                          onAddSubtask={addSubtask}
                          onToggleSubtask={toggleSubtask}
                          onManualMove={moveStatus}
                          canManage={canManage}
                          subtaskTitle={subtaskTitle}
                          setSubtaskTitle={setSubtaskTitle}
                        />
                      ))}
                    </AnimatePresence>
                  </motion.div>
                </SortableContext>
              </BoardColumn>
            );
          })}
        </div>

        <DragOverlay dropAnimation={{ duration: 260, easing: 'cubic-bezier(.34,1.56,.64,1)' }}>
          {activeTask && (
            <div className="card p-3 shadow-drag" style={{ transform: 'rotate(2.4deg) scale(1.04)', width: 268 }}>
              <div className="text-[13px] font-semibold text-gray-900 font-display">{activeTask.title}</div>
              <div className="text-[11px] text-gray-400 font-mono mt-1.5">W{activeTask.weightage}·D{activeTask.difficulty}</div>
            </div>
          )}
        </DragOverlay>
      </DndContext>

      <p className="text-[11px] text-gray-400 mt-4">
        Tip: click a card to open it, drag it by the body to move it between columns. Expanded cards stay put so you can edit them.
      </p>

      <Toast message={toast.msg} tone={toast.tone} onDone={clearToast} />
    </AppShell>
  );
}
