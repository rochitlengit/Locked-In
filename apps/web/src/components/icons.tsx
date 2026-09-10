'use client';
import React from 'react';

/**
 * A small, purpose-built stroke icon set — 16 icons drawn once as inline SVG
 * paths, sharing one <Icon> wrapper. No icon library dependency; every glyph
 * here is used somewhere real in the product (nav, status, roles, skills).
 */
const PATHS: Record<string, React.ReactNode> = {
  dashboard: (
    <>
      <rect x="3" y="3" width="7" height="8" rx="1.6" />
      <rect x="14" y="3" width="7" height="5" rx="1.6" />
      <rect x="14" y="11" width="7" height="10" rx="1.6" />
      <rect x="3" y="14" width="7" height="7" rx="1.6" />
    </>
  ),
  board: (
    <>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M8.5 4v16M15.5 4v16" />
      <rect x="4.5" y="6.5" width="2.5" height="4" rx=".5" fill="currentColor" stroke="none" />
      <rect x="10" y="6.5" width="2.5" height="7" rx=".5" fill="currentColor" stroke="none" />
      <rect x="17" y="6.5" width="2.5" height="3" rx=".5" fill="currentColor" stroke="none" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3.2 2" />
    </>
  ),
  trend: (
    <>
      <path d="M3 17l5.5-6 4 3L21 5" />
      <path d="M15 5h6v6" />
    </>
  ),
  team: (
    <>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3 20c0-3.3 2.7-5.5 6-5.5s6 2.2 6 5.5" />
      <path d="M17 8.5a3 3 0 100-5M18 20c0-2.6-1-4.4-2.5-5.4" />
    </>
  ),
  leave: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M8 3v4M16 3v4M3 10h18" />
      <path d="M8.5 14.5l2 2 4-4.5" />
    </>
  ),
  grievance: (
    <>
      <path d="M21 15a3 3 0 01-3 3H8l-5 4V6a3 3 0 013-3h12a3 3 0 013 3z" />
      <path d="M12 8v3M12 14h.01" />
    </>
  ),
  org: (
    <>
      <rect x="9" y="2" width="6" height="5" rx="1.6" />
      <rect x="2" y="16" width="6" height="5" rx="1.6" />
      <rect x="16" y="16" width="6" height="5" rx="1.6" />
      <path d="M12 7v4M5 16v-2.5h14V16" />
    </>
  ),
  chat: (
    <>
      <path d="M21 12a8 8 0 01-11.6 7.1L3 21l1.9-6.4A8 8 0 1121 12z" />
    </>
  ),
  news: (
    <>
      <rect x="3" y="4" width="14" height="16" rx="2" />
      <path d="M17 8h3a1 1 0 011 1v9a2 2 0 01-2 2M7 8h6M7 12h6M7 16h4" />
    </>
  ),
  admin: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.6 1.6 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.6 1.6 0 00-2.7 1.1V21a2 2 0 11-4 0v-.1A1.6 1.6 0 007.5 19.4l-.1.1a2 2 0 11-2.8-2.8l.1-.1A1.6 1.6 0 003 15H3a2 2 0 110-4h.1a1.6 1.6 0 001.1-2.7l-.1-.1a2 2 0 112.8-2.8l.1.1A1.6 1.6 0 009 4.6V4a2 2 0 114 0v.1a1.6 1.6 0 002.7 1.1l.1-.1a2 2 0 112.8 2.8l-.1.1A1.6 1.6 0 0021 11h.1a2 2 0 010 4H21z" />
    </>
  ),
  flag: (
    <>
      <path d="M5 21V4" />
      <path d="M5 4h13l-2.5 3.5L18 11H5" />
    </>
  ),
  bolt: (
    <>
      <path d="M13 2 4 14h6l-1 8 9-12h-6l1-8z" />
    </>
  ),
  calendar: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M8 3v4M16 3v4M3 10h18" />
    </>
  ),
  check: <path d="M20 6L9 17l-5-5" />,
  chevronDown: <path d="M6 9l6 6 6-6" />,
  medal: (
    <>
      <circle cx="12" cy="14.5" r="6.2" />
      <path d="M9 3l1.4 5.6M15 3l-1.4 5.6" />
      <path d="M10.3 12.3l1.2 3.6 1.2-3.6" />
    </>
  ),
  spark: (
    <>
      <path d="M12 3l1.6 4.6L18 9l-4.4 1.4L12 15l-1.6-4.6L6 9l4.4-1.4z" />
      <path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z" />
    </>
  ),
  trophy: (
    <>
      <path d="M8 3h8v4a4 4 0 01-8 0V3z" />
      <path d="M8 4.5H5.5a3 3 0 003 3M16 4.5h2.5a3 3 0 01-3 3" />
      <path d="M12 11v3.5" />
      <path d="M9.5 20.5h5l-.5-3h-4z" />
    </>
  ),
  diamond: (
    <>
      <path d="M6 9L12 3l6 6-6 12z" />
      <path d="M6 9h12M9.5 9L12 3l2.5 6M9.5 9L12 21M14.5 9L12 21" />
    </>
  ),
  dumbbell: (
    <>
      <rect x="1.5" y="10" width="3" height="4" rx="1" fill="currentColor" stroke="none" />
      <rect x="19.5" y="10" width="3" height="4" rx="1" fill="currentColor" stroke="none" />
      <rect x="5" y="8.5" width="2.4" height="7" rx="1.1" />
      <rect x="16.6" y="8.5" width="2.4" height="7" rx="1.1" />
      <path d="M7.4 12h9.2" />
    </>
  ),
  runner: (
    <>
      <circle cx="13.2" cy="4.6" r="1.7" fill="currentColor" stroke="none" />
      <path d="M8 21l1.8-5.8 3-1.6M8 21l2.8-2.8 1.4-4M12.8 9.4l2 2.2 3-1.1M9.8 13l3 1.4 2 4.6" />
    </>
  ),
  sunrise: (
    <>
      <circle cx="12" cy="17" r="4" />
      <path d="M12 3v3M4.2 9.2l2 2M19.8 9.2l-2 2M2 17h2M20 17h2M5 21h14" />
    </>
  ),
  hash: (
    <path d="M9 3L7 21M17 3l-2 18M4 8h16M3 16h16" />
  ),
  send: (
    <path d="M22 2L11 13M22 2l-7 20-4-9-9-4z" />
  ),
  pin: (
    <>
      <path d="M12 21s7-7.2 7-12a7 7 0 10-14 0c0 4.8 7 12 7 12z" />
      <circle cx="12" cy="9" r="2.3" />
    </>
  ),
};

export type IconName = keyof typeof PATHS;

export function Icon({
  name,
  size = 15,
  strokeWidth = 1.7,
  className = '',
}: {
  name: IconName;
  size?: number;
  strokeWidth?: number;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`shrink-0 ${className}`}
      aria-hidden="true"
    >
      {PATHS[name]}
    </svg>
  );
}

/** Per-skill glyph so tags on a task card read at a glance rather than as plain text chips. */
const SKILL_ICON: Record<string, IconName> = {
  Backend: 'bolt',
  Frontend: 'board',
  Mobile: 'flag',
  Design: 'spark',
  DevOps: 'trend',
  QA: 'check',
  Security: 'admin',
  Data: 'dashboard',
  Docs: 'news',
};

export function skillIcon(name: string): IconName {
  return SKILL_ICON[name] || 'spark';
}
