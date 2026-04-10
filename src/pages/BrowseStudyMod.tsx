import { 
  Search, 
  X, 
  Plus, 
  Star, 
  Download, 
  Bookmark, 
  Eye, 
  Upload, 
  Pencil, 
  MessageSquare, 
  Trash2, 
  AlertTriangle,
  ChevronRight,
  Info
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'react-router-dom';
import api from '../lib/api';
import { useAuthStore } from '../store/authStore';
import { cn } from "@/lib/utils";
import { useDebounce } from "@/hooks/useDebounce";

const materialTypes = [
  "All Types",
  "📝 Notes",
  "📄 PYQs",
  "🎥 YouTube",
  "📚 Books",
  "🤖 AI Notes",
  "👨‍🏫 Teacher's",
  "👨‍🎓 Student's",
  "📋 Guidelines",
];

const badgeStyles: Record<string, string> = {
  notes: "bg-primary/15 text-primary",
  pyq: "bg-warning/15 text-warning",
  youtube: "bg-danger/15 text-danger",
  book: "bg-success/15 text-success",
  ai_notes: "bg-accent/15 text-accent",
  teacher_notes: "bg-[hsl(270,70%,60%)]/15 text-[hsl(270,70%,75%)]",
  student_notes: "bg-info/15 text-info",
  guidelines: "bg-[hsl(320,68%,58%)]/15 text-[hsl(320,68%,75%)]",
};

const typeMap: Record<string, string> = {
  '📝 Notes': 'notes',
  '📄 PYQs': 'pyq',
  '🎥 YouTube': 'youtube',
  '📚 Books': 'book',
  '🤖 AI Notes': 'ai_notes',
  "👨‍🏫 Teacher's": 'teacher_notes',
  "👨‍🎓 Student's": 'student_notes',
};

const BrowseStudyMod = () => {
  const user = useAuthStore(s => s.user);
  const location = useLocation();
  const qc = useQueryClient();

  // Initialize search from URL query param if present
  const params = new URLSearchParams(location.search);
  const initialSearch = params.get('search') || "";

  const [rawSearch, setRawSearch] = useState(initialSearch);
  const search = useDebounce(rawSearch, 300);
  const [activeFilter, setActiveFilter] = useState("All Types");
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<any>(null);

  // Sync state if URL changes (header search)
  useEffect(() => {
    const newSearch = new URLSearchParams(location.search).get('search');
    if (newSearch !== null) setRawSearch(newSearch);
  }, [location.search]);

  const { data, isLoading } = useQuery({
    queryKey: ['mod', 'browse', { search, activeFilter }],
    queryFn: () => api.get('/api/materials', {
      params: {
        search: search || undefined,
        type: typeMap[activeFilter] || undefined,
      }
    }).then(r => r.data),
  });

  const { mutate: deleteMaterial } = useMutation({
    mutationFn: (id: string) => api.delete(`/api/materials/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['mod', 'browse'] });
      setIsDeleteOpen(false);
    },
  });

  const { mutate: updateMaterial } = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: any }) =>
      api.patch(`/api/materials/${id}`, updates),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['mod', 'browse'] });
      setIsEditOpen(false);
    },
  });

  const materials = data?.materials || [];

  const handleAction = (material: any, action: string) => {
    setSelectedMaterial(material);
    if (action === 'edit') setIsEditOpen(true);
    if (action === 'delete') setIsDeleteOpen(true);
    if (action === 'feedback') setIsFeedbackOpen(true);
  };

  const getOrdinal = (n: number) => {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  };

  return (
    <div className="relative min-h-full">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div>
            <h2 className="font-display font-bold text-2xl text-foreground">
              Browse & Study
            </h2>
            <div className="flex items-center gap-2 mt-0.5">
              <p className="text-sm text-muted-foreground font-body">
                {user?.department?.short_name || 'CSE'} Department — Viewing as Moderator
              </p>
              <div className="inline-flex items-center gap-1.5 bg-[hsl(172_70%_42%/0.1)] border border-[hsl(172_70%_42%/0.2)] rounded-full px-2 py-0.5 animate-in fade-in zoom-in slide-in-from-left-4 duration-500 delay-200">
                <Eye size={10} className="text-[hsl(172_70%_55%)]" />
                <span className="text-[10px] font-body text-[hsl(172_70%_55%)] font-medium">Moderator controls active</span>
              </div>
            </div>
          </div>
        </div>
        <Button variant="mod-primary" size="sm" className="gap-2 shadow-lg" asChild>
          <a href="/moderator/upload">
            <Upload size={16} /> Upload Material
          </a>
        </Button>
      </div>

      <div className="relative w-full mb-4 group">
        <Search
          size={16}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-[hsl(172_70%_55%)] transition-colors"
        />
        <input
          value={rawSearch}
          onChange={(e) => setRawSearch(e.target.value)}
          className="bg-surface-1 border border-border/50 rounded-2xl pl-11 pr-10 py-3.5 text-sm font-body text-foreground placeholder:text-muted-foreground/30 w-full focus:outline-none focus:ring-1 focus:ring-[hsl(172_70%_42%/0.4)] focus:border-[hsl(172_70%_42%/0.3)] transition-all"
          placeholder="Search by subject name or material title..."
        />
        {rawSearch && (
          <button
            onClick={() => setRawSearch("")}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X size={16} />
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {materialTypes.map((chip) => (
          <button
            key={chip}
            onClick={() => setActiveFilter(chip)}
            className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-[11px] font-body cursor-pointer transition-all ${
              activeFilter === chip
                ? "bg-[hsl(172_70%_42%/0.12)] border border-[hsl(172_70%_42%/0.3)] text-[hsl(172_70%_55%)]"
                : "bg-surface-1 border border-border text-muted-foreground hover:border-[hsl(172_70%_42%/0.4)] hover:text-foreground"
            }`}
          >
            {chip}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1,2,3,4,5,6].map(i => <div key={i} className="h-48 rounded-2xl shimmer" />)}
        </div>
      ) : materials.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
           <Info size={40} className="text-muted-foreground/20 mb-4" />
           <h3 className="font-display font-semibold text-foreground">No materials found</h3>
           <p className="font-body text-sm text-muted-foreground mt-1">Try adjusting your search or filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {materials.map((m: any) => (
            <div
              key={m.id}
              className="gradient-border rounded-2xl p-5 hover:bg-surface-1/50 transition-all duration-300 group relative overflow-hidden"
            >
              <div className="flex items-start justify-between mb-3">
                <span
                  className={cn(
                    "rounded-full px-2.5 py-0.5 text-[10px] font-body font-medium uppercase tracking-wider",
                    badgeStyles[m.material_type] || "bg-surface-2 text-muted-foreground"
                  )}
                >
                  {m.material_type.replace('_', ' ')}
                </span>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleAction(m, 'feedback'); }}
                    className="flex items-center gap-1 bg-surface-2/80 hover:bg-surface-2 rounded-full px-2 py-0.5 text-[10px] font-body text-muted-foreground transition-colors group/fb"
                  >
                    <MessageSquare size={10} className="group-hover/fb:text-[hsl(172_70%_55%)] transition-colors" />
                    <span>{m.rating_count || 0}</span>
                  </button>
                  <button className="w-7 h-7 rounded-lg hover:bg-surface-2 flex items-center justify-center transition-colors">
                    <Bookmark
                      size={14}
                      className="text-muted-foreground group-hover:text-foreground"
                    />
                  </button>
                </div>
              </div>
              
              <h3 className="font-display font-semibold text-sm text-foreground mb-1 leading-tight group-hover:text-[hsl(172_70%_55%)] transition-colors">
                {m.subject?.name || 'Unknown Subject'}
              </h3>
              <p className="font-body text-xs text-muted-foreground mb-4 leading-relaxed line-clamp-2">
                {m.title}
              </p>
              
              <div className="flex items-center gap-3 flex-wrap text-[10px] font-body text-muted-foreground mb-4">
                <span className="bg-surface-2 rounded-full px-2 py-0.5">
                  {getOrdinal(m.semester)} Sem
                </span>
                <span>{m.department?.short_name}</span>
                <span>·</span>
                <span>by {m.uploader?.full_name || 'Unknown'}</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      size={10}
                      className={
                        s <= Math.round(m.average_rating)
                          ? "fill-warning text-warning"
                          : "text-border"
                      }
                    />
                  ))}
                  <span className="text-[11px] text-muted-foreground ml-1">
                    ({m.average_rating?.toFixed(1) || '0.0'})
                  </span>
                </div>
                <button className="w-7 h-7 rounded-lg bg-[hsl(172_70%_42%/0.1)] hover:bg-[hsl(172_70%_42%/0.2)] flex items-center justify-center transition-colors">
                  <Download size={14} className="text-[hsl(172_70%_55%)]" />
                </button>
              </div>

              {/* Moderator Action Bar */}
              <div className="mod-action-bar mt-4 pt-4 flex items-center justify-between border-t border-border/20">
                <span className="text-[9px] font-body text-muted-foreground/50 uppercase tracking-widest">Mod Controls</span>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleAction(m, 'edit'); }}
                    className="flex items-center gap-1.5 h-7 rounded-lg bg-primary/10 px-2.5 text-[10px] font-body text-primary hover:bg-primary/20 transition-colors"
                  >
                    <Pencil size={11} /> <span>Edit</span>
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleAction(m, 'feedback'); }}
                    className="flex items-center gap-1.5 h-7 rounded-lg bg-[hsl(172_70%_42%/0.1)] px-2.5 text-[10px] font-body text-[hsl(172_70%_55%)] hover:bg-[hsl(172_70%_42%/0.2)] transition-colors"
                  >
                    <MessageSquare size={11} /> <span>Feedback</span>
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleAction(m, 'delete'); }}
                    className="w-7 h-7 rounded-lg bg-danger/10 hover:bg-danger/20 flex items-center justify-center transition-colors text-danger"
                  >
                    <Trash2 size={11} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Drawer Overlay Placeholder */}
      {isEditOpen && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsEditOpen(false)} />
          <div className="w-full max-w-md bg-sidebar-bg border-l border-border h-full relative p-6 animate-in slide-in-from-right duration-300">
            <button onClick={() => setIsEditOpen(false)} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground">
              <X size={20} />
            </button>
            <h3 className="font-display font-bold text-lg mt-2">Edit Material</h3>
            <p className="font-body text-xs text-muted-foreground mt-1 mb-8">Changes save instantly and are visible to students.</p>
            
            <div className="space-y-5">
              <div>
                <label className="text-[11px] font-body font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Material Title</label>
                <input 
                  type="text" 
                  id="edit-title"
                  defaultValue={selectedMaterial?.title}
                  className="w-full bg-surface-1 border border-border rounded-xl px-4 py-2.5 text-sm font-body text-foreground focus:outline-none focus:ring-1 focus:ring-[hsl(172_70%_42%/0.4)]"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-body font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Semester</label>
                  <select id="edit-semester" defaultValue={selectedMaterial?.semester} className="w-full bg-surface-1 border border-border rounded-xl px-3 py-2.5 text-sm font-body text-foreground focus:outline-none">
                    {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>{getOrdinal(s)} Sem</option>)}
                  </select>
                </div>
                <div>
                   <label className="text-[11px] font-body font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Type</label>
                   <select id="edit-type" defaultValue={selectedMaterial?.material_type} className="w-full bg-surface-1 border border-border rounded-xl px-3 py-2.5 text-sm font-body text-foreground focus:outline-none capitalize">
                     {Object.values(typeMap).map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
                   </select>
                </div>
              </div>
            </div>
            
            <div className="absolute bottom-6 left-6 right-6 space-y-3">
              <Button variant="mod-primary" className="w-full h-11" onClick={() => {
                const title = (document.getElementById('edit-title') as HTMLInputElement).value;
                const semester = parseInt((document.getElementById('edit-semester') as HTMLSelectElement).value);
                const type = (document.getElementById('edit-type') as HTMLSelectElement).value;
                updateMaterial({ id: selectedMaterial.id, updates: { title, semester, material_type: type } });
              }}>Save Changes</Button>
              <Button variant="ghost-border" className="w-full h-11" onClick={() => setIsEditOpen(false)}>Cancel</Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal Overlay Placeholder */}
      {isDeleteOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsDeleteOpen(false)} />
          <div className="glass-strong rounded-2xl p-8 max-w-sm w-full relative animate-in zoom-in duration-300 text-center">
            <div className="w-16 h-16 rounded-2xl bg-danger/10 text-danger flex items-center justify-center mx-auto mb-4">
              <AlertTriangle size={32} />
            </div>
            <h3 className="font-display font-bold text-xl text-foreground">Delete Material?</h3>
            <p className="font-body text-sm text-muted-foreground mt-2">
              "{selectedMaterial?.title}" will be permanently removed. This action cannot be undone.
            </p>
            <div className="flex gap-3 mt-8">
               <Button variant="ghost-border" className="flex-1" onClick={() => setIsDeleteOpen(false)}>Cancel</Button>
               <Button variant="danger" className="flex-1" onClick={() => deleteMaterial(selectedMaterial.id)}>Yes, Delete</Button>
            </div>
          </div>
        </div>
      )}

      {/* Feedback Panel Placeholder */}
      {isFeedbackOpen && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsFeedbackOpen(false)} />
          <div className="w-full max-w-md bg-sidebar-bg border-l border-border h-full relative flex flex-col p-6 animate-in slide-in-from-right duration-300">
             <button onClick={() => setIsFeedbackOpen(false)} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground">
               <X size={20} />
             </button>
             <h3 className="font-display font-bold text-lg mt-2">Material Feedback</h3>
             <p className="font-body text-xs text-muted-foreground mt-1 mb-6 truncate">{selectedMaterial?.title}</p>
             
             <div className="flex items-center gap-4 py-4 border-b border-border/40">
                <div className="font-display font-bold text-4xl text-foreground">{selectedMaterial?.average_rating?.toFixed(1) || '0.0'}</div>
                <div>
                   <div className="flex gap-0.5">
                      {[1,2,3,4,5].map(s => <Star key={s} size={14} className={s <= Math.round(selectedMaterial?.average_rating) ? "fill-warning text-warning" : "text-border"} />)}
                   </div>
                   <p className="text-[10px] text-muted-foreground font-body mt-1">Based on {selectedMaterial?.rating_count || 0} student reviews</p>
                </div>
             </div>

             <div className="flex-1 overflow-y-auto custom-scrollbar pt-4 text-center py-10 opacity-50">
                <MessageSquare size={32} className="mx-auto mb-2 text-muted-foreground/30" />
                <p className="text-xs font-body">Feedback comments wiring in progress...</p>
             </div>

             <div className="mt-auto pt-6 border-t border-border/40">
                <Button variant="mod-primary" className="w-full h-11" onClick={() => setIsFeedbackOpen(false)}>Done Checking</Button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BrowseStudyMod;
