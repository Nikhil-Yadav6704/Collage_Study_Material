import { useState } from "react";
import { Eye, EyeOff, BookOpen, ShieldAlert, AlertTriangle, User, Lock, ArrowLeft, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

const AdminLoginPage = () => {
  const { adminLogin } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [rollNumber, setRollNumber] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await adminLogin(rollNumber, password);
      // useAuth handles redirect to /admin
    } catch (err: any) {
      setError(err.response?.data?.error || "Invalid credentials or not an admin.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center relative overflow-hidden">
      {/* Background elements */}
      <div className="dot-grid absolute inset-0 opacity-30" />
      
      {/* Red-tinted orbs for admin feel */}
      <div className="w-[500px] h-[500px] bg-danger/20 blur-[120px] absolute top-[-150px] left-[-150px] opacity-15" />
      <div className="w-[300px] h-[300px] bg-primary/15 blur-[80px] absolute bottom-[-80px] right-[-80px] opacity-10" />

      <div className="w-full max-w-md mx-4 relative z-10 animate-fade-up">
        <div className="bg-card rounded-[1.5rem] border border-danger/20 shadow-[0_0_60px_rgba(239,68,68,0.08),0_20px_60px_rgba(0,0,0,0.5)] p-8 md:p-10 relative overflow-hidden">
          
          <div className="text-center mb-8">
            <div className="flex items-center gap-2 justify-center mb-3">
              <BookOpen size={20} className="text-primary" />
              <span className="font-display font-bold text-xl">
                <span className="text-foreground">Edu</span>
                <span className="gradient-text">Vault</span>
              </span>
            </div>

            <div className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 bg-danger/10 border border-danger/25 text-danger text-[11px] font-body font-semibold uppercase tracking-widest mb-6">
              <ShieldAlert size={12} />
              <span>RESTRICTED — ADMIN ACCESS ONLY</span>
            </div>

            <h2 className="font-display font-bold text-xl text-foreground">Admin Sign In</h2>
            <p className="font-body text-xs text-muted-foreground mt-1">
              This portal is for authorized administrators only.
            </p>
          </div>

          <div className="flex items-start gap-3 bg-warning/5 border border-warning/15 rounded-xl px-4 py-3 mb-6">
            <AlertTriangle size={15} className="text-warning mt-0.5 flex-shrink-0" />
            <p className="text-[11px] font-body text-muted-foreground leading-normal">
              Unauthorized access attempts are logged. If you're a student,{" "}
              <Link to="/signin" className="text-primary hover:underline font-medium">sign in here</Link>
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-body font-medium text-muted-foreground mb-1.5 block">
                Roll Number
              </label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground">
                  <User size={15} />
                </div>
                <input
                  type="text"
                  required
                  value={rollNumber}
                  onChange={(e) => setRollNumber(e.target.value.toUpperCase())}
                  placeholder="Your admin roll number"
                  className="bg-input border border-border rounded-xl px-4 py-2.5 pl-10 text-sm font-body text-foreground w-full focus:outline-none focus:ring-1 focus:ring-danger/40 focus:border-danger/40 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-body font-medium text-muted-foreground mb-1.5 block">
                Password
              </label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground">
                  <Lock size={15} />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="bg-input border border-border rounded-xl px-4 py-2.5 pl-10 text-sm font-body text-foreground w-full focus:outline-none focus:ring-1 focus:ring-danger/40 focus:border-danger/40 transition-all pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-xs text-danger font-body text-center bg-danger/5 border border-danger/20 rounded-xl px-4 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-6 w-full h-11 rounded-xl bg-[#3E45E8] border border-danger/30 text-white font-display font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Signing in...
                </>
              ) : "Sign In to Admin Portal"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link to="/signin" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground/50 hover:text-muted-foreground transition-colors">
              <ArrowLeft size={12} />
              <span>Back to Student Login</span>
            </Link>
          </div>

          <div className="mt-8 pt-4 border-t border-border/30 flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground/40 font-body">
            <Lock size={11} />
            <span>All admin actions are logged and monitored.</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLoginPage;
