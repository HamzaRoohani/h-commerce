import { create } from 'zustand';
import type { User } from '@/types/user';

type AuthStatus = 'loading' | 'authenticated' | 'guest';

type AuthState = {
  accessToken: string | null;
  user: User | null;
  status: AuthStatus;
  setSession: (accessToken: string, user: User) => void;
  clearSession: () => void;
};

// Access token lives only in memory (never localStorage — an XSS bug would
// otherwise hand over the token immediately). A hard reload always starts
// with none; AuthBootstrap calls /auth/refresh on mount to repopulate it.
export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  user: null,
  status: 'loading',
  setSession: (accessToken, user) => set({ accessToken, user, status: 'authenticated' }),
  clearSession: () => set({ accessToken: null, user: null, status: 'guest' }),
}));
