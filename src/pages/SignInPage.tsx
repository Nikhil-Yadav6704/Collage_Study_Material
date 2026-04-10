import { useState } from "react";
import { Eye, EyeOff, BookOpen, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

const SignInPage = () => {
  const { loginWithGoogle, loginWithRollNumber } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [rollNumber, setRollNumber] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      await loginWithGoogle();
    } catch (err: any) {
      setError(err.message || 'Google sign in failed');
      setLoading(false);
    }
  };

  const handleRollNumberSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await loginWithRollNumber(rollNumber, password);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Invalid credentials');
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
          Welcome back
        </h2>
        <p className="font-body text-sm text-muted-foreground text-center mt-1 mb-8">
          Sign in to access your study materials
        </p>

        <button 
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full h-11 rounded-xl bg-surface-1 hover:bg-surface-2 border border-border hover:border-border/80 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
        >
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
          </svg>
          <span className="font-body font-medium text-sm text-foreground">
            Continue with Google
          </span>
        </button>

        <div className="flex items-center gap-3 my-6">
          <hr className="border-border/50 flex-1" />
          <span className="text-xs text-muted-foreground">or</span>
          <hr className="border-border/50 flex-1" />
        </div>

        <form onSubmit={handleRollNumberSignIn} className="space-y-4">
          <div>
            <label className="text-xs font-body font-medium text-muted-foreground mb-1.5 block">
              Roll Number
            </label>
            <input
              required
              value={rollNumber}
              onChange={(e) => setRollNumber(e.target.value.toUpperCase())}
              className="bg-input border border-border rounded-xl px-4 py-2.5 text-sm font-body text-foreground placeholder:text-muted-foreground/50 w-full focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary/50 transition-all"
              placeholder="e.g. 22CSE034"
            />
          </div>
          <div>
            <label className="text-xs font-body font-medium text-muted-foreground mb-1.5 block">
              Password
            </label>
            <div className="relative">
              <input
                required
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-input border border-border rounded-xl px-4 py-2.5 text-sm font-body text-foreground placeholder:text-muted-foreground/50 w-full focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary/50 transition-all pr-10"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <div className="text-right mt-1">
              <a href="#" className="text-xs text-primary hover:underline">
                Forgot password?
              </a>
            </div>
          </div>

          {error && <p className="text-xs text-danger font-body text-center mt-2">{error}</p>}

          <Button variant="primary" className="w-full mt-6" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>

        <p className="text-xs text-muted-foreground text-center mt-6">
          Don't have an account?{" "}
          <Link to="/signup" className="text-primary hover:underline">
            Sign Up
          </Link>
        </p>

        <div className="h-px bg-border/30 w-full mt-5 mb-4" />

        <div className="flex items-center justify-center gap-2">
          <Lock size={13} className="text-muted-foreground/40" />
          <span className="text-xs font-body text-muted-foreground/50">Admin?</span>
          <Link 
            to="/admin/login" 
            className="text-xs font-body text-muted-foreground/50 hover:text-primary/70 transition-colors cursor-pointer"
          >
            Access Admin Portal →
          </Link>
        </div>
      </div>
    </div>
  );
};

export default SignInPage;
