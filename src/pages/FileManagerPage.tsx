import { useState, useMemo, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  ChevronRight, ChevronDown, FolderOpen, Folder, Home,
  FileText, PlayCircle, BookMarked, ScrollText, User, Bot,
  BookOpen, Grid2X2, List, Download, Bookmark, Star, Search,
  Loader2, X, Menu as MenuIcon,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import api from "../lib/api";
import { useAuthStore } from "../store/authStore";
import { useDownloadMaterial } from "../hooks/useMaterials";
import { useBookmarks, useToggleBookmark } from "../hooks/useBookmarks";
import { cn } from "@/lib/utils";
import { useDebounce } from "../hooks/useDebounce";

// ─── File type icons (color coded) ───
const FILE_ICONS: Record<string, { icon: any; color: string; label: string }> = {
  notes:         { icon: FileText,  color: "text-blue-400",   label: "Notes" },
  teacher_notes: { icon: BookOpen,  color: "text-purple-400", label: "Teacher's" },
  pyq:           { icon: ScrollText,color: "text-orange-400", label: "PYQ" },
  youtube:       { icon: PlayCircle,color: "text-red-400",    label: "YouTube" },
  student_notes: { icon: User,      color: "text-green-400",  label: "Student" },
  book:          { icon: BookMarked,color: "text-indigo-400", label: "Book" },
  ai_notes:      { icon: Bot,       color: "text-cyan-400",   label: "AI Notes" },
};

// ─── Tree Item (controlled expansion) ──────────────────────────
const FolderTreeItem = ({
  node, depth = 0, activeFolderId, expandedIds, onSelect, onToggle,
}: {
  node: any; depth?: number; activeFolderId: string | null;
  expandedIds: Set<string>; onSelect: (node: any) => void; onToggle: (id: string) => void;
}) => {
  const isActive = activeFolderId === node.id;
  const hasChildren = node.children?.length > 0;
  const open = expandedIds.has(node.id);

  return (
    <div className="select-none">
      <div
        className={cn(
          "flex items-center gap-1 py-[6px] pr-2 cursor-pointer transition-colors rounded-lg group mx-1",
          isActive
            ? "bg-primary/15 text-primary shadow-sm"
            : "text-muted-foreground hover:bg-surface-2 hover:text-foreground"
        )}
        style={{ paddingLeft: `${depth * 14 + 6}px` }}
        onClick={() => onSelect(node)}
      >
        <button
          aria-label="Toggle folder expansion"
          className="w-5 h-5 flex items-center justify-center shrink-0 hover:text-foreground rounded-md hover:bg-surface-3 transition-colors"
          onClick={(e) => { e.stopPropagation(); onToggle(node.id); }}
        >
          {hasChildren ? (
            open
              ? <ChevronDown size={14} className="opacity-70" />
              : <ChevronRight size={14} className="opacity-70" />
          ) : <span className="w-4" />}
        </button>

        {open && hasChildren
          ? <FolderOpen size={16} className={cn("shrink-0 mr-1.5", isActive ? "text-primary" : "text-primary/60")} />
          : <Folder size={16} className={cn("shrink-0 mr-1.5", isActive ? "text-primary" : "text-muted-foreground/50")} />
        }

        <span className={cn("truncate text-[13px] font-body flex-1", isActive ? "font-semibold" : "font-medium")}>
          {node.name}
        </span>
      </div>

      {open && hasChildren && node.children.map((child: any) => (
        <FolderTreeItem
          key={child.id} node={child} depth={depth + 1}
          activeFolderId={activeFolderId} expandedIds={expandedIds}
          onSelect={onSelect} onToggle={onToggle}
        />
      ))}
    </div>
  );
};

// ─── Main ─────────────────────────────────────────────────────────
const FileManagerPage = () => {
  const user = useAuthStore(s => s.user);
  const navigate = useNavigate();
  const location = useLocation();

  // Read active folder from URL query param: /files?folder=<id>
  const params = new URLSearchParams(location.search);
  const activeFolderId = params.get('folder') || null;

  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [rawSearch, setRawSearch] = useState("");
  const search = useDebounce(rawSearch, 300);

  // Controlled folder expansion state
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => new Set());

  // Fix 10: Mobile folder drawer
  const [mobileFolderOpen, setMobileFolderOpen] = useState(false);

  const handleToggle = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const { data: folderData, isLoading: isLoadingFolders } = useQuery({
    queryKey: ['folders', user?.department_id],
    queryFn: () => api.get('/api/folders').then(r => r.data),
    enabled: !!user?.department_id,
  });

  const { data: materialsData, isLoading: isLoadingFiles } = useQuery({
    queryKey: ['materials', 'folder', activeFolderId, search],
    queryFn: () => api.get('/api/materials', {
      params: { folder_id: activeFolderId, search: search || undefined }
    }).then(r => r.data),
    enabled: !!activeFolderId,
  });

  const { mutate: download } = useDownloadMaterial();
  const { data: bookmarksData } = useBookmarks();
  const { mutate: toggleBookmark } = useToggleBookmark();

  // Build tree
  const tree = useMemo(() => {
    if (!folderData?.folders) return [];
    const build = (parentId: string | null = null): any[] =>
      folderData.folders
        .filter((f: any) => f.parent_id === parentId)
        .map((f: any) => ({ ...f, children: build(f.id) }));

    const roots = build(null);
    const deptRoot = roots.find(r => r.folder_type === 'department');
    // Wrap the dept root in an array so it appears as the top-level parent
    return deptRoot ? [deptRoot] : roots;
  }, [folderData]);

  // Flatten for breadcrumb lookup
  const allFolders: any[] = folderData?.folders || [];
  const activeFolder = allFolders.find(f => f.id === activeFolderId) || null;

  // Auto-expand ancestors when URL changes (deep-link support)
  useEffect(() => {
    if (!activeFolderId || !allFolders.length) return;
    const ancestors = new Set<string>();
    let cur: any = allFolders.find((f: any) => f.id === activeFolderId);
    while (cur?.parent_id) {
      ancestors.add(cur.parent_id);
      cur = allFolders.find((f: any) => f.id === cur.parent_id);
    }
    if (ancestors.size > 0) {
      setExpandedIds(prev => new Set([...prev, ...ancestors]));
    }
  }, [activeFolderId, allFolders]);

  // Auto-Navigate to Department Root
  useEffect(() => {
    if (!activeFolderId && folderData?.folders) {
      const rootFolder = folderData.folders.find((f: any) => f.parent_id === null && f.folder_type === 'department');
      if (rootFolder) {
        navigate(`/files?folder=${rootFolder.id}`, { replace: true });
      }
    }
  }, [activeFolderId, folderData, navigate]);

  // Build breadcrumb path from active folder up
  const breadcrumb = useMemo(() => {
    if (!activeFolderId || !allFolders.length) return [];
    const path: any[] = [];
    let current = allFolders.find(f => f.id === activeFolderId);
    while (current) {
      path.unshift(current);
      current = allFolders.find(f => f.id === current.parent_id);
    }
    return path;
  }, [activeFolderId, allFolders]);

  const files = materialsData?.materials || [];

  const subFolders = useMemo(() => {
    if (!allFolders.length || !activeFolderId) return [];
    return allFolders.filter(f => f.parent_id === activeFolderId);
  }, [allFolders, activeFolderId]);

  const navigateTo = (folder: any) => {
    navigate(`/files?folder=${folder.id}`);
  };

  return (
    <div className="flex flex-col h-full max-w-[1400px] mx-auto gap-4">
      {/* Breadcrumb Navigation Panel */}
      <div className="flex items-center gap-1.5 px-4 py-3 bg-surface-1/50 rounded-2xl border border-border/40 text-[11px] font-body flex-shrink-0 shadow-sm backdrop-blur-sm">
        <Home size={13} className="text-muted-foreground transition-colors hover:text-primary cursor-pointer" onClick={() => navigate('/files')} />
        <ChevronRight size={10} className="text-border mx-0.5" />
        <span
          onClick={() => navigate('/files')}
          className="text-muted-foreground hover:text-primary cursor-pointer font-bold uppercase tracking-wider transition-colors"
        >
          {user?.department?.short_name || 'Library'}
        </span>
        {breadcrumb.map((b, i) => (
          <span key={b.id} className="flex items-center">
            <ChevronRight size={10} className="text-border mx-1.5" />
            <span
              onClick={() => navigateTo(b)}
              className={cn(
                "cursor-pointer font-bold uppercase tracking-wider transition-colors",
                i === breadcrumb.length - 1 ? "text-primary bg-primary/5 px-2 py-0.5 rounded-md" : "text-muted-foreground hover:text-primary"
              )}
            >
              {b.name}
            </span>
          </span>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-5 flex-1 min-h-0 overflow-hidden">
        {/* LEFT: VSCode-style Navigator */}
        <div className="overflow-y-auto custom-scrollbar bg-card/40 rounded-2xl border border-border/50 flex flex-col backdrop-blur-sm shadow-xl hidden lg:flex">
          <div className="px-5 py-4 border-b border-border/30 flex items-center justify-between">
            <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-[0.2em] flex items-center gap-2">
              <Folder size={12} /> EXPLORER
            </p>
          </div>
          <div className="py-3 flex-1">
            {isLoadingFolders ? (
              <div className="px-4 space-y-2">
                {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="h-8 rounded-lg shimmer w-full" />)}
              </div>
            ) : tree.length === 0 ? (
              <div className="flex flex-col items-center justify-center pt-10 text-center px-4 opacity-50">
                <FolderOpen size={32} className="mb-2 text-muted-foreground/30" />
                <p className="text-[11px] text-muted-foreground font-body">No directories found.</p>
              </div>
            ) : (
              tree.map(node => (
                <FolderTreeItem
                  key={node.id} node={node}
                  activeFolderId={activeFolderId}
                  expandedIds={expandedIds}
                  onSelect={navigateTo}
                  onToggle={handleToggle}
                />
              ))
            )}
          </div>
        </div>

        {/* RIGHT: Content Viewport */}
        <div className="flex flex-col min-h-0 bg-surface-1/10 rounded-2xl border border-border/40 overflow-hidden shadow-2xl backdrop-blur-sm">
          {/* Dashboard Header toolbar */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border/30 bg-card/20 flex-shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              {/* Fix 10: Mobile folder toggle */}
              <button
                aria-label="Toggle menu"
                className="lg:hidden flex items-center gap-1.5 px-3 py-2 text-xs font-body bg-surface-1 border border-border/50 rounded-xl text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => setMobileFolderOpen(true)}
              >
                <MenuIcon size={14} />
                <span>Folders</span>
                {activeFolderId && <span className="w-1.5 h-1.5 rounded-full bg-primary ml-1" />}
              </button>
              <div className="p-2 rounded-xl bg-surface-2 border border-border/50">
                 <FolderOpen size={18} className="text-primary" />
              </div>
              <div className="min-w-0">
                <h3 className="font-display font-bold text-base text-foreground truncate">
                  {activeFolder?.name || "Vault Library"}
                </h3>
                {activeFolderId && (
                  <p className="text-[10px] text-muted-foreground font-body mt-0.5 flex items-center gap-1.5">
                    <span className="w-1 h-1 rounded-full bg-success" />
                    Indexed {files.length} materials in this path
                  </p>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="relative group">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <input
                  value={rawSearch}
                  onChange={e => setRawSearch(e.target.value)}
                  placeholder="Search repository..."
                  className="bg-card/40 border border-border/50 rounded-xl pl-9 pr-3 py-2 text-xs font-body w-48 focus:outline-none focus:ring-1 focus:ring-primary/40 focus:bg-card/80 transition-all shadow-sm"
                />
              </div>
              <div className="flex gap-0.5 bg-card/40 rounded-xl p-1 border border-border/40 shadow-inner">
                {([['grid', Grid2X2], ['list', List]] as const).map(([mode, Icon]) => (
                  <button key={mode} aria-label={`Switch to ${mode} view`} onClick={() => setViewMode(mode)}
                    className={cn("w-8 h-8 flex items-center justify-center rounded-lg transition-all",
                      viewMode === mode 
                        ? "bg-surface-1 text-primary shadow-md border border-border/50" 
                        : "text-muted-foreground hover:text-foreground hover:bg-surface-1/50")}>
                    <Icon size={14} />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Files Grid/List */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
            {!activeFolderId ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-20 animate-in fade-in duration-700">
                <div className="w-20 h-20 bg-primary/5 rounded-[2.5rem] flex items-center justify-center mb-6 border border-primary/10 shadow-inner">
                  <FolderOpen size={40} className="text-primary/40" />
                </div>
                <h4 className="font-display font-bold text-xl text-foreground">Select a directory</h4>
                <p className="text-sm text-muted-foreground mt-2 max-w-[280px] font-body leading-relaxed">
                  Browse the department repository using the explorer in the sidebar.
                </p>
              </div>
            ) : isLoadingFiles ? (
              <div className="flex flex-col items-center justify-center h-full py-20 gap-4">
                <div className="relative">
                   <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full" />
                   <Loader2 size={32} className="animate-spin text-primary relative z-10" />
                </div>
                <p className="text-xs font-body uppercase font-bold tracking-[0.2em] text-muted-foreground">Hydrating database...</p>
              </div>
            ) : files.length === 0 && subFolders.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-20 opacity-60">
                <FileText size={48} className="mb-4 text-muted-foreground/20" />
                <h4 className="font-display font-bold text-base text-foreground">Empty path</h4>
                <p className="text-xs text-muted-foreground mt-1 font-body">No materials uploaded here yet.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-8">
                {subFolders.length > 0 && (
                  <div>
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-4">Directories</h4>
                    <div className={cn(
                      viewMode === 'grid'
                        ? "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4"
                        : "flex flex-col gap-2"
                    )}>
                      {subFolders.map((sf: any) => {
                        const childCount = allFolders.filter(f => f.parent_id === sf.id).length;
                        return viewMode === 'grid' ? (
                          <div key={sf.id} onClick={() => navigateTo(sf)}
                            className="group p-4 bg-card/40 border border-border/40 rounded-2xl hover:bg-surface-1 transition-all cursor-pointer text-center relative overflow-hidden shadow-sm"
                          >
                             <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/5 transition-colors" />
                             <FolderOpen size={40} className="mx-auto text-primary/40 group-hover:text-primary transition-colors mb-4" />
                             <p className="text-xs font-body font-bold text-foreground truncate">{sf.name}</p>
                             <p className="text-[9px] text-muted-foreground mt-1 uppercase">{childCount} Items</p>
                          </div>
                        ) : (
                          <div key={sf.id} onClick={() => navigateTo(sf)}
                            className="flex items-center gap-4 px-5 py-3.5 rounded-2xl bg-card/30 border border-border/40 hover:bg-card/60 transition-all group border-l-4 border-l-transparent hover:border-l-primary cursor-pointer"
                          >
                             <div className="w-10 h-10 rounded-xl bg-surface-2 flex items-center justify-center shrink-0 group-hover:bg-primary/5 transition-colors">
                               <FolderOpen size={20} className="text-primary/70 group-hover:text-primary transition-colors" />
                             </div>
                             <div className="flex-1 min-w-0">
                               <p className="text-sm font-body font-bold text-foreground truncate">{sf.name}</p>
                               <div className="flex items-center gap-3 mt-1">
                                  <p className="text-[10px] font-bold uppercase text-primary">Directory</p>
                                  <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                                  <p className="text-[10px] text-muted-foreground font-body">{childCount} item{childCount !== 1 ? 's' : ''} inside</p>
                               </div>
                             </div>
                             <ChevronRight size={16} className="text-muted-foreground/40 group-hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {files.length > 0 && (
                  <div>
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-4 mt-2">Materials</h4>
                    <div className={cn(
                      viewMode === 'grid'
                        ? "grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4"
                        : "flex flex-col gap-2"
                    )}>
                {files.map((file: any) => {
                  const iconCfg = FILE_ICONS[file.material_type] || FILE_ICONS.notes;
                  const isBookmarked = bookmarksData?.some((b: any) => b.material?.id === file.id);
                  return viewMode === 'grid' ? (
                    <div key={file.id}
                      className="group relative flex flex-col bg-card/30 border border-border/50 rounded-2xl p-4 hover:bg-card/60 transition-all hover:translate-y-[-4px] hover:shadow-2xl hover:border-primary/20"
                    >
                      <div className="absolute top-3 right-3 z-10">
                         <button aria-label={isBookmarked ? "Remove bookmark" : "Add bookmark"} onClick={() => toggleBookmark({ materialId: file.id, isBookmarked: !!isBookmarked })}
                            className={cn(
                              "w-8 h-8 rounded-xl flex items-center justify-center transition-all backdrop-blur-md",
                              isBookmarked ? "bg-primary/20 text-primary shadow-sm" : "bg-card/40 text-muted-foreground hover:bg-card/80"
                            )}>
                            <Bookmark size={14} className={isBookmarked ? "fill-primary" : ""} />
                         </button>
                      </div>

                      <div className={cn("w-full aspect-video rounded-xl flex items-center justify-center mb-4 transition-all group-hover:scale-[1.02] border border-border/20", 
                        iconCfg.color.replace('text-', 'bg-').replace('-400', '-400/5'))}>
                        <iconCfg.icon size={36} className={iconCfg.color} />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-body font-bold text-foreground truncate group-hover:text-primary transition-colors">{file.title}</p>
                        <div className="flex items-center justify-between mt-2">
                           <span className={cn("text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md border border-border/50", iconCfg.color)}>
                              {iconCfg.label}
                           </span>
                           <div className="flex items-center gap-1">
                              <Star size={10} className={file.average_rating ? "fill-warning text-warning" : "text-border"} />
                              <span className="text-[10px] text-muted-foreground font-bold">{file.average_rating?.toFixed(1) || '—'}</span>
                           </div>
                        </div>
                      </div>

                      <button aria-label="Download file" onClick={() => download(file.id)}
                        className="w-full mt-4 h-9 rounded-xl bg-surface-2 hover:bg-primary/10 hover:text-primary border border-border/50 flex items-center justify-center gap-2 transition-all font-body text-xs font-semibold">
                        <Download size={14} /> Download File
                      </button>
                    </div>
                  ) : (
                    <div key={file.id}
                      className="flex items-center gap-4 px-5 py-3.5 rounded-2xl bg-card/30 border border-border/40 hover:bg-card/60 transition-all group border-l-4 border-l-transparent hover:border-l-primary"
                    >
                      <div className="w-10 h-10 rounded-xl bg-surface-2 flex items-center justify-center shrink-0 group-hover:bg-primary/5 transition-colors">
                        <iconCfg.icon size={20} className={iconCfg.color} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-body font-bold text-foreground truncate">{file.title}</p>
                        <div className="flex items-center gap-3 mt-1">
                           <p className={cn("text-[10px] font-bold uppercase", iconCfg.color)}>
                             {iconCfg.label}
                           </p>
                           <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                           <p className="text-[10px] text-muted-foreground font-body">
                             {file.subject?.name || 'Departmental Index'}
                           </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 px-2 py-1 bg-surface-2 rounded-lg mr-2">
                           <Star size={10} className={file.average_rating ? "fill-warning text-warning" : "text-border"} />
                           <span className="text-[10px] text-muted-foreground font-bold">{file.average_rating?.toFixed(1) || '0.0'}</span>
                        </div>
                        <button aria-label={isBookmarked ? "Remove bookmark" : "Add bookmark"} onClick={() => toggleBookmark({ materialId: file.id, isBookmarked: !!isBookmarked })}
                          className={cn(
                            "w-9 h-9 rounded-xl flex items-center justify-center transition-all",
                            isBookmarked ? "bg-primary/10 text-primary" : "bg-surface-2 text-muted-foreground hover:text-foreground"
                          )}>
                          <Bookmark size={15} className={isBookmarked ? "fill-primary" : ""} />
                        </button>
                        <button aria-label="Download file" onClick={() => download(file.id)}
                          className="w-9 h-9 rounded-xl bg-primary shadow-lg shadow-primary/20 hover:bg-primary/90 text-primary-foreground flex items-center justify-center transition-all transform hover:scale-105">
                          <Download size={16} />
                        </button>
                      </div>
                    </div>
                  );
                })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Fix 10: Mobile Folder Drawer */}
      {mobileFolderOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            onClick={() => setMobileFolderOpen(false)}
          />
          <div className="absolute left-0 top-0 bottom-0 w-72 bg-card border-r border-border/50 flex flex-col animate-in slide-in-from-left duration-300 overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border/30">
              <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-[0.2em]">
                EXPLORER
              </p>
              <button aria-label="Close menu" onClick={() => setMobileFolderOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X size={18} />
              </button>
            </div>
            <div className="py-3 flex-1">
              {tree.map(node => (
                <FolderTreeItem
                  key={node.id}
                  node={node}
                  activeFolderId={activeFolderId}
                  expandedIds={expandedIds}
                  onSelect={(folder) => {
                    navigateTo(folder);
                    setMobileFolderOpen(false);
                  }}
                  onToggle={handleToggle}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FileManagerPage;
