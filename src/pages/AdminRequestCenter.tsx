import { useState } from "react";
import { 
  CheckCircle, 
  XCircle, 
  FileText, 
  Clock, 
  ShieldPlus,
  AlertCircle,
  MoreVertical,
  Check,
  X,
  Loader2,
  Flag
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../lib/api";
import { cn } from "@/lib/utils";

const AdminRequestCenter = () => {
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<'uploads' | 'moderators' | 'reports'>('uploads');

  // Fetch upload requests
  const { data: uploadsData, isLoading: isLoadingUploads } = useQuery({
    queryKey: ['admin', 'upload-requests'],
    queryFn: () => api.get('/api/upload-requests', { params: { status: 'pending', limit: 50 } }).then(r => r.data),
    enabled: activeTab === 'uploads'
  });

  // Fetch moderator requests
  const { data: modsData, isLoading: isLoadingMods } = useQuery({
    queryKey: ['admin', 'moderator-requests'],
    queryFn: () => api.get('/api/moderator-requests', { params: { status: 'pending' } }).then(r => r.data),
    enabled: activeTab === 'moderators'
  });

  const { mutate: handleUpload } = useMutation({
    mutationFn: ({ id, action }: { id: string; action: 'approve' | 'reject' }) => 
      api.patch(`/api/upload-requests/${id}/review`, { action }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'upload-requests'] }),
  });

  const { mutate: handleModRequest } = useMutation({
    mutationFn: ({ requestId, action }: { requestId: string; action: 'approve' | 'reject' }) =>
      api.patch(`/api/moderator-requests/${requestId}/review`, {
        status: action === 'approve' ? 'approved' : 'rejected',
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'moderator-requests'] }),
  });

  const uploadRequests = uploadsData?.requests || [];
  const moderatorRequests = modsData?.requests || [];


  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display font-bold text-2xl text-foreground">Request Center</h2>
          <p className="font-body text-sm text-muted-foreground">Review and act on all pending requests.</p>
        </div>
      </div>

      <div className="flex items-center gap-0 border-b border-border/50 mb-6 shrink-0">
        {[
          { id: 'uploads', label: 'Upload Requests', count: uploadRequests.length },
          { id: 'moderators', label: 'Moderator Requests', count: moderatorRequests.length },
          { id: 'reports', label: 'Reports', count: 0 }
        ].map((tab: any) => (
          <button 
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-6 py-3 text-sm font-body cursor-pointer border-b-2 -mb-px transition-all relative group ${
              activeTab === tab.id ? 'text-foreground border-primary font-semibold' : 'text-muted-foreground border-transparent hover:text-foreground hover:border-border'
            }`}
          >
            {tab.label}
            {tab.count > 0 && (
              <span className="ml-2 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary transition-colors">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="flex-1">
        {activeTab === 'uploads' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {isLoadingUploads ? (
              [1, 2, 3].map(i => <div key={i} className="h-48 rounded-2xl shimmer" />)
            ) : uploadRequests.length === 0 ? (
              <div className="col-span-full py-12 text-center gradient-border rounded-2xl">
                <p className="text-sm font-body text-muted-foreground">No pending upload requests.</p>
              </div>
            ) : (
              uploadRequests.map((req: any) => (
                <div key={req.id} className="gradient-border rounded-2xl p-5 bg-card/50 hover:shadow-md transition-all">
                  <div className="flex items-center justify-between mb-4">
                    <span className="bg-primary/10 text-primary border border-primary/20 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase transition-all">
                      {req.material_type}
                    </span>
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1 font-body">
                      <Clock size={10} /> {new Date(req.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <h4 className="font-display font-semibold text-sm text-foreground line-clamp-2 min-h-[40px]">{req.title}</h4>
                  <p className="text-[11px] text-muted-foreground font-body mt-1">
                    {req.department?.short_name} · Sem {req.semester} · {req.uploader?.full_name}
                  </p>
                  
                  <div className="flex gap-2 mt-6">
                    <button 
                      onClick={() => handleUpload({ id: req.id, action: 'approve' })}
                      className="flex-1 h-9 rounded-xl bg-success/10 text-success hover:bg-success/20 text-[11px] font-body font-semibold transition-all flex items-center justify-center gap-1.5"
                    >
                      <Check size={14} /> Approve
                    </button>
                    <button 
                      onClick={() => handleUpload({ id: req.id, action: 'reject' })}
                      className="flex-1 h-9 rounded-xl bg-danger/10 text-danger hover:bg-danger/20 text-[11px] font-body font-semibold transition-all flex items-center justify-center gap-1.5"
                    >
                      <X size={14} /> Reject
                    </button>

                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'moderators' && (
          <div className="space-y-4">
            {isLoadingMods ? (
              [1, 2].map(i => <div key={i} className="h-56 rounded-2xl shimmer" />)
            ) : moderatorRequests.length === 0 ? (
              <div className="py-12 text-center gradient-border rounded-2xl">
                <p className="text-sm font-body text-muted-foreground">No pending moderator requests.</p>
              </div>
            ) : (
              moderatorRequests.map((req: any) => (
                <div key={req.id} className="gradient-border rounded-2xl p-6 bg-card border border-border/30">
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/30 to-accent/20 flex items-center justify-center text-lg font-display font-bold">
                        {req.user?.full_name[0].toUpperCase()}
                      </div>
                      <div>
                        <h4 className="font-display font-semibold text-base text-foreground">{req.user?.full_name}</h4>
                        <p className="text-xs font-body text-muted-foreground mt-1">{req.user?.roll_number} · {req.department?.name}</p>
                      </div>
                    </div>
                    <span className="text-[11px] text-muted-foreground font-body">{new Date(req.created_at).toLocaleDateString()}</span>
                  </div>

                  <div className="bg-surface-1/50 rounded-xl p-4 mb-8 border border-border/20">
                    <p className="text-[10px] text-muted-foreground uppercase font-bold mb-2 tracking-wider">Application Reason</p>
                    <p className="text-sm font-body text-foreground leading-relaxed italic">"{req.reason || "No reason provided."}"</p>
                  </div>

                  <div className="flex gap-3">
                    <Button 
                      onClick={() => handleModRequest({ requestId: req.id, action: 'approve' })}
                      className="flex-1 gap-2 bg-success hover:bg-success/90"
                    >
                      <ShieldPlus size={16} /> Approve as Moderator
                    </Button>
                    <Button 
                      variant="ghost" 
                      onClick={() => handleModRequest({ requestId: req.id, action: 'reject' })}
                      className="flex-1 border border-danger/30 text-danger hover:bg-danger/10"
                    >
                      <XCircle size={16} /> Decline Request
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'reports' && (
          <div className="py-20 text-center gradient-border rounded-2xl">
            <Flag size={32} className="text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-sm font-body text-muted-foreground">No active reports requiring attention.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminRequestCenter;
