import { useState, useEffect } from "react";
import { 
  BookOpen, 
  Save, 
  Search, 
  ChevronDown, 
  List, 
  ListOrdered, 
  Link as LinkIcon, 
  Quote, 
  Code, 
  Highlighter, 
  Trash2,
  AlertCircle,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../lib/api";
import { cn } from "@/lib/utils";

const AdminStudyGuidelines = () => {
  const qc = useQueryClient();
  const [selectedSubject, setSelectedSubject] = useState<any>(null);
  const [content, setContent] = useState("");
  const [deptFilter, setDeptFilter] = useState("");
  const [semFilter, setSemFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: deptsData } = useQuery({
    queryKey: ['departments'],
    queryFn: () => api.get('/api/departments').then(r => r.data),
  });

  const { data: subjectsData, isLoading: isLoadingSubjects } = useQuery({
    queryKey: ['admin', 'subjects', { deptFilter, semFilter, searchQuery }],
    queryFn: () => api.get('/api/subjects', {
      params: {
        department_id: deptFilter || undefined,
        semester: semFilter || undefined,
        search: searchQuery || undefined
      }
    }).then(r => r.data),
  });

  const { mutate: saveGuideline, isPending: isSaving } = useMutation({
    mutationFn: ({ subjectId, guideline }: { subjectId: string; guideline: string }) =>
      api.patch(`/api/admin/subjects/${subjectId}/guideline`, { guideline }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'subjects'] });
      alert("Guideline saved successfully!");
    }
  });

  useEffect(() => {
    if (selectedSubject) {
      setContent(selectedSubject.guideline || "");
    }
  }, [selectedSubject]);

  const subjects = subjectsData?.subjects || [];
  const departments = deptsData?.departments || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display font-bold text-2xl text-foreground">Study Guidelines</h2>
          <p className="font-body text-sm text-muted-foreground">Author subject-specific study advice and resource roadmaps.</p>
        </div>
        <Button 
          onClick={() => saveGuideline({ subjectId: selectedSubject.id, guideline: content })}
          disabled={!selectedSubject || isSaving}
          className="gap-2 bg-primary text-white font-bold h-11 px-8"
        >
          {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          Save Guideline
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6 border border-border/50 rounded-2xl overflow-hidden bg-card min-h-[600px]">
        {/* Left List */}
        <div className="border-r border-border/40 overflow-y-auto custom-scrollbar flex flex-col bg-surface-1/30">
          <div className="p-4 space-y-3 border-b border-border/30">
             <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input 
                  type="text" 
                  placeholder="Search subjects..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-input border border-border/60 rounded-xl px-4 py-2.5 pl-10 text-xs font-body w-full focus:outline-none focus:ring-1 focus:ring-primary/40 transition-all"
                />
             </div>
             <div className="grid grid-cols-2 gap-2">
                <select 
                  value={deptFilter} 
                  onChange={(e) => setDeptFilter(e.target.value)}
                  className="bg-input border border-border/60 rounded-xl px-3 py-2 text-[10px] font-body outline-none"
                >
                  <option value="">All Depts</option>
                  {departments.map((d: any) => (
                    <option key={d.id} value={d.id}>{d.short_name}</option>
                  ))}
                </select>
                <select 
                  value={semFilter} 
                  onChange={(e) => setSemFilter(e.target.value)}
                  className="bg-input border border-border/60 rounded-xl px-3 py-2 text-[10px] font-body outline-none"
                >
                  <option value="">Semesters</option>
                  {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>{s}th Sem</option>)}
                </select>
             </div>
          </div>

          <div className="divide-y divide-border/20">
             {isLoadingSubjects ? (
               [1,2,3,4,5].map(i => <div key={i} className="h-12 shimmer m-4 rounded-lg" />)
             ) : subjects.length === 0 ? (
               <div className="p-8 text-center text-xs text-muted-foreground font-body">No subjects found.</div>
             ) : (
               subjects.map((sub: any) => (
                 <div 
                   key={sub.id}
                   onClick={() => setSelectedSubject(sub)}
                   className={cn(
                     "px-6 py-3.5 cursor-pointer transition-all hover:bg-white/5 group border-l-2",
                     selectedSubject?.id === sub.id ? "bg-primary/5 border-primary" : "border-transparent text-muted-foreground"
                   )}
                 >
                    <div className="flex items-center justify-between">
                       <span className={cn("text-xs font-body truncate flex-1 pr-2", selectedSubject?.id === sub.id ? "text-foreground font-semibold" : "")}>
                         {sub.name}
                       </span>
                       <div className={cn("w-1.5 h-1.5 rounded-full shrink-0", sub.guideline ? "bg-success" : "bg-muted-foreground/30")} />
                    </div>
                    <span className="text-[9px] uppercase tracking-tighter mt-1 block opacity-60">
                      {sub.department?.short_name} · Sem {sub.semester}
                    </span>
                 </div>
               ))
             )}
          </div>
        </div>

        {/* Right Editor */}
        <div className="flex flex-col h-full bg-surface-1/10">
          {!selectedSubject ? (
            <div className="flex flex-col items-center justify-center flex-1 text-center p-12">
              <BookOpen size={48} className="text-muted-foreground/20 mb-4" />
              <h3 className="font-display font-semibold text-sm text-foreground">Select a subject</h3>
              <p className="text-xs text-muted-foreground font-body mt-2">Choose a subject to start authoring study advice.</p>
            </div>
          ) : (
            <div className="flex flex-col h-full animate-in fade-in duration-300">
               <div className="px-8 py-6 border-b border-border/30 bg-card/60 backdrop-blur-md sticky top-0 z-10 flex items-center justify-between">
                  <div>
                    <h3 className="font-display font-bold text-lg text-foreground">{selectedSubject.name}</h3>
                    <p className="text-[10px] text-muted-foreground font-body mt-1 uppercase tracking-widest">
                      {selectedSubject.department?.name} · SEMESTER {selectedSubject.semester}
                    </p>
                  </div>
                  <div className="flex items-center gap-4 bg-surface-1 rounded-xl p-1.5 border border-border/40">
                     <button className="p-1.5 text-muted-foreground hover:bg-surface-2 rounded-lg transition-colors"><List size={14} /></button>
                     <button className="p-1.5 text-muted-foreground hover:bg-surface-2 rounded-lg transition-colors"><Quote size={14} /></button>
                     <button className="p-1.5 text-muted-foreground hover:bg-surface-2 rounded-lg transition-colors"><LinkIcon size={14} /></button>
                  </div>
               </div>

               <div className="flex-1 p-8 md:px-12 md:py-8 overflow-y-auto custom-scrollbar">
                  <div className="max-w-3xl mx-auto space-y-6">
                     <div className="bg-warning/5 border border-warning/20 rounded-2xl p-4 flex items-start gap-3">
                        <AlertCircle size={16} className="text-warning shrink-0 mt-0.5" />
                        <p className="text-[11px] text-muted-foreground leading-relaxed">
                          Guidelines use standard text. You can use markdown-like structures for lists and emphasis. Students will see this content on the Study Page.
                        </p>
                     </div>
                     <textarea 
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="Start writing study advice... e.g., 'To master this subject, start with Unit 3 as it builds the foundation for complex algorithms...'"
                        className="w-full h-[400px] bg-transparent outline-none font-body text-sm text-foreground/90 leading-relaxed resize-none p-2 border-l-2 border-primary/20 focus:border-primary transition-all placeholder:text-muted-foreground/30"
                     />
                  </div>
               </div>

               <div className="px-8 py-3 border-t border-border/30 bg-surface-1/40 flex items-center justify-between shrink-0">
                  <div className="text-[10px] font-body text-muted-foreground flex items-center gap-4">
                     <span>Character Count: {content.length}</span>
                     <span>Last saved: {selectedSubject.updated_at ? new Date(selectedSubject.updated_at).toLocaleDateString() : 'Never'}</span>
                  </div>
                  <button 
                    onClick={() => { if(confirm("Discard all changes?")) setContent("") }}
                    className="text-[10px] text-danger/60 hover:text-danger flex items-center gap-1.5 font-bold uppercase transition-all"
                  >
                    <Trash2 size={12} /> Reset Draft
                  </button>
               </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminStudyGuidelines;
