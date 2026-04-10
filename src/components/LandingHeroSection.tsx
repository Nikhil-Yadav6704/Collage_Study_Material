import { Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const LandingHeroSection = () => {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden pt-20">
      {/* Background layers */}
      <div className="absolute inset-0 dot-grid opacity-40" />
      <div className="absolute inset-0 noise-overlay" />
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <div className="orb orb-3" />
      <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-background to-transparent" />

      {/* Content */}
      <div className="relative z-10 text-center max-w-4xl mx-auto px-6">
        {/* Badge */}
        <div className="glass rounded-full px-4 py-1.5 inline-flex items-center gap-2 mb-8">
          <Sparkles size={14} className="text-accent" />
          <span className="text-xs font-body text-muted-foreground">
            Your college's study hub is here
          </span>
        </div>

        {/* Headline */}
        <h1 className="font-display font-bold text-5xl md:text-7xl leading-[1.05] tracking-[-0.03em] text-foreground">
          Everything You Need
        </h1>
        <h1 className="font-display font-bold text-5xl md:text-7xl leading-[1.05] tracking-[-0.03em] gradient-text-hero mt-2">
          to Ace Every Exam.
        </h1>

        {/* Subheadline */}
        <p className="font-body text-base md:text-lg text-muted-foreground max-w-xl mx-auto mt-5 leading-relaxed">
          Notes, PYQs, books, video lectures — organized by your department and
          semester. Stop hunting. Start studying.
        </p>

        {/* CTA */}
        <div className="mt-10 flex gap-4 justify-center flex-wrap">
          <Button variant="primary" asChild>
            <Link to="/signup">
              Get Started Free <ArrowRight size={16} className="ml-2" />
            </Link>
          </Button>
          <Button variant="ghost-border">
            <a href="#features">Explore Features</a>
          </Button>
        </div>

        {/* Trust line */}
        <p className="mt-6 text-xs text-muted-foreground/60 font-body">
          Free for all students · No credit card · Works on mobile
        </p>

        {/* Hero Preview Card */}
        <div className="mt-20 max-w-5xl mx-auto w-full relative px-6">
          <div className="absolute inset-x-20 top-4 h-40 bg-primary/20 blur-3xl rounded-full" />
          <div className="gradient-border rounded-2xl overflow-hidden shadow-2xl relative">
            {/* Mock browser bar */}
            <div className="bg-surface-1 border-b border-border/50 px-4 py-2 flex items-center gap-2">
              <div className="flex gap-1.5">
                <div className="w-2 h-2 rounded-full bg-danger" />
                <div className="w-2 h-2 rounded-full bg-warning" />
                <div className="w-2 h-2 rounded-full bg-success" />
              </div>
              <div className="bg-muted/50 rounded-md px-3 py-1 text-xs text-muted-foreground/50 flex-1 max-w-xs mx-auto text-center">
                eduvault.college
              </div>
            </div>
            {/* Mock content */}
            <div className="bg-card p-4 grid grid-cols-3 gap-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="shimmer rounded-xl h-28" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LandingHeroSection;
