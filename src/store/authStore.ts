import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface AuthUser {
  id: string;
  email: string;
  full_name: string;
  role: 'student' | 'moderator' | 'admin';
  department_id: string | null;
  year: string | null;
  college_form_completed: boolean;
  roll_number: string | null;
  status: string;
  avatar_url: string | null;
  created_at: string;
  last_active_at: string | null;
  department?: { id: string; name: string; short_name: string } | null;
}

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  isAuthenticated: boolean;
  hydrated: boolean;         // true after persist rehydration completes
  setAuth: (token: string, user: AuthUser) => void;
  setUser: (user: AuthUser) => void;
  logout: () => void;
  setHydrated: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      isAuthenticated: false,
      hydrated: false,
      setAuth: (token, user) => set({ token, user, isAuthenticated: true }),
      setUser: (user) => set({ user, isAuthenticated: true }),
      logout: () => set({ token: null, user: null, isAuthenticated: false }),
      setHydrated: () => set({ hydrated: true }),
    }),
    {
      name: 'eduvault-auth',
      partialize: (state) => ({ token: state.token }),
      onRehydrateStorage: () => (state) => {
        // Called after localStorage is loaded — mark store as hydrated
        state?.setHydrated();
      },
    }
  )
);
