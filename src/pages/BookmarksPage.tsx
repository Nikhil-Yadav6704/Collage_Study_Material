import { Bookmark, BookmarkCheck, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useBookmarks, useToggleBookmark } from "../hooks/useBookmarks";
import { useDownloadMaterial } from "../hooks/useMaterials";

const BookmarksPage = () => {
  const { data: bookmarks, isLoading } = useBookmarks();
  const { mutate: toggleBookmark } = useToggleBookmark();
  const { mutate: download } = useDownloadMaterial();

  const count = bookmarks?.length || 0;

  return (
    <div>
      <div className="flex items-center gap-2 mb-6">
        <h2 className="font-display font-bold text-2xl text-foreground">My Bookmarks</h2>
        <span className="bg-primary/10 text-primary rounded-full px-2.5 py-0.5 text-xs font-body">
          {count}
        </span>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => <div key={i} className="h-40 rounded-2xl shimmer" />)}
        </div>
      ) : count === 0 ? (
        <div className="flex flex-col items-center justify-center py-24">
          <Bookmark size={48} className="text-border" />
          <h3 className="font-display font-semibold text-lg text-foreground mt-4">No bookmarks yet</h3>
          <p className="font-body text-sm text-muted-foreground mt-2 text-center max-w-xs">
            Bookmark materials from the study page to find them here quickly.
          </p>
          <Button variant="primary" className="mt-6" asChild>
            <Link to="/study">Browse Materials</Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {bookmarks!.map((b: any) => {
            const m = b.material;
            if (!m) return null;
            return (
              <div key={b.id} className="gradient-border rounded-2xl p-5 hover:bg-surface-1/50 transition-all group">
                <div className="flex items-start justify-between mb-3">
                  <span className="rounded-full px-2.5 py-0.5 text-[11px] font-body font-medium bg-primary/15 text-primary">
                    {m.material_type}
                  </span>
                  <button
                    onClick={() => toggleBookmark({ materialId: m.id, isBookmarked: true })}
                    className="w-7 h-7 rounded-lg hover:bg-surface-2 flex items-center justify-center transition-colors"
                  >
                    <BookmarkCheck size={14} className="fill-primary text-primary" />
                  </button>
                </div>
                <h3 className="font-display font-semibold text-sm text-foreground mb-1">
                  {m.subject?.name || "Unknown Subject"}
                </h3>
                <p className="font-body text-xs text-muted-foreground mb-4 line-clamp-2">{m.title}</p>
                <button
                  onClick={() => download(m.id)}
                  className="w-full h-8 rounded-xl bg-primary/10 hover:bg-primary/20 flex items-center justify-center gap-2 text-xs font-body text-primary transition-colors"
                >
                  <Download size={13} /> Download
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default BookmarksPage;
