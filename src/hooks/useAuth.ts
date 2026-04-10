import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { authService } from '../services/authService';
import { supabase } from '../lib/supabase';
import { queryClient } from '../lib/queryClient';
import api from '../lib/api';

export function useAuth() {
  const { token, user, isAuthenticated, setAuth, setUser, logout } = useAuthStore();
  const navigate = useNavigate();

  // Called on app boot when token exists in storage but user is not loaded yet
  const initializeAuth = useCallback(async () => {
    if (!token) return;
    try {
      const freshUser = await authService.getMe();
      setUser(freshUser);
      // If they refreshed on a page but haven't completed the form, send them there
      if (!freshUser.college_form_completed && freshUser.role !== 'admin') {
        navigate('/signup/complete', { replace: true });
      }
    } catch {
      logout();
    }
  }, [token, setUser, logout, navigate]);

  const loginWithRollNumber = useCallback(async (roll_number: string, password: string) => {
    const { token, user } = await authService.signInWithRollNumber(roll_number, password);
    setAuth(token, user);
    // Check if they still need the college form
    if (!user.college_form_completed && user.role !== 'admin') {
      navigate('/signup/complete', { replace: true });
    } else {
      redirectByRole(user.role, navigate);
    }
  }, [setAuth, navigate]);

  const adminLogin = useCallback(async (roll_number: string, password: string) => {
    const { token, user } = await authService.adminSignIn(roll_number, password);
    setAuth(token, user);
    navigate('/admin');
  }, [setAuth, navigate]);

  const loginWithGoogle = useCallback(async () => {
    await authService.signInWithGoogle();
  }, []);

  const handleCallback = useCallback(async () => {
    const { token, user, needsCollegeForm } = await authService.handleGoogleCallback();
    setAuth(token, user);
    if (needsCollegeForm) {
      navigate('/signup/complete', { replace: true });
    } else {
      redirectByRole(user.role, navigate);
    }
  }, [setAuth, navigate]);

  const signOut = useCallback(async () => {
    // 1. Tell backend to clear last_active_at FIRST (before token is gone)
    try {
      await api.post('/api/auth/logout');
    } catch {
      // Swallow — don't block logout if this fails
    }

    // 2. Clear Supabase session (for Google OAuth users)
    await supabase.auth.signOut();

    // 3. Clear frontend store + cache
    logout();
    queryClient.clear();

    // 4. Navigate to signin
    navigate('/signin');
  }, [logout, navigate]);

  return {
    user,
    token,
    isAuthenticated,
    initializeAuth,
    loginWithRollNumber,
    loginWithGoogle,
    adminLogin,
    handleCallback,
    signOut,
  };
}

function redirectByRole(role: string, navigate: ReturnType<typeof useNavigate>) {
  if (role === 'admin') navigate('/admin', { replace: true });
  else if (role === 'moderator') navigate('/moderator', { replace: true });
  else navigate('/study', { replace: true });
}
