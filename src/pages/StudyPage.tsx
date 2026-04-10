import { Search, X, Plus, Star, Download, Bookmark, FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useMemo } from "react";
import { useMaterials } from "../hooks/useMaterials";
import { useAuthStore } from "../store/authStore";
import { useToggleBookmark, useBookmarks } from "../hooks/useBookmarks";
import { useDownloadMaterial } from "../hooks/useMaterials";
import { Link } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../lib/api";
import { getOrdinalSuffix } from "@/lib/utils";
import { useDebounce } from "../hooks/useDebounce";

const materialTypes = [
  "All Types",
  "Notes",
  "PYQ",
  "YouTube",
  "Book",
  "AI Notes",
  "Teacher's",
  "Student's",
  "Guidelines",
];

const badgeStyles: Record<string, string> = {
  notes: "bg-primary/15 text-primary",
  pyq: "bg-warning/15 text-warning",
  youtube: "bg-danger/15 text-danger",
  book: "bg-success/15 text-success",
  ai_notes: "bg-accent/15 text-accent",
  teacher_notes: "bg-[hsl(270,70%,60%)]/15 text-[hsl(270,70%,75%)]",
  student_notes: "bg-info/15 text-info",
  study_guidelines: "bg-[hsl(320,68%,58%)]/15 text-[hsl(320,68%,75%)]",
};

const typeDisplayLabels: Record<string, string> = {
  notes: "Notes",
  pyq: "PYQ",
  youtube: "YouTube",
  book: "Book",
  ai_notes: "AI Notes",
  teacher_notes: "Teacher's",
  student_notes: "Student's",
  study_guidelines: "Guidelines",
};

const typeFilterMap: Record<string, string> = {
  "All Types": "",
  "Notes": "notes",
  "PYQ": "pyq",
  "YouTube": "youtube",
  "Book": "book",
  "AI Notes": "ai_notes",
  "Teacher's": "teacher_notes",
  "Student's": "student_notes",
  "Guidelines": "study_guidelines",
};

