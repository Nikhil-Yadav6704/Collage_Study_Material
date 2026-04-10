import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, BookOpen, Info, Check, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { authService } from '../services/authService';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../lib/supabase';

interface Department {
  id: string;
  name: string;
  short_name: string;
}

const currentYear = new Date().getFullYear();
const ADMISSION_YEAR_OPTIONS = [
  { label: `${currentYear} (Current Batch)`, value: String(currentYear) },
  { label: `${currentYear - 1}`, value: String(currentYear - 1) },
  { label: `${currentYear - 2}`, value: String(currentYear - 2) },
  { label: `${currentYear - 3}`, value: String(currentYear - 3) },
];

export default function CompleteSignupPage() {
  const navigate = useNavigate();
  const { setUser, user, logout } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Departments loaded from API
  const [departments, setDepartments] = useState<Department[]>([]);
  const [deptLoading, setDeptLoading] = useState(true);

  // Form state
  const [name, setName] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [admissionYear, setAdmissionYear] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [rollValid, setRollValid] = useState<boolean | null>(null);

  // Password strength
  const passwordConstraints = [
    { id: 'length', label: '8+ characters', validator: (p: string) => p.length >= 8 },
    { id: 'uppercase', label: 'Uppercase letter', validator: (p: string) => /[A-Z]/.test(p) },
    { id: 'lowercase', label: 'Lowercase letter', validator: (p: string) => /[a-z]/.test(p) },
    { id: 'number', label: 'Number', validator: (p: string) => /[0-9]/.test(p) },
    { id: 'special', label: 'Special character', validator: (p: string) => /[^A-Za-z0-9]/.test(p) },
  ];

  const completedRules = passwordConstraints.filter(c => c.validator(password)).length;
  const strength = password.length === 0 ? 0 : 
                   completedRules <= 2 ? 1 : 
                   completedRules <= 3 ? 2 : 
                   completedRules === 4 ? 3 : 4;
  
  const strengthLabels = ["", "Weak", "Fair", "Good", "Strong"];
  const strengthColors = ["", "bg-danger", "bg-warning", "bg-info", "bg-success"];

  // Load departments from API on mount
  useEffect(() => {
    authService.getDepartments()
      .then(setDepartments)
      .catch(() => setError('Could not load departments. Please refresh.'))
      .finally(() => setDeptLoading(false));
  }, []);

  // Pre-fill name from Google if available
  useEffect(() => {
    if (user?.full_name && !name) {
      setName(user.full_name);
    }
  }, [user, name]);

  // Live roll number validation (Starts with YY001 and exactly 12 digits)
  useEffect(() => {
    if (admissionYear && rollNumber) {
      const yy = admissionYear.slice(-2);
      const prefix = `${yy}001`;
      // Exactly 12 digits starting with prefix
      const regex = new RegExp(`^${prefix}\\d{7}$`);
      setRollValid(regex.test(rollNumber));
    } else {
      setRollValid(null);
    }
  }, [rollNumber, admissionYear]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!departmentId) { setError('Please select your department.'); return; }
    if (!admissionYear) { setError('Please select your admission year.'); return; }
    if (rollValid === false) {
      const yy = admissionYear.slice(-2);
      setError(`Invalid roll number. Must be exactly 12 numbers starting with ${yy}001`);
      return;
    }
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    if (password !== confirmPassword) { setError('Passwords do not match.'); return; }

    setLoading(true);
    setError(null);

    try {
      await authService.completeSignup({
        full_name: name.trim(),
        department_id: departmentId,
        admission_year: admissionYear,
        roll_number: rollNumber.trim().toUpperCase(),
        password,
      });

      // Refresh user from backend
      const freshUser = await authService.getMe();
      setUser(freshUser);

      // Redirect based on role
      if (freshUser.role === 'admin') navigate('/admin', { replace: true });
      else if (freshUser.role === 'moderator') navigate('/moderator', { replace: true });
      else navigate('/study', { replace: true });

    } catch (err: any) {
      const msg = err.response?.data?.error;
      if (typeof msg === 'string') {
        setError(msg);
      } else if (msg?.fieldErrors) {
        const firstError = Object.values(msg.fieldErrors)[0] as string[];
        setError(firstError?.[0] || 'Validation failed.');
      } else {
        setError('Registration failed. Please try again.');
      }
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center relative overflow-hidden">
      <div className="orb orb-1 opacity-10" />
      <div className="orb orb-2 opacity-10" />
      <div className="absolute inset-0 dot-grid opacity-30" />

      <div className="glass-strong rounded-3xl p-8 md:p-10 w-full max-w-md mx-4 relative z-10">
        <div className="flex items-center gap-2 justify-center mb-6">
          <BookOpen size={20} className="text-primary" />
          <span className="font-display font-bold text-xl">
            <span className="text-foreground">Edu</span>
            <span className="gradient-text">Vault</span>
          </span>
        </div>

        <div className="flex items-center gap-3 justify-center mb-6">
          <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center text-xs font-display font-semibold text-primary">
            ✓
          </div>
          <div className="w-10 h-px bg-primary/40" />
          <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-display font-semibold">
            2
          </div>
        </div>

        <h2 className="font-display font-bold text-2xl text-foreground text-center">
          Complete your profile
        </h2>
        <p className="font-body text-sm text-muted-foreground text-center mt-1 mb-2">
          This information is permanent and tied to your college ID.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4 mt-6">
          <div className="bg-warning/10 border border-warning/30 rounded-xl p-3 mb-2 flex gap-3 text-left">
            <Info size={16} className="text-warning shrink-0 mt-0.5" />
            <p className="text-xs font-body text-warning leading-relaxed">
              <strong>NOTE:</strong> Users must enter correct Name, department name and year to access correct material (Since Material will be shown according to their department Name).
            </p>
          </div>

          <div>
            <label className="text-xs font-body font-medium text-muted-foreground mb-1.5 block">
              Full Name
            </label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-input border border-border rounded-xl px-4 py-2.5 text-sm font-body text-foreground placeholder:text-muted-foreground/50 w-full focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary/50 transition-all"
              placeholder="As on your college ID card"
            />
          </div>

          <div>
            <label className="text-xs font-body font-medium text-muted-foreground mb-1.5 block">
              Department
            </label>
            <select
              required
              value={departmentId}
              onChange={(e) => setDepartmentId(e.target.value)}
              disabled={deptLoading}
              className="bg-input border border-border rounded-xl px-4 py-2.5 text-sm font-body text-foreground w-full focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary/50 transition-all appearance-none disabled:opacity-50"
            >
              <option value="">{deptLoading ? 'Loading departments...' : 'Select department'}</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>{d.short_name} — {d.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-body font-medium text-muted-foreground mb-1.5 block">
              Year of Admission
            </label>
            <select
              required
              value={admissionYear}
              onChange={(e) => setAdmissionYear(e.target.value)}
              className="bg-input border border-border rounded-xl px-4 py-2.5 text-sm font-body text-foreground w-full focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary/50 transition-all appearance-none"
            >
              <option value="">Select admission year</option>
              {ADMISSION_YEAR_OPTIONS.map((y) => (
                <option key={y.value} value={y.value}>{y.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-body font-medium text-muted-foreground mb-1.5 block">
              Roll Number
            </label>
            <div className="relative">
              <input
                required
                value={rollNumber}
                onChange={(e) => setRollNumber(e.target.value.replace(/\D/g, ''))}
                className={`bg-input border ${
                  rollValid === false ? 'border-danger focus:ring-danger/40' :
                  rollValid === true ? 'border-success focus:ring-success/40' :
                  'border-border focus:ring-primary/50'
                } rounded-xl px-4 py-2.5 pr-10 text-sm font-body text-foreground placeholder:text-muted-foreground/50 w-full focus:outline-none focus:ring-1 transition-all`}
                placeholder="e.g. 22CSE034"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {rollValid === true && <Check size={16} className="text-success" />}
                {rollValid === false && <X size={16} className="text-danger" />}
              </div>
            </div>
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
                placeholder="Min. 8 characters"
                minLength={8}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {password && (
              <div className="mt-3 space-y-3">
                <div>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${i <= strength ? strengthColors[strength] : 'bg-surface-2'}`} />
                    ))}
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-xs text-muted-foreground">Password strength</span>
                    <span className={`text-xs font-medium ${
                       strength === 1 ? 'text-danger' : 
                       strength === 2 ? 'text-warning' : 
                       strength === 3 ? 'text-info' : 
                       strength === 4 ? 'text-success' : 'text-muted-foreground'
                    }`}>{strengthLabels[strength]}</span>
                  </div>
                </div>

                <div className="bg-surface-1 rounded-xl p-3 border border-border/50 grid grid-cols-2 gap-2 text-left">
                  {passwordConstraints.map(c => {
                    const isValid = c.validator(password);
                    return (
                      <div key={c.id} className="flex items-center gap-2">
                        <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0 transition-colors ${isValid ? 'bg-success/20 text-success' : 'bg-surface-2 text-muted-foreground'}`}>
                          {isValid ? <Check size={8} strokeWidth={4} /> : <div className="w-1 h-1 rounded-full bg-current" />}
                        </div>
                        <span className={`text-[10px] uppercase tracking-widest font-bold transition-colors ${isValid ? 'text-success' : 'text-muted-foreground'}`}>
                          {c.label}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="text-xs font-body font-medium text-muted-foreground mb-1.5 block">
              Confirm Password
            </label>
            <div className="relative">
              <input
                required
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={`bg-input border ${confirmPassword && password !== confirmPassword ? 'border-danger focus:ring-danger/40' : confirmPassword && password === confirmPassword ? 'border-success focus:ring-success/40' : 'border-border focus:ring-primary/50'} rounded-xl px-4 py-2.5 text-sm font-body text-foreground placeholder:text-muted-foreground/50 w-full focus:outline-none focus:ring-1 transition-all pr-10`}
                placeholder="Confirm your password"
                minLength={8}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {confirmPassword && password !== confirmPassword && (
              <p className="text-xs text-danger mt-1.5 font-body">Passwords do not match.</p>
            )}
          </div>

          {error && (
            <p className="text-xs text-danger font-body text-center bg-danger/5 border border-danger/20 rounded-xl px-4 py-2.5">
              {error}
            </p>
          )}

          <Button variant="primary" className="w-full mt-4" disabled={loading || deptLoading} type="submit">
            {loading ? (
              <span className="flex items-center gap-2">
                <Loader2 size={16} className="animate-spin" />
                Finalizing...
              </span>
            ) : 'Complete Registration'}
          </Button>

          <div className="text-center mt-4 border-t border-border/30 pt-4">
            <p className="text-xs text-muted-foreground/60 font-body">
              Wrong account?{" "}
              <button
                type="button"
                onClick={async () => {
                  await supabase.auth.signOut();
                  logout();
                  navigate('/signin', { replace: true });
                }}
                className="text-primary hover:underline font-semibold"
              >
                Sign out and start over
              </button>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
