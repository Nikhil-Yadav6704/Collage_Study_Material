import { useState, useEffect } from "react";
import { 
  Users, 
  Activity, 
  Files, 
  Clock, 
  TrendingUp, 
  ArrowUpCircle, 
  CheckCircle, 
  XCircle, 
  UserPlus, 
  Calendar,
  Upload,
  Inbox,
  ChevronRight
} from "lucide-react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area 
} from "recharts";
import { useQuery } from "@tanstack/react-query";
import api from "../lib/api";
import { useNavigate } from "react-router-dom";

const colorMap: Record<string, { bg: string; text: string; trend: string }> = {
  primary: { bg: 'bg-primary/15', text: 'text-primary', trend: '' },
  success: { bg: 'bg-success/15', text: 'text-success', trend: 'bg-success/10 text-success' },
  warning: { bg: 'bg-warning/15', text: 'text-warning', trend: 'bg-warning/10 text-warning' },
  danger:  { bg: 'bg-danger/15',  text: 'text-danger',  trend: 'bg-danger/10 text-danger' },
  accent:  { bg: 'bg-accent/15',  text: 'text-accent',  trend: 'bg-accent/10 text-accent' },
};

const StatCard = ({ icon: Icon, color, trend, number, label, delay, pulseGlow = false }: any) => {
  const [count, setCount] = useState(0);
  const target = typeof number === 'string' ? parseInt(number.replace(/,/g, '')) : number;

  useEffect(() => {
    let start = 0;
    const duration = 1200;
    const increment = target / (duration / 16);
    
    const timer = setInterval(() => {
      start += increment;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    
    return () => clearInterval(timer);
  }, [target]);

  const classes = colorMap[color] || colorMap.primary;
  const trendIsPositive = trend?.includes('+');
  const trendIsLive = trend?.toLowerCase() === 'live';
  const trendBg = trendIsLive ? 'bg-accent/10 text-accent' : trendIsPositive ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger';

  return (
    <div 
      className={`gradient-border rounded-2xl p-5 animate-fade-up ${pulseGlow ? 'animate-pulse-glow' : ''}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex justify-between items-start">
        <div className={`w-10 h-10 rounded-xl ${classes.bg} flex items-center justify-center`}>
          <Icon size={18} className={classes.text} />
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-[11px] ${trendBg} rounded-full px-2 py-0.5`}>
            {trendIsLive && <span className="w-2 h-2 rounded-full bg-accent animate-ping inline-block mr-1" />}
            {trendIsPositive && <TrendingUp size={10} />}
            {trend}
          </div>
        )}
      </div>
      <div className="font-display font-bold text-3xl text-foreground mt-4">
        {count.toLocaleString()}
      </div>
      <div className="font-body text-xs text-muted-foreground mt-1">{label}</div>
    </div>
  );
};

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { data: overview, isLoading: isOverviewLoading } = useQuery({

    queryKey: ['admin', 'overview'],
    queryFn: async () => {
      const { data } = await api.get('/api/admin/analytics/overview');
      return data;
    },
    refetchInterval: 30000,
  });

  const { data: deptData, isLoading: isDeptLoading } = useQuery({
    queryKey: ['admin', 'dept-chart'],
    queryFn: () => api.get('/api/admin/analytics/materials-by-department').then(r => r.data),
  });

  const { data: activityData, isLoading: isActivityLoading } = useQuery({
    queryKey: ['admin', 'activity-chart'],
    queryFn: () => api.get('/api/admin/analytics/daily-active-users').then(r => r.data),
  });

  const { data: topMaterials, isLoading: isTopMaterialsLoading } = useQuery({
    queryKey: ['admin', 'top-materials'],
    queryFn: () => api.get('/api/admin/analytics/top-rated-materials').then(r => r.data),
  });

  const barData = deptData?.data?.map((d: any) => ({
    name: d.department,
    value: d.material_count
  })) || [];

  const areaData = activityData?.data?.map((u: any) => ({
    name: new Date(u.day).toLocaleDateString('en-US', { day: 'numeric', month: 'short' }),
    value: u.active_users
  })) || [];

  const isLoading = isOverviewLoading || isDeptLoading || isActivityLoading || isTopMaterialsLoading;
  
  if (isLoading) {
    return (
      <div className="p-6 grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => <div key={i} className="h-32 rounded-2xl shimmer" />)}
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="font-display font-bold text-2xl text-foreground">Good morning, Admin 👋</h1>
          <p className="font-body text-sm text-muted-foreground mt-0.5">Here's what's happening on EduVault right now.</p>
        </div>
        <div className="glass rounded-xl px-4 py-2 flex items-center gap-2">
          <Calendar size={14} className="text-muted-foreground" />
          <span className="text-xs font-body text-muted-foreground">
            {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon={Users} color="primary" 
          trend={`${overview?.total_users || 0} total`} 
          number={overview?.total_users || 0} 
          label="Total Students" delay={0} />
        <StatCard icon={Activity} color="accent" 
          trend="Live" 
          number={overview?.online_users || 0} 
          label="Currently Online" delay={80} />
        <StatCard icon={Files} color="warning" 
          trend={overview?.total_materials > 0 ? `+${overview.total_materials}` : ""} 
          number={overview?.total_materials || 0} 
          label="Total Materials" delay={160} />
        <StatCard icon={Clock} color="danger" 
          trend="Needs attention" 
          number={overview?.pending_requests || 0} 
          label="Awaiting Review" delay={240} pulseGlow />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-5 mb-5">
        <div className="gradient-border rounded-2xl p-5 relative overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-semibold text-sm text-foreground">Top Materials</h3>
            <span className="text-xs text-primary hover:underline cursor-pointer font-body">View all</span>
          </div>

          <div className="flex flex-col gap-0 divide-y divide-border/30">
            {topMaterials?.data?.map((m: any) => (
              <div key={m.id} className="flex items-center gap-3 py-3.5 first:pt-0 last:pb-0">
                <div className="w-8 h-8 rounded-xl bg-surface-2 flex items-center justify-center text-xs font-display font-semibold text-foreground">
                  {m.title.slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-body text-xs text-foreground leading-snug">
                    <span className="font-medium text-foreground">{m.title}</span>{" "}
                    <span className="text-muted-foreground">in {m.department}</span>
                  </p>
                  <p className="text-[11px] text-muted-foreground/60 mt-0.5">{m.material_type} · {m.average_rating || 'N/A'} rating</p>
                </div>
                <div className="flex-shrink-0">
                  <ArrowUpCircle size={14} className="text-success" />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="gradient-border rounded-2xl p-5 flex flex-col relative overflow-hidden">
          <h3 className="font-display font-semibold text-sm mb-4">Quick Actions</h3>
          <div className="flex flex-col gap-2.5">
            <button 
              onClick={() => navigate('/admin/requests')}
              className="w-full h-10 rounded-xl flex items-center gap-3 px-4 text-xs font-body font-medium bg-danger/10 border border-danger/20 text-danger hover:bg-danger/20 transition-all"
            >
              <Inbox size={15} /> 
              Review Requests {overview?.pending_requests > 0 ? `(${overview.pending_requests})` : ''}
            </button>

            <button className="w-full h-10 rounded-xl flex items-center gap-3 px-4 text-xs font-body font-medium bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20 transition-all">
              <UserPlus size={15} /> Add Moderator
            </button>
            <button className="w-full h-10 rounded-xl flex items-center gap-3 px-4 text-xs font-body font-medium bg-success/10 border border-success/20 text-success hover:bg-success/20 transition-all">
              <Upload size={15} /> Upload Material
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="gradient-border rounded-2xl p-5 h-[320px] flex flex-col relative overflow-hidden">
          <div className="mb-4">
            <h3 className="font-display font-semibold text-sm text-foreground">Materials by Department</h3>
          </div>
          <div className="flex-1 w-full min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} layout="vertical" margin={{ left: -20, right: 10 }}>
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} width={60} />
                <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} contentStyle={{ background: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '11px', backdropFilter: 'blur(8px)' }} />
                <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} barSize={18} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="gradient-border rounded-2xl p-5 h-[320px] flex flex-col relative overflow-hidden">
          <div className="mb-4">
            <h3 className="font-display font-semibold text-sm text-foreground">User Activity</h3>
          </div>
          <div className="flex-1 w-full min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={areaData}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--accent))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--accent))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <Tooltip contentStyle={{ background: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '11px', backdropFilter: 'blur(8px)' }} />
                <Area type="monotone" dataKey="value" stroke="hsl(var(--accent))" strokeWidth={2} fillOpacity={1} fill="url(#colorValue)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
