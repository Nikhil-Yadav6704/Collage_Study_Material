import { useState } from "react";
import { 
  Inbox, 
  Check, 
  X, 
  Search, 
  Clock, 
  FileText, 
  PlayCircle, 
  Link as LinkIcon, 
  PenLine, 
  ChevronDown, 
  Archive, 
  CheckCircle2, 
  User, 
  Filter,
  Loader2,
  ExternalLink
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../lib/api";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

const RequestCard = ({ request }: { request: any }) => {
  const qc = useQueryClient();
  const [isExpanding, setIsExpanding] = useState<'none' | 'approve' | 'reject'>('none');
  const [selected, setSelected] = useState(false);

  const { mutate: handleReview, isPending } = useMutation({
    // Fix 5A: Backend expects { action: 'approve'|'approve_with_edits'|'reject' }
    mutationFn: (updates: any) => api.patch(`/api/upload-requests/${request.id}/review`, updates),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['mod', 'upload-requests'] });
      setIsExpanding('none');
    },
  });

  const getOrdinal = (n: number) => {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  };

  return (
     <div className={cn(
       "gradient-border rounded-2xl p-6 transition-all duration-300 group",
       request.status === 'approved' ? 'bg-success/5 border-success/20' : 
       request.status === 'rejected' ? 'bg-danger/5 border-danger/20' : ''
     )}>
        <div className="flex items-start justify-between">
           <div className="flex items-start gap-4">
              <div 
                className={cn(
                  "w-5 h-5 rounded border border-border/60 mt-1 cursor-pointer flex items-center justify-center transition-all",
                  selected ? "bg-[hsl(172_70%_42%)] border-[hsl(172_70%_42%)] text-white" : "hover:border-[hsl(172_70%_42%/0.5)] bg-surface-2"
                )}
                onClick={() => setSelected(!selected)}
              >
                {selected && <Check size={12} />}
              </div>
              <div className="flex flex-col gap-1">
                 <div className="flex items-center gap-2">
                   <span className="bg-surface-2 text-muted-foreground rounded-full px-2.5 py-0.5 text-[10px] font-body uppercase tracking-wider border border-border/40 font-semibold">{request.material_type}</span>
                   <span className="flex items-center gap-1 text-[11px] text-muted-foreground font-body">
                      <Clock size={11} /> Submitted {formatDistanceToNow(new Date(request.created_at))} ago
                   </span>
                 </div>
              </div>
           </div>
           
           <div className={cn(
             "px-3 py-1 rounded-full text-[11px] font-body font-semibold uppercase tracking-widest border",
             request.status === 'pending' ? 'bg-warning/15 text-warning border-warning/25' :
             request.status === 'approved' ? 'bg-success/15 text-success border-success/25' :
             'bg-danger/15 text-danger border-danger/25'
           )}>
             {request.status}
           </div>
        </div>

        {/* Fix 5B: Use request.submitter (backend join alias), not request.uploader */}
        <div className="flex items-center gap-3 mt-4 pb-4 border-b border-border/30">
           <div className="w-10 h-10 rounded-xl bg-surface-2 flex items-center justify-center text-xs font-display font-bold text-foreground border border-border/50 shadow-sm">
              {request.submitter?.full_name?.[0] || '?'}
           </div>
           <div>
              <p className="font-body text-sm font-semibold text-foreground">{request.submitter?.full_name}</p>
              <p className="text-[11px] text-muted-foreground font-body">{request.submitter?.roll_number} · {request.department?.short_name}</p>
           </div>
        </div>

        <div className="mt-4">
           <h3 className="font-display font-semibold text-base text-foreground leading-snug group-hover:text-[hsl(172_70%_55%)] transition-colors">{request.title}</h3>
           <div className="flex gap-3 mt-1.5 text-[11px] font-body text-muted-foreground/70">
              <span>{request.subject?.name}</span>
              <span>·</span>
              <span>{getOrdinal(request.semester)} Sem</span>
           </div>
           
           {/* Fix 5C: Use request.student_note (backend field name), not request.notes */}
           {request.student_note && (
             <div className="mt-4 bg-muted/30 rounded-xl p-4 border-l-2 border-[hsl(172_70%_42%/0.4)] relative">
                <p className="text-[9px] font-bold text-muted-foreground/50 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                   <User size={10} /> Note from student
                </p>
                <p className="font-body text-xs text-muted-foreground italic leading-relaxed">"{request.student_note}"</p>
             </div>
           )}

           {/* Fix 5D: Use request.external_url or request.file_key, not request.file_url */}
           {(request.external_url || request.file_key) && (
             <div className="mt-4 bg-surface-1 rounded-xl p-3 flex items-center justify-between border border-border/40 group/file cursor-pointer hover:border-primary/30 transition-all">
                <div className="flex items-center gap-3">
                   <div className="w-8 h-8 rounded-lg bg-surface-2 flex items-center justify-center text-danger/70">
                      <FileText size={16} />
                   </div>
                   <div className="flex flex-col">
                      <span className="font-body text-xs text-foreground font-medium">
                        {request.file_key ? (request.file_name || 'Uploaded File') : 'External Link'}
                      </span>
                      <span className="text-[10px] text-muted-foreground/60">
                        {request.file_key ? 'PDF / Document' : request.external_url}
                      </span>
                   </div>
                </div>
                {request.external_url && (
                  <a href={request.external_url} target="_blank" rel="noreferrer" className="text-[11px] text-primary hover:underline font-body font-medium flex items-center gap-1">
                    <ExternalLink size={11} /> Open Link
                  </a>
                )}
                {request.file_key && !request.external_url && (
                  <span className="text-[11px] text-muted-foreground font-body">File on server</span>
                )}
             </div>
           )}
        </div>

        {request.status === 'pending' && (
          <div className="mt-6">
             <div className="flex gap-3 border-t border-border/20 pt-5">
                {/* Fix 5A: Send { action: 'approve' } not { status: 'approved' } */}
                <Button 
                  variant="success" 
                  disabled={isPending}
                  className="flex-1 rounded-xl gap-2 h-11" 
                  onClick={() => handleReview({ action: 'approve' })}
                >
                   {isPending ? <Loader2 className="animate-spin" size={16} /> : <Check size={16} />} Approve
                </Button>
                <Button 
                  variant="ghost-border" 
                  className="flex-1 rounded-xl gap-2 h-11" 
                  onClick={() => setIsExpanding(isExpanding === 'approve' ? 'none' : 'approve')}
                >
                   <PenLine size={16} /> Edit & Approve
                </Button>
                <Button 
                  variant="danger" 
                  className="flex-1 rounded-xl gap-2 h-11" 
                  onClick={() => setIsExpanding(isExpanding === 'reject' ? 'none' : 'reject')}
                >
                   <X size={16} /> Reject
                </Button>
             </div>

             {/* Expansion Approve with Edits */}
             {isExpanding === 'approve' && (
                <div className="mt-4 bg-surface-1/50 rounded-2xl p-5 border border-[hsl(172_70%_42%/0.2)] animate-in slide-in-from-top-2 duration-300">
                   <h4 className="font-display font-semibold text-sm mb-4">Edit before approving</h4>
                   <form onSubmit={(e) => {
                     e.preventDefault();
                     const formData = new FormData(e.currentTarget);
                     // Fix 5A: Send action: 'approve_with_edits'
                     handleReview({
                       action: 'approve_with_edits',
                       title: formData.get('title'),
                       review_note: formData.get('review_note'),
                     });
                   }} className="space-y-4">
                      <div>
                         <label className="text-[10px] uppercase font-bold text-muted-foreground/60 mb-2 block tracking-wider font-body">Refined Title</label>
                         <input name="title" defaultValue={request.title} className="w-full bg-surface-2 border border-border/50 rounded-xl px-4 py-2.5 text-xs font-body" />
                      </div>
                      <div>
                         <label className="text-[10px] uppercase font-bold text-muted-foreground/60 mb-2 block tracking-wider font-body">Review Note (optional)</label>
                         <input name="review_note" placeholder="Any notes for the student..." className="w-full bg-surface-2 border border-border/50 rounded-xl px-4 py-2.5 text-xs font-body" />
                      </div>
                      <div className="flex gap-3 mt-6">
                        <Button type="submit" variant="mod-primary" className="flex-1 h-10 text-xs" disabled={isPending}>
                          {isPending ? 'Processing...' : 'Approve & Go Live'}
                        </Button>
                        <Button type="button" variant="ghost-border" className="h-10 text-xs" onClick={() => setIsExpanding('none')}>Cancel</Button>
                      </div>
                   </form>
                </div>
             )}

             {/* Expansion Reject */}
             {isExpanding === 'reject' && (
                <div className="mt-4 bg-danger/5 rounded-2xl p-5 border border-danger/20 animate-in slide-in-from-top-2 duration-300">
                   <h4 className="font-display font-semibold text-sm mb-4 text-danger">Rejection details</h4>
                   <form onSubmit={(e) => {
                     e.preventDefault();
                     const formData = new FormData(e.currentTarget);
                     // Fix 5A: Send action: 'reject'
                     handleReview({
                       action: 'reject',
                       rejection_reason: formData.get('reason'),
                     });
                   }}>
                      <label className="text-[10px] uppercase font-bold text-danger/60 mb-2 block tracking-wider font-body">Reason (student will see this)</label>
                      <textarea name="reason" placeholder="e.g. This subject is already well-covered. Please check existing materials..." className="w-full bg-surface-2 border border-border/50 rounded-xl px-4 py-3 text-xs font-body h-20 resize-none outline-none focus:border-danger/40" />
                      <div className="flex gap-3 mt-6">
                        <Button type="submit" variant="danger" className="flex-1 h-10 text-xs" disabled={isPending}>
                          {isPending ? 'Processing...' : 'Confirm Rejection'}
                        </Button>
                        <Button type="button" variant="ghost-border" className="h-10 text-xs" onClick={() => setIsExpanding('none')}>Cancel</Button>
                      </div>
                   </form>
                </div>
             )}
          </div>
        )}
     </div>
  );
};

