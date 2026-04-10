import { Upload, Link as LinkIcon, CheckCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useRef, useMemo } from "react";
import { useAuthStore } from "../store/authStore";
import { uploadService } from "../services/uploadService";
import api from "../lib/api";
import { getOrdinalSuffix } from "@/lib/utils";

const materialTypes = ["Notes", "PYQ", "Book", "YouTube", "AI Notes", "Teacher's", "Student's", "Other"];

// Map display labels to backend enum
const typeEnumMap: Record<string, string> = {
  "Notes": "notes", "PYQ": "pyq", "Book": "book", "YouTube": "youtube",
  "AI Notes": "ai_notes", "Teacher's": "teacher_notes", "Student's": "student_notes", "Other": "notes",
};

const UploadRequestPage = () => {
  const user = useAuthStore((s) => s.user);
  const [selectedType, setSelectedType] = useState("Notes");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [customSubjectName, setCustomSubjectName] = useState("");
  const [semester, setSemester] = useState("");
  const [description, setDescription] = useState("");
  const [externalUrl, setExternalUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Subjects and Folders loaded from API based on user's dept
  const [subjects, setSubjects] = useState<{ id: string; name: string; semester: number }[]>([]);
  const [folders, setFolders] = useState<any[]>([]);

  useEffect(() => {
    if (user?.department_id) {
      Promise.all([
        api.get('/api/subjects', { params: { department_id: user.department_id } }),
        api.get('/api/folders')
      ]).then(([resSub, resFold]) => {
        setSubjects(resSub.data.subjects || []);
        setFolders(resFold.data.folders || []);
      }).catch(() => {});
    }
  }, [user?.department_id]);

  // Merge subjects and semester child folders dynamically
  const mergedSubjects = useMemo(() => {
    if (!semester) return [];
    
    // 1. Get raw subjects from table for this semester
    const dbSubs = subjects.filter(s => s.semester.toString() === semester).map(s => ({ id: s.id, name: s.name }));
    
    // 2. Get children of the semester folder
    const semFolder = folders.find(f => f.folder_type === 'semester' && f.semester?.toString() === semester && (f.department_id === user?.department_id || !f.department_id));
    const folderSubs = semFolder 
      ? folders.filter(f => f.parent_id === semFolder.id).map(f => ({ id: f.name, name: f.name })) // Use name as ID so the backend auto-creates it
      : [];

    // 3. Deduplicate by name (case-insensitive)
    const uniqueMap = new Map();
    [...dbSubs, ...folderSubs].forEach(s => {
      uniqueMap.set(s.name.toLowerCase(), s);
    });

    return Array.from(uniqueMap.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [semester, subjects, folders, user?.department_id]);

  // Semesters: 1-8
  const semesters = [1, 2, 3, 4, 5, 6, 7, 8];

  // Year restriction — default to user's year
  const yearRestriction = user?.year || "1";

  const handleSubmit = async () => {
    if (!title.trim()) { setError("Please add a title."); return; }
    if (!subjectId) { setError("Please select a subject."); return; }
    if (!semester) { setError("Please select a semester."); return; }
    if (!file && !externalUrl.trim()) { setError("Please upload a file or paste a link."); return; }

    setLoading(true);
    setError(null);

    try {
      let fileKey: string | undefined;
      let fileName: string | undefined;
      let fileSizeBytes: number | undefined;

      if (file) {
        const fileData = await uploadService.uploadRequestFile(file);
        fileKey = fileData.file_key;
        fileName = fileData.file_name;
        fileSizeBytes = fileData.file_size_bytes;
      }

      await uploadService.submitUploadRequest({
        title: title.trim(),
        material_type: typeEnumMap[selectedType] || "notes",
        subject_id: subjectId === 'custom' ? customSubjectName.trim() : subjectId,
        department_id: user!.department_id!,
        semester: parseInt(semester),
        year_restriction: yearRestriction,
        student_note: description.trim() || undefined,
        file_key: fileKey,
        file_name: fileName,
        file_size_bytes: fileSizeBytes,
        external_url: externalUrl.trim() || undefined,
      });

      setSubmitted(true);
    } catch (err: any) {
      setError(err.response?.data?.error || "Submission failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="gradient-border rounded-3xl p-8">
        <h2 className="font-display font-bold text-xl text-foreground mb-1">Suggest a Material</h2>
        <p className="font-body text-sm text-muted-foreground mb-8">
          Your suggestion goes to a moderator for review before going live.
        </p>

        {submitted ? (
          <div className="bg-surface-1 border border-primary/20 rounded-2xl p-4 flex items-center gap-3 text-center flex-col py-12">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <CheckCircle size={32} className="text-primary" />
            </div>
            <h3 className="font-display font-bold text-xl text-foreground">Submission Received!</h3>
            <p className="font-body text-sm text-muted-foreground mt-2 max-w-[280px]">
              We've received "{title}". Our moderators will review it shortly.
            </p>
            <Button 
              variant="ghost-border" 
              className="mt-8"
              onClick={() => {
                setSubmitted(false);
                setTitle("");
                setFile(null);
                setExternalUrl("");
                setDescription("");
              }}
            >
              Suggest Another
            </Button>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Material Type */}
            <div>
              <label className="text-xs font-body font-medium text-muted-foreground mb-2 block uppercase tracking-wider">Material Type</label>
              <div className="grid grid-cols-4 gap-2">
                {materialTypes.map((t) => (
                  <button key={t} onClick={() => setSelectedType(t)}
                    className={`rounded-xl py-2 px-3 text-center cursor-pointer transition-all border text-[11px] font-body font-bold ${
                      selectedType === t ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/30"
                    }`}
                  >{t}</button>
                ))}
              </div>
            </div>

            {/* Semester */}
            <div>
              <label className="text-xs font-body font-medium text-muted-foreground mb-1.5 block uppercase tracking-wider">Semester</label>
              <select
                required
                value={semester}
                onChange={(e) => { setSemester(e.target.value); setSubjectId(""); }}
                className="bg-surface-1 border border-border rounded-xl px-4 py-3 text-sm font-body text-foreground w-full focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all appearance-none cursor-pointer"
              >
                <option value="">Select semester</option>
                {semesters.map((s) => (
                  <option key={s} value={s.toString()}>{getOrdinalSuffix(s)} Semester</option>
                ))}
              </select>
            </div>

            {/* Subject — API-loaded */}
            <div>
              <label className="text-xs font-body font-medium text-muted-foreground mb-1.5 block uppercase tracking-wider">Subject</label>
              <select
                required
                value={subjectId}
                onChange={(e) => setSubjectId(e.target.value)}
                className="bg-surface-1 border border-border rounded-xl px-4 py-3 text-sm font-body text-foreground w-full focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all appearance-none cursor-pointer"
                disabled={!semester}
              >
                <option value="">{semester ? "Select subject" : "Select semester first"}</option>
                {mergedSubjects.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
                {semester && <option value="custom" className="font-bold text-primary">+ Add New Subject...</option>}
              </select>
              {subjectId === 'custom' && (
                  <input
                    autoFocus
                    placeholder="Type new subject name..."
                    value={customSubjectName}
                    onChange={e => setCustomSubjectName(e.target.value)}
                    className="w-full mt-2 bg-primary/5 border border-primary/40 rounded-xl px-4 py-3 text-sm font-body text-foreground focus:outline-none"
                  />
              )}
            </div>

            {/* Title */}
            <div>
              <label className="text-xs font-body font-medium text-muted-foreground mb-1.5 block uppercase tracking-wider">Title</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="bg-surface-1 border border-border rounded-xl px-4 py-3 text-sm font-body text-foreground placeholder:text-muted-foreground/50 w-full focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all"
                placeholder="e.g., Unit 1 Notes - Integration"
              />
            </div>

            {/* File upload */}
            <div>
              <label className="text-xs font-body font-medium text-muted-foreground mb-1.5 block uppercase tracking-wider">Upload File</label>
              <input
                ref={fileRef}
                type="file"
                accept=".pdf,.docx,.pptx,.jpg,.png"
                className="hidden"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
              <div
                onClick={() => fileRef.current?.click()}
                className="border-2 border-dashed border-border rounded-2xl p-8 text-center hover:border-primary/40 transition-colors cursor-pointer bg-surface-1"
              >
                <Upload size={28} className="text-muted-foreground mx-auto" />
                {file ? (
                  <p className="font-body text-sm text-foreground mt-2 font-bold">{file.name}</p>
                ) : (
                  <>
                    <p className="font-body text-sm text-muted-foreground mt-2">Click to browse or drag file here</p>
                    <p className="text-[10px] text-muted-foreground/60 mt-1">PDF, DOCX, PPT, IMAGE (MAX 50MB)</p>
                  </>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <hr className="border-border/50 flex-1" />
              <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">or link</span>
              <hr className="border-border/50 flex-1" />
            </div>

            <div className="relative">
              <LinkIcon size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                value={externalUrl}
                onChange={(e) => setExternalUrl(e.target.value)}
                className="bg-surface-1 border border-border rounded-xl pl-11 pr-4 py-3 text-sm font-body text-foreground placeholder:text-muted-foreground/50 w-full focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all"
                placeholder="Google Drive, YouTube, or Direct Link"
              />
            </div>

            {/* Description */}
            <div>
              <label className="text-xs font-body font-medium text-muted-foreground mb-1.5 block uppercase tracking-wider">
                Note to moderator (optional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="bg-surface-1 border border-border rounded-xl px-4 py-3 text-sm font-body text-foreground placeholder:text-muted-foreground/50 w-full focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all resize-none"
                rows={3}
                placeholder="Anything they should know about this material?"
              />
            </div>

            {error && (
              <p className="text-xs text-danger font-body text-center bg-danger/5 border border-danger/20 rounded-xl px-4 py-2">
                {error}
              </p>
            )}

            <Button variant="primary" className="w-full py-6 text-sm uppercase tracking-widest font-bold" onClick={handleSubmit} disabled={loading || (subjectId === 'custom' && !customSubjectName)}>
              {loading ? <><Loader2 size={16} className="animate-spin mr-2" />Processing...</> : "Submit for Review"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default UploadRequestPage;
