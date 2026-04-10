import {
  Search,
  FolderOpen,
  Layers,
  Grid2X2,
  Users,
  Shield,
} from "lucide-react";

const features = [
  {
    icon: Search,
    color: "text-primary",
    bgColor: "bg-primary/15",
    title: "Search by Abbreviation",
    body: "Type OS, DBMS, CN — it just works. The system understands every short form your college uses.",
  },
  {
    icon: FolderOpen,
    color: "text-accent",
    bgColor: "bg-accent/15",
    title: "Year-Smart Content",
    body: "See only what's relevant to your semester and department. No clutter, no confusion — just your syllabus.",
  },
  {
    icon: Layers,
    color: "text-warning",
    bgColor: "bg-warning/15",
    title: "Every Format, One Place",
    body: "Notes, PYQs, books, YouTube playlists, AI notes, teacher handouts — all in one organized folder structure.",
  },
  {
    icon: Grid2X2,
    color: "text-success",
    bgColor: "bg-success/15",
    title: "Folder-Style Navigation",
    body: "Drill down from Department → Semester → Subject → Material Type like a proper file manager. Intuitive, fast.",
  },
  {
    icon: Users,
    color: "text-info",
    bgColor: "bg-info/15",
    title: "Contribute & Rate",
    body: "Submit your own notes for review. Rate materials you've used. The best content rises to the top.",
  },
  {
    icon: Shield,
    color: "text-primary",
    bgColor: "bg-primary/15",
    title: "Trusted by Design",
    body: "Every account is Google-verified and tied to a real roll number. Moderators ensure quality. Admins maintain order.",
  },
];

const FeaturesSection = () => {
  return (
    <section id="features" className="py-28 px-6 max-w-7xl mx-auto">
      <p className="text-xs font-body text-accent uppercase tracking-widest mb-3 text-center">
        Features
      </p>
      <h2 className="font-display font-bold text-3xl md:text-4xl text-foreground text-center mb-4">
        Built for students.
        <br />
        By students.
      </h2>
      <p className="text-muted-foreground font-body text-base text-center mb-16 max-w-2xl mx-auto">
        Everything you need to organize, discover, and share study materials —
        built with care.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {features.map((f) => (
          <div
            key={f.title}
            className="gradient-border p-6 rounded-2xl hover:bg-surface-1 transition-colors duration-200 group"
          >
            <div
              className={`w-10 h-10 rounded-xl ${f.bgColor} flex items-center justify-center mb-4`}
            >
              <f.icon size={18} className={f.color} />
            </div>
            <h3 className="font-display font-semibold text-base text-foreground mb-2">
              {f.title}
            </h3>
            <p className="font-body text-sm text-muted-foreground leading-relaxed">
              {f.body}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default FeaturesSection;
