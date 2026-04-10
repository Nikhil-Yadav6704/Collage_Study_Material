import { BookOpen } from "lucide-react";
import { Link } from "react-router-dom";

const PublicFooter = () => {
  return (
    <footer className="border-t border-border/40 py-12 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between flex-wrap gap-6">
          <Link to="/" className="flex items-center gap-2">
            <BookOpen size={20} className="text-primary" />
            <span className="font-display font-bold text-xl">
              <span className="text-foreground">Edu</span>
              <span className="gradient-text">Vault</span>
            </span>
          </Link>
          <div className="flex gap-6">
            {["About", "Features", "Contact", "Privacy Policy"].map((l) => (
              <a
                key={l}
                href="#"
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                {l}
              </a>
            ))}
          </div>
        </div>
        <div className="mt-8 flex items-center justify-between flex-wrap gap-4">
          <p className="text-xs text-muted-foreground/50">
            © 2025 EduVault. Built for students, by students.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default PublicFooter;
