import { useState, useMemo, useEffect, useRef } from "react";
import {
  Folder, FolderPlus, FolderOpen, Upload, FileText, PlayCircle,
  Bot, GraduationCap, BookOpen, Trash2, Pencil, MoreVertical,
  Home, ChevronRight, Plus, Search, Grid2X2, List, Download,
  Star, X, Check, Loader2, ChevronDown, MoreHorizontal,
  Settings, Tag, Move, ExternalLink, HardDrive, Filter,
  BookMarked
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../lib/api";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";

// ─── TYPES ───────────────────────────────────────────────────────
interface FolderNode {
  id: string;
  name: string;
  parent_id: string | null;
  department_id: string | null;
  semester: number | null;
  subject_id: string | null;
  folder_type: string;
  tags?: string[];
  children: FolderNode[];
}

// ─── HELPERS ─────────────────────────────────────────────────────
function buildTree(folders: any[]): FolderNode[] {
  const map: Record<string, FolderNode> = {};
  const roots: FolderNode[] = [];
  folders.forEach(f => { map[f.id] = { ...f, children: [] }; });
  folders.forEach(f => {
    if (f.parent_id && map[f.parent_id]) {
      map[f.parent_id].children.push(map[f.id]);
    } else {
      roots.push(map[f.id]);
    }
  });
  return roots;
}

const AdminContentManagement = () => {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [explorerSearch, setExplorerSearch] = useState("");
  const [isRenaming, setIsRenaming] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; node: any } | null>(null);
  
  // Modals
  const [showNewFolderModal, setShowNewFolderModal] = useState<{ parentId: string | null; deptId: string | null } | null>(null);
  const [newFolderName, setNewFolderName] = useState("");
  
  // Create Department Modal
  const [showCreateDeptModal, setShowCreateDeptModal] = useState(false);
  const [newDeptForm, setNewDeptForm] = useState({ name: '', short_name: '' });

  // Controlled expansion for ExplorerItem (Fix 6A)
  const [explorerExpandedIds, setExplorerExpandedIds] = useState<Set<string>>(() => new Set());
  const handleExplorerToggle = (id: string) => {
    setExplorerExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // ─── DATA FETCHING ──────────────────────────────────────────────
  const { data: foldersData, isLoading: isLoadingFolders } = useQuery({
    queryKey: ['admin', 'folders'],
    queryFn: () => api.get('/api/folders').then(r => r.data),
  });

  const { data: materialsData, isLoading: isLoadingMaterials } = useQuery({
    queryKey: ['admin', 'materials', selectedNode?.id],
    queryFn: () => api.get('/api/admin/content', { params: { folder_id: selectedNode?.id, limit: 100 } }).then(r => r.data),
    enabled: selectedNode?.folder_type !== undefined,
  });

  const { data: deptsData } = useQuery({
    queryKey: ['departments'],
    queryFn: () => api.get('/api/departments').then(r => r.data),
  });

  // ─── MUTATIONS ──────────────────────────────────────────────────
  const { mutate: createFolder } = useMutation({
    mutationFn: (data: any) => api.post('/api/folders', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'folders'] });
      setShowNewFolderModal(null);
      setNewFolderName("");
      toast({ title: "Folder created" });
    }
  });

  const { mutate: deleteFolder } = useMutation({
    mutationFn: (id: string) => api.delete(`/api/folders/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'folders'] });
      setSelectedNode(null);
      toast({ title: "Folder deleted", variant: "destructive" });
    }
  });

  const { mutate: createDepartment } = useMutation({
    mutationFn: (data: any) => api.post('/api/departments', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'folders'] });
      qc.invalidateQueries({ queryKey: ['departments'] });
      setShowCreateDeptModal(false);
      setNewDeptForm({ name: '', short_name: '' });
      toast({ title: "Department Created", description: "Matrix folders successfully generated." });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.response?.data?.error || "Failed to create department", variant: 'destructive' });
    }
  });

  const { mutate: renameFolder } = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) => api.patch(`/api/folders/${id}`, { name }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'folders'] });
      setIsRenaming(null);
      toast({ title: "Renamed successfully" });
    }
  });

  const { mutate: deleteMaterial } = useMutation({
    mutationFn: (id: string) => api.patch(`/api/admin/content/${id}`, { is_active: false }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'materials'] });
      toast({ title: "Material archived", variant: "destructive" });
    }
  });

  // ─── TREE LOGIC ─────────────────────────────────────────────────
  const folders = foldersData?.folders || [];
  const tree = useMemo(() => buildTree(folders), [folders]);
  const departments = deptsData?.departments || [];

  const filteredTree = useMemo(() => {
    if (!explorerSearch) return tree;
    const search = (nodes: FolderNode[]): FolderNode[] => {
      return nodes.reduce((acc: FolderNode[], node) => {
        const children = search(node.children);
        if (node.name.toLowerCase().includes(explorerSearch.toLowerCase()) || children.length > 0) {
          acc.push({ ...node, children });
        }
        return acc;
      }, []);
    };
    return search(tree);
  }, [tree, explorerSearch]);

  // ─── UI COMPONENTS ──────────────────────────────────────────────
  const handleContextMenu = (e: React.MouseEvent, node: any) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, node });
  };

  const startRename = (node: any) => {
    setIsRenaming(node.id);
    setRenameValue(node.name);
    setContextMenu(null);
  };

  const submitRename = () => {
    if (isRenaming && renameValue.trim()) {
      renameFolder({ id: isRenaming, name: renameValue.trim() });
    } else {
      setIsRenaming(null);
    }
  };

  const FileIcon = ({ type, size = 18, className = "" }: { type: string, size?: number, className?: string }) => {
    const icons: Record<string, any> = {
      notes: <FileText size={size} className={cn("text-blue-500", className)} />,
      teacher_notes: <GraduationCap size={size} className={cn("text-purple-500", className)} />,
      pyq: <ScrollText size={size} className={cn("text-orange-500", className)} />,
      youtube: <PlayCircle size={size} className={cn("text-red-500", className)} />,
      book: <BookMarked size={size} className={cn("text-indigo-500", className)} />,
      ai_notes: <Bot size={size} className={cn("text-cyan-500", className)} />,
    };
    return icons[type] || <FileText size={size} className={cn("text-muted-foreground", className)} />;
  };

  // Fix 6A: ExplorerItem uses controlled expansion from parent Set<string>
  const ExplorerItem = ({ node, depth = 0 }: { node: FolderNode; depth: number }) => {
    const isOpen = explorerExpandedIds.has(node.id);
    const hasChildren = node.children.length > 0;
    const isSelected = selectedNode?.id === node.id;

    return (
      <div className="select-none">
        <div
          className={cn(
            "group flex items-center gap-2 px-3 py-1.5 text-[13px] font-body cursor-pointer transition-colors relative",
            isSelected ? "bg-primary/20 text-primary" : "text-muted-foreground hover:bg-surface-2 hover:text-foreground"
          )}
          style={{ paddingLeft: `${depth * 12 + 12}px` }}
          onClick={() => { setSelectedNode(node); handleExplorerToggle(node.id); }}
          onContextMenu={(e) => handleContextMenu(e, node)}
        >
          {isSelected && <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-primary" />}
          
          <div className="flex items-center gap-1.5 min-w-0">
            {hasChildren ? (
              isOpen ? <ChevronDown size={14} className="shrink-0" /> : <ChevronRight size={14} className="shrink-0" />
            ) : <div className="w-3.5" />}
            
            <Folder size={16} className={cn("shrink-0", isSelected ? "text-primary" : "text-muted-foreground/60")} />
            
            {isRenaming === node.id ? (
              <input 
                autoFocus
                value={renameValue}
                onChange={e => setRenameValue(e.target.value)}
                onBlur={submitRename}
                onKeyDown={e => e.key === 'Enter' && submitRename()}
                className="bg-background border border-primary/40 rounded px-1 text-[13px] w-full focus:outline-none"
                onClick={e => e.stopPropagation()}
              />
            ) : (
              <span className="truncate">{node.name}</span>
            )}
          </div>
          
          <div className="ml-auto opacity-0 group-hover:opacity-100 flex items-center gap-1">
             <Plus size={12} className="hover:text-primary" onClick={(e) => { e.stopPropagation(); setShowNewFolderModal({ parentId: node.id, deptId: node.department_id }); }} />
          </div>
        </div>
        
        {isOpen && node.children.map(child => (
          <ExplorerItem key={child.id} node={child} depth={depth + 1} />
        ))}
      </div>
    );
  };

  return (
    <div className="flex h-full bg-background overflow-hidden border border-border/40 rounded-3xl shadow-2xl relative" onClick={() => setContextMenu(null)}>
      
      {/* ─── SIDEBAR EXPLORER ─── */}
      <aside className="w-[300px] border-r border-border/40 bg-card/30 flex flex-col shrink-0">
        <div className="p-4 border-b border-border/40 flex items-center justify-between">
          <h4 className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Explorer</h4>
          <div className="flex items-center gap-1">
             <button title="Create Department Hierarchy" onClick={() => setShowCreateDeptModal(true)} className="p-1 hover:bg-surface-2 hover:text-primary rounded text-muted-foreground transition-colors"><FolderPlus size={14} /></button>
          </div>
        </div>
        
        <div className="p-3">
          <div className="relative group">
            <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary" />
            <input 
              placeholder="Search folders..."
              value={explorerSearch}
              onChange={e => setExplorerSearch(e.target.value)}
              className="w-full bg-surface-1 border border-border/40 rounded-xl pl-8 pr-3 py-1.5 text-xs font-body focus:outline-none focus:ring-1 focus:ring-primary/30"
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {isLoadingFolders ? (
             [1,2,3,4,5,6].map(i => <div key={i} className="h-8 shimmer mx-4 my-2 rounded-lg" />)
          ) : (
            filteredTree.map(node => (
              <ExplorerItem key={node.id} node={node} depth={0} />
            ))
          )}
        </div>
      </aside>

      {/* ─── MAIN CONTENT AREA ─── */}
      <main className="flex-1 flex flex-col min-w-0 bg-surface-1/10 relative">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 blur-[150px] pointer-events-none rounded-full" />
        
        {/* Breadcrumb Path Bar */}
        <div className="h-10 border-b border-border/40 flex items-center px-6 gap-2 text-[11px] font-body text-muted-foreground shrink-0 bg-background/40 backdrop-blur-sm z-10">
           <Home size={12} />
           <ChevronRight size={10} />
           <span className="uppercase tracking-widest font-bold">EDUVAULT CONTENT</span>
           {selectedNode && (
             <>
               <ChevronRight size={10} />
               <span className="text-foreground font-bold truncate max-w-[200px]">{selectedNode.name}</span>
             </>
           )}
        </div>

        {/* View Surface */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-8 z-0">
          {!selectedNode ? (
            <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
               <div className="w-24 h-24 rounded-[3rem] bg-surface-1 flex items-center justify-center mb-8 border border-border/50 rotate-6">
                  <HardDrive size={48} className="text-muted-foreground/30" />
               </div>
               <h3 className="font-display font-bold text-xl text-foreground">Select a Directory</h3>
               <p className="text-sm font-body text-muted-foreground mt-2 max-w-[280px]">Browse the repository structure on the left to manage academic assets and folders.</p>
            </div>
          ) : (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
               <div className="flex items-center justify-between mb-8">
                  <div>
                    <h2 className="font-display font-bold text-3xl text-foreground flex items-center gap-3">
                       {selectedNode.name}
                       <span className="text-[10px] bg-primary/10 text-primary border border-primary/20 px-2.5 py-1 rounded-full uppercase tracking-tighter">
                          {selectedNode.folder_type}
                       </span>
                    </h2>
                    <p className="text-sm font-body text-muted-foreground mt-1">Managed via Admin Policy v4.0 · Sub-directories: {selectedNode.children.length}</p>
                  </div>
                  
                  <div className="flex items-center gap-3">
                     <Button variant="ghost-border" size="sm" onClick={() => setShowNewFolderModal({ parentId: selectedNode.id, deptId: selectedNode.department_id })}>
                        <FolderPlus size={16} className="mr-2" /> New Sub-folder
                     </Button>
                     {/* Fix 6B: Use onClick instead of broken anchor to /moderator/upload */}
                     <Button variant="primary" size="sm" onClick={() => {
                       window.location.href = selectedNode ? `/moderator/upload?folder=${selectedNode.id}` : '/moderator/upload';
                     }}>
                        <Upload size={16} className="mr-2" /> Direct Upload
                     </Button>
                  </div>
               </div>

               {/* Tags Preview */}
               {selectedNode.tags && selectedNode.tags.length > 0 && (
                 <div className="flex flex-wrap gap-2 mb-8 p-4 bg-primary/5 rounded-2xl border border-primary/10">
                    <Tag size={14} className="text-primary mt-1" />
                    {selectedNode.tags.map((t: string) => (
                      <span key={t} className="bg-background px-3 py-1 rounded-full text-[10px] font-bold text-muted-foreground border border-border/40">#{t}</span>
                    ))}
                    <button className="text-[10px] font-bold text-primary hover:underline ml-2" onClick={() => window.location.href = '/admin/tags'}>Manage Tags</button>
                 </div>
               )}

               <div className="space-y-12">
                  {/* Folder Section */}
                  {selectedNode.children.length > 0 && (
                    <section>
                       <div className="flex items-center gap-2 mb-4 border-b border-border/20 pb-2">
                          <Folder size={14} className="text-muted-foreground" />
                          <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Sub-folders</h4>
                       </div>
                       <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                          {selectedNode.children.map((sub: any) => (
                            <div 
                              key={sub.id}
                              onClick={() => setSelectedNode(sub)}
                              className="group p-4 bg-card/40 border border-border/40 rounded-2xl hover:bg-surface-1 transition-all cursor-pointer text-center relative overflow-hidden"
                            >
                               <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/5 transition-colors" />
                               <FolderOpen size={40} className="mx-auto text-primary/40 group-hover:text-primary transition-colors mb-4" />
                               <p className="text-xs font-body font-bold text-foreground truncate">{sub.name}</p>
                               <p className="text-[9px] text-muted-foreground mt-1 uppercase">{sub.children.length} Items</p>
                            </div>
                          ))}
                       </div>
                    </section>
                  )}

                  {/* Material Section */}
                  <section>
                    <div className="flex items-center justify-between mb-4 border-b border-border/20 pb-2">
                       <div className="flex items-center gap-2">
                          <FileText size={14} className="text-muted-foreground" />
                          <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Contained Materials</h4>
                       </div>
                       <span className="text-[11px] font-bold text-muted-foreground">({materialsData?.content?.length || 0} TOTAL)</span>
                    </div>

                    {isLoadingMaterials ? (
                      <div className="grid grid-cols-1 gap-1">
                         {[1,2,3].map(i => <div key={i} className="h-16 shimmer rounded-xl" />)}
                      </div>
                    ) : materialsData?.content?.length === 0 ? (
                      <div className="py-12 bg-surface-1/30 rounded-2xl border border-dashed border-border/60 text-center">
                         <p className="text-xs text-muted-foreground font-body">No files discovered in this node.</p>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        {materialsData.content.map((file: any) => (
                          <div 
                            key={file.id}
                            className="group flex items-center gap-4 px-5 py-4 bg-card border border-border/30 rounded-2xl hover:border-primary/40 hover:bg-surface-1/50 transition-all cursor-default"
                          >
                            <div className="w-10 h-10 rounded-xl bg-surface-1 flex items-center justify-center shrink-0 border border-border/40 group-hover:bg-white transition-colors">
                               <FileIcon type={file.material_type} size={20} />
                            </div>
                            
                            <div className="flex-1 min-w-0">
                               <h5 className="text-sm font-bold text-foreground truncate group-hover:text-primary transition-colors">{file.title}</h5>
                               <div className="flex items-center gap-3 mt-1">
                                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-tighter bg-surface-2 px-1.5 py-0.5 rounded">{file.material_type}</span>
                                  <span className="text-[10px] text-muted-foreground/60 font-body">Uploaded {new Date(file.created_at).toLocaleDateString()}</span>
                                  <span className="text-[10px] text-muted-foreground/60 font-body">· { (file.file_size_bytes / (1024*1024)).toFixed(2) } MB</span>
                               </div>
                            </div>

                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                               <button className="p-2 hover:bg-primary/10 rounded-xl text-primary transition-colors"><ExternalLink size={14} /></button>
                               <button className="p-2 hover:bg-primary/10 rounded-xl text-primary transition-colors"><Pencil size={14} /></button>
                               <button onClick={() => deleteMaterial(file.id)} className="p-2 hover:bg-danger/10 rounded-xl text-danger transition-colors"><Trash2 size={14} /></button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </section>
               </div>
            </div>
          )}
        </div>
      </main>

      {/* ─── MODALS & FLOATING UI ─── */}
      
      {/* Context Menu */}
      {contextMenu && (
        <div 
          className="fixed z-[100] glass-strong rounded-xl border border-border/50 shadow-2xl p-1.5 min-w-[160px] animate-in fade-in zoom-in duration-150"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onClick={e => e.stopPropagation()}
        >
           <button onClick={() => startRename(contextMenu.node)} className="w-full flex items-center gap-3 px-3 py-2 text-xs font-semibold rounded-lg hover:bg-primary/10 text-foreground transition-colors">
              <Pencil size={14} className="text-muted-foreground" /> Rename
           </button>
           <button className="w-full flex items-center gap-3 px-3 py-2 text-xs font-semibold rounded-lg hover:bg-primary/10 text-foreground transition-colors">
              <Move size={14} className="text-muted-foreground" /> Move Folder
           </button>
           <div className="h-px bg-border/40 my-1 mx-2" />
           <button onClick={() => deleteFolder(contextMenu.node.id)} className="w-full flex items-center gap-3 px-3 py-2 text-xs font-semibold rounded-lg hover:bg-danger/10 text-danger transition-colors">
              <Trash2 size={14} /> Delete
           </button>
        </div>
      )}

      {/* New Folder Modal */}
      {showNewFolderModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
           <div className="absolute inset-0 bg-background/80 backdrop-blur-md" onClick={() => setShowNewFolderModal(null)} />
           <div className="glass-strong rounded-3xl p-8 w-full max-w-sm relative z-10 border border-border/50 shadow-[0_20px_50px_-10px_rgba(0,0,0,0.5)]">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
                 <FolderPlus size={32} className="text-primary" />
              </div>
              <h3 className="font-display font-bold text-xl text-foreground">Create New Folder</h3>
              <p className="text-xs font-body text-muted-foreground mt-2 mb-6">Will be nested inside "{selectedNode?.name || 'Root'}"</p>
              
               <div className="space-y-4">
                 <div>
                   <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5 block">Folder Name</label>
                   <input 
                      autoFocus
                      placeholder="e.g. Unit 3 - Advanced Physics"
                      value={newFolderName}
                      onChange={e => setNewFolderName(e.target.value)}
                      className="w-full bg-surface-1 border border-border/50 rounded-2xl px-4 py-3 text-sm font-body focus:outline-none focus:ring-1 focus:ring-primary/40"
                   />
                 </div>
              </div>

               <div className="flex gap-3 mt-8">
                 <button onClick={() => setShowNewFolderModal(null)} className="flex-1 py-3 text-xs font-bold uppercase tracking-widest text-muted-foreground hover:bg-surface-2 rounded-2xl transition-colors">Cancel</button>
                 <Button
                   className="flex-1 py-6 rounded-2xl font-bold uppercase tracking-widest text-xs"
                   disabled={!newFolderName.trim()}
                   onClick={() => {
                     if (!showNewFolderModal.parentId) {
                       toast({ title: "Please select a parent folder in the explorer first", variant: 'destructive' });
                       return;
                     }
                     createFolder({
                        name: newFolderName,
                        parent_id: showNewFolderModal.parentId,
                        department_id: showNewFolderModal.deptId,
                        folder_type: 'sub'
                     });
                   }}
                 >Create</Button>
              </div>
           </div>
        </div>
      )}

      {/* Create Department Modal */}
      {showCreateDeptModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
           <div className="absolute inset-0 bg-background/80 backdrop-blur-md" onClick={() => setShowCreateDeptModal(false)} />
           <div className="glass-strong rounded-3xl p-8 w-full max-w-sm relative z-10 border border-border/50 shadow-[0_20px_50px_-10px_rgba(0,0,0,0.5)]">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
                 <Grid2X2 size={32} className="text-primary" />
              </div>
              <h3 className="font-display font-bold text-xl text-foreground">Create Department Matrix</h3>
              <p className="text-xs font-body text-muted-foreground mt-2 mb-6 ml-0">Initializes the root and generates all 8 semester dependencies natively.</p>
              
               <div className="space-y-4">
                 <div>
                   <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5 block">Short Code (e.g. IT)</label>
                   <input 
                      autoFocus
                      placeholder="e.g. IT"
                      value={newDeptForm.short_name}
                      onChange={e => setNewDeptForm({ ...newDeptForm, short_name: e.target.value })}
                      className="w-full bg-surface-1 border border-border/50 rounded-2xl px-4 py-3 text-sm uppercase font-body focus:outline-none focus:ring-1 focus:ring-primary/40"
                   />
                 </div>
                 <div>
                   <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5 block">Full Department Name</label>
                   <input 
                      placeholder="e.g. Information Technology"
                      value={newDeptForm.name}
                      onChange={e => setNewDeptForm({ ...newDeptForm, name: e.target.value })}
                      className="w-full bg-surface-1 border border-border/50 rounded-2xl px-4 py-3 text-sm font-body focus:outline-none focus:ring-1 focus:ring-primary/40"
                   />
                 </div>
              </div>

              <div className="flex gap-3 mt-8">
                 <button onClick={() => setShowCreateDeptModal(false)} className="flex-1 py-3 text-xs font-bold uppercase tracking-widest text-muted-foreground hover:bg-surface-2 rounded-2xl transition-colors">Cancel</button>
                 <Button
                   className="flex-1 py-6 rounded-2xl font-bold uppercase tracking-widest text-xs"
                   disabled={!newDeptForm.name.trim() || !newDeptForm.short_name.trim()}
                   onClick={() => createDepartment(newDeptForm)}
                 >Initialize</Button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

// Types check
interface ScrollTextProps { size?: number, className?: string }
const ScrollText = ({ size = 18, className = "" }: ScrollTextProps) => <FileText size={size} className={className} />;

export default AdminContentManagement;