const StudentRequests = () => {
  const [activeTab, setActiveTab] = useState('pending');
  const [search, setSearch] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ['mod', 'upload-requests', activeTab],
    queryFn: () => api.get('/api/upload-requests', { params: { status: activeTab === 'all' ? undefined : activeTab } }).then(r => r.data),
  });

  const requests = data?.requests || [];

  return (
    <div className="max-w-[1000px] mx-auto pb-20 relative">
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div>
           <h2 className="font-display font-bold text-2xl text-foreground">Student Requests</h2>
           <p className="font-body text-sm text-muted-foreground mt-0.5">Review material submissions from students.</p>
        </div>
        <div className="flex items-center gap-3">
           <Button variant="ghost-border" size="sm" className="gap-2">
             <Filter size={14} /> Filter
           </Button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative mb-8 group">
         <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-[hsl(172_70%_55%)] transition-colors" />
         <input 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by student name, roll no, or material title..." 
            className="w-full bg-surface-1 border border-border/50 rounded-2xl pl-11 pr-5 py-3.5 text-sm font-body focus:outline-none focus:ring-1 focus:ring-[hsl(172_70%_42%/0.4)] focus:border-[hsl(172_70%_42%/0.3)] transition-all"
         />
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-0 border-b border-border/30 mb-8 overflow-x-auto custom-scrollbar whitespace-nowrap">
         {['all', 'pending', 'approved', 'rejected'].map((tabId) => {
           const active = activeTab === tabId;
           return (
             <button
               key={tabId}
               onClick={() => setActiveTab(tabId)}
               className={cn(
                 "px-6 py-4 text-sm font-body relative transition-all capitalize",
                 active ? "text-foreground font-semibold" : "text-muted-foreground hover:text-foreground"
               )}
             >
                <div className="flex items-center gap-2">
                   {tabId}
                   <span className="rounded-full px-2 py-0.5 text-[10px] font-bold bg-surface-2 text-muted-foreground border border-border/40">
                      {activeTab === tabId ? requests.length : '-'}
                   </span>
                </div>
                {active && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[hsl(172_70%_42%)] shadow-[0_-2px_10px_hsl(172_70%_42%/0.5)] animate-in slide-in-from-bottom-1 duration-300" />}
             </button>
           );
         })}
      </div>

      {/* Request List */}
      <div className="flex flex-col gap-5">
         {isLoading ? (
           [1,2,3].map(i => <div key={i} className="h-64 rounded-2xl shimmer" />)
         ) : requests.length === 0 ? (
           <div className="py-20 text-center animate-in fade-in zoom-in duration-500">
              <div className="w-16 h-16 bg-surface-1 rounded-3xl border border-border/40 flex items-center justify-center mx-auto mb-4 text-muted-foreground/30">
                 <Archive size={32} />
              </div>
              <h3 className="font-display font-semibold text-lg text-foreground">No requests found</h3>
              <p className="font-body text-sm text-muted-foreground mt-2 max-w-xs mx-auto">All student submissions for this category have been processed.</p>
           </div>
         ) : (
           requests
             // Fix 5B: Use submitter (not uploader) in search filter
             .filter((r: any) => 
               r.submitter?.full_name?.toLowerCase().includes(search.toLowerCase()) || 
               r.title.toLowerCase().includes(search.toLowerCase()) ||
               r.subject?.name?.toLowerCase().includes(search.toLowerCase())
             )
             .map((req: any) => (
               <RequestCard key={req.id} request={req} />
             ))
         )}
      </div>
    </div>
  );
};

export default StudentRequests;
