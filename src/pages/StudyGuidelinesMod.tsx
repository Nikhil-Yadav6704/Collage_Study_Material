import { useState, useEffect } from "react";
import { 
  BookMarked, 
  Search, 
  ChevronRight, 
  ChevronDown, 
  Eye, 
  EyeOff, 
  Cloud, 
  CloudOff, 
  Save, 
  Undo, 
  Redo, 
  Bold, 
  Italic, 
  List as ListIcon, 
  Heading1, 
  Heading2, 
  Quote, 
  Code, 
  Info,
  CheckCircle2,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../lib/api";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

const StudyGuidelinesMod = () => {
  const qc = useQueryClient();
  const [selectedSubject, setSelectedSubject] = useState<any>(null);
  const [content, setContent] = useState("");
  const [search, setSearch] = useState("");

  // Get all subjects in the department
  const { data: subjectsData, isLoading: isLoadingSubjects } = useQuery({
    queryKey: ['mod', 'subjects'],
    queryFn: () => api.get('/api/subjects').then(r => r.data),
  });

  // Get guideline for selected subject
  const { data: guidelineData, isLoading: isLoadingGuideline } = useQuery({
    queryKey: ['mod', 'guideline', selectedSubject?.id],
    queryFn: () => api.get(`/api/guidelines/${selectedSubject.id}`).then(r => r.data),
    enabled: !!selectedSubject?.id,
  });

  useEffect(() => {
    if (guidelineData?.guideline) {
      setContent(guidelineData.guideline.content);
    } else {
      setContent("");
    }
  }, [guidelineData]);

  const { mutate: saveGuideline, isPending: isSaving } = useMutation({
    mutationFn: () => api.post('/api/guidelines', {
      subject_id: selectedSubject.id,
      content,
      status: guidelineData?.guideline?.status || 'draft'
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['mod', 'guideline', selectedSubject?.id] });
    },
  });

  const { mutate: togglePublish } = useMutation({
    mutationFn: (publish: boolean) => api.patch(`/api/guidelines/${selectedSubject.id}/publish`, { publish }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['mod', 'guideline', selectedSubject?.id] });
    },
  });

  const subjects = subjectsData?.subjects || [];
  const filteredSubjects = subjects.filter((s: any) => s.name.toLowerCase().includes(search.toLowerCase()));

  const getOrdinal = (n: number) => {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  };

  const currentGuideline = guidelineData?.guideline;

  return (
    <div className="flex flex-col h-full max-w-[1400px] mx-auto min-h-0">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4 shrink-0">
        <div>
           <h2 className="font-display font-bold text-2xl text-foreground">Study Guidelines</h2>
           <p className="font-body text-sm text-muted-foreground mt-0.5">Write study advice for each subject.</p>
        </div>
        <div className="flex items-center gap-3">
           <Button 
            variant="mod-primary" 
            className="gap-2 px-6" 
            disabled={!content || isSaving}
            onClick={() => saveGuideline()}
           >
              {isSaving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />} 
              Save Guideline
           </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] flex-1 border border-border/50 rounded-2xl overflow-hidden min-h-0 bg-sidebar-bg/30">
        
        {/* LEFT PANEL — Subject Selector */}
        <div className="border-r border-border/40 flex flex-col min-h-0 bg-surface-1/30">
           <div className="p-4 border-b border-border/30 bg-surface-1/50 sticky top-0 z-10">
              <div className="relative group">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-[hsl(172_70%_55%)] transition-colors" />
                <input 
                  placeholder="Search subjects..." 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-surface-2 border border-border/50 rounded-xl pl-9 pr-4 py-2 text-xs font-body focus:outline-none focus:ring-1 focus:ring-[hsl(172_70%_42%/0.4)]"
                />
              </div>
           </div>

           <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-6 pt-4">
              {isLoadingSubjects ? (
                [1,2,3,4].map(i => <div key={i} className="h-10 rounded-xl shimmer mx-2 my-1" />)
              ) : (
                [1,2,3,4,5,6,7,8].map(sem => {
                  const semSubjects = filteredSubjects.filter((s: any) => s.semester === sem);
                  if (semSubjects.length === 0) return null;
                  return (
                    <div key={sem}>
                      <p className="text-[10px] font-body font-bold text-muted-foreground/40 uppercase tracking-[0.2em] px-3 mb-3">{getOrdinal(sem)} Semester</p>
                      <div className="space-y-1">
                        {semSubjects.map((s: any) => (
                          <button
                            key={s.id}
                            onClick={() => setSelectedSubject(s)}
                            className={cn(
                              "w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all group",
                              selectedSubject?.id === s.id 
                                ? "bg-[hsl(172_70%_42%/0.12)] text-[hsl(172_70%_55%)] font-semibold border border-[hsl(172_70%_42%/0.2)]" 
                                : "text-muted-foreground hover:bg-surface-2 hover:text-foreground"
                            )}
                          >
                             <span className="text-xs truncate font-body">{s.name}</span>
                             {selectedSubject?.id === s.id && <ChevronRight size={12} className="text-inherit opacity-40 ml-2" />}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })
              )}
           </div>
        </div>

        {/* RIGHT PANEL — Editor Area */}
        <div className="bg-card flex flex-col min-h-0">
           {selectedSubject ? (
             <>
               <div className="px-8 py-6 border-b border-border/30 bg-surface-1/20 shrink-0">
                  <div className="flex items-center justify-between flex-wrap gap-4">
                     <div>
                        <h3 className="font-display font-bold text-2xl text-foreground mb-1">{selectedSubject.name}</h3>
                        <p className="text-xs text-muted-foreground font-body">{getOrdinal(selectedSubject.semester)} Sem · {selectedSubject.department?.name}</p>
                     </div>
                     <div className="flex items-center gap-3">
                        {currentGuideline && (
                          <button 
                            onClick={() => togglePublish(currentGuideline.status !== 'published')}
                            className={cn(
                              "flex items-center gap-2 px-4 py-1.5 rounded-full border text-[11px] font-body font-semibold transition-all",
                              currentGuideline.status === 'published' 
                                ? "bg-success/15 text-success border-success/30" 
                                : "bg-warning/15 text-warning border-warning/30"
                            )}
                          >
                            {currentGuideline.status === 'published' ? <Eye size={14} /> : <EyeOff size={14} />}
                            {currentGuideline.status === 'published' ? 'Live on Portal' : 'Draft Mode'}
                          </button>
                        )}
                        <Button variant="ghost-border" size="sm" className="gap-2">
                           <Eye size={14} /> Preview
                        </Button>
                     </div>
                  </div>

                  <div className="flex items-center gap-3 mt-6">
                     <div className="flex items-center gap-1.5 text-[10px] font-body text-muted-foreground/60">
                        <Cloud size={14} className={cn("transition-colors", isSaving ? "animate-pulse text-primary" : "text-success")} />
                        {isSaving ? "Saving..." : currentGuideline ? `Last updated ${formatDistanceToNow(new Date(currentGuideline.updated_at))} ago` : "Not saved yet"}
                     </div>
                     <span className="text-muted-foreground/20 text-[10px]">|</span>
                     <span className="text-[10px] font-body text-muted-foreground/60">{content.split(/\s+/).filter(word => word.length > 0).length} words</span>
                  </div>
               </div>

               {/* Editor Toolbar */}
               <div className="px-8 py-3 border-b border-border/20 bg-surface-1/10 flex items-center gap-1 flex-wrap shrink-0">
                  {[Bold, Italic, Heading1, Heading2, ListIcon, Quote, Code].map((Icon, i) => (
                    <button key={i} className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-surface-2 hover:text-foreground transition-all">
                       <Icon size={16} />
                    </button>
                  ))}
               </div>

               {/* Content Area */}
               <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
                  {isLoadingGuideline ? (
                    <div className="flex flex-col gap-4">
                       <div className="h-4 w-3/4 shimmer rounded" />
                       <div className="h-4 w-full shimmer rounded" />
                       <div className="h-4 w-2/3 shimmer rounded" />
                    </div>
                  ) : (
                    <textarea 
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      placeholder="## How to approach this subject\n\nExplain key concepts and priority topics here..."
                      className="w-full h-full bg-transparent border-none outline-none resize-none font-body text-sm text-foreground leading-relaxed placeholder:text-muted-foreground/30 placeholder:italic"
                    />
                  )}
               </div>

               <div className="px-8 py-4 border-t border-border/30 bg-surface-1/10 shrink-0 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                     <div className="flex items-center gap-1.5 text-[11px] font-body text-[hsl(172_70%_55%)]">
                        <CheckCircle2 size={12} /> Real-time editor active
                     </div>
                  </div>
               </div>
             </>
           ) : (
             <div className="flex-1 flex flex-col items-center justify-center text-center p-8 opacity-40">
                <div className="w-16 h-16 rounded-3xl bg-surface-1 border border-border flex items-center justify-center mb-6">
                   <BookMarked size={32} />
                </div>
                <h3 className="font-display font-semibold text-lg text-foreground">Select a subject</h3>
                <p className="font-body text-sm text-muted-foreground mt-2 max-w-xs">Pick a subject from the left panel to start writing study guidelines.</p>
             </div>
           )}
        </div>
      </div>
    </div>
  );
};

export default StudyGuidelinesMod;
