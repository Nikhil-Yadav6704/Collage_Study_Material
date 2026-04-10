import { useState, useEffect } from "react";
import { 
  User, 
  Lock, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  Mail, 
  Hash, 
  Building, 
  Calendar,
  CheckCircle2,
  ChevronRight,
  Loader2,
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/authStore";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";

const ProfileSettingsMod = () => {
  const user = useAuthStore(s => s.user);
  const qc = useQueryClient();
  const { toast } = useToast();
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // ─── Email Preferences (Fix 6) ───────────────────────────────
  const [emailPrefs, setEmailPrefs] = useState<Record<string, boolean>>({
    req: true,
    rep: true,
    sys: false,
  });
  const [prefSaveStatus, setPrefSaveStatus] = useState<'' | 'saving' | 'saved'>('');

  const handlePrefToggle = (id: string) => {
    setEmailPrefs(prev => ({ ...prev, [id]: !prev[id] }));
    setPrefSaveStatus('');
  };

  const savePrefs = () => {
    setPrefSaveStatus('saving');
    setTimeout(() => {
      localStorage.setItem('emailPrefs_' + user?.id, JSON.stringify(emailPrefs));
      setPrefSaveStatus('saved');
      setTimeout(() => setPrefSaveStatus(''), 3000);
    }, 400);
  };

  useEffect(() => {
    const stored = localStorage.getItem('emailPrefs_' + user?.id);
    if (stored) {
      try { setEmailPrefs(JSON.parse(stored)); } catch {}
    }
  }, [user?.id]);

  // ─── Profile Correction Request (Fix 11) ─────────────────────
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

  // ─── Password Change ─────────────────────────────────────────
  const { mutate: changePassword, isPending } = useMutation({
    mutationFn: (data: any) => api.patch('/api/auth/change-password', data),
    onSuccess: () => {
      setSuccessMsg("Password updated successfully");
      setErrorMsg("");
      setTimeout(() => setSuccessMsg(""), 5000);
    },
    onError: (err: any) => {
      setErrorMsg(err.response?.data?.error || "Failed to update password");
      setSuccessMsg("");
    }
  });

  const handleUpdate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const current_password = formData.get('current_password') as string;
    const new_password = formData.get('new_password') as string;
    const confirm_password = formData.get('confirm_password') as string;

    if (new_password !== confirm_password) {
      setErrorMsg("New passwords do not match");
      return;
    }

    changePassword({ current_password, new_password });
  };

  const getOrdinal = (n: number | string) => {
    const num = typeof n === 'string' ? parseInt(n) : n;
    const s = ["th", "st", "nd", "rd"];
    const v = num % 100;
    return num + (s[(v - 20) % 10] || s[v] || s[0]);
  };

  return (
    <div className="max-w-[800px] mx-auto pb-20">
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div>
           <h2 className="font-display font-bold text-2xl text-foreground">Profile & Settings</h2>
           <p className="font-body text-sm text-muted-foreground mt-0.5">Manage your moderator account and security.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] gap-8">
        {/* Left: Quick Profile Card */}
        <div className="flex flex-col gap-6">
           <div className="gradient-border rounded-2xl p-6 text-center group transition-all hover:shadow-xl">
              <div className="w-20 h-20 rounded-2xl bg-[hsl(172_70%_42%/0.15)] flex items-center justify-center text-2xl font-display font-bold text-[hsl(172_70%_55%)] mx-auto mb-4 border border-[hsl(172_70%_42%/0.2)] group-hover:scale-105 transition-transform duration-300 shadow-lg">
                {user?.full_name?.[0] || 'U'}
              </div>
              <h3 className="font-display font-semibold text-base text-foreground truncate">{user?.full_name}</h3>
              <div className="mod-role-badge mt-2 justify-center mx-auto scale-90">
                <ShieldCheck size={10} />
                <span>{user?.role === 'admin' ? 'Administrator' : 'Moderator'}</span>
              </div>
              <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground/40 mt-4 font-body">Department</p>
              <p className="text-xs font-body text-muted-foreground mt-1">{user?.department?.name || 'All Access'}</p>
           </div>

           <div className="bg-[hsl(172_70%_42%/0.04)] border border-[hsl(172_70%_42%/0.15)] rounded-2xl p-5 group">
              <div className="flex items-center gap-2 text-[hsl(172_70%_55%)] mb-3">
                 <ShieldCheck size={16} />
                 <span className="font-display font-bold text-xs uppercase tracking-wider">Moderator Note</span>
              </div>
              <p className="font-body text-[11px] text-foreground/70 leading-relaxed">
                Your elevated access is managed by an Admin. Your actions are audited to maintain quality.
              </p>
           </div>
        </div>

        {/* Right: Detailed Settings */}
        <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
           {/* Section 1: Basic Information (Read-only) */}
           <div className="gradient-border rounded-2xl p-6 bg-surface-1/30">
              <h4 className="font-display font-semibold text-base mb-6 flex items-center gap-2">
                 <User size={18} className="text-muted-foreground" />
                 Basic Information
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                 <div>
                    <label className="text-[10px] uppercase font-bold text-muted-foreground/60 mb-2 block tracking-wider font-body">Full Name</label>
                    <div className="bg-surface-2/50 border border-border/40 rounded-xl px-4 py-2.5 text-xs font-body text-muted-foreground/70 flex items-center gap-2 opacity-70">
                       <Lock size={12} /> {user?.full_name}
                    </div>
                 </div>
                 <div>
                    <label className="text-[10px] uppercase font-bold text-muted-foreground/60 mb-2 block tracking-wider font-body">Roll Number</label>
                    <div className="bg-surface-2/50 border border-border/40 rounded-xl px-4 py-2.5 text-xs font-body text-muted-foreground/70 flex items-center gap-2 opacity-70">
                       <Lock size={12} /> {user?.roll_number}
                    </div>
                 </div>
                 <div>
                    <label className="text-[10px] uppercase font-bold text-muted-foreground/60 mb-2 block tracking-wider font-body">Email</label>
                    <div className="bg-surface-2/50 border border-border/40 rounded-xl px-4 py-2.5 text-xs font-body text-muted-foreground/70 flex items-center gap-2 opacity-70 truncate">
                       <Lock size={12} /> {user?.email}
                    </div>
                 </div>
                 <div>
                    <label className="text-[10px] uppercase font-bold text-muted-foreground/60 mb-2 block tracking-wider font-body">Current Year</label>
                    <div className="bg-surface-2/50 border border-border/40 rounded-xl px-4 py-2.5 text-xs font-body text-muted-foreground/70 flex items-center gap-2 opacity-70">
                       <Lock size={12} /> {user?.year ? getOrdinal(user.year) : 'N/A'} Year
                    </div>
                 </div>
              </div>
              <p className="text-[10px] text-muted-foreground/40 mt-6 font-body italic">
                * Personal fields are managed through the central student database and cannot be modified directly.
              </p>

              {/* Fix 11: Correction Request */}
              <div className="mt-4 pt-4 border-t border-border/20">
                {correctionSent ? (
                  <p className="text-xs text-success font-body flex items-center gap-1.5">
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
                      className="w-full bg-surface-1 border border-border rounded-xl px-4 py-2.5 text-sm font-body text-foreground resize-none focus:outline-none focus:ring-1 focus:ring-primary/40"
                    />
                    <div className="flex gap-2">
                      <Button
                        variant="mod-primary"
                        size="sm"
                        onClick={() => requestCorrection(correctionNote)}
                        disabled={!correctionNote.trim() || isRequestingCorrection}
                      >
                        {isRequestingCorrection ? 'Sending...' : 'Send to Admin'}
                      </Button>
                      <Button
                        variant="ghost-border"
                        size="sm"
                        onClick={() => setShowCorrectionForm(false)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowCorrectionForm(true)}
                    className="text-[11px] text-primary hover:underline font-body"
                  >
                    Found an error in your profile? Request a correction →
                  </button>
                )}
              </div>
           </div>

           {/* Section 2: Security */}
           <div className="gradient-border rounded-2xl p-6">
              <h4 className="font-display font-semibold text-base mb-6 flex items-center gap-2">
                 <Lock size={18} className="text-muted-foreground" />
                 Password & Security
              </h4>
              <form onSubmit={handleUpdate} className="space-y-6">
                 {(successMsg || errorMsg) && (
                   <div className={cn(
                     "p-4 rounded-xl text-xs font-body flex items-center gap-2 animate-in slide-in-from-top-2",
                     successMsg ? "bg-success/10 text-success border border-success/20" : "bg-danger/10 text-danger border border-danger/20"
                   )}>
                      {successMsg ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                      {successMsg || errorMsg}
                   </div>
                 )}

                 <div>
                    <label className="text-[10px] uppercase font-bold text-muted-foreground/60 mb-2 block tracking-wider font-body">Current Password</label>
                    <div className="relative group">
                       <input 
                         name="current_password"
                         required
                         type={showCurrentPass ? "text" : "password"} 
                         className="w-full bg-surface-1 border border-border/60 rounded-xl px-4 py-3 text-sm font-body focus:outline-none focus:ring-1 focus:ring-[hsl(172_70%_42%/0.4)]"
                         placeholder="••••••••"
                       />
                       <button 
                         type="button" 
                         aria-label="Toggle password visibility"
                         onClick={() => setShowCurrentPass(!showCurrentPass)}
                         className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {showCurrentPass ? <EyeOff size={16} /> : <Eye size={16} />}
                       </button>
                    </div>
                 </div>

                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                   <div>
                      <label className="text-[10px] uppercase font-bold text-muted-foreground/60 mb-2 block tracking-wider font-body">New Password</label>
                      <div className="relative group">
                         <input 
                           name="new_password"
                           required
                           type={showNewPass ? "text" : "password"} 
                           className="w-full bg-surface-1 border border-border/60 rounded-xl px-4 py-3 text-sm font-body focus:outline-none focus:ring-1 focus:ring-[hsl(172_70%_42%/0.4)]"
                           placeholder="••••••••"
                         />
                         <button 
                           type="button" 
                           aria-label="Toggle password visibility"
                           onClick={() => setShowNewPass(!showNewPass)}
                           className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                          >
                            {showNewPass ? <EyeOff size={16} /> : <Eye size={16} />}
                         </button>
                      </div>
                   </div>
                   <div>
                      <label className="text-[10px] uppercase font-bold text-muted-foreground/60 mb-2 block tracking-wider font-body">Confirm Password</label>
                      <input 
                        name="confirm_password"
                        required
                        type="password"
                        placeholder="••••••••" 
                        className="w-full bg-surface-1 border border-border/60 rounded-xl px-4 py-3 text-sm font-body focus:outline-none focus:ring-1 focus:ring-[hsl(172_70%_42%/0.4)]"
                      />
                   </div>
                 </div>

                 <div className="pt-4">
                    <Button 
                      type="submit"
                      variant="mod-primary" 
                      className="px-8 h-11 shadow-lg min-w-[160px]"
                      disabled={isPending}
                    >
                       {isPending ? <Loader2 className="animate-spin mr-2" size={18} /> : null}
                       {isPending ? 'Updating...' : 'Update Password'}
                    </Button>
                 </div>
              </form>
           </div>

           {/* Section 3: Notification Preferences (Fix 6) */}
           <div className="gradient-border rounded-2xl p-6 bg-surface-1/30">
              <h4 className="font-display font-semibold text-base mb-6 flex items-center gap-2">
                 <Mail size={18} className="text-muted-foreground" />
                 Email Preferences
              </h4>
              <div className="space-y-4">
                 {[
                   { id: 'req', label: "New Student Requests", sub: `Alerts for submissions in ${user?.department?.short_name || 'your department'}.` },
                   { id: 'rep', label: "Flagged Feedback Reports", sub: "Priority notifications for reported student comments." },
                   { id: 'sys', label: "System Announcements", sub: "Updates from the library admins." },
                 ].map(pref => (
                   <div key={pref.id} className="flex items-start justify-between p-3 rounded-xl hover:bg-surface-2 transition-colors group">
                      <div className="flex-1 min-w-0 pr-4">
                         <p className="text-sm font-body font-semibold text-foreground">{pref.label}</p>
                         <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">{pref.sub}</p>
                      </div>
                      <button
                        aria-label="Toggle email preference"
                        onClick={() => handlePrefToggle(pref.id)}
                        className={cn(
                          "w-10 h-6 rounded-full relative shadow-inner transition-colors shrink-0 focus:outline-none",
                          emailPrefs[pref.id] ? "bg-[hsl(172_70%_42%)]" : "bg-surface-2 border border-border"
                        )}
                      >
                        <div className={cn(
                          "absolute top-1 w-4 h-4 bg-white rounded-full shadow-md transition-transform duration-200",
                          emailPrefs[pref.id] ? "right-1 translate-x-0" : "left-1 translate-x-0"
                        )} />
                      </button>
                   </div>
                 ))}
              </div>
              <div className="flex items-center justify-between mt-4">
                <Button
                  variant="mod-primary"
                  size="sm"
                  className="px-6"
                  onClick={savePrefs}
                  disabled={prefSaveStatus === 'saving'}
                >
                  {prefSaveStatus === 'saving' ? 'Saving...' :
                   prefSaveStatus === 'saved' ? '✓ Saved' : 'Save Preferences'}
                </Button>
                <p className="text-[10px] text-muted-foreground/50 font-body italic">
                  API integration coming soon
                </p>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileSettingsMod;
