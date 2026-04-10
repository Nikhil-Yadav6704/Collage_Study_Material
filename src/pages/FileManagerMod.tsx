import { useState, useMemo, useRef } from "react";
import { Menu as MenuIcon } from "lucide-react";
import {
  ChevronRight,
  ChevronDown,
  FolderOpen,
  Folder,
  Home,
  BookOpen,
  Calendar,
  FileText,
  PlayCircle,
  Image,
  Grid2X2,
  List,
  Download,
  Star,
  Plus,
  MoreHorizontal,
  ShieldCheck,
  Upload,
  CheckSquare,
  Pencil,
  Trash2,
  BookMarked,
  Search,
  Loader2,
  AlertCircle,
  ScrollText,
  User,
  Bot,
  FilePlus,
  FolderPlus,
  RefreshCw,
  Check,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { cn } from "@/lib/utils";
import { Link, useNavigate } from "react-router-dom";
import { useDebounce } from "@/hooks/useDebounce";
import { useDownloadMaterial } from "@/hooks/useMaterials";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";

const fileIcons: Record<string, { icon: any; color: string }> = {
  notes: { icon: FileText, color: "text-blue-500" },
  teacher_notes: { icon: BookOpen, color: "text-purple-500" },
  pyq: { icon: ScrollText, color: "text-orange-500" },
  youtube: { icon: PlayCircle, color: "text-red-500" },
  student_notes: { icon: User, color: "text-green-500" },
  book: { icon: BookMarked, color: "text-indigo-500" },
  ai_notes: { icon: Bot, color: "text-cyan-500" },
};

// ─── TreeItem (controlled expansion, lifted outside) ─────────────
const TreeItem = ({
  node,
  depth = 0,
  selectedId,
  onSelect,
  expandedIds,
  onToggle,
  renamingId,
  renameVal,
  onRenameChange,
  onRenameSubmit,
}: {
  node: any;
  depth?: number;
  selectedId?: string | null;
  onSelect: (node: any) => void;
  expandedIds: Set<string>;
  onToggle: (id: string) => void;
  renamingId?: string | null;
  renameVal?: string;
  onRenameChange?: (v: string) => void;
  onRenameSubmit?: () => void;
}) => {
  const expanded = expandedIds.has(node.id);
  const hasChildren = node.children && node.children.length > 0;
  const isSelected = selectedId === node.id;
  const Icon = hasChildren ? (expanded ? FolderOpen : Folder) : Folder;

  return (
    <div>
      <div
        className={cn(
          "group flex items-center gap-1.5 px-3 py-2 rounded-xl text-[13px] font-body cursor-pointer transition-colors w-full text-left relative",
          isSelected
            ? "bg-primary/10 text-primary border border-primary/20 shadow-sm font-semibold"
            : "text-muted-foreground hover:bg-surface-2 hover:text-foreground"
        )}
        style={{ paddingLeft: `${depth * 12 + 12}px` }}
        onClick={() => onSelect(node)}
      >
        <button
          onClick={(e) => { e.stopPropagation(); onToggle(node.id); }}
          className="flex items-center gap-1.5 flex-1 outline-none min-w-0"
        >
          {hasChildren ? (
            expanded ? <ChevronDown size={12} className="shrink-0" /> : <ChevronRight size={12} className="shrink-0" />
          ) : (
            <span className="w-3 shrink-0" />
          )}
          <Icon size={14} className={cn("shrink-0", isSelected ? "text-primary" : "text-muted-foreground/60")} />
          {renamingId === node.id ? (
            <input
              autoFocus
              value={renameVal || ''}
              onChange={e => onRenameChange?.(e.target.value)}
              onBlur={() => onRenameSubmit?.()}
              onKeyDown={e => {
                if (e.key === 'Enter') onRenameSubmit?.();
                if (e.key === 'Escape') onRenameChange?.('');
              }}
              className="bg-background border border-primary/40 rounded px-1 text-[13px] w-full focus:outline-none"
              onClick={e => e.stopPropagation()}
            />
          ) : (
            <span className="truncate">{node.name}</span>
          )}
        </button>
      </div>
      {expanded &&
        node.children?.map((child: any) => (
          <TreeItem
            key={child.id} node={child} depth={depth + 1}
            selectedId={selectedId} onSelect={onSelect}
            expandedIds={expandedIds} onToggle={onToggle}
            renamingId={renamingId} renameVal={renameVal}
            onRenameChange={onRenameChange} onRenameSubmit={onRenameSubmit}
          />
        ))}
    </div>
  );
};

// ─── Main ────────────────────────────────────────────────────────
const FileManagerMod = () => {
  const user = useAuthStore(s => s.user);
  const qc = useQueryClient();
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [rawSearch, setRawSearch] = useState("");
  const search = useDebounce(rawSearch, 300);
  const [selectedFolder, setSelectedFolder] = useState<any>(null);

  // Controlled folder expansion state
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => new Set());
  const handleToggle = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Download hook (Fix 3B)
  const { mutate: download } = useDownloadMaterial();

  // Inline folder creation (Fix 7)
  const [inlineNewFolder, setInlineNewFolder] = useState<{ parentId: string | null } | null>(null);
  const [newFolderName, setNewFolderName] = useState("");

  // Rename state (Fix 8)
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameVal, setRenameVal] = useState("");

  // Inline upload panel (Fix 7)
  const [showUploadPanel, setShowUploadPanel] = useState(false);
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadType, setUploadType] = useState("notes");
  const [uploadSubjectId, setUploadSubjectId] = useState("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadLink, setUploadLink] = useState("");
  const [uploadSemester, setUploadSemester] = useState('1'); // Fix 7: dynamic semester
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fix 10: Mobile folder drawer
  const [mobileFolderOpen, setMobileFolderOpen] = useState(false);

  // ─── Data Queries ───────────────────────────────────────────────
  const { data: folderData, isLoading: isLoadingFolders } = useQuery({
    queryKey: ['folders', user?.department_id],
    queryFn: () => api.get('/api/folders').then(r => r.data),
    enabled: !!user?.department_id,
  });

  const { data: materialsData, isLoading: isLoadingMaterials } = useQuery({
    queryKey: ['materials', 'folder', selectedFolder?.id, search],
    queryFn: () => api.get('/api/materials', {
      params: { folder_id: selectedFolder?.id, search: search || undefined }
    }).then(r => r.data),
    enabled: !!selectedFolder?.id,
  });

  const { data: subjectsData } = useQuery({
    queryKey: ['subjects', user?.department_id],
    queryFn: () => api.get('/api/subjects').then(r => r.data),
    enabled: !!user?.department_id,
  });

  // ─── Mutations ──────────────────────────────────────────────────
  const { mutate: createFolder } = useMutation({
    mutationFn: (data: any) => api.post('/api/folders', data),
    onSuccess: (res: any) => {
      qc.invalidateQueries({ queryKey: ['folders'] });
      setInlineNewFolder(null);
      setNewFolderName("");
      if (res.data?.folder) setSelectedFolder(res.data.folder);
    },
  });

  const { mutate: renameFolder } = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      api.patch(`/api/folders/${id}`, { name }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['folders'] });
      setRenamingId(null);
    },
  });

  const { mutate: deleteFolder } = useMutation({
    mutationFn: (id: string) => api.delete(`/api/folders/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['folders'] });
      setSelectedFolder(null);
    },
  });

  const { mutate: uploadMaterial, isPending: isUploading } = useMutation({
    mutationFn: async () => {
      const formData = new FormData();
      formData.append('title', uploadTitle);
      formData.append('material_type', uploadType);
      formData.append('subject_id', uploadSubjectId);
      formData.append('department_id', user!.department_id!);
      // Fix 7: Use semester from selected folder, or user-selected semester
      const semesterValue = selectedFolder?.semester?.toString() || uploadSemester;
      formData.append('semester', semesterValue);
      formData.append('year_restriction', user?.year || '1');
      if (selectedFolder?.id) formData.append('folder_id', selectedFolder.id);
      if (uploadFile) formData.append('file', uploadFile);
      if (uploadLink) formData.append('external_url', uploadLink);
      return api.post('/api/upload/material', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['materials'] });
      setShowUploadPanel(false);
      setUploadTitle(""); setUploadFile(null); setUploadLink("");
    },
  });

  // ─── Tree ───────────────────────────────────────────────────────
  const tree = useMemo(() => {
    if (!folderData?.folders) return [];
    const build = (parentId: string | null = null): any[] => {
      return folderData.folders
        .filter((f: any) => f.parent_id === parentId)
        .map((f: any) => ({ ...f, children: build(f.id) }));
    };
    return build(null);
  }, [folderData]);

  const materials = materialsData?.materials || [];

  return (
    <div className="flex flex-col h-full max-w-[1400px] mx-auto">
      {/* HEADER: Breadcrumb + IDE Toolbar (Fix 7) */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div className="flex items-center gap-1.5 text-sm font-body">
          <Home size={14} className="text-muted-foreground" />
          <ChevronRight size={12} className="text-border" />
          <span className="text-foreground font-medium">{user?.department?.short_name || 'Dept'} Library</span>
          {selectedFolder && (
            <>
              <ChevronRight size={12} className="text-border" />
              <span className="text-primary font-semibold">{selectedFolder.name}</span>
            </>
          )}
        </div>

        {/* VSCode-style toolbar */}
        <div className="flex items-center gap-1 bg-surface-1 border border-border/50 rounded-xl p-1">
          <button
            onClick={() => {
              if (!selectedFolder) { alert("Select a folder first"); return; }
              setShowUploadPanel(true);
            }}
            title="New File / Upload"
            className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all"
          >
            <FilePlus size={15} />
          </button>
          <button
            onClick={() => {
              setInlineNewFolder({ parentId: selectedFolder?.id || null });
              setNewFolderName("");
            }}
            title="New Folder"
            className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all"
          >
            <FolderPlus size={15} />
          </button>
          <button
            onClick={() => setShowUploadPanel(true)}
            title="Import / Upload File"
            className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all"
          >
            <Upload size={15} />
          </button>
          <button
            onClick={() => qc.invalidateQueries({ queryKey: ['folders'] })}
            title="Refresh"
            className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-surface-2 transition-all"
          >
            <RefreshCw size={15} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6 flex-1 min-h-0 overflow-hidden">
        {/* LEFT PANEL — Folder Tree with Context Menu (Fix 8) */}
        <div className="overflow-y-auto custom-scrollbar bg-sidebar-bg/30 rounded-2xl border border-border/40 p-3 hidden lg:block">
          <div className="px-3 py-2 mb-2">
            <h4 className="text-[10px] uppercase font-bold text-muted-foreground/40 tracking-[0.2em]">Folders</h4>
          </div>

          {/* Inline new folder input (Fix 7) */}
          {inlineNewFolder !== null && (
            <div
              className="flex items-center gap-2 px-3 py-2 mx-1 rounded-xl bg-primary/5 border border-primary/20 mb-2"
              style={{ paddingLeft: `${(selectedFolder ? 1 : 0) * 12 + 24}px` }}
            >
              <FolderPlus size={14} className="text-primary shrink-0" />
              <input
                autoFocus
                value={newFolderName}
                onChange={e => setNewFolderName(e.target.value)}
                placeholder="New folder name..."
                className="bg-transparent flex-1 text-[13px] font-body focus:outline-none text-foreground placeholder:text-muted-foreground/50"
                onKeyDown={e => {
                  if (e.key === 'Enter' && newFolderName.trim()) {
                    createFolder({
                      name: newFolderName.trim(),
                      parent_id: inlineNewFolder.parentId,
                      department_id: user?.department_id,
                      folder_type: inlineNewFolder.parentId ? 'sub' : 'department',
                    });
                  }
                  if (e.key === 'Escape') {
                    setInlineNewFolder(null);
                    setNewFolderName("");
                  }
                }}
                onBlur={() => { if (!newFolderName.trim()) setInlineNewFolder(null); }}
              />
              <div className="flex gap-1">
                <button
                  onClick={() => {
                    if (newFolderName.trim()) {
                      createFolder({
                        name: newFolderName.trim(),
                        parent_id: inlineNewFolder.parentId,
                        department_id: user?.department_id,
                        folder_type: inlineNewFolder.parentId ? 'sub' : 'department',
                      });
                    }
                  }}
                  className="w-5 h-5 flex items-center justify-center text-success hover:text-success/80"
                >
                  <Check size={12} />
                </button>
                <button
                  onClick={() => { setInlineNewFolder(null); setNewFolderName(""); }}
                  className="w-5 h-5 flex items-center justify-center text-muted-foreground hover:text-danger"
                >
                  <X size={12} />
                </button>
              </div>
            </div>
          )}

          {isLoadingFolders ? (
            [1,2,3,4].map(i => <div key={i} className="h-8 rounded-lg shimmer mx-2 my-1" />)
          ) : tree.length === 0 ? (
            <div className="p-4 text-center">
              <p className="text-xs text-muted-foreground">No folders found.</p>
            </div>
          ) : (
            tree.map((node) => (
              <ContextMenu key={node.id}>
                <ContextMenuTrigger>
                  <TreeItem
                    node={node} selectedId={selectedFolder?.id}
                    onSelect={setSelectedFolder} expandedIds={expandedIds}
                    onToggle={handleToggle} renamingId={renamingId}
                    renameVal={renameVal} onRenameChange={setRenameVal}
                    onRenameSubmit={() => {
                      if (renamingId && renameVal.trim()) renameFolder({ id: renamingId, name: renameVal.trim() });
                      setRenamingId(null);
                    }}
                  />
                </ContextMenuTrigger>
                <ContextMenuContent className="w-48 glass-strong border-border/50 shadow-2xl">
                  <ContextMenuItem
                    onClick={() => { setInlineNewFolder({ parentId: node.id }); setNewFolderName(""); }}
                    className="gap-2 text-xs font-body"
                  >
                    <FolderPlus size={13} /> New Subfolder
                  </ContextMenuItem>
                  <ContextMenuItem
                    onClick={() => { setSelectedFolder(node); setShowUploadPanel(true); }}
                    className="gap-2 text-xs font-body"
                  >
                    <Upload size={13} /> Upload Here
                  </ContextMenuItem>
                  <ContextMenuSeparator />
                  <ContextMenuItem
                    onClick={() => { setRenamingId(node.id); setRenameVal(node.name); }}
                    className="gap-2 text-xs font-body"
                  >
                    <Pencil size={13} /> Rename
                  </ContextMenuItem>
                  <ContextMenuSeparator />
                  <ContextMenuItem
                    className="gap-2 text-xs font-body text-danger focus:text-danger focus:bg-danger/10"
                    onClick={() => {
                      if (window.confirm(`Delete "${node.name}"? All sub-folders will be removed.`)) {
                        deleteFolder(node.id);
                      }
                    }}
                  >
                    <Trash2 size={13} /> Delete Folder
                  </ContextMenuItem>
                </ContextMenuContent>
              </ContextMenu>
            ))
          )}
        </div>

        {/* RIGHT PANEL — Content */}
        <div className="flex flex-col min-h-0 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
               {/* Fix 10: Mobile folder toggle */}
               <button
                 className="lg:hidden flex items-center gap-1.5 px-3 py-2 text-xs font-body bg-surface-1 border border-border/50 rounded-xl text-muted-foreground hover:text-foreground transition-colors"
                 onClick={() => setMobileFolderOpen(true)}
               >
                 <MenuIcon size={14} />
                 <span>Folders</span>
                 {selectedFolder && <span className="w-1.5 h-1.5 rounded-full bg-primary ml-1" />}
               </button>
               <h3 className="font-display font-semibold text-lg text-foreground">
                  {selectedFolder ? selectedFolder.name : "Select a folder"}
               </h3>
               {selectedFolder && (
                 <span className="text-xs text-muted-foreground font-body bg-surface-1 px-2 py-0.5 rounded-full border border-border/50">
                   {materials.length} items
                 </span>
               )}
            </div>
            <div className="flex items-center gap-2">
               <div className="relative group">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                 <input
                    placeholder="Search folder..."
                    value={rawSearch}
                    onChange={(e) => setRawSearch(e.target.value)}
                    className="bg-surface-1 border border-border/50 rounded-xl pl-9 pr-4 py-1.5 text-xs font-body w-48 focus:outline-none focus:ring-1 focus:ring-primary/40 transition-all"
                 />
               </div>
               <div className="flex gap-1 bg-surface-1 rounded-xl p-1 border border-border/40">
                <button
                  aria-label="Grid view"
                  onClick={() => setViewMode("grid")}
                  className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center transition-all",
                    viewMode === "grid" ? "bg-surface-2 text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Grid2X2 size={15} />
                </button>
                <button
                  aria-label="List view"
                  onClick={() => setViewMode("list")}
                  className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center transition-all",
                    viewMode === "list" ? "bg-surface-2 text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <List size={15} />
                </button>
              </div>
            </div>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 pb-4">
            {!selectedFolder ? (
              <div className="flex flex-col items-center justify-center h-full opacity-40 text-center p-8">
                 <div className="w-16 h-16 rounded-3xl bg-surface-1 border border-border flex items-center justify-center mb-6">
                    <FolderOpen size={32} />
                 </div>
                 <h3 className="font-display font-semibold text-lg text-foreground">Open a folder to view materials</h3>
                 <p className="font-body text-sm text-muted-foreground mt-2 max-w-xs">Use the sidebar to navigate your department's file hierarchy.</p>
              </div>
            ) : isLoadingMaterials ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {[1,2,3,4,5].map(i => <div key={i} className="h-48 rounded-2xl shimmer" />)}
              </div>
            ) : materials.length === 0 ? (
              <div className="py-20 text-center opacity-40">
                 <FileText size={48} className="mx-auto mb-4" />
                 <p className="font-body text-sm text-muted-foreground">This folder is empty.</p>
              </div>
            ) : (
              viewMode === "grid" ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {materials.map((f: any) => {
                    const fi = fileIcons[f.material_type] || { icon: FileText, color: "text-muted-foreground" };
                    return (
                      <div
                        key={f.id}
                        className="gradient-border rounded-2xl p-4 hover:bg-surface-1/50 transition-all cursor-pointer group relative overflow-hidden"
                      >
                        <div className="w-full aspect-[4/3] rounded-xl bg-surface-2 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform duration-300">
                          <fi.icon size={40} className={fi.color} />
                        </div>
                        <p className="font-body text-[11px] text-foreground font-medium text-center line-clamp-2 px-1">
                          {f.title}
                        </p>
                        <p className="text-[10px] text-muted-foreground text-center mt-0.5">
                          {f.material_type.replace('_', ' ').toUpperCase()}
                        </p>
                        
                        {/* Grid Action Overlay */}
                        <div className="absolute bottom-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0">
                           <button
                             onClick={() => download(f.id)}
                             className="w-7 h-7 rounded-lg bg-surface-1/90 backdrop-blur-sm border border-border/30 flex items-center justify-center text-primary hover:text-primary/80 transition-colors"
                           >
                              <Download size={11} />
                           </button>
                           <button className="w-7 h-7 rounded-lg bg-surface-1/90 backdrop-blur-sm border border-border/30 flex items-center justify-center text-muted-foreground hover:text-danger transition-colors">
                              <Trash2 size={11} />
                           </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {materials.map((f: any) => {
                    const fi = fileIcons[f.material_type] || { icon: FileText, color: "text-muted-foreground" };
                    return (
                      <div
                        key={f.id}
                        className="flex items-center gap-4 px-4 py-3 rounded-2xl hover:bg-surface-1 transition-all cursor-pointer group border border-border/20"
                      >
                        <div className="w-9 h-9 rounded-xl bg-surface-2 flex items-center justify-center flex-shrink-0">
                          <fi.icon size={18} className={fi.color} />
                        </div>
                        <div className="flex-1 min-w-0">
                           <span className="font-body text-sm text-foreground truncate block">
                             {f.title}
                           </span>
                           <span className="text-[10px] text-muted-foreground">{f.material_type.replace('_', ' ').toUpperCase()}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {/* Fix 3B: Replace broken <a href={f.file_url}> with download button */}
                          <button
                            onClick={() => download(f.id)}
                            className="w-8 h-8 rounded-lg bg-primary/10 hover:bg-primary/20 flex items-center justify-center transition-colors"
                          >
                            <Download size={14} className="text-primary" />
                          </button>
                          <button className="w-8 h-8 rounded-lg hover:bg-surface-2 flex items-center justify-center text-muted-foreground hover:text-foreground">
                            <Pencil size={14} />
                          </button>
                          <button className="w-8 h-8 rounded-lg hover:bg-danger/10 flex items-center justify-center text-muted-foreground hover:text-danger">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )
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
                FOLDERS
              </p>
              <button onClick={() => setMobileFolderOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X size={18} />
              </button>
            </div>
            <div className="py-3 flex-1">
              {tree.map((node) => (
                <div key={node.id} onClick={() => { setSelectedFolder(node); setMobileFolderOpen(false); }}>
                  <TreeItem
                    node={node} selectedId={selectedFolder?.id}
                    onSelect={(n) => { setSelectedFolder(n); setMobileFolderOpen(false); }}
                    expandedIds={expandedIds}
                    onToggle={handleToggle}
                    renamingId={renamingId}
                    renameVal={renameVal}
                    onRenameChange={setRenameVal}
                    onRenameSubmit={() => {
                      if (renamingId && renameVal.trim()) renameFolder({ id: renamingId, name: renameVal.trim() });
                      setRenamingId(null);
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Inline Upload Panel (Fix 7) */}
      {showUploadPanel && (
        <div className="fixed inset-0 z-50 flex items-end justify-end p-4">
          <div
            className="absolute inset-0 bg-background/60 backdrop-blur-sm"
            onClick={() => setShowUploadPanel(false)}
          />
          <div className="relative z-10 w-full max-w-md bg-card rounded-2xl border border-border/60 shadow-2xl p-6 animate-in slide-in-from-right-4 duration-300">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-display font-bold text-base text-foreground">
                Upload to: <span className="text-primary">{selectedFolder?.name || 'Root'}</span>
              </h3>
              <button onClick={() => setShowUploadPanel(false)} className="text-muted-foreground hover:text-foreground">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <input
                value={uploadTitle}
                onChange={e => setUploadTitle(e.target.value)}
                placeholder="Material title..."
                className="w-full bg-input border border-border rounded-xl px-4 py-2.5 text-sm font-body focus:outline-none focus:ring-1 focus:ring-primary/40"
              />

              <select
                value={uploadType}
                onChange={e => setUploadType(e.target.value)}
                className="w-full bg-input border border-border rounded-xl px-4 py-2.5 text-sm font-body focus:outline-none appearance-none"
              >
                {[
                  ['notes', 'Notes'], ['teacher_notes', "Teacher's"], ['pyq', 'PYQ'],
                  ['youtube', 'YouTube'], ['student_notes', 'Student Notes'],
                  ['book', 'Book'], ['ai_notes', 'AI Notes'],
                ].map(([val, lbl]) => <option key={val} value={val}>{lbl}</option>)}
              </select>

              <select
                value={uploadSubjectId}
                onChange={e => setUploadSubjectId(e.target.value)}
                className="w-full bg-input border border-border rounded-xl px-4 py-2.5 text-sm font-body focus:outline-none appearance-none"
              >
                <option value="">Select subject...</option>
                {(subjectsData?.subjects || []).map((s: any) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>

              {/* Fix 7: Semester selector */}
              <select
                value={selectedFolder?.semester ? selectedFolder.semester.toString() : uploadSemester}
                onChange={e => setUploadSemester(e.target.value)}
                disabled={!!selectedFolder?.semester}
                className="w-full bg-input border border-border rounded-xl px-4 py-2.5 text-sm font-body focus:outline-none appearance-none disabled:opacity-60"
              >
                {[1,2,3,4,5,6,7,8].map(s => (
                  <option key={s} value={s.toString()}>
                    {['1st','2nd','3rd','4th','5th','6th','7th','8th'][s-1]} Semester
                    {selectedFolder?.semester === s ? ' (from folder)' : ''}
                  </option>
                ))}
              </select>

              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".pdf,.docx,.pptx,.jpg,.png"
                onChange={e => setUploadFile(e.target.files?.[0] || null)}
              />
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-border hover:border-primary/40 rounded-xl p-6 text-center cursor-pointer transition-colors"
              >
                {uploadFile ? (
                  <p className="text-sm font-body text-foreground">{uploadFile.name}</p>
                ) : (
                  <>
                    <Upload size={24} className="text-muted-foreground mx-auto mb-2" />
                    <p className="text-xs text-muted-foreground">Drop file or click to browse</p>
                  </>
                )}
              </div>

              <div className="flex items-center gap-2">
                <hr className="flex-1 border-border/50" />
                <span className="text-[10px] text-muted-foreground uppercase">or link</span>
                <hr className="flex-1 border-border/50" />
              </div>

              <input
                value={uploadLink}
                onChange={e => setUploadLink(e.target.value)}
                placeholder="https://youtube.com/..."
                className="w-full bg-input border border-border rounded-xl px-4 py-2.5 text-sm font-body focus:outline-none focus:ring-1 focus:ring-primary/40"
              />

              <Button
                variant="mod-primary"
                className="w-full h-11"
                disabled={isUploading || !uploadTitle || (!uploadFile && !uploadLink) || !uploadSubjectId}
                onClick={() => uploadMaterial()}
              >
                {isUploading ? <Loader2 size={16} className="animate-spin mr-2" /> : null}
                {isUploading ? 'Uploading...' : 'Upload & Go Live'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FileManagerMod;
