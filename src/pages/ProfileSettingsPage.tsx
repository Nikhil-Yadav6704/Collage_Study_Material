import { Lock, Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useAuthStore } from "../store/authStore";
import { useMutation } from "@tanstack/react-query";
import api from "../lib/api";
import { getOrdinalSuffix } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

const ProfileSettingsPage = () => {
  const user = useAuthStore((s) => s.user);
  const { toast } = useToast();
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ current: "", new: "", confirm: "" });

  // Fix 11: Profile correction request
  const [showCorrectionForm, setShowCorrectionForm] = useState(false);
  const [correctionNote, setCorrectionNote] = useState('');
  const [correctionSent, setCorrectionSent] = useState(false);

  const { mutate: requestCorrection, isPending: isRequestingCorrection } = useMutation({
    mutationFn: (note: string) =>
      api.post('/api/notifications/request-profile-correction', { note }),
    onSuccess: () => {
      setCorrectionSent(true);
      setCorrectionNote('');
      setShowCorrectionForm(false);
    },
    onError: () => {
      toast({ title: "Failed to send request", variant: "destructive" });
    },
  });

  const { mutate: updatePassword, isPending } = useMutation({
    mutationFn: (data: any) => api.patch('/api/auth/change-password', data),
    onSuccess: () => {
      setPasswordForm({ current: "", new: "", confirm: "" });
      toast({
        title: "Password Updated",
        description: "Your security credentials have been successfully updated.",
      });
    },
    onError: (err: any) => {
      toast({
        title: "Update Failed",
        description: err.response?.data?.error || "Failed to update password",
        variant: "destructive",
      });
    },
  });

  const initials = user?.full_name?.split(' ').map(n => n[0]).join('').toUpperCase() || '??';

  const profileFields = [
    { label: "Full Name", value: user?.full_name },
    { label: "Roll Number", value: user?.roll_number },
    { label: "Department", value: user?.department?.name },
    { label: "Year", value: `${getOrdinalSuffix(user?.year)} Year` },
    { label: "Email", value: user?.email },
    { label: "Status", value: user?.status?.toUpperCase() || 'ACTIVE' },
  ];

  return (
    <div className="max-w-lg mx-auto">
      <div className="gradient-border rounded-3xl p-8 bg-card relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl pointer-events-none rounded-full" />
        
        <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center text-3xl font-display font-bold text-primary mx-auto border-2 border-primary/20 shadow-xl shadow-primary/5">
          {initials}
        </div>
        
        <h2 className="font-display font-bold text-2xl text-foreground mt-5 text-center">
          {user?.full_name}
        </h2>
        
        <div className="flex gap-2 mt-2 justify-center">
          <span className="text-[10px] bg-primary/20 text-primary border border-primary/20 rounded-full px-3 py-1 font-body font-bold uppercase tracking-wider">
            {user?.role}
          </span>
          <span className="text-[11px] text-muted-foreground font-body bg-surface-1 px-3 py-1 rounded-full border border-border/40">
            {user?.department?.short_name || 'DEPT'} · {getOrdinalSuffix(user?.year)} Year
          </span>
        </div>

        <div className="mt-10">
          <div className="flex items-center gap-2 mb-4">
             <div className="w-1.5 h-4 bg-primary rounded-full" />
             <h3 className="font-display font-bold text-sm text-foreground uppercase tracking-widest">
               Identity Profile
             </h3>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {profileFields.map((f) => (
              <div key={f.label} className="bg-surface-1/50 rounded-xl px-4 py-3 border border-border/40 transition-all hover:bg-surface-2">
                <p className="text-[9px] text-muted-foreground uppercase font-bold tracking-[0.1em] mb-1">
                  {f.label}
                </p>
                <p className="text-sm font-body font-semibold text-foreground truncate">{f.value || 'N/A'}</p>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-muted-foreground/60 mt-6 italic text-center font-body border-t border-border/30 pt-4">
            Security lock: Identity details are synchronized via college SSO and cannot be edited.
          </p>

          {/* Fix 11: Correction Request */}
          <div className="mt-4 pt-4 border-t border-border/20">
            {correctionSent ? (
              <p className="text-xs text-success font-body flex items-center justify-center gap-1.5">
                ✓ Correction request sent to admin. They'll review it shortly.
              </p>
            ) : showCorrectionForm ? (
              <div className="space-y-3">
                <p className="text-xs text-muted-foreground font-body">
                  Describe the error (e.g., wrong department, typo in roll number):
                </p>
                <textarea
                  value={correctionNote}
                  onChange={e => setCorrectionNote(e.target.value)}
                  placeholder="Wrong department selected — should be ECE, not CSE..."
                  rows={3}
                  className="w-full bg-surface-1/80 border border-border rounded-xl px-4 py-2.5 text-sm font-body text-foreground resize-none focus:outline-none focus:ring-1 focus:ring-primary/40"
                />
                <div className="flex gap-2 justify-center">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => requestCorrection(correctionNote)}
                    disabled={!correctionNote.trim() || isRequestingCorrection}
                  >
                    {isRequestingCorrection ? 'Sending...' : 'Send to Admin'}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowCorrectionForm(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center">
                <button
                  onClick={() => setShowCorrectionForm(true)}
                  className="text-[11px] text-primary hover:underline font-body"
                >
                  Found an error in your profile? Request a correction →
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="relative my-10">
           <hr className="border-border/50" />
           <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-4 text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Security Settings</span>
        </div>

        <h3 className="font-display font-bold text-sm text-foreground mb-5 flex items-center gap-2 uppercase tracking-widest">
          <Lock size={16} className="text-primary" /> Update Password
        </h3>
        
        <div className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-[10px] font-body font-bold text-muted-foreground uppercase tracking-wider block ml-1">
              Current Password
            </label>
            <div className="relative">
              <input
                type={showCurrent ? "text" : "password"}
                value={passwordForm.current}
                onChange={(e) => setPasswordForm({ ...passwordForm, current: e.target.value })}
                className="bg-surface-1/80 border border-border rounded-xl px-4 py-3 text-sm font-body text-foreground w-full focus:outline-none focus:ring-1 focus:ring-primary/40 transition-all pr-12"
                placeholder="••••••••"
              />
              <button
                type="button"
                aria-label="Toggle password visibility"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
              >
                {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-body font-bold text-muted-foreground uppercase tracking-wider block ml-1">
              New Password
            </label>
            <div className="relative">
              <input
                type={showNew ? "text" : "password"}
                value={passwordForm.new}
                onChange={(e) => setPasswordForm({ ...passwordForm, new: e.target.value })}
                className="bg-surface-1/80 border border-border rounded-xl px-4 py-3 text-sm font-body text-foreground w-full focus:outline-none focus:ring-1 focus:ring-primary/40 transition-all pr-12"
                placeholder="Min. 8 characters"
              />
              <button
                type="button"
                aria-label="Toggle password visibility"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
              >
                {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-body font-bold text-muted-foreground uppercase tracking-wider block ml-1">
              Confirm New Password
            </label>
            <input
              type="password"
              value={passwordForm.confirm}
              onChange={(e) => setPasswordForm({ ...passwordForm, confirm: e.target.value })}
              className="bg-surface-1/80 border border-border rounded-xl px-4 py-3 text-sm font-body text-foreground w-full focus:outline-none focus:ring-1 focus:ring-primary/40 transition-all"
              placeholder="Confirm new password"
            />
          </div>

          <Button 
            variant="primary" 
            className="w-full h-12 text-sm uppercase tracking-[0.2em] font-bold mt-2"
            disabled={isPending || !passwordForm.current || passwordForm.new.length < 8 || passwordForm.new !== passwordForm.confirm}
            onClick={() => updatePassword({ current_password: passwordForm.current, new_password: passwordForm.new })}
          >
            {isPending ? <><Loader2 className="animate-spin mr-2" />Updating...</> : "Update Password"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ProfileSettingsPage;
