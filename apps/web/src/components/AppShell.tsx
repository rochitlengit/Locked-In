'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/auth';
import { Avatar } from './ui';
import { Icon, IconName } from './icons';
import ThemeToggle from './ThemeToggle';
import { LogoMark } from './Logo';

type Role = 'SUPER_ADMIN' | 'HR' | 'TEAM_LEAD' | 'EMPLOYEE';
const ALL: Role[] = ['SUPER_ADMIN', 'HR', 'TEAM_LEAD', 'EMPLOYEE'];

const NAV: { href: string; label: string; icon: IconName; roles: Role[]; group: string }[] = [
  { href: '/dashboard', label: 'Dashboard', icon: 'dashboard', roles: ALL, group: 'Work' },
  { href: '/tasks', label: 'Tasks', icon: 'board', roles: ALL, group: 'Work' },
  { href: '/time', label: 'Time Tracker', icon: 'clock', roles: ALL, group: 'Work' },

  { href: '/performance', label: 'My Performance', icon: 'trend', roles: ALL, group: 'Performance' },
  {
    href: '/team',
    label: 'Team Performance',
    icon: 'team',
    roles: ['SUPER_ADMIN', 'HR', 'TEAM_LEAD'],
    group: 'Performance',
  },

  { href: '/leave', label: 'Leave & Permissions', icon: 'leave', roles: ALL, group: 'People' },
  { href: '/grievance', label: 'Grievances', icon: 'grievance', roles: ALL, group: 'People' },
  { href: '/org-chart', label: 'Org Chart', icon: 'org', roles: ALL, group: 'People' },

  { href: '/chat', label: 'Chat', icon: 'chat', roles: ALL, group: 'Company' },
  { href: '/announcements', label: 'Newsletter', icon: 'news', roles: ALL, group: 'Company' },
  { href: '/admin', label: 'Admin Console', icon: 'admin', roles: ['SUPER_ADMIN', 'HR'], group: 'Company' },
];

const GROUP_ORDER = ['Work', 'Performance', 'People', 'Company'];

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: 'Administrator',
  HR: 'People team',
  TEAM_LEAD: 'Team lead',
  EMPLOYEE: 'Member',
};

export default function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, token, hydrate, logout } = useAuthStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const [showTop, setShowTop] = useState(false);
  const mainRef = useRef<HTMLElement>(null);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!useAuthStore.getState().token) router.replace('/login');
    }, 100);
    return () => clearTimeout(timer);
  }, [token, router]);

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3">
        <div className="h-7 w-7 rounded-lg bg-brand-500/80 animate-pop" />
        <p className="text-gray-500 text-sm">Loading your workspace…</p>
      </div>
    );
  }

  const visible = NAV.filter((item) => item.roles.includes(user.role as Role));
  const current = visible.find((i) => i.href === pathname);

  return (
    <div className="min-h-screen flex">
      <aside className="w-[236px] shrink-0 flex flex-col border-r border-gray-100 bg-[var(--surface)]/90 backdrop-blur">
        <div className="px-4 pt-4 pb-3">
          <div className="flex items-center gap-2.5">
            <span className="h-9 w-9 rounded-xl bg-black grid place-items-center shadow-glow">
              <LogoMark size={23} color="#fff" />
            </span>
            <div className="leading-tight">
              <div className="text-[15px] font-semibold tracking-tight text-gray-900">LockedIn</div>
              <div className="text-[10px] text-gray-400 tracking-wide">TEAM PERFORMANCE OS</div>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-4 py-2 overflow-y-auto">
          {GROUP_ORDER.map((group) => {
            const items = visible.filter((i) => i.group === group);
            if (items.length === 0) return null;
            return (
              <div key={group} className="mb-5">
                <div className="px-2.5 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-gray-400">
                  {group}
                </div>
                <div className="space-y-0.5">
                  {items.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`nav-link ${pathname === item.href ? 'active' : ''}`}
                    >
                      <Icon name={item.icon} />
                      {item.label}
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </nav>

        <div className="p-3 border-t border-gray-100 relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="w-full flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-gray-100 transition-colors text-left"
          >
            <Avatar name={user.fullName} size={30} />
            <div className="min-w-0 flex-1">
              <div className="text-[13px] text-gray-800 truncate font-medium">{user.fullName}</div>
              <div className="text-[11px] text-gray-400">{ROLE_LABELS[user.role] || user.role}</div>
            </div>
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400">
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>

          {menuOpen && (
            <div className="absolute bottom-16 left-3 right-3 card shadow-pop p-1 animate-pop">
              <button onClick={logout} className="btn-ghost w-full justify-start text-[13px]">
                Sign out
              </button>
            </div>
          )}
        </div>
      </aside>

      <div className="flex-1 flex flex-col max-h-screen overflow-hidden">
        <header className="h-12 shrink-0 flex items-center gap-2 px-8 border-b border-gray-100 bg-[var(--surface)]/60 backdrop-blur">
          <span className="text-[12px] text-gray-400">{current?.group || 'Workspace'}</span>
          <span className="text-gray-300">/</span>
          <span className="text-[12px] text-gray-700 font-medium">{current?.label || 'LockedIn'}</span>
          <span className="ml-auto" />
          <ThemeToggle />
        </header>
        <main
          ref={mainRef}
          className="app-content relative flex-1 overflow-y-auto px-8 py-7"
          onScroll={(e) => setShowTop(e.currentTarget.scrollTop > 400)}
        >
          {children}
          {showTop && (
            <button
              onClick={() => mainRef.current?.scrollTo({ top: 0, behavior: 'smooth' })}
              aria-label="Scroll to top"
              className="fixed bottom-8 right-8 z-20 h-10 w-10 rounded-full grid place-items-center shadow-[var(--shadow-pop)] bg-[var(--card)] border border-[var(--line)] text-[var(--text-dim)] hover:text-[var(--accent)] hover:border-[var(--accent-line)] transition-all animate-pop"
            >
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 19V5M5 12l7-7 7 7" />
              </svg>
            </button>
          )}
        </main>
      </div>
    </div>
  );
}
