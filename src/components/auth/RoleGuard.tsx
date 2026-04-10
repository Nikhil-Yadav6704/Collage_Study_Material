import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: ('student' | 'moderator' | 'admin')[];
  redirectTo?: string;
}

export function RoleGuard({ children, allowedRoles, redirectTo = '/study' }: RoleGuardProps) {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    if (!user) return; // Still loading — AuthGuard is fetching
    if (!allowedRoles.includes(user.role)) {
      // Wrong role — redirect to correct portal
      if (user.role === 'admin') navigate('/admin', { replace: true });
      else if (user.role === 'moderator') navigate('/moderator', { replace: true });
      else navigate(redirectTo, { replace: true });
    }
  }, [user, allowedRoles, navigate, redirectTo]);

  // Still loading user — show a minimal spinner
  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-border border-t-primary animate-spin" />
      </div>
    );
  }

  // Wrong role — return null while redirect happens
  if (!allowedRoles.includes(user.role)) return null;

  return <>{children}</>;
}
