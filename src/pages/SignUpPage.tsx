import { useState } from "react";
import { BookOpen } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

const SignUpPage = () => {
  const { loginWithGoogle } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleSignUp = async () => {
    setLoading(true);
    setError(null);
    try {
      await loginWithGoogle();
      // Supabase redirects to /auth/callback
      // The callback handler checks college_form_completed
    } catch (err: any) {
      setError(err.message || 'Google sign up failed. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center relative overflow-hidden">
      <div className="orb orb-1 opacity-10" />
      <div className="orb orb-2 opacity-10" />
      <div className="absolute inset-0 dot-grid opacity-30" />

      <div className="glass-strong rounded-3xl p-8 md:p-10 w-full max-w-md mx-4 relative z-10">
        <div className="flex items-center gap-2 justify-center mb-8">
          <BookOpen size={20} className="text-primary" />
          <span className="font-display font-bold text-xl">
            <span className="text-foreground">Edu</span>
            <span className="gradient-text">Vault</span>
          </span>
        </div>

        <h2 className="font-display font-bold text-2xl text-foreground text-center">
          Create your account
        </h2>
        <p className="font-body text-sm text-muted-foreground text-center mt-1 mb-8">
          Sign up with your Google account to get started.
        </p>

        <button
          onClick={handleGoogleSignUp}
          disabled={loading}
          className="w-full h-11 rounded-xl bg-surface-1 hover:bg-surface-2 border border-border hover:border-border/80 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <div className="w-5 h-5 rounded-full border-2 border-border border-t-primary animate-spin" />
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
          )}
          <span className="font-body font-medium text-sm text-foreground">
            {loading ? 'Redirecting to Google...' : 'Sign Up with Google'}
          </span>
        </button>

        <p className="text-xs text-muted-foreground/60 text-center mt-4">
          After Google verification, you'll fill your college details.
        </p>

        {error && (
          <p className="text-xs text-danger font-body text-center mt-3">{error}</p>
        )}

        <p className="text-xs text-muted-foreground text-center mt-6">
          Already have an account?{" "}
          <Link to="/signin" className="text-primary hover:underline">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
};

export default SignUpPage;
