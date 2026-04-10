import { 
  Inbox, 
  Files, 
  TrendingUp, 
  Flag, 
  BookOpen, 
  Upload, 
  Calendar, 
  FileUp, 
  Check, 
  X, 
  Star, 
  ArrowRight,
  ShieldCheck,
  ChevronRight,
  BookMarked
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import api from "../lib/api";
import { useAuthStore } from "../store/authStore";

const StatCard = ({ 
  icon: Icon, 
  number, 
  label, 
  sub, 
  cta, 
  colorClass, 
  urgent = false, 
  delay = 0 
}: any) => (
  <div 
    className="gradient-border rounded-2xl p-4 animate-fade-up"
    style={{ animationDelay: `${delay}ms` }}
  >
    <div className="flex justify-between items-start">
      <div className={cn(
        "w-9 h-9 rounded-xl flex items-center justify-center transition-all",
        colorClass,
        urgent && "urgency-pulse"
      )}>
        <Icon size={16} />
      </div>
    </div>
    <div className="font-display font-bold text-2xl text-foreground mt-3">
      {number}
    </div>
    <div className="font-body text-[11px] text-muted-foreground mt-0.5">
      {label}
    </div>
    {sub && (
      <div className="text-[10px] text-muted-foreground/60 mt-1">
        {sub}
      </div>
    )}
    {cta && (
      <button className="flex items-center gap-1 text-[11px] font-body mt-2 hover:underline cursor-pointer group transition-all">
        <span className={cn(colorClass.replace('bg-', 'text-').split(' ')[1])}>{cta}</span>
        <ChevronRight size={10} className={cn(colorClass.replace('bg-', 'text-').split(' ')[1], "group-hover:translate-x-0.5 transition-transform")} />
      </button>
    )}
  </div>
);

const ModeratorDashboard = () => {
  const user = useAuthStore((s) => s.user);
  const { data: stats, isLoading } = useQuery({
    queryKey: ['moderator', 'dashboard', 'stats'],
    queryFn: async () => {
      const { data } = await api.get('/api/moderator/dashboard/stats');
      return data;
    },
    refetchInterval: 30000,
  });

  if (isLoading) {
    return (
      <div className="p-6 grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="h-32 rounded-2xl shimmer" />)}
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto p-6">
      <div className="flex items-start justify-between mb-7">
        <div>
          <h1 className="font-display font-bold text-2xl text-foreground">Department Dashboard</h1>
          <p className="font-body text-sm text-muted-foreground mt-0.5">
            {user?.department?.name || 'Department'} · Your moderation overview
          </p>
        </div>
        <div className="glass rounded-xl px-4 py-2 flex items-center gap-2 border-border/40">
          <Calendar size={14} className="text-muted-foreground" />
          <span className="text-xs font-body text-muted-foreground">
            {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
        <StatCard 
          icon={Inbox} 
          number={stats?.pending_count || 0} 
          label="Pending Requests" 
          cta="Review"
          colorClass="bg-warning/15 text-warning"
          urgent={(stats?.pending_count || 0) > 0}
          delay={0}
        />
        <StatCard 
          icon={Files} 
          number={stats?.materials_count || 0} 
          label="Total Materials" 
          sub="In your department"
          colorClass="bg-[hsl(172_70%_42%/0.15)] text-[hsl(172_70%_55%)]"
          delay={60}
        />
        <StatCard 
          icon={TrendingUp} 
          number={stats?.new_this_week || 0} 
          label="New This Week" 
          sub="Across all categories"
          colorClass="bg-success/15 text-success"
          delay={120}
        />
        <StatCard 
          icon={Flag} 
          number={stats?.flagged_feedback || 0} 
          label="Flagged Feedback" 
          cta="View"
          colorClass="bg-danger/15 text-danger"
          urgent={(stats?.flagged_feedback || 0) > 0}
          delay={180}
        />
        <StatCard 
          icon={BookOpen} 
          number={stats?.missing_guidelines || 0} 
          label="Missing Guidelines" 
          cta="Fill in"
          colorClass="bg-warning/15 text-warning"
          delay={240}
        />
        <StatCard 
          icon={Upload} 
          number={stats?.my_uploads || 0} 
          label="My Uploads" 
          sub="Materials I uploaded"
          colorClass="bg-[hsl(172_70%_42%/0.15)] text-[hsl(172_70%_55%)]"
          delay={300}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6 mb-6">
        <div className="gradient-border rounded-2xl p-5 flex flex-col max-h-[420px]">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-display font-semibold text-sm text-foreground flex items-center gap-2">
              <Inbox size={16} className="text-[hsl(172_70%_55%)]" />
              Recent Uploads
            </h2>
            <span className="bg-primary/15 text-primary rounded-full px-2.5 py-0.5 text-[11px] font-body">Latest items</span>
          </div>

          <div className="overflow-y-auto custom-scrollbar flex-1 pr-2">
            <div className="flex flex-col gap-2">
               {stats?.recent_uploads?.map((item: any) => (
                 <div key={item.id} className="flex items-start gap-3 py-3 border-b border-border/25 last:border-0 group">
                    <div className="w-8 h-8 rounded-xl bg-surface-2 flex items-center justify-center flex-shrink-0 transition-all text-[hsl(172_70%_55%)]">
                      <Files size={14} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-body text-xs text-foreground leading-snug group-hover:text-[hsl(172_70%_55%)] transition-colors truncate">
                        {item.title}
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">{new Date(item.created_at).toLocaleDateString()}</p>
                    </div>
                 </div>
               ))}
            </div>
          </div>
        </div>

        <div className="gradient-border rounded-2xl p-6 relative overflow-hidden flex flex-col justify-center">
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-[hsl(172_70%_42%/0.15)] blur-[80px] rounded-full pointer-events-none" />
          <div className="relative z-10">
            <h2 className="font-display font-semibold text-lg text-foreground">Ready to contribute?</h2>
            <p className="font-body text-sm text-muted-foreground mt-1.5 mb-6 max-w-[280px]">
              Upload notes, PYQs, or resources directly to your department. Your contributions keep the Vault alive.
            </p>
            <div className="flex flex-col gap-2.5">
               <Button variant="mod-primary" className="w-full h-11 justify-start gap-3 shadow-lg">
                  <Upload size={18} />
                  <span>Upload Material</span>
               </Button>
               <Button variant="mod-ghost" className="w-full h-11 justify-start gap-3">
                  <BookMarked size={18} />
                  <span>Write Study Guidelines</span>
               </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModeratorDashboard;
