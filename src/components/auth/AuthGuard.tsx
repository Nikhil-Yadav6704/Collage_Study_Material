import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useAuth } from '../../hooks/useAuth';
import { BookOpen } from 'lucide-react';

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const navigate = useNavigate();
  const { token, hydrated, user } = useAuthStore();
  const { initializeAuth } = useAuth();

  useEffect(() => {
    if (!hydrated) return;

    if (token && !user) {
      initializeAuth();
    } else if (!token) {
      navigate('/signin', { replace: true });
    }
  }, [hydrated, token, user, navigate, initializeAuth]);

  // Show branded loading skeleton instead of white flash
  if (!hydrated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center gap-2 animate-pulse">
            <BookOpen size={22} className="text-primary" />
            <span className="font-display font-bold text-xl">
              <span className="text-foreground">Edu</span>
              <span className="text-primary">Vault</span>
            </span>
          </div>
          <div className="w-8 h-8 rounded-full border-2 border-border border-t-primary animate-spin" />
        </div>
      </div>
    );
  }

  if (token) return <>{children}</>;
  return null;
}
