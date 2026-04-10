import { useState, useEffect } from "react";
import { 
  Plus, 
  Search, 
  Info, 
  BookOpen, 
  Tag as TagIcon, 
  X, 
  Trash2,
  Sparkles,
  Loader2,
  Save,
  Folder,
  FileText,
  ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../lib/api";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";

type TagType = 'subject' | 'folder' | 'material';

const AdminTagsAliasLibrary = () => {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<TagType>('subject');
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [newTag, setNewTag] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  // 1. Fetch Subjects
  const { data: subjectsData, isLoading: isLoadingSubjects } = useQuery({
    queryKey: ['admin', 'subjects', searchQuery],
    queryFn: () => api.get('/api/subjects', { params: { search: searchQuery || undefined } }).then(r => r.data),
    enabled: activeTab === 'subject',
  });

  // 2. Fetch Folders
  const { data: foldersData, isLoading: isLoadingFolders } = useQuery({
    queryKey: ['admin', 'folders', searchQuery],
    queryFn: () => api.get('/api/folders', { params: { search: searchQuery || undefined } }).then(r => r.data),
    enabled: activeTab === 'folder',
  });

  // 3. Fetch Materials
  const { data: materialsData, isLoading: isLoadingMaterials } = useQuery({
    queryKey: ['admin', 'materials', searchQuery],
    queryFn: () => api.get('/api/materials', { params: { search: searchQuery || undefined } }).then(r => r.data),
    enabled: activeTab === 'material',
  });

  // Mutation for Subject Aliases
  const { mutate: updateAliases, isPending: isSavingAliases } = useMutation({
    mutationFn: ({ id, aliases }: { id: string; aliases: string[] }) =>
      api.patch(`/api/subjects/${id}/aliases`, { aliases }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'subjects'] });
      toast({ title: "Aliases updated successfully" });
    }
  });

  // Mutation for Folder/Material Tags
  const { mutate: updateTags, isPending: isSavingTags } = useMutation({
    mutationFn: ({ id, type, tags }: { id: string; type: 'folder' | 'material'; tags: string[] }) =>
      api.patch(`/api/${type}s/${id}/tags`, { tags }),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ['admin', `${variables.type}s`] });
      toast({ title: "Tags updated successfully" });
    }
  });

  useEffect(() => {
    if (selectedItem) {
      if (activeTab === 'subject') {
        setTags(selectedItem.aliases || []);
      } else {
        setTags(selectedItem.tags || []);
      }
    }
  }, [selectedItem, activeTab]);

  const items = activeTab === 'subject' ? (subjectsData?.subjects || []) :
                activeTab === 'folder' ? (foldersData?.folders || []) :
                (materialsData?.materials || []);

  const isLoading = isLoadingSubjects || isLoadingFolders || isLoadingMaterials;

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && newTag.trim()) {
      const val = newTag.trim().toLowerCase();
      if (!tags.includes(val)) {
        setTags([...tags, val]);
      }
      setNewTag("");
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  const handleSave = () => {
    if (!selectedItem) return;
    if (activeTab === 'subject') {
      updateAliases({ id: selectedItem.id, aliases: tags });
    } else {
      updateTags({ id: selectedItem.id, type: activeTab as 'folder' | 'material', tags });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display font-bold text-2xl text-foreground">Polymorphic Tag Library</h2>
          <p className="font-body text-sm text-muted-foreground">Manage searchable aliases across subjects, folders, and study materials.</p>
        </div>
      </div>

      <div className="flex gap-2 p-1 bg-surface-1 rounded-2xl border border-border/40 w-fit">
        {(['subject', 'folder', 'material'] as TagType[]).map((tab) => (
          <button
            key={tab}
            onClick={() => { setActiveTab(tab); setSelectedItem(null); setTags([]); }}
            className={cn(
              "px-6 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all",
              activeTab === tab 
                ? "bg-primary text-white shadow-lg shadow-primary/20" 
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {tab}s
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-6 border border-border/40 rounded-3xl overflow-hidden bg-card min-h-[600px] shadow-2xl shadow-black/20">
        {/* Left List */}
        <div className="border-r border-border/40 overflow-y-auto custom-scrollbar bg-surface-1/20 flex flex-col">
          <div className="p-5 border-b border-border/40 bg-surface-1/40">
            <div className="relative group">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <input 
                type="text" 
                placeholder={`Search ${activeTab}s...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-surface-2 border border-border/60 rounded-xl px-4 py-2.5 pl-9 text-xs font-body w-full focus:outline-none focus:ring-1 focus:ring-primary/40 transition-all"
              />
            </div>
          </div>

          <div className="divide-y divide-border/20">
            {isLoading ? (
               [1,2,3,4,5].map(i => <div key={i} className="h-20 shimmer m-4 rounded-2xl" />)
            ) : items.length === 0 ? (
               <div className="p-12 text-center text-xs text-muted-foreground font-body opacity-50 italic">No {activeTab}s discovered in this sector.</div>
            ) : (
              items.map((item: any) => (
                <div 
                  key={item.id}
                  onClick={() => setSelectedItem(item)}
                  className={cn(
                    "p-5 cursor-pointer transition-all hover:bg-primary/5 group relative",
                    selectedItem?.id === item.id ? "bg-primary/10" : ""
                  )}
                >
                  {selectedItem?.id === item.id && <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-r-full shadow-[0_0_10px_theme(colors.primary)]" />}
                  
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <h4 className={cn(
                        "text-sm font-body font-bold truncate group-hover:text-primary transition-colors",
                        selectedItem?.id === item.id ? "text-primary" : "text-foreground"
                      )}>
                        {item.name || item.title}
                      </h4>
                      <p className="text-[10px] text-muted-foreground mt-1 font-body uppercase tracking-wider flex items-center gap-1.5">
                        {activeTab === 'folder' && <Folder size={10} />}
                        {activeTab === 'material' && <FileText size={10} />}
                        {activeTab === 'subject' && <BookOpen size={10} />}
                        {item.code || (activeTab === 'material' ? item.material_type : (item.folder_type || 'Custom'))}
                      </p>
                    </div>
                    <ChevronRight size={14} className={cn("shrink-0 transition-transform", selectedItem?.id === item.id ? "text-primary translate-x-1" : "text-muted-foreground/30")} />
                  </div>

                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {(item.aliases || item.tags || []).slice(0, 4).map((t: string) => (
                      <span key={t} className="text-[9px] bg-surface-2 px-2 py-0.5 rounded-full border border-border/40 text-muted-foreground group-hover:border-primary/20">{t}</span>
                    ))}
                    {(item.aliases || item.tags || []).length > 4 && 
                      <span className="text-[10px] text-primary font-bold ml-1">+{ (item.aliases || item.tags || []).length - 4 }</span>
                    }
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Editor */}
        <div className="p-8 flex flex-col bg-surface-1/10 h-full relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-[120px] pointer-events-none rounded-full" />
          
          {!selectedItem ? (
            <div className="flex flex-col items-center justify-center flex-1 text-center py-20 px-10">
               <div className="w-20 h-20 rounded-[2.5rem] bg-surface-2 border border-border/40 flex items-center justify-center mb-8 rotate-3 group hover:rotate-0 transition-transform">
                  <TagIcon size={40} className="text-muted-foreground/30" />
               </div>
               <h3 className="font-display font-bold text-lg text-foreground uppercase tracking-widest">Entry Inspector</h3>
               <p className="text-[11px] text-muted-foreground font-body mt-3 leading-relaxed">
                 Select any subject, folder, or material to modify its searchable metadata and organizational tags.
               </p>
            </div>
          ) : (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500 flex flex-col h-full relative z-10">
              <div className="mb-10">
                 <div className="flex items-center gap-2 mb-3">
                    <span className="px-2 py-0.5 rounded-full bg-primary/20 text-[9px] font-bold text-primary uppercase tracking-widest">{activeTab}</span>
                    <span className="text-border">/</span>
                    <span className="text-[10px] text-muted-foreground font-bold font-body">{selectedItem.id.slice(0, 8)}</span>
                 </div>
                 <h3 className="font-display font-bold text-2xl text-foreground leading-tight">{selectedItem.name || selectedItem.title}</h3>
                 <p className="text-[11px] text-muted-foreground font-body mt-2 opacity-80">
                   Modified by Admin Root on {new Date().toLocaleDateString()}
                 </p>
              </div>

              <div className="space-y-8 flex-1">
                 <div>
                   <div className="flex items-center justify-between mb-4">
                     <label className="text-[10px] font-body font-bold text-muted-foreground uppercase tracking-[0.2em] block">
                       Searchable Tags / Aliases
                     </label>
                     <span className="text-[10px] font-bold text-primary">{tags.length} TOTAL</span>
                   </div>
                   
                   <div className="bg-surface-2/50 border border-border/60 rounded-[1.5rem] p-5 min-h-[180px] focus-within:ring-2 focus-within:ring-primary/20 transition-all flex flex-wrap content-start gap-2.5 shadow-inner">
                      {tags.map((tag) => (
                        <span key={tag} className="bg-background rounded-full px-4 py-1.5 text-[11px] font-body font-semibold text-foreground flex items-center gap-2 border border-border/40 hover:border-primary/40 transition-colors shadow-sm">
                          {tag}
                          <button onClick={() => handleRemoveTag(tag)} className="text-muted-foreground hover:text-danger transition-colors">
                             <X size={12} />
                          </button>
                        </span>
                      ))}
                      <input 
                        type="text" 
                        placeholder="Add new tag..."
                        className="bg-transparent border-none focus:outline-none text-sm font-body py-1.5 flex-1 min-w-[120px] placeholder:text-muted-foreground/30"
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        onKeyDown={handleAddTag}
                      />
                   </div>
                 </div>

                 <div className="bg-primary/5 rounded-2xl p-5 border border-primary/20">
                    <div className="flex items-center gap-2 mb-4">
                       <Sparkles size={14} className="text-primary animate-pulse" />
                       <span className="text-[10px] font-bold text-primary uppercase tracking-[0.15em]">AI Suggested Keywords</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                       {["OS", "Notes", "Unit 1", "Core", "Exam"].map(sug => (
                         <button 
                           key={sug}
                           onClick={() => { if(!tags.includes(sug.toLowerCase())) setTags([...tags, sug.toLowerCase()]) }}
                           className="text-[10px] bg-white text-muted-foreground px-4 py-1.5 rounded-xl border border-border/40 hover:border-primary hover:text-primary transition-all font-bold"
                         >
                           + {sug}
                         </button>
                       ))}
                    </div>
                    <p className="text-[9px] text-muted-foreground mt-4 font-body italic opacity-60">
                      Suggestions based on content semantics and peer search patterns.
                    </p>
                 </div>
              </div>

              <div className="mt-auto pt-10 flex flex-col gap-3">
                 <Button 
                   onClick={handleSave}
                   disabled={isSavingAliases || isSavingTags}
                   className="w-full h-14 font-bold gap-3 uppercase tracking-widest text-xs rounded-2xl shadow-xl shadow-primary/20 active:scale-[0.98] transition-transform"
                 >
                   { (isSavingAliases || isSavingTags) ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} /> }
                   Commit Changes to DB
                 </Button>
                 <button className="flex items-center justify-center gap-2 py-3 text-[10px] font-bold uppercase tracking-widest text-danger hover:bg-danger/10 rounded-xl transition-colors">
                    <Trash2 size={14} /> Purge Entry Metadata
                 </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminTagsAliasLibrary;
