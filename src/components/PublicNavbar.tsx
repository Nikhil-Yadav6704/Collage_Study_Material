import { BookOpen, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Link } from "react-router-dom";

const navLinks = ["Home", "Features", "How It Works", "About Us", "Contact"];

const PublicNavbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-border/40">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <BookOpen size={20} className="text-primary" />
          <span className="font-display font-bold text-xl">
            <span className="text-foreground">Edu</span>
            <span className="gradient-text">Vault</span>
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <a
              key={link}
              href={`#${link.toLowerCase().replace(/\s/g, "-")}`}
              className="text-sm font-body text-muted-foreground hover:text-foreground transition-colors px-3 py-1"
            >
              {link}
            </a>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-3">
          <Button variant="ghost-border" size="sm" asChild>
            <Link to="/signin">Sign In</Link>
          </Button>
          <Button variant="primary" size="sm" asChild>
            <Link to="/signup">Sign Up Free</Link>
          </Button>
        </div>

        <button
          className="md:hidden text-muted-foreground hover:text-foreground"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {mobileOpen && (
        <div className="md:hidden glass border-t border-border/40 px-6 py-4 flex flex-col gap-3">
          {navLinks.map((link) => (
            <a
              key={link}
              href={`#${link.toLowerCase().replace(/\s/g, "-")}`}
              className="text-sm font-body text-muted-foreground hover:text-foreground transition-colors py-2"
              onClick={() => setMobileOpen(false)}
            >
              {link}
            </a>
          ))}
          <div className="flex gap-3 pt-2">
            <Button variant="ghost-border" size="sm" asChild>
              <Link to="/signin">Sign In</Link>
            </Button>
            <Button variant="primary" size="sm" asChild>
              <Link to="/signup">Sign Up Free</Link>
            </Button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default PublicNavbar;
