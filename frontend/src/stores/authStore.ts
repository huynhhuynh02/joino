import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
  avatar: string | null;
  dailySummary?: boolean;
  mentionsNotifications?: boolean;
  assignmentsNotifications?: boolean;
}

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  setAuth: (user: AuthUser, token: string) => void;
  setUser: (user: AuthUser) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      setAuth: (user, token) => {
        if (typeof window !== 'undefined') {
          localStorage.setItem('joino_token', token);
        }
        set({ user, token, isAuthenticated: true });
      },

      setUser: (user) => set({ user }),

      logout: () => {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('joino_token');
          localStorage.removeItem('joino_user');
          document.cookie = 'joino_token=; path=/; domain=' + window.location.hostname + '; expires=Thu, 01 Jan 1970 00:00:00 GMT; max-age=0';
          document.cookie = 'joino_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; max-age=0';
        }
        set({ user: null, token: null, isAuthenticated: false });
      },
    }),
    {
      name: 'joino_auth',
      partialize: (state) => ({ user: state.user, token: state.token, isAuthenticated: state.isAuthenticated }),
    }
  )
);
