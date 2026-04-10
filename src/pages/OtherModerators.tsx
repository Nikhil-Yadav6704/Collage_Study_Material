import { 
  Users, 
  Info, 
  Clock, 
  UserCheck, 
  ShieldCheck, 
  Award, 
  BarChart3, 
  MessageSquare, 
  Calendar,
  Loader2
} from "lucide-react";
import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';
import { cn } from "@/lib/utils";
import { format } from "date-fns";

const ColleagueCard = ({ mod }: { mod: any }) => (
  <div className={cn(
    "gradient-border rounded-2xl p-6 relative overflow-hidden transition-all duration-300 group hover:shadow-xl",
    mod.is_you && "border-[hsl(172_70%_42%/0.4)] bg-[hsl(172_70%_42%/0.02)]"
  )}>
    {mod.is_you && (
      <div className="absolute top-4 right-4 bg-[hsl(172_70%_42%/0.15)] text-[hsl(172_70%_55%)] rounded-full px-2.5 py-0.5 text-[10px] font-body font-bold uppercase tracking-widest border border-[hsl(172_70%_42%/0.2)]">
        YOU
      </div>
    )}

    {/* Top Section */}
    <div className="flex items-start gap-4 pb-5 border-b border-border/30">
       <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[hsl(172_70%_30%)] to-[hsl(172_50%_20%)] flex items-center justify-center text-xl font-display font-bold text-foreground border border-white/10 group-hover:scale-105 transition-transform duration-300">
          {mod.user?.full_name?.split(' ').map((n: string) => n[0]).join('') || '?'}
       </div>
       <div className="min-w-0 flex-1">
          <h3 className="font-display font-bold text-lg text-foreground truncate group-hover:text-[hsl(172_70%_55%)] transition-colors">{mod.user?.full_name}</h3>
          <p className="text-xs font-body text-muted-foreground font-mono mt-0.5">{mod.user?.roll_number}</p>
          <div className="flex items-center gap-2 mt-3">
             <div className="mod-role-badge">
               <ShieldCheck size={10} />
               <span>Moderator</span>
             </div>
             <span className="text-[10px] text-muted-foreground font-body flex items-center gap-1 ml-1 opacity-60">
                <Calendar size={10} /> Assigned {format(new Date(mod.created_at), 'MMM yyyy')}
             </span>
          </div>
       </div>
    </div>

    {/* Stats Grid */}
    <div className="grid grid-cols-3 gap-3 mt-5">
       <div className="bg-surface-1 rounded-xl py-3 text-center border border-border/30 group-hover:border-[hsl(172_70%_42%/0.2)] transition-all">
          <p className="font-display font-bold text-xl text-foreground">{mod.stats?.uploads || 0}</p>
          <p className="text-[9px] font-body text-muted-foreground mt-0.5 uppercase tracking-widest font-semibold flex items-center justify-center gap-1 opacity-60">
            <BarChart3 size={9} /> Uploads
          </p>
       </div>
       <div className="bg-surface-1 rounded-xl py-3 text-center border border-border/30 group-hover:border-[hsl(172_70%_42%/0.2)] transition-all">
          <p className="font-display font-bold text-xl text-foreground">{mod.stats?.reviews || 0}</p>
          <p className="text-[9px] font-body text-muted-foreground mt-0.5 uppercase tracking-widest font-semibold flex items-center justify-center gap-1 opacity-60">
            <Award size={9} /> Reviews
          </p>
       </div>
       <div className="bg-surface-1 rounded-xl py-3 text-center border border-border/30 group-hover:border-[hsl(172_70%_42%/0.2)] transition-all">
          <p className="font-display font-bold text-xl text-foreground">{mod.stats?.guidelines || 0}</p>
          <p className="text-[9px] font-body text-muted-foreground mt-0.5 uppercase tracking-widest font-semibold flex items-center justify-center gap-1 opacity-60">
            <Award size={9} /> Guides
          </p>
       </div>
    </div>
    
    <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-tr from-transparent via-[hsl(172_70%_42%/0.03)] to-[hsl(172_70%_42%/0.08)]" />
  </div>
);

const OtherModerators = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['mod', 'colleagues'],
    queryFn: () => api.get('/api/moderator/colleagues').then(r => r.data),
  });

  const moderators = data?.moderators || [];

  return (
    <div className="max-w-[1200px] mx-auto pb-20">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div>
           <h2 className="font-display font-bold text-2xl text-foreground">Department Colleagues</h2>
           <p className="font-body text-sm text-muted-foreground mt-0.5">Your fellow moderators in the department.</p>
        </div>
        <div className="glass rounded-xl px-4 py-2 border border-border/40 flex items-center gap-2 animate-in fade-in slide-in-from-right-4 duration-500">
           <Info size={14} className="text-muted-foreground" />
           <span className="text-xs font-body text-muted-foreground">Coordination reference</span>
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-[hsl(172_70%_42%/0.06)] border border-[hsl(172_70%_42%/0.2)] rounded-2xl px-6 py-5 mb-10 flex items-center gap-4 relative overflow-hidden group">
         <div className="absolute top-0 right-0 w-32 h-32 bg-[hsl(172_70%_42%/0.08)] blur-3xl rounded-full" />
         <div className="w-10 h-10 rounded-2xl bg-[hsl(172_70%_42%/0.15)] flex items-center justify-center text-[hsl(172_70%_55%)] shrink-0 group-hover:scale-110 transition-transform">
           <Users size={20} />
         </div>
         <div className="flex-1 relative z-10">
            <p className="font-body text-sm text-foreground/90 leading-relaxed max-w-2xl">
              Prevent duplicate efforts by checking which subjects your colleagues are actively moderating.
            </p>
         </div>
      </div>

      {/* Moderators Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
         {isLoading ? (
           [1,2,3].map(i => <div key={i} className="h-64 rounded-2xl shimmer" />)
         ) : moderators.length === 0 ? (
            <div className="md:col-span-2 lg:col-span-3 py-20 text-center animate-in zoom-in duration-500">
               <UserCheck size={48} className="mx-auto text-muted-foreground/20 mb-6" />
               <h3 className="font-display font-bold text-xl text-foreground">You're the only moderator here</h3>
               <p className="font-body text-sm text-muted-foreground mt-2">Currently, no other colleagues are assigned to this department.</p>
            </div>
         ) : (
           moderators.map((mod: any) => (
             <ColleagueCard key={mod.id} mod={mod} />
           ))
         )}
      </div>

      {/* Footer Info */}
      <div className="mt-20 py-10 border-t border-border/20 text-center">
         <p className="font-body text-xs text-muted-foreground/60 max-w-sm mx-auto italic">
            "Coordination is the glue of a curated library." 
         </p>
      </div>
    </div>
  );
};

export default OtherModerators;
