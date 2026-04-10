import { useEffect, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';

export default function AuthCallbackPage() {
  const { handleCallback } = useAuth();
  const called = useRef(false); // Prevent double-call in React StrictMode

  useEffect(() => {
    if (called.current) return;
    called.current = true;

    handleCallback().catch((err) => {
      console.error('Auth callback failed:', err);
      window.location.href = '/signin?error=auth_failed';
    });
  }, []); // Empty deps — run once on mount only

  return (
    <div className="min-h-screen bg-background flex items-center justify-center relative overflow-hidden">
      <div className="orb orb-1 opacity-10" />
      <div className="orb orb-2 opacity-10" />
      <div className="absolute inset-0 dot-grid opacity-30" />
      <div className="flex flex-col items-center gap-4 relative z-10">
        <div className="w-10 h-10 rounded-full border-2 border-border border-t-primary animate-spin" />
        <p className="text-sm font-body text-muted-foreground">Signing you in...</p>
      </div>
    </div>
  );
}
