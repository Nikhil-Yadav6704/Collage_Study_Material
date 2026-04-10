import { useState } from "react";
import { 
  TrendingUp, 
  Download, 
  Star, 
  Users, 
  Crown,
  Activity,
  Files,
  Clock
} from "lucide-react";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  BarChart, 
  Bar, 
  Legend
} from "recharts";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import api from "../lib/api";

const AdminAnalytics = () => {
  const [timeRange, setTimeRange] = useState("30D");

  const { data: overview, isLoading: isOverviewLoading } = useQuery({
    queryKey: ['admin', 'analytics', 'overview'],
    queryFn: () => api.get('/api/admin/analytics/overview').then(r => r.data),
  });

  const { data: deptData, isLoading: isDeptLoading } = useQuery({
    queryKey: ['admin', 'analytics', 'dept'],
    queryFn: () => api.get('/api/admin/analytics/materials-by-department').then(r => r.data),
  });

  const { data: activityData, isLoading: isActivityLoading } = useQuery({
    queryKey: ['admin', 'analytics', 'activity'],
    queryFn: () => api.get('/api/admin/analytics/daily-active-users').then(r => r.data),
  });

  const { data: topMaterials, isLoading: isTopLoading } = useQuery({
    queryKey: ['admin', 'analytics', 'top-materials'],
    queryFn: () => api.get('/api/admin/analytics/top-rated-materials').then(r => r.data),
  });

  const isLoading = isOverviewLoading || isDeptLoading || isActivityLoading || isTopLoading;

  const dauData = activityData?.data?.map((u: any) => ({
    name: new Date(u.day).toLocaleDateString('en-US', { day: 'numeric', month: 'short' }),
    students: u.active_users,
    moderators: Math.floor(u.active_users * 0.05) // Mocking moderator split for UI depth
  })) || [];

  const barData = deptData?.data?.map((d: any) => ({
    name: d.department,
    count: d.material_count
  })) || [];

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="h-10 w-48 shimmer rounded-lg" />
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-24 shimmer rounded-2xl" />)}
        </div>
        <div className="grid grid-cols-2 gap-5">
          {[1, 2].map(i => <div key={i} className="h-[320px] shimmer rounded-2xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display font-bold text-2xl text-foreground">Platform Analytics</h2>
          <p className="font-body text-sm text-muted-foreground">Detailed insights into EduVault usage.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="glass rounded-xl flex items-center p-1 gap-1">
            {["7D", "30D", "3M", "All"].map((opt) => (
              <button 
                key={opt}
                onClick={() => setTimeRange(opt)}
                className={`px-3 py-1.5 text-xs font-body rounded-lg transition-all ${
                  timeRange === opt ? 'bg-primary text-white shadow-sm' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
          <Button variant="ghost" className="border border-border/50 text-xs gap-2">
            <Download size={14} /> Export Report
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Students", value: overview?.total_users, icon: Users, color: "text-primary" },
          { label: "Total Materials", value: overview?.total_materials, icon: Files, color: "text-warning" },
          { label: "Active Today", value: overview?.online_users, icon: Activity, color: "text-success" },
          { label: "Pending Reviews", value: overview?.pending_requests, icon: Clock, color: "text-danger" }
        ].map((kpi, i) => (
          <div key={i} className="bg-card border border-border/40 rounded-2xl p-5 shadow-sm hover:border-primary/20 transition-all">
            <div className="flex justify-between items-start mb-3">
               <kpi.icon size={18} className={kpi.color} />
            </div>
            <p className="text-2xl font-display font-bold text-foreground leading-none">{kpi.value || 0}</p>
            <p className="text-[11px] font-body text-muted-foreground uppercase tracking-widest mt-2">{kpi.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-5">
        <div className="gradient-border rounded-2xl p-6 h-[340px] flex flex-col bg-card">
           <div className="flex items-center justify-between mb-6">
              <h3 className="font-display font-semibold text-sm text-foreground">User Activity (DAU)</h3>
              <div className="flex gap-4 text-[11px] font-body">
                <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-primary" /> Students</div>
              </div>
           </div>
           <div className="flex-1 w-full min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dauData}>
                  <defs>
                    <linearGradient id="colorStudents" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                  <Tooltip 
                    contentStyle={{ background: 'rgba(15, 23, 42, 0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', backdropFilter: 'blur(8px)', fontSize: '11px' }}
                  />
                  <Area type="monotone" dataKey="students" stroke="hsl(var(--primary))" strokeWidth={2} fillOpacity={1} fill="url(#colorStudents)" />
                </AreaChart>
              </ResponsiveContainer>
           </div>
        </div>

        <div className="gradient-border rounded-2xl p-6 h-[340px] flex flex-col bg-card">
           <h3 className="font-display font-semibold text-sm text-foreground mb-4">Materials Distribution</h3>
           <div className="flex-1 w-full min-h-0 relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={barData.slice(0, 5)}
                    cx="50%"
                    cy="45%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="count"
                  >
                    {barData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend 
                     layout="horizontal" verticalAlign="bottom" align="center"
                     formatter={(value) => <span className="text-[10px] font-body text-muted-foreground">{value}</span>}
                     iconType="circle" iconSize={8}
                  />
                </PieChart>
              </ResponsiveContainer>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
         <div className="gradient-border rounded-2xl p-6 flex flex-col bg-card">
            <h3 className="font-display font-semibold text-sm text-foreground mb-6">Top Rated Materials</h3>
            <div className="space-y-4">
               {topMaterials?.data?.map((item: any, i: number) => (
                 <div key={item.id} className="flex items-center gap-4 group">
                    <span className="font-display font-bold text-lg text-foreground/10 w-6 shrink-0 group-hover:text-primary/40 transition-colors">{i+1}</span>
                    <div className="flex-1 min-w-0">
                       <h4 className="font-body text-sm font-medium text-foreground truncate">{item.title}</h4>
                       <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold mt-1 inline-block">{item.department}</span>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                       <div className="flex items-center gap-1 text-[11px] font-bold text-foreground">
                          <Star size={12} className="fill-warning text-warning" /> {item.average_rating || 'N/A'}
                       </div>
                    </div>
                 </div>
               ))}
            </div>
         </div>

         <div className="gradient-border rounded-2xl p-6 flex flex-col bg-card">
             <h3 className="font-display font-semibold text-sm text-foreground mb-6">Subject Popularity</h3>
             <div className="flex-1 min-h-[240px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData} layout="vertical" margin={{ left: 0 }}>
                     <XAxis type="number" hide />
                     <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} width={80} />
                     <Tooltip />
                     <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} barSize={12} />
                  </BarChart>
                </ResponsiveContainer>
             </div>
         </div>
      </div>
    </div>
  );
};

export default AdminAnalytics;
