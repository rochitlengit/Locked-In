'use client';
import React, { useEffect } from 'react';
import { Icon, IconName } from './icons';

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between mb-6 gap-4 animate-rise">
      <div>
        <h1 className="text-[23px] font-semibold tracking-tight text-gray-900 font-display">{title}</h1>
        {subtitle && <p className="text-[13px] text-gray-500 mt-1 max-w-xl">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function Card({ title, icon, children, className = '', action }: {
  title?: string; icon?: IconName; children: React.ReactNode; className?: string; action?: React.ReactNode;
}) {
  return (
    <section className={`card card-hover p-5 animate-rise ${className}`}>
      {(title || action) && (
        <header className="flex items-center justify-between mb-4 gap-3">
          {title && (
            <h2 className="text-[12px] font-semibold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
              {icon && <Icon name={icon} size={13} className="text-brand-500" />}
              {title}
            </h2>
          )}
          {action}
        </header>
      )}
      {children}
    </section>
  );
}

// Each tone is a full category colour — border, icon chip and a soft top
// wash — rather than a single grey card with an accent dot. Matches the
// bordered-card language of the reference dashboard rather than a flat list.
const STAT_TONE: Record<string, { border: string; bg: string; fg: string; wash: string; icon: IconName }> = {
  default: { border: 'border-blue-400/35', bg: 'bg-blue-50', fg: 'text-blue-500', wash: 'from-blue-50/70', icon: 'dashboard' },
  good: { border: 'border-emerald-400/35', bg: 'bg-emerald-50', fg: 'text-emerald-500', wash: 'from-emerald-50/70', icon: 'trend' },
  warn: { border: 'border-amber-400/40', bg: 'bg-amber-50', fg: 'text-amber-500', wash: 'from-amber-50/70', icon: 'flag' },
  violet: { border: 'border-violet-400/35', bg: 'bg-violet-50', fg: 'text-violet-500', wash: 'from-violet-50/70', icon: 'medal' },
};

export function Stat({ label, value, suffix, hint, tone = 'default', icon, size = 'md', className = '' }: {
  label: string; value: React.ReactNode; suffix?: string; hint?: string; tone?: 'default' | 'good' | 'warn' | 'violet'; icon?: IconName;
  size?: 'md' | 'lg'; className?: string;
}) {
  const t = STAT_TONE[tone];
  const lg = size === 'lg';
  return (
    <div
      className={`relative overflow-hidden rounded-2xl border-2 ${t.border} glass-surface ${lg ? 'p-5 flex flex-col justify-between' : 'p-4'} animate-rise card-hover shadow-[var(--shadow-card)] ${className}`}
    >
      <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${t.wash} to-transparent opacity-60`} />
      <div className="relative flex items-center justify-between">
        <div className={`uppercase tracking-wider text-gray-500 font-semibold ${lg ? 'text-[12px]' : 'text-[11px]'}`}>{label}</div>
        <span className={`grid place-items-center ${t.bg} ${t.fg} ${lg ? 'h-9 w-9 rounded-2xl' : 'h-7 w-7 rounded-xl'}`}>
          <Icon name={icon || t.icon} size={lg ? 16 : 13} />
        </span>
      </div>
      <div>
        <div
          className={`relative leading-tight font-bold tracking-tight font-display text-gray-900 ${lg ? 'text-[46px] mt-3' : 'text-[28px] mt-2.5'}`}
        >
          {value}
          {suffix && <span className={`font-normal text-gray-400 ml-0.5 ${lg ? 'text-base' : 'text-sm'}`}>{suffix}</span>}
        </div>
        {hint && <div className={`relative text-gray-500 mt-1 ${lg ? 'text-[12px]' : 'text-[11px]'}`}>{hint}</div>}
      </div>
    </div>
  );
}

const STATUS_TONES: Record<string, { cls: string; icon: IconName }> = {
  TODO: { cls: 'bg-gray-100 text-gray-600 border-gray-300', icon: 'flag' },
  IN_PROGRESS: { cls: 'bg-blue-50 text-blue-500 border-blue-100', icon: 'clock' },
  IN_REVIEW: { cls: 'bg-amber-50 text-amber-500 border-amber-100', icon: 'flag' },
  DONE: { cls: 'bg-emerald-50 text-emerald-500 border-emerald-100', icon: 'check' },
  REJECTED: { cls: 'bg-red-50 text-red-500 border-red-100', icon: 'flag' },
  PENDING: { cls: 'bg-amber-50 text-amber-500 border-amber-100', icon: 'clock' },
  APPROVED: { cls: 'bg-emerald-50 text-emerald-500 border-emerald-100', icon: 'check' },
  OPEN: { cls: 'bg-amber-50 text-amber-500 border-amber-100', icon: 'flag' },
  RESOLVED: { cls: 'bg-emerald-50 text-emerald-500 border-emerald-100', icon: 'check' },
  CLOSED: { cls: 'bg-gray-100 text-gray-500 border-gray-300', icon: 'check' },
  NOT_SUBMITTED: { cls: 'bg-gray-100 text-gray-500 border-gray-300', icon: 'flag' },
  CANCELLED: { cls: 'bg-gray-100 text-gray-500 border-gray-300', icon: 'flag' },
};

export function Pill({ value, className = '', withIcon = false }: { value: string; className?: string; withIcon?: boolean }) {
  const tone = STATUS_TONES[value] || STATUS_TONES.TODO;
  return (
    <span className={`chip ${tone.cls} ${className}`}>
      {withIcon && <Icon name={tone.icon} size={10} />}
      {value.replace(/_/g, ' ').toLowerCase()}
    </span>
  );
}

export function ScoreBar({ label, score, hint }: { label: string; score: number; hint?: string }) {
  const pct = Math.max(0, Math.min(100, score));
  const colour = pct >= 75 ? 'bg-emerald-500' : pct >= 50 ? 'bg-brand-500' : pct >= 25 ? 'bg-amber-500' : 'bg-red-500';
  return (
    <div>
      <div className="flex justify-between text-xs mb-1.5">
        <span className="text-gray-500">{label}</span>
        <span className="text-gray-900 font-medium tabular-nums font-mono text-[11px]">{pct.toFixed(1)}</span>
      </div>
      <div className="h-1.5 rounded-full bg-gray-200 overflow-hidden">
        <div className={`h-full rounded-full origin-left animate-grow ${colour}`} style={{ width: `${pct}%` }} />
      </div>
      {hint && <div className="text-[11px] text-gray-400 mt-1">{hint}</div>}
    </div>
  );
}

export function Sparkline({ points, height = 64 }: { points: { label: string; value: number }[]; height?: number }) {
  if (points.length === 0) return <p className="text-sm text-gray-400">No history yet.</p>;
  const width = 260, max = 100;
  const step = points.length > 1 ? width / (points.length - 1) : 0;
  const coords = points.map((p, i) => [i * step, height - (p.value / max) * height] as const);
  const line = coords.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
  const area = `${line} L${width},${height} L0,${height} Z`;
  return (
    <div className="animate-fade">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ height }} preserveAspectRatio="none">
        <defs>
          <linearGradient id="spark" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.22" />
            <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={area} fill="url(#spark)" />
        <path d={line} fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
        {coords.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r="2.75" fill="var(--card)" stroke="var(--accent)" strokeWidth="1.75" />
        ))}
      </svg>
      <div className="flex justify-between text-[11px] text-gray-400 mt-1.5 font-mono">
        {points.map((p) => <span key={p.label}>{p.label}</span>)}
      </div>
    </div>
  );
}

// Colourful icon treatment for gamification badges, keyed by badge name —
// replaces the raw emoji the API returns with a consistent glyph + tint
// that matches the rest of the icon system, and still degrades gracefully
// (a generic star chip) for any badge name we don't recognise yet.
const BADGE_STYLE: Record<string, { icon: IconName; bg: string; fg: string }> = {
  'Early Bird': { icon: 'sunrise', bg: 'bg-orange-50', fg: 'text-orange-500' },
  'On The Clock': { icon: 'clock', bg: 'bg-blue-50', fg: 'text-blue-500' },
  'Heavy Lifter': { icon: 'dumbbell', bg: 'bg-violet-50', fg: 'text-violet-500' },
  Marathoner: { icon: 'runner', bg: 'bg-emerald-50', fg: 'text-emerald-500' },
  Perfectionist: { icon: 'diamond', bg: 'bg-cyan-50', fg: 'text-cyan-500' },
  'Sprint Champion': { icon: 'trophy', bg: 'bg-amber-50', fg: 'text-amber-500' },
};

export function BadgeIcon({ name, size = 'sm' }: { name: string; size?: 'sm' | 'md' }) {
  const style = BADGE_STYLE[name] || { icon: 'spark' as IconName, bg: 'bg-gray-100', fg: 'text-gray-500' };
  const dim = size === 'md' ? 'h-8 w-8 rounded-xl' : 'h-6 w-6 rounded-lg';
  return (
    <span title={name} className={`inline-grid place-items-center shrink-0 ${dim} ${style.bg} ${style.fg}`}>
      <Icon name={style.icon} size={size === 'md' ? 15 : 12} strokeWidth={1.9} />
    </span>
  );
}

// A slim, labelled capacity bar — used for leave balances ("N of M used")
// where ScoreBar's 0-100 framing doesn't quite fit. Colour ramps from calm
// (little used) to warm (almost exhausted) same as ScoreBar's scale.
export function CapacityBar({ label, used, total, icon }: { label: string; used: number; total: number; icon?: IconName }) {
  const pct = total > 0 ? Math.max(0, Math.min(100, (used / total) * 100)) : 0;
  const colour = pct >= 90 ? 'bg-red-500' : pct >= 65 ? 'bg-amber-500' : 'bg-emerald-500';
  return (
    <div className="rounded-xl border border-[var(--line-soft)] bg-[var(--hover)]/60 px-3.5 py-3">
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="flex items-center gap-1.5 text-[12.5px] font-medium text-gray-700">
          {icon && (
            <span className="grid place-items-center h-5 w-5 rounded-md bg-[var(--card)] text-[var(--accent)]">
              <Icon name={icon} size={11} />
            </span>
          )}
          {label}
        </span>
        <span className="text-[11px] font-mono text-gray-400 tabular-nums">
          {used}/{total}
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-gray-200 overflow-hidden">
        <div className={`h-full rounded-full origin-left animate-grow ${colour}`} style={{ width: `${total > 0 ? pct : 0}%` }} />
      </div>
    </div>
  );
}

export function Empty({ icon = 'board', children }: { icon?: IconName; children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-1.5 text-center py-4 text-gray-400">
      <Icon name={icon} size={18} className="opacity-50" />
      <p className="text-sm">{children}</p>
    </div>
  );
}

export function Skeleton({ className = 'h-4 w-full' }: { className?: string }) {
  return <div className={`skeleton ${className}`} />;
}

// Indices into the accent/status CSS variables so avatar tints repaint with
// the theme instead of being frozen at their light-mode hex values.
const AVATAR_TINTS = [
  ['var(--accent-soft)', 'var(--accent)'],
  ['var(--ok-soft)', 'var(--ok)'],
  ['var(--warn-soft)', 'var(--warn)'],
  ['var(--bad-soft)', 'var(--bad)'],
  ['var(--accent-soft)', 'var(--accent-ink)'],
  ['var(--ok-soft)', 'var(--ok)'],
];

export function Avatar({ name, size = 32 }: { name: string; size?: number }) {
  const initials = name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase();
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  const [bg, fg] = AVATAR_TINTS[hash % AVATAR_TINTS.length];
  return (
    <span
      className="inline-flex items-center justify-center rounded-full font-semibold shrink-0 select-none"
      style={{ width: size, height: size, fontSize: size * 0.38, background: bg, color: fg, border: '1px solid var(--line-soft)' }}
      title={name}
    >
      {initials}
    </span>
  );
}

export function Toast({ message, tone = 'info', onDone }: { message: string; tone?: 'info' | 'good' | 'bad'; onDone: () => void }) {
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(onDone, 3200);
    return () => clearTimeout(t);
  }, [message, onDone]);
  if (!message) return null;
  const icon: IconName = tone === 'good' ? 'check' : tone === 'bad' ? 'flag' : 'bolt';
  const accent = tone === 'good' ? 'border-emerald-500' : tone === 'bad' ? 'border-red-500' : 'border-brand-400';
  const iconTone = tone === 'good' ? 'text-emerald-500' : tone === 'bad' ? 'text-red-500' : 'text-brand-500';
  return (
    <div className={`fixed bottom-6 right-6 z-50 animate-slide-in card shadow-pop px-4 py-3 text-sm text-gray-800 border-l-[3px] flex items-center gap-2 ${accent}`} role="status">
      <Icon name={icon} size={14} className={iconTone} />
      {message}
    </div>
  );
}
