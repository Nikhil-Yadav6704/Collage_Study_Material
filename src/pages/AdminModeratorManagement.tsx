import { useState } from "react";
import { 
  UserPlus, 
  AlertCircle, 
  MoreHorizontal, 
  Search, 
  X,
  Clock,
  FileText,
  Mail,
  Loader2,
  CheckCircle,
  XCircle,
  Activity,
  Shield
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../lib/api";
import { cn } from "@/lib/utils";

const AdminModeratorManagement = () => {
  const qc = useQueryClient();
  const [selectedMod, setSelectedMod] = useState<any>(null);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

  // Fetch all moderators
  const { data: modsData, isLoading: isLoadingMods } = useQuery({
    queryKey: ['admin', 'moderators'],
    queryFn: () => api.get('/api/admin/moderators').then(r => r.data),
  });

  // Fetch pending moderator requests
  const { data: pendingData, isLoading: isLoadingPending } = useQuery({
    queryKey: ['admin', 'moderator-requests'],
    queryFn: () => api.get('/api/moderator-requests', { params: { status: 'pending' } }).then(r => r.data),
  });

  const { mutate: handleRequest } = useMutation({
    mutationFn: ({ requestId, action }: { requestId: string; action: 'approve' | 'reject' }) =>
      api.patch(`/api/moderator-requests/${requestId}/review`, {
        status: action === 'approve' ? 'approved' : 'rejected',
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'moderator-requests'] });
      qc.invalidateQueries({ queryKey: ['admin', 'moderators'] });
    },
  });

  const { mutate: removeAccess } = useMutation({
    mutationFn: (modId: string) => api.delete(`/api/admin/moderators/${modId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'moderators'] });
      setSelectedMod(null);
    },
  });

  const moderators = modsData?.moderators || [];
  const pendingRequests = pendingData?.requests || [];


  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display font-bold text-2xl text-foreground">Moderator Management</h2>
          <p className="font-body text-sm text-muted-foreground">Manage and review moderator applications.</p>
        </div>
        <Button onClick={() => setIsInviteModalOpen(true)} variant="primary" className="gap-2">
          <UserPlus size={16} /> Invite Moderator
        </Button>
      </div>

      {/* Pending Requests Section */}
      {pendingRequests.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 px-1">
            <AlertCircle size={16} className="text-warning" />
            <h3 className="font-display font-semibold text-sm text-foreground">Pending Requests ({pendingRequests.length})</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pendingRequests.map((req: any) => (
              <div key={req.id} className="gradient-border rounded-2xl p-5 bg-card/50">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-xs font-display font-bold text-primary">
                    {req.user?.full_name[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-body font-semibold text-foreground">{req.user?.full_name}</p>
                    <p className="text-[11px] text-muted-foreground">{req.department?.short_name} · {req.user?.roll_number}</p>
                  </div>
                </div>
                <div className="bg-surface-1 rounded-xl p-3 mb-4 border border-border/30">
                  <p className="text-[10px] text-muted-foreground uppercase font-semibold mb-1">Reason for request</p>
                  <p className="text-xs font-body text-foreground line-clamp-2">{req.reason || "No reason provided."}</p>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleRequest({ requestId: req.id, action: 'approve' })}
                    className="flex-1 h-9 rounded-xl bg-success/10 text-success hover:bg-success/20 text-[11px] font-body font-medium transition-all flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle size={14} /> Approve
                  </button>
                  <button 
                    onClick={() => handleRequest({ requestId: req.id, action: 'reject' })}
                    className="flex-1 h-9 rounded-xl bg-danger/10 text-danger hover:bg-danger/20 text-[11px] font-body font-medium transition-all flex items-center justify-center gap-1.5"
                  >
                    <XCircle size={14} /> Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Moderators List */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6">
        <div className="space-y-4">
          <div className="flex items-center gap-2 px-1">
            <Shield size={16} className="text-primary" />
            <h3 className="font-display font-semibold text-sm text-foreground">Active Moderators ({moderators.length})</h3>
          </div>
          
          {isLoadingMods ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map(i => <div key={i} className="h-48 rounded-2xl shimmer" />)}
            </div>
          ) : moderators.length === 0 ? (
            <div className="text-center py-12 gradient-border rounded-2xl">
              <p className="text-sm font-body text-muted-foreground">No moderators found.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {moderators.map((mod: any) => (
                <div 
                  key={mod.id}
                  onClick={() => setSelectedMod(mod)}
                  className={cn(
                    "gradient-border rounded-2xl p-5 cursor-pointer transition-all hover:scale-[1.01]",
                    selectedMod?.id === mod.id ? "bg-primary/5 border-primary/40" : "bg-card/50"
                  )}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary/30 to-accent/20 flex items-center justify-center text-sm font-display font-bold text-foreground">
                        {mod.user?.full_name[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-body font-semibold text-foreground">{mod.user?.full_name}</p>
                        <p className="text-[11px] text-muted-foreground">{mod.department?.short_name} · {mod.user?.roll_number}</p>
                      </div>
                    </div>
                    <button className="w-8 h-8 rounded-lg hover:bg-surface-2 text-muted-foreground flex items-center justify-center">
                      <MoreHorizontal size={14} />
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2 py-3 border-t border-border/30">
                    <div className="text-center">
                      <p className="text-sm font-display font-bold text-foreground">{mod.total_actions || 0}</p>
                      <p className="text-[10px] text-muted-foreground">Actions</p>
                    </div>
                    <div className="text-center border-l border-border/30">
                      <p className="text-sm font-display font-bold text-foreground">{mod.approved_count || 0}</p>
                      <p className="text-[10px] text-muted-foreground">Approved</p>
                    </div>
                    <div className="text-center border-l border-border/30">
                      <p className="text-sm font-display font-bold text-foreground">{mod.rejected_count || 0}</p>
                      <p className="text-[10px] text-muted-foreground">Rejected</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Detail Panel */}
        <div className="space-y-4">
          <div className="bg-surface-1 rounded-2xl border border-border/50 p-5 sticky top-24 min-h-[400px]">
            {!selectedMod ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-12">
                <Shield size={32} className="text-muted-foreground/30 mb-4" />
                <h3 className="font-display font-semibold text-sm text-foreground">Moderator details</h3>
                <p className="text-xs text-muted-foreground font-body mt-2">Select a moderator to view their activity and manage permissions.</p>
              </div>
            ) : (
              <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="text-center pb-6 border-b border-border/30">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/30 to-accent/20 flex items-center justify-center text-2xl font-display font-bold text-foreground mx-auto">
                    {selectedMod.user?.full_name[0].toUpperCase()}
                  </div>
                  <h3 className="font-display font-semibold text-lg text-foreground mt-4">{selectedMod.user?.full_name}</h3>
                  <p className="text-xs text-muted-foreground font-body">{selectedMod.user?.email}</p>
                </div>

                <div className="mt-6 space-y-4">
                   <div className="bg-surface-2 rounded-xl p-4 border border-border/30">
                      <h4 className="text-[10px] text-muted-foreground uppercase font-bold mb-3 flex items-center gap-1.5">
                        <Activity size={10} /> Contribution Stats
                      </h4>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground font-body">Efficiency</span>
                          <span className="text-xs font-semibold text-success">High</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground font-body">Approval Rate</span>
                          <span className="text-xs font-semibold">{Math.round((selectedMod.approved_count / (selectedMod.total_actions || 1)) * 100)}%</span>
                        </div>
                      </div>
                   </div>

                   <Button variant="ghost" className="w-full text-xs gap-2 border border-border/50">
                      <Mail size={14} /> Message Moderator
                   </Button>
                   
                   <Button 
                    variant="ghost" 
                    onClick={() => removeAccess(selectedMod.id)}
                    className="w-full text-xs gap-2 border border-danger/20 text-danger hover:bg-danger/10"
                   >
                      <XCircle size={14} /> Remove Access
                   </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminModeratorManagement;
