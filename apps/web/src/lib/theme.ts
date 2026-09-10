'use client';
import { useEffect, useState } from 'react';

export type Theme = 'light' | 'dark';
const KEY = 'lockedin-theme';
const EVENT = 'lockedin-theme-change';

export function getTheme(): Theme {
  if (typeof document === 'undefined') return 'light';
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
}

export function setTheme(theme: Theme) {
  document.documentElement.classList.toggle('dark', theme === 'dark');
  try {
    window.localStorage.setItem(KEY, theme);
  } catch {
    /* private browsing / storage blocked — theme just won't persist */
  }
  window.dispatchEvent(new CustomEvent(EVENT, { detail: theme }));
}

/** Reactive theme value + toggle. Safe to use in any client component. */
export function useTheme(): [Theme, () => void] {
  const [theme, setThemeState] = useState<Theme>(getTheme);

  useEffect(() => {
    setThemeState(getTheme());
    const onChange = (e: Event) => setThemeState((e as CustomEvent).detail || getTheme());
    window.addEventListener(EVENT, onChange);
    return () => window.removeEventListener(EVENT, onChange);
  }, []);

  const toggle = () => setTheme(getTheme() === 'dark' ? 'light' : 'dark');
  return [theme, toggle];
}