const StudyPage = () => {
  const user = useAuthStore((s) => s.user);
  const [rawSearch, setRawSearch] = useState("");
  const search = useDebounce(rawSearch, 300);
  const [activeFilter, setActiveFilter] = useState("All Types");
  const [ratingModal, setRatingModal] = useState<{ materialId: string; currentRating: number } | null>(null);
  const [pendingRating, setPendingRating] = useState(0);

  const qc = useQueryClient();
  const { data, isLoading } = useMaterials({
    search: search || undefined,
    type: typeFilterMap[activeFilter] || undefined,
  });

  const { data: bookmarks } = useBookmarks();
  const { mutate: toggleBookmark } = useToggleBookmark();
  const { mutate: download } = useDownloadMaterial();

  const { mutate: submitRating } = useMutation({
    mutationFn: ({ materialId, rating }: { materialId: string; rating: number }) =>
      api.post('/api/ratings', { material_id: materialId, rating }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['materials'] });
      setRatingModal(null);
    },
  });

  const materials = data?.materials || [];

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <h2 className="font-display font-bold text-2xl text-foreground">
            Study Materials
          </h2>
          <p className="text-xs text-muted-foreground font-body mt-0.5">
            Showing {user?.department?.short_name || 'Your Dept'} · {getOrdinalSuffix(user?.year)} Year · All Subjects
          </p>
        </div>
        <Link to="/suggest">
          <Button variant="ghost-border" size="sm">
            <Plus size={16} className="mr-1" /> Suggest a Material
          </Button>
        </Link>
      </div>

      <div className="relative w-full mb-4">
        <Search
          size={16}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground"
        />
        <input
          value={rawSearch}
          onChange={(e) => setRawSearch(e.target.value)}
          className="bg-surface-1 border border-border rounded-2xl pl-11 pr-10 py-3.5 text-sm font-body text-foreground placeholder:text-muted-foreground/50 w-full focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary/50 transition-all"
          placeholder="Search by subject name or abbreviation — try 'OS', 'DBMS', 'CN'..."
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
            className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-body cursor-pointer transition-all ${
              activeFilter === chip
                ? "bg-primary/15 border border-primary/40 text-primary"
                : "bg-surface-1 border border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
            }`}
          >
            {chip}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-48 rounded-2xl shimmer" />
          ))}
        </div>
      ) : materials.length === 0 ? (
        <div className="text-center py-20 px-8 shimmer-border rounded-2xl">
          <p className="text-muted-foreground font-body">No materials found matching your criteria.</p>
        </div>
      ) : (
        <>
          <p className="text-xs text-muted-foreground font-body mb-4">
            Showing {materials.length} materials
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {materials.map((m) => {
              const isBookmarked = bookmarks?.some((b: any) => b.material_id === m.id);
              return (
                <div
                  key={m.id}
                  className="gradient-border rounded-2xl p-5 hover:bg-surface-1/50 transition-all duration-200 group cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-3">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[11px] font-body font-medium ${badgeStyles[m.material_type] || ""}`}
                    >
                      {typeDisplayLabels[m.material_type] || m.material_type}
                    </span>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleBookmark({ materialId: m.id, isBookmarked });
                      }}
                      className="w-7 h-7 rounded-lg hover:bg-surface-2 flex items-center justify-center transition-colors"
                    >
                      <Bookmark
                        size={14}
                        className={`${isBookmarked ? 'fill-primary text-primary' : 'text-muted-foreground group-hover:text-foreground'}`}
                      />
                    </button>
                  </div>
                  <h3 className="font-display font-semibold text-sm text-foreground mb-1 leading-tight">
                    {m.subject?.name || 'Unknown Subject'}
                  </h3>
                  <p className="font-body text-xs text-muted-foreground mb-3 leading-relaxed line-clamp-2">
                    {m.title}
                  </p>
                  <div className="flex items-center gap-3 flex-wrap text-[11px] font-body text-muted-foreground">
                    <span className="bg-surface-2 rounded-full px-2 py-0.5">
                      {getOrdinalSuffix(m.semester)} Sem
                    </span>
                    <span>{m.department?.short_name || ''}</span>
                    <span>·</span>
                    <span>by {m.uploader?.full_name || 'Unknown'}</span>
                    {m.folder?.name && (
                      <span className="flex items-center gap-1 text-[10px] text-primary/70 bg-primary/5 px-2 py-0.5 rounded-full border border-primary/15">
                        <FolderOpen size={10} />
                        {m.folder.name}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between mt-4">
                    <div 
                      className="flex items-center gap-0.5 cursor-pointer" 
                      onClick={(e) => {
                        e.stopPropagation();
                        setRatingModal({ materialId: m.id, currentRating: m.average_rating || 0 });
                        setPendingRating(0);
                      }}
                    >
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          size={12}
                          className={
                            s <= Math.round(m.average_rating || 0)
                              ? "fill-warning text-warning"
                              : "text-border"
                          }
                        />
                      ))}
                      <span className="text-xs text-muted-foreground ml-1">
                        ({m.average_rating?.toFixed(1) || 'Rate'})
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                        <Download size={12} /> {m.download_count}
                      </span>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          download(m.id);
                        }}
                        className="w-7 h-7 rounded-lg bg-primary/10 hover:bg-primary/20 flex items-center justify-center transition-colors"
                      >
                        <Download size={14} className="text-primary" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Rating Modal */}
      {ratingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-background/60 backdrop-blur-sm" onClick={() => setRatingModal(null)} />
          <div className="glass-strong rounded-2xl p-6 w-full max-w-xs relative z-10 text-center">
            <h3 className="font-display font-bold text-base text-foreground mb-2">Rate this material</h3>
            <p className="text-xs text-muted-foreground font-body mb-5">Tap a star to submit your rating</p>
            <div className="flex items-center justify-center gap-2 mb-6">
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s}
                  onClick={() => setPendingRating(s)}
                  className="transition-transform hover:scale-110 active:scale-95"
                >
                  <Star
                    size={32}
                    className={s <= pendingRating ? "fill-warning text-warning" : "text-border hover:text-warning"}
                  />
                </button>
              ))}
            </div>
            {pendingRating > 0 && (
              <Button
                variant="primary"
                className="w-full"
                onClick={() => submitRating({ materialId: ratingModal.materialId, rating: pendingRating })}
              >
                Submit Rating
              </Button>
            )}
            <button
              onClick={() => setRatingModal(null)}
              className="mt-3 text-xs text-muted-foreground hover:text-foreground font-body"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudyPage;
