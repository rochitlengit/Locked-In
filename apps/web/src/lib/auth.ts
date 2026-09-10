import { create } from 'zustand';

export type Role = 'SUPER_ADMIN' | 'HR' | 'TEAM_LEAD' | 'EMPLOYEE';

export interface CurrentUser {
  id: string;
  email: string;
  fullName: string;
  role: Role;
  orgId: string;
  teamId?: string | null;
  title?: string | null;
}

interface AuthState {
  token: string | null;
  user: CurrentUser | null;
  setSession: (token: string, user: CurrentUser) => void;
  logout: () => void;
  hydrate: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,
  setSession: (token, user) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('lockedin_token', token);
      localStorage.setItem('lockedin_user', JSON.stringify(user));
    }
    set({ token, user });
  },
  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('lockedin_token');
      localStorage.removeItem('lockedin_user');
    }
    set({ token: null, user: null });
  },
  hydrate: () => {
    if (typeof window === 'undefined') return;
    const token = localStorage.getItem('lockedin_token');
    const userRaw = localStorage.getItem('lockedin_user');
    if (token && userRaw) {
      try {
        set({ token, user: JSON.parse(userRaw) });
      } catch {}
    }
  },
}));
