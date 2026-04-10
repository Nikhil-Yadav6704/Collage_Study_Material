import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

export function CollegeFormGuard({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    if (user && !user.college_form_completed) {
      // Admins and existing moderators usually have this completed or bypass it
      // But for students/new-moderators, we force the form completion
      if (user.role !== 'admin') {
        navigate('/signup/complete', { replace: true });
      }
    }
  }, [user, navigate]);

  if (user && !user.college_form_completed && user.role !== 'admin') return null;
  return <>{children}</>;
}
