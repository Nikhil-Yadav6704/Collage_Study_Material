import { useState, useMemo } from "react";
import { 
  Upload, 
  FileEdit, 
  X, 
  FileText, 
  GraduationCap, 
  ScrollText, 
  Youtube, 
  User, 
  BookOpen, 
  Bot, 
  Lock, 
  Link as LinkIcon, 
  CloudOff, 
  Cloud, 
  CheckCircle2, 
  ArrowLeft,
  Loader2,
  FolderOpen
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/authStore";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { cn } from "@/lib/utils";

const materialTypes = [
  { id: 'notes', label: "Notes", icon: FileText },
  { id: 'teacher_notes', label: "Teacher's", icon: GraduationCap },
  { id: 'pyq', label: "PYQs", icon: ScrollText },
  { id: 'youtube', label: "YouTube", icon: Youtube },
  { id: 'student_notes', label: "Student Notes", icon: User },
  { id: 'book', label: "Books", icon: BookOpen },
  { id: 'ai_notes', label: "AI Notes", icon: Bot },
];

const UploadMaterial = () => {
  const user = useAuthStore(s => s.user);
  const qc = useQueryClient();
  
  const [title, setTitle] = useState("");
  const [type, setType] = useState('notes');
  const [subjectId, setSubjectId] = useState("");
  const [customSubjectName, setCustomSubjectName] = useState("");
  const [folderId, setFolderId] = useState("");
  const [semester, setSemester] = useState("4");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [uploadTab, setUploadTab] = useState<'file' | 'link'>('file');
  const [file, setFile] = useState<File | null>(null);
  const [link, setLink] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  // Fetch subjects
  const { data: subjectsData } = useQuery({
    queryKey: ['subjects', user?.department_id],
    queryFn: () => api.get('/api/subjects').then(r => r.data),
    enabled: !!user?.department_id,
  });

  // Fetch folders for this dept
  const { data: foldersData } = useQuery({
    queryKey: ['folders', user?.department_id],
    queryFn: () => api.get('/api/folders').then(r => r.data),
    enabled: !!user?.department_id,
  });

  const subjects = subjectsData?.subjects || [];
  const folders = foldersData?.folders || [];

  const mergedSubjects = useMemo(() => {
    if (!semester) return [];
    
    // 1. Get raw subjects from table for this semester
    const dbSubs = subjects.filter((s: any) => s.semester.toString() === semester).map((s: any) => ({ id: s.id, name: s.name }));
    
    // 2. Get children of the semester folder
    const semFolder = folders.find((f: any) => f.folder_type === 'semester' && f.semester?.toString() === semester && (f.department_id === user?.department_id || !f.department_id));
    const folderSubs = semFolder 
      ? folders.filter((f: any) => f.parent_id === semFolder.id).map((f: any) => ({ id: f.name, name: f.name }))
      : [];

    // 3. Deduplicate by name (case-insensitive)
    const uniqueMap = new Map();
    [...dbSubs, ...folderSubs].forEach((s: any) => {
      uniqueMap.set(s.name.toLowerCase(), s);
    });

    return Array.from(uniqueMap.values()).sort((a: any, b: any) => a.name.localeCompare(b.name));
  }, [semester, subjects, folders, user?.department_id]);

  const { mutate: uploadMaterial, isPending } = useMutation({
    mutationFn: async () => {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('material_type', type);
      formData.append('subject_id', subjectId === 'custom' ? customSubjectName : subjectId);
      formData.append('department_id', user!.department_id!);
      formData.append('semester', semester);
      formData.append('year_restriction', user?.year || '1');

      if (folderId) formData.append('folder_id', folderId);
      if (tags.length > 0) formData.append('tags', JSON.stringify(tags));

      if (uploadTab === 'file' && file) {
        formData.append('file', file);
      } else if (uploadTab === 'link' && link) {
        formData.append('external_url', link);
      }

      return api.post('/api/upload/material', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    },
    onSuccess: () => {
      setIsSuccess(true);
      qc.invalidateQueries({ queryKey: ['materials'] });
      qc.invalidateQueries({ queryKey: ['folders'] });
    },
    onError: (err: any) => {
      alert(err.response?.data?.error || 'Upload failed');
    }
  });

  const addTag = (e: any) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      if (!tags.includes(tagInput.trim())) {
        setTags([...tags, tagInput.trim()]);
      }
      setTagInput("");
      e.preventDefault();
    }
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  if (isSuccess) {
    return (
      <div className="max-w-2xl mx-auto py-10 animate-in fade-in zoom-in duration-500">
        <div className="gradient-border rounded-3xl p-12 text-center">
          <div className="w-20 h-20 bg-success/10 text-success rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
            <CheckCircle2 size={48} />
          </div>
          <h2 className="font-display font-bold text-2xl text-foreground mt-4">Uploaded & Live!</h2>
          <p className="font-body text-sm text-muted-foreground mt-2 max-w-sm mx-auto">
            Your material is now visible to students.
          </p>
          <div className="flex gap-4 mt-10 justify-center">
            <Button variant="mod-primary" onClick={() => {
              setIsSuccess(false);
              setTitle("");
              setFile(null);
              setLink("");
            }}>Upload Another</Button>
            <Button variant="ghost-border" asChild>
               <a href="/admin/content">View Materials</a>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto pb-20">
      <div className="gradient-border rounded-3xl p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[hsl(172_70%_42%/0.05)] blur-[100px] pointer-events-none rounded-full" />
        
        <header className="flex items-center gap-4 mb-10 relative z-10">
          <div className="w-12 h-12 rounded-2xl bg-[hsl(172_70%_42%/0.15)] flex items-center justify-center text-[hsl(172_70%_55%)]">
            <Upload size={24} />
          </div>
          <div>
            <h1 className="font-display font-bold text-xl text-foreground">Upload Material</h1>
            <p className="font-body text-xs text-muted-foreground mt-0.5">Goes live immediately — visible to matching students.</p>
          </div>
        </header>

        <div className="space-y-7 relative z-10">
          {/* Title */}
          <div>
            <label className="text-xs font-body font-semibold text-muted-foreground uppercase tracking-widest mb-2 block">Material Title</label>
            <input 
              type="text" 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Unit 3 – CPU Scheduling Algorithms | Complete Notes"
              className="w-full bg-surface-1 border border-border/60 rounded-xl px-4 py-3 text-sm font-body text-foreground focus:outline-none focus:ring-1 focus:ring-[hsl(172_70%_42%/0.4)] transition-all"
            />
          </div>

          {/* Department */}
          <div>
            <label className="text-xs font-body font-semibold text-muted-foreground uppercase tracking-widest mb-2 block">Department</label>
            <div className="bg-surface-1/50 border border-border/40 rounded-xl px-4 py-3 text-sm font-body text-muted-foreground flex items-center gap-2 cursor-not-allowed">
              <Lock size={13} className="opacity-50" />
              <span>{user?.department?.name || 'Loading...'}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div>
               <label className="text-xs font-body font-semibold text-muted-foreground uppercase tracking-widest mb-2 block">Semester</label>
               <select 
                value={semester}
                onChange={(e) => { setSemester(e.target.value); setSubjectId(""); }}
                className="w-full bg-surface-1 border border-border/60 rounded-xl px-4 py-2.5 text-sm font-body text-foreground focus:outline-none focus:ring-1 focus:ring-[hsl(172_70%_42%/0.4)]"
               >
                 {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>{s}th Semester</option>)}
               </select>
             </div>
             <div>
                <label className="text-xs font-body font-semibold text-muted-foreground uppercase tracking-widest mb-2 block">Subject</label>
                <select 
                  value={subjectId}
                  onChange={(e) => setSubjectId(e.target.value)}
                  className="w-full bg-surface-1 border border-border/60 rounded-xl px-4 py-2.5 text-sm font-body text-foreground focus:outline-none focus:ring-1 focus:ring-[hsl(172_70%_42%/0.4)]"
                >
                  <option value="">Select subject</option>
                  {mergedSubjects.map((s: any) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                  <option value="custom" className="font-bold text-primary">+ Add New Subject...</option>
                </select>
                {subjectId === 'custom' && (
                  <input
                    autoFocus
                    placeholder="Type new subject name..."
                    value={customSubjectName}
                    onChange={e => setCustomSubjectName(e.target.value)}
                    className="w-full mt-2 bg-primary/5 border border-primary/40 rounded-xl px-4 py-2.5 text-sm font-body text-foreground focus:outline-none"
                  />
                )}
             </div>
          </div>

          {/* Folder Target */}
          <div>
             <label className="text-xs font-body font-semibold text-muted-foreground uppercase tracking-widest mb-2 block">Select Folder (Optional)</label>
             <div className="relative">
                <FolderOpen className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <select 
                  value={folderId}
                  onChange={(e) => setFolderId(e.target.value)}
                  className="w-full bg-surface-1 border border-border/60 rounded-xl pl-12 pr-4 py-3 text-sm font-body text-foreground focus:outline-none focus:ring-1 focus:ring-[hsl(172_70%_42%/0.4)] appearance-none"
                >
                  <option value="">Root / Unsorted</option>
                  {folders.map((f: any) => (
                    <option key={f.id} value={f.id}>{f.name}</option>
                  ))}
                </select>
             </div>
          </div>

          <div>
             <label className="text-xs font-body font-semibold text-muted-foreground uppercase tracking-widest mb-3 block">Material Type</label>
             <div className="grid grid-cols-4 gap-3">
                {materialTypes.map(m => (
                  <button 
                    key={m.id}
                    onClick={() => setType(m.id)}
                    className={cn(
                      "rounded-2xl py-3 px-2 flex flex-col items-center gap-2 border transition-all",
                      type === m.id 
                        ? "bg-[hsl(172_70%_42%/0.12)] border-[hsl(172_70%_42%/0.5)] text-[hsl(172_70%_55%)] font-semibold shadow-[0_0_20px_rgba(20,184,166,0.15)]" 
                        : "bg-surface-1 border-border/60 text-muted-foreground hover:border-[hsl(172_70%_42%/0.3)] hover:text-foreground"
                    )}
                  >
                    <m.icon size={18} />
                    <span className="text-[10px] font-body uppercase tracking-wider">{m.label}</span>
                  </button>
                ))}
             </div>
          </div>

          <div>
             <label className="text-xs font-body font-semibold text-muted-foreground uppercase tracking-widest mb-1.5 block">Tags & Keywords</label>
             <div className="bg-surface-1 border border-border/60 rounded-2xl px-4 py-3 min-h-[100px] flex flex-wrap gap-2 content-start transition-all">
                {tags.map(tag => (
                   <div key={tag} className="bg-surface-2 border border-border/40 rounded-lg px-2.5 py-1 text-xs font-body flex items-center gap-2 group animate-in zoom-in duration-200">
                      {tag}
                      <X size={10} className="text-muted-foreground cursor-pointer hover:text-danger" onClick={() => removeTag(tag)} />
                   </div>
                ))}
                <input 
                   value={tagInput}
                   onChange={(e) => setTagInput(e.target.value)}
                   onKeyDown={addTag}
                   placeholder="Type and press Enter..."
                   className="bg-transparent border-none outline-none text-sm font-body text-foreground flex-1 min-w-[140px]"
                />
             </div>
          </div>

          <div>
             <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                <label className="text-xs font-body font-semibold text-muted-foreground uppercase tracking-widest block">File or Link</label>
                <div className="flex bg-surface-2 border border-border/40 p-1 rounded-xl">
                   <button 
                      onClick={() => setUploadTab('file')}
                      className={cn("px-3 py-1 rounded-lg text-[10px] font-body transition-all uppercase tracking-wider", uploadTab === 'file' ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}
                   >Upload File</button>
                   <button 
                      onClick={() => setUploadTab('link')}
                      className={cn("px-3 py-1 rounded-lg text-[10px] font-body transition-all uppercase tracking-wider", uploadTab === 'link' ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}
                   >Paste Link</button>
                </div>
             </div>

             {uploadTab === 'file' ? (
                <div 
                  className={cn(
                    "border-2 border-dashed border-border/40 rounded-3xl p-12 text-center group cursor-pointer transition-all",
                    file ? "border-primary bg-primary/5" : "hover:border-primary/40 hover:bg-primary/5"
                  )}
                  onClick={() => document.getElementById('file-input')?.click()}
                >
                   <input 
                    type="file" 
                    id="file-input" 
                    className="hidden" 
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                   />
                   <div className="w-16 h-16 bg-surface-2 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-all">
                      <Upload size={32} className="text-muted-foreground/40 group-hover:text-primary" />
                   </div>
                   <p className="font-body text-sm font-medium text-foreground">{file ? file.name : "Drag & drop your file here"}</p>
                   <p className="font-body text-xs text-muted-foreground/60 mt-1">{file ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : "or click to browse local files"}</p>
                </div>
             ) : (
                <div className="relative group">
                   <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                   <input 
                      type="url"
                      value={link}
                      onChange={(e) => setLink(e.target.value)}
                      placeholder="https://youtube.com/watch?v=... or Drive link"
                      className="w-full bg-surface-1 border border-border/60 rounded-xl pl-12 pr-4 py-3.5 text-sm font-body text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40 transition-all"
                   />
                </div>
             )}
          </div>

          <div className="pt-10 border-t border-border/40 flex items-center justify-end">
             <Button 
               variant="mod-primary" 
               className="px-8 min-w-[150px]" 
               onClick={() => uploadMaterial()}
               disabled={isPending || !title || (!file && !link) || !subjectId || (subjectId === 'custom' && !customSubjectName)}
             >
               {isPending ? <Loader2 className="animate-spin mr-2" size={18} /> : null}
               {isPending ? 'Uploading...' : 'Upload & Go Live'}
             </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UploadMaterial;
