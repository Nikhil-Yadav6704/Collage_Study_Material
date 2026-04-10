import { useState } from "react";
import { 
  User, 
  Lock, 
  Building, 
  Bell, 
  Users, 
  Database, 
  AlertTriangle, 
  ChevronRight, 
  Eye, 
  EyeOff, 
  Plus, 
  X,
  ShieldCheck,
  Smartphone,
  Monitor,
  Trash2,
  FileText,
  Loader2,
  LogOut,
  GraduationCap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../lib/api";
import { useAuthStore } from "../store/authStore";
import { cn } from "@/lib/utils";

const AdminSettings = () => {
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const [activeSection, setActiveSection] = useState<'profile' | 'security' | 'college' | 'notifications' | 'year' | 'danger'>('profile');
  const [passMsg, setPassMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ current: "", new: "", confirm: "" });

  const { data: deptsData } = useQuery({
    queryKey: ['departments'],
    queryFn: () => api.get('/api/departments').then(r => r.data),
  });

  const { mutate: updatePassword, isPending: isUpdatingPass } = useMutation({
    mutationFn: (data: any) => api.patch('/api/auth/change-password', data),
    onSuccess: () => {
      setPasswordForm({ current: "", new: "", confirm: "" });
      setPassMsg({ type: 'success', text: 'Password updated successfully.' });
      setTimeout(() => setPassMsg(null), 5000);
    },
    onError: (err: any) => {
      setPassMsg({ type: 'error', text: err.response?.data?.error || 'Failed to update password.' });
    },
  });

  const { mutate: deleteDept } = useMutation({
    mutationFn: (deptId: string) => api.patch(`/api/departments/${deptId}/deactivate`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['departments'] }),
  });

  // Fix 11: Year upgrade mutation
  const { mutate: triggerYearUpgrade, isPending: isUpgrading } = useMutation({
    mutationFn: () => api.post('/api/admin/settings/trigger-year-upgrade'),
    onSuccess: (res: any) => {
      setPassMsg({ type: 'success', text: `Year upgrade complete. ${res.data.updated} students updated.` });
      setTimeout(() => setPassMsg(null), 8000);
    },
    onError: (err: any) => setPassMsg({ type: 'error', text: err.response?.data?.error || 'Year upgrade failed' }),
  });

  const sections = [
    { id: 'profile', label: 'My Profile', icon: User },
    { id: 'security', label: 'Password & Security', icon: Lock },
    { id: 'college', label: 'College & Platform', icon: Building },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'year', label: 'Year Progression', icon: Users },
    { id: 'danger', label: 'Danger Zone', icon: AlertTriangle, isDanger: true }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display font-bold text-2xl text-foreground">Admin Settings</h2>
          <p className="font-body text-sm text-muted-foreground">Manage your account and platform configuration.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-8">
        <div className="space-y-1">
          {sections.map((section: any) => (
            <button 
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-body transition-all text-left",
                activeSection === section.id 
                  ? section.isDanger ? "bg-danger/10 text-danger" : "bg-primary/10 text-primary"
                  : section.isDanger ? "text-danger hover:bg-danger/5" : "text-muted-foreground hover:bg-surface-1 hover:text-foreground"
              )}
            >
              <section.icon size={16} />
              {section.label}
            </button>
          ))}
        </div>

        <div className="space-y-6 min-h-[500px]">
          {activeSection === 'profile' && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300 space-y-6">
              <div className="gradient-border rounded-2xl p-8 bg-card">
                <div className="flex items-center gap-6 mb-8 pb-8 border-b border-border/30">
                  <div className="w-20 h-20 rounded-2xl bg-primary/20 flex items-center justify-center text-3xl font-display font-bold text-primary shadow-inner border border-primary/20">
                    {user?.full_name?.[0].toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-xl text-foreground">{user?.full_name}</h3>
                    <div className="flex gap-2 mt-2">
                      <span className="bg-danger/10 text-danger rounded-full px-2.5 py-0.5 text-[10px] font-bold border border-danger/20 capitalize">{user?.role}</span>
                      <span className="bg-surface-2 text-muted-foreground rounded-full px-2.5 py-0.5 text-[10px] font-medium border border-border/50">SYSTEM ACCESS</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[
                    { label: "Full Name", value: user?.full_name },
                    { label: "Email Address", value: user?.email },
                    { label: "Roll Number", value: user?.roll_number },
                    { label: "Department", value: user?.department?.name || "N/A" }
                  ].map((field) => (
                    <div key={field.label}>
                       <label className="text-[10px] font-body font-bold text-muted-foreground uppercase tracking-widest mb-1.5 block">{field.label}</label>
                       <div className="bg-surface-1/50 border border-border/30 rounded-xl px-4 py-2.5 flex items-center justify-between text-muted-foreground/60">
                          <span className="text-sm font-body">{field.value}</span>
                          <Lock size={12} />
                       </div>
                    </div>
                  ))}
                </div>
                <div className="mt-8 p-4 bg-primary/5 rounded-xl border border-primary/20 flex items-start gap-3">
                  <ShieldCheck size={18} className="text-primary shrink-0 mt-0.5" />
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Some profile fields are read-only as they are synchronized with the institution's directory. Contact IT to request changes.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'security' && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300 space-y-6">
              <div className="gradient-border rounded-2xl p-8 bg-card">
                 <h3 className="font-display font-semibold text-lg text-foreground mb-6">Change Password</h3>
                 <div className="max-w-md space-y-4">
                    <div>
                       <label className="text-xs font-body font-medium text-muted-foreground mb-1.5 block">Current Password</label>
                       <div className="relative">
                          <input 
                            type={showCurrentPass ? "text" : "password"} 
                            value={passwordForm.current}
                            onChange={(e) => setPasswordForm({ ...passwordForm, current: e.target.value })}
                            className="bg-input border border-border rounded-xl px-4 py-2.5 text-sm font-body w-full pr-12 focus:ring-1 focus:ring-primary/40 outline-none"
                          />
                          <button onClick={() => setShowCurrentPass(!showCurrentPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                             {showCurrentPass ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                       </div>
                    </div>
                    <div>
                       <label className="text-xs font-body font-medium text-muted-foreground mb-1.5 block">New Password</label>
                       <div className="relative">
                          <input 
                            type={showNewPass ? "text" : "password"} 
                            value={passwordForm.new}
                            onChange={(e) => setPasswordForm({ ...passwordForm, new: e.target.value })}
                            className="bg-input border border-border rounded-xl px-4 py-2.5 text-sm font-body w-full pr-12 focus:ring-1 focus:ring-primary/40 outline-none"
                          />
                          <button onClick={() => setShowNewPass(!showNewPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                             {showNewPass ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                       </div>
                    </div>
                    <div>
                       <label className="text-xs font-body font-medium text-muted-foreground mb-1.5 block">Confirm New Password</label>
                       <input 
                        type="password" 
                        value={passwordForm.confirm}
                        onChange={(e) => setPasswordForm({ ...passwordForm, confirm: e.target.value })}
                        className="bg-input border border-border rounded-xl px-4 py-2.5 text-sm font-body w-full focus:ring-1 focus:ring-primary/40 outline-none"
                       />
                    </div>
                    {passMsg && (
                      <div className={cn(
                        "p-3 rounded-xl text-xs font-body flex items-center gap-2",
                        passMsg.type === 'success'
                          ? "bg-success/10 text-success border border-success/20"
                          : "bg-danger/10 text-danger border border-danger/20"
                      )}>
                        {passMsg.text}
                      </div>
                    )}
                    <Button 
                      onClick={() => updatePassword({ current_password: passwordForm.current, new_password: passwordForm.new })}
                      disabled={isUpdatingPass || !passwordForm.current || passwordForm.new !== passwordForm.confirm}
                      className="w-full h-11 bg-primary text-white font-bold text-sm"
                    >
                      {isUpdatingPass ? <Loader2 className="animate-spin" /> : "Update Password"}
                    </Button>
                 </div>
              </div>
            </div>
          )}

          {activeSection === 'college' && (
             <div className="animate-in fade-in slide-in-from-right-4 duration-300 space-y-6">
                <div className="gradient-border rounded-2xl p-8 bg-card">
                   <h3 className="font-display font-semibold text-lg text-foreground mb-6">Department Registry</h3>
                   <div className="space-y-3">
                      {deptsData?.departments?.map((dept: any) => (
                        <div key={dept.id} className="flex items-center justify-between bg-surface-1 rounded-2xl px-5 py-4 border border-border/30 hover:border-primary/20 transition-all cursor-default">
                           <div>
                              <p className="text-sm font-semibold text-foreground">{dept.name}</p>
                              <p className="text-[11px] text-muted-foreground mt-0.5">{dept.short_name} · Code: {dept.id.slice(0, 8)}</p>
                           </div>
                           <Button
                              variant="ghost"
                              size="icon"
                              className="text-muted-foreground hover:text-danger transition-colors"
                              onClick={() => {
                                if (window.confirm(`Deactivate ${dept.name}? Students will lose access.`)) {
                                  deleteDept(dept.id);
                                }
                              }}
                           >
                              <Trash2 size={16} />
                           </Button>
                        </div>
                      ))}
                   </div>
                   <Button variant="ghost" className="mt-6 border border-border/50 text-xs gap-2">
                     <Plus size={14} /> Add New Department
                   </Button>
                </div>
             </div>
          )}

          {/* Fix 11: Notifications Section */}
          {activeSection === 'notifications' && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300 space-y-6">
              <div className="gradient-border rounded-2xl p-8 bg-card">
                <h3 className="font-display font-semibold text-lg text-foreground mb-6">Platform Notifications</h3>
                <div className="space-y-4">
                  {[
                    { id: 'new_requests', label: 'New Upload Requests', sub: 'Notify moderators when students submit materials', on: true },
                    { id: 'mod_apply', label: 'Moderator Applications', sub: 'Notify admins when students apply to moderate', on: true },
                    { id: 'flagged', label: 'Flagged Content', sub: 'Alert when students report inappropriate materials', on: false },
                    { id: 'year_upgrade', label: 'Year Upgrade Events', sub: 'Notify students when their year is auto-advanced', on: true },
                  ].map(pref => (
                    <div key={pref.id} className="flex items-start justify-between p-4 bg-surface-1 rounded-xl border border-border/30 hover:border-primary/20 transition-colors">
                      <div>
                        <p className="text-sm font-body font-semibold text-foreground">{pref.label}</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">{pref.sub}</p>
                      </div>
                      <div className={cn(
                        "w-10 h-6 rounded-full relative p-1 cursor-pointer shrink-0 transition-colors",
                        pref.on ? "bg-primary" : "bg-surface-2 border border-border/50"
                      )}>
                        <div className={cn(
                          "h-4 w-4 bg-white rounded-full shadow-md transition-transform",
                          pref.on ? "ml-auto" : "ml-0"
                        )} />
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-[10px] text-muted-foreground/50 mt-6 font-body italic">
                  Email notification settings require Resend API integration. Contact your system administrator for SMTP configuration.
                </p>
              </div>
            </div>
          )}

          {/* Fix 11: Year Progression Section */}
          {activeSection === 'year' && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300 space-y-6">
              <div className="gradient-border rounded-2xl p-8 bg-card">
                <h3 className="font-display font-semibold text-lg text-foreground mb-2">Year Progression</h3>
                <p className="text-sm text-muted-foreground font-body mb-8">
                  Advance all active students by one academic year. This re-computes each student's year from their
                  admission year versus the current academic calendar.
                </p>

                <div className="bg-warning/5 border border-warning/20 rounded-2xl p-5 mb-6">
                  <div className="flex items-start gap-3">
                    <AlertTriangle size={18} className="text-warning shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-body font-semibold text-foreground">Before running year upgrade:</p>
                      <ul className="mt-2 space-y-1 text-[12px] text-muted-foreground font-body">
                        <li>• Ensure all students have correct <strong>admission_year</strong> values in their profiles</li>
                        <li>• Students with backlogs can be manually overridden in User Management afterwards</li>
                        <li>• This action updates the <code className="bg-surface-2 px-1 rounded text-[11px]">year</code> field for all students simultaneously</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {passMsg && (
                  <div className={cn(
                    "p-3 rounded-xl text-xs font-body flex items-center gap-2 mb-4",
                    passMsg.type === 'success'
                      ? "bg-success/10 text-success border border-success/20"
                      : "bg-danger/10 text-danger border border-danger/20"
                  )}>
                    {passMsg.text}
                  </div>
                )}

                <Button
                  className="h-11 px-8 bg-warning text-warning-foreground hover:bg-warning/90 font-bold"
                  onClick={() => {
                    if (window.confirm('This will advance ALL students by one year based on their admission date. Are you sure?')) {
                      triggerYearUpgrade();
                    }
                  }}
                  disabled={isUpgrading}
                >
                  {isUpgrading ? <><Loader2 size={16} className="animate-spin mr-2" /> Processing...</> : <><GraduationCap size={16} className="mr-2" /> Trigger Year Upgrade</>}
                </Button>
              </div>
            </div>
          )}

          {/* Fix 11: Danger Zone Section */}
          {activeSection === 'danger' && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300 space-y-6">
              <div className="border border-danger/30 rounded-2xl p-8 bg-danger/5">
                <h3 className="font-display font-semibold text-lg text-danger mb-1">Danger Zone</h3>
                <p className="text-sm text-muted-foreground font-body mb-8">
                  These actions are irreversible. Proceed with extreme caution.
                </p>

                <div className="space-y-4">
                  {/* Purge inactive materials */}
                  <div className="bg-card rounded-2xl p-5 border border-border/40">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-body font-semibold text-foreground">Purge Archived Materials</p>
                        <p className="text-[11px] text-muted-foreground mt-1">
                          Permanently delete all materials with <code className="bg-surface-2 px-1 rounded text-[10px]">is_active = false</code> from the database and storage.
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        className="text-danger hover:bg-danger/10 border border-danger/30 text-xs px-4 shrink-0"
                        onClick={() => {
                          if (window.confirm('Permanently delete all archived materials? This cannot be undone.')) {
                            alert('Purge scheduled — implement POST /api/admin/settings/purge-archived endpoint.');
                          }
                        }}
                      >
                        <Trash2 size={14} className="mr-1" /> Purge Now
                      </Button>
                    </div>
                  </div>

                  {/* Reset all sessions */}
                  <div className="bg-card rounded-2xl p-5 border border-border/40">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-body font-semibold text-foreground">Force Logout All Users</p>
                        <p className="text-[11px] text-muted-foreground mt-1">
                          Clears <code className="bg-surface-2 px-1 rounded text-[10px]">last_active_at</code> for all profiles and invalidates active sessions.
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        className="text-danger hover:bg-danger/10 border border-danger/30 text-xs px-4 shrink-0"
                        onClick={() => {
                          if (window.confirm('This will log out all currently active users. Proceed?')) {
                            alert('Force logout — implement POST /api/admin/settings/force-logout-all endpoint.');
                          }
                        }}
                      >
                        <LogOut size={14} className="mr-1" /> Force Logout
                      </Button>
                    </div>
                  </div>

                  {/* Delete all upload requests */}
                  <div className="bg-card rounded-2xl p-5 border border-border/40">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-body font-semibold text-foreground">Clear Upload Request History</p>
                        <p className="text-[11px] text-muted-foreground mt-1">
                          Remove all completed upload requests older than 90 days. Preserves pending and recently reviewed items.
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        className="text-danger hover:bg-danger/10 border border-danger/30 text-xs px-4 shrink-0"
                        onClick={() => {
                          if (window.confirm('Clear upload request history older than 90 days?')) {
                            alert('Clear history — implement POST /api/admin/settings/clear-request-history endpoint.');
                          }
                        }}
                      >
                        <FileText size={14} className="mr-1" /> Clear History
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;
