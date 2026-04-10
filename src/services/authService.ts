import axios from 'axios';
import api from '../lib/api';
import { supabase } from '../lib/supabase';
import { AuthUser } from '../store/authStore';

export const authService = {
  // Triggers Google OAuth
  async signInWithGoogle(): Promise<void> {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: { access_type: 'offline', prompt: 'consent' },
      },
    });
    if (error) throw error;
  },

  // Called at /auth/callback after Google redirect
  async handleGoogleCallback(): Promise<{ token: string; user: AuthUser; needsCollegeForm: boolean }> {
    // Get the session Supabase just created
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error || !session) throw new Error('No session found after Google auth');

    // Call backend /me using the Supabase access_token directly
    const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${session.access_token}` },
      timeout: 15000,
    });

    const user: AuthUser = response.data.user;

    return {
      token: session.access_token,
      user,
      needsCollegeForm: !user.college_form_completed,
    };
  },

  // Roll number + password login
  async signInWithRollNumber(
    roll_number: string,
    password: string
  ): Promise<{ token: string; user: AuthUser }> {
    const { data } = await api.post('/api/auth/signin-roll-number', { roll_number, password });
    return data;
  },

  // Admin-only login
  async adminSignIn(
    roll_number: string,
    password: string
  ): Promise<{ token: string; user: AuthUser }> {
    const { data } = await api.post('/api/auth/admin-signin', { roll_number, password });
    return data;
  },

  // Complete college form
  async completeSignup(formData: {
    full_name: string;
    department_id: string;      // MUST be a UUID
    admission_year: string;     // Calendar year (e.g., '2024')
    roll_number: string;
    password: string;
  }): Promise<void> {
    await api.post('/api/auth/complete-signup', formData);
  },

  // Get current user
  async getMe(): Promise<AuthUser> {
    const { data } = await api.get('/api/auth/me');
    return data.user;
  },

  // Get roll number format hint
  async getRollNumberFormat(
    department_id: string,
    admission_year: string
  ): Promise<{ regex_pattern: string; example: string } | null> {
    const { data } = await api.get('/api/auth/roll-number-format', {
      params: { department_id, year: admission_year } // backend handles computing academic year
    });
    return data.format;
  },

  // Change password
  async changePassword(current_password: string, new_password: string): Promise<void> {
    await api.patch('/api/auth/change-password', { current_password, new_password });
  },

  // Fetch all departments
  async getDepartments(): Promise<{ id: string; name: string; short_name: string }[]> {
    const { data } = await api.get('/api/departments');
    return data.departments;
  },
};
