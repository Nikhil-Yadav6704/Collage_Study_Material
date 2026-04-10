import { useState } from "react";
import { 
  Star, 
  MessageSquare, 
  Flag, 
  ChevronDown, 
  Filter, 
  Search, 
  Info, 
  FileText, 
  AlertTriangle, 
  X, 
  CheckCircle2,
  TrendingUp,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../lib/api";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

const FeedbackMaterialRow = ({ material }: { material: any }) => {
  const [expanded, setExpanded] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [selectedComment, setSelectedComment] = useState<any>(null);

  const handleReport = (comment: any) => {
    setSelectedComment(comment);
    setReportModalOpen(true);
  };

  return (
    <div className={cn(
      "gradient-border rounded-2xl overflow-hidden transition-all duration-300",
      expanded ? "feedback-row-expanded border-[hsl(172_70%_42%/0.3)] ring-1 ring-[hsl(172_70%_42%/0.1)]" : "hover:bg-surface-1/40"
    )}>
      {/* Collapsed Header */}
      <div 
        className="px-6 py-5 flex items-center gap-5 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="w-10 h-10 rounded-xl bg-surface-2 flex items-center justify-center border border-border/50 shadow-sm shrink-0">
           <FileText size={18} className="text-primary/70" />
        </div>
        <div className="flex-1 min-w-0">
           <h3 className="font-body font-semibold text-sm text-foreground truncate">{material.title}</h3>
           <p className="text-[11px] text-muted-foreground mt-0.5">{material.subject?.name} · CSE Department</p>
        </div>
        <div className="flex items-center gap-6 shrink-0">
           <div className="flex items-center gap-1.5 px-3 py-1 bg-surface-1 rounded-lg border border-border/30">
              <Star size={12} className="fill-warning text-warning" />
              <span className="text-[11px] font-bold text-foreground">{material.average_rating?.toFixed(1) || '0.0'}</span>
           </div>
           <div className="flex items-center gap-1.5 text-muted-foreground">
              <MessageSquare size={13} />
              <span className="text-[11px] font-body">{material.rating_count || 0}</span>
           </div>
           {material.flaggedCount > 0 && (
             <div className="flex items-center gap-1.5 text-danger bg-danger/10 px-2 py-0.5 rounded-full border border-danger/20 animate-pulse">
                <Flag size={12} />
                <span className="text-[10px] font-bold font-body">{material.flaggedCount}</span>
             </div>
           )}
           <ChevronDown className={cn("text-muted-foreground transition-transform duration-300 ml-2", expanded && "rotate-180")} size={16} />
        </div>
      </div>

      {/* Expanded Content */}
      {expanded && (
        <div className="px-6 pb-6 pt-2 animate-in slide-in-from-top-1 duration-300">
           <div className="h-px bg-border/20 mb-6" />
           
           <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-10">
              {/* Left Column: Stats Breakdown */}
              <div className="space-y-4">
                 <h4 className="text-[10px] uppercase font-bold text-muted-foreground/60 tracking-wider font-body mb-2">Rating Distribution</h4>
                 <div className="space-y-2">
                    {[5,4,3,2,1].map((star, i) => (
                      <div key={star} className="flex items-center gap-3 group">
                         <span className="text-[10px] font-body text-muted-foreground/60 w-5 flex items-center gap-0.5">{star} <Star size={8} /></span>
                         <div className="flex-1 h-1.5 bg-surface-2 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-warning transition-all duration-500" 
                              style={{ width: `${material.ratingsBreakdown?.[i] || 0}%` }}
                            />
                         </div>
                         <span className="text-[10px] font-body text-muted-foreground/40 w-4 text-right">{material.ratingsBreakdown?.[i] || 0}%</span>
                      </div>
                    ))}
                 </div>
              </div>

              {/* Right Column: Comments */}
              <div className="flex flex-col gap-0 divide-y divide-border/20">
                 <h4 className="text-[10px] uppercase font-bold text-muted-foreground/60 tracking-wider font-body mb-2 px-1">Recent Student Comments</h4>
                 {material.comments.length === 0 ? (
                   <p className="text-xs text-muted-foreground py-4 px-1">No comments yet.</p>
                 ) : material.comments.map((comment: any) => (
                   <div key={comment.id} className="py-5 first:pt-2 group/comment">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-3">
                           <div className="w-8 h-8 rounded-xl bg-surface-2 flex items-center justify-center text-[10px] font-display font-bold text-foreground border border-border/50">
                              {comment.user?.full_name?.[0] || '?'}
                           </div>
                           <div>
                              <p className="font-body text-xs font-semibold text-foreground">{comment.user?.full_name}</p>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                 <div className="flex gap-0.5">
                                    {[1,2,3,4,5].map(s => <Star key={s} size={10} className={s <= comment.score ? "fill-warning text-warning" : "text-border"} />)}
                                 </div>
                                 <span className="text-[9px] text-muted-foreground/50 font-body uppercase ml-1 tracking-widest">{formatDistanceToNow(new Date(comment.created_at))} ago</span>
                              </div>
                           </div>
                        </div>
                        <button 
                          onClick={() => handleReport(comment)}
                          className="text-[10px] text-muted-foreground/40 hover:text-danger opacity-0 group-hover/comment:opacity-100 transition-all font-body uppercase tracking-widest"
                        >Report</button>
                      </div>
                      <p className="font-body text-xs text-muted-foreground/80 leading-relaxed pl-11">{comment.comment}</p>
                   </div>
                 ))}
              </div>
           </div>
        </div>
      )}

      {/* Report Modal Integration */}
      {reportModalOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
           <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setReportModalOpen(false)} />
           <div className="glass-strong rounded-2xl p-8 max-w-sm w-full relative animate-in zoom-in duration-300">
              <div className="w-12 h-12 rounded-xl bg-danger/10 text-danger flex items-center justify-center mb-5">
                 <AlertTriangle size={24} />
              </div>
              <h3 className="font-display font-bold text-xl text-foreground">Report Comment</h3>
              <p className="font-body text-sm text-muted-foreground mt-1 mb-6">This will alert the admin for potential deletion.</p>
              
              <div className="bg-surface-1 rounded-xl p-4 border border-danger/10 mb-6 italic opacity-70">
                 <p className="text-xs text-muted-foreground font-body">"{selectedComment?.comment}"</p>
              </div>

              <div className="space-y-4 mb-8">
                 <div>
                    <label className="text-[10px] uppercase font-bold text-muted-foreground/60 mb-2 block tracking-wider font-body">Reason</label>
                    <select className="w-full bg-surface-2 border border-border/50 rounded-xl px-3 py-2.5 text-xs font-body outline-none focus:border-danger/30">
                       <option>Irrelevant Content</option>
                       <option>Inappropriate Language</option>
                       <option>Spam or Promo</option>
                       <option>Other</option>
                    </select>
                 </div>
              </div>

              <div className="flex gap-3">
                 <Button variant="ghost-border" className="flex-1" onClick={() => setReportModalOpen(false)}>Cancel</Button>
                 <Button variant="danger" className="flex-1 gap-2" onClick={() => setReportModalOpen(false)}>
                    <Flag size={14} /> Send Report
                 </Button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

const FeedbackCenter = () => {
  const [search, setSearch] = useState("");

  const { data: overview, isLoading: isLoadingOverview } = useQuery({
    queryKey: ['mod', 'feedback', 'overview'],
    queryFn: () => api.get('/api/moderator/feedback/overview').then(r => r.data),
  });

  const { data: materialsData, isLoading: isLoadingMaterials } = useQuery({
    queryKey: ['mod', 'feedback', 'materials'],
    queryFn: () => api.get('/api/moderator/feedback/materials').then(r => r.data),
  });

  const metrics = [
    { label: "Dept Avg Rating", value: overview?.avg_rating?.toFixed(1) || '0.0', type: "rating", icon: Star, color: "text-warning bg-warning/10" },
    { label: "Total Comments", value: overview?.total_comments?.toString() || '0', type: "count", icon: MessageSquare, color: "text-primary bg-primary/10" },
    { label: "New This Week", value: overview?.new_this_week?.toString() || '0', type: "count", icon: TrendingUp, color: "text-success bg-success/10" },
    { label: "Flagged Comments", value: overview?.flagged_count?.toString() || '0', type: "danger", icon: Flag, color: "text-danger bg-danger/5 border-danger/20" },
  ];

  const materials = materialsData?.materials || [];

  return (
    <div className="max-w-[1100px] mx-auto pb-20">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div>
           <h2 className="font-display font-bold text-2xl text-foreground">Feedback Center</h2>
           <p className="font-body text-sm text-muted-foreground mt-0.5">Student ratings and comments on department materials.</p>
        </div>
      </div>

      {/* Metrics Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
         {isLoadingOverview ? (
           [1,2,3,4].map(i => <div key={i} className="h-28 rounded-2xl shimmer" />)
         ) : metrics.map((m, i) => (
           <div key={i} className={cn(
             "bg-surface-1 border border-border/40 rounded-2xl px-6 py-5 flex flex-col gap-2 transition-all hover:scale-105",
             m.type === 'danger' && "border-danger/20"
           )}>
              <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", m.color)}>
                 <m.icon size={16} />
              </div>
              <div>
                 <p className="font-display font-bold text-2xl text-foreground">{m.value}</p>
                 <p className="text-[11px] font-body text-muted-foreground uppercase tracking-widest mt-0.5">{m.label}</p>
              </div>
           </div>
         ))}
      </div>

      {/* Search and Material Accordion */}
      <div className="flex flex-col gap-4">
         <div className="relative mb-2 group">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-[hsl(172_70%_55%)] transition-colors" />
            <input 
               value={search}
               onChange={(e) => setSearch(e.target.value)}
               placeholder="Filter by subject or material title..." 
               className="w-full bg-surface-1 border border-border/50 rounded-2xl pl-11 pr-5 py-4 text-sm font-body focus:outline-none focus:ring-1 focus:ring-[hsl(172_70%_42%/0.4)] transition-all"
            />
         </div>

         {isLoadingMaterials ? (
           [1,2,3].map(i => <div key={i} className="h-20 rounded-2xl shimmer" />)
         ) : materials.length === 0 ? (
           <div className="py-20 text-center">
              <Info size={40} className="mx-auto text-muted-foreground/30 mb-4" />
              <p className="font-body text-sm text-muted-foreground">No materials found.</p>
           </div>
         ) : (
           materials
            .filter((m: any) => m.title.toLowerCase().includes(search.toLowerCase()) || m.subject?.name?.toLowerCase().includes(search.toLowerCase()))
            .map((material: any) => (
              <FeedbackMaterialRow key={material.id} material={material} />
            ))
         )}
      </div>
    </div>
  );
};

export default FeedbackCenter;
