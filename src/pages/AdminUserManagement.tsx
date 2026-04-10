import { useState } from "react";
import { 
  Search, 
  Filter, 
  Shield, 
  UserMinus, 
  UserCheck, 
  Calendar,
  ChevronLeft,
  ChevronRight,
  AlertCircle
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../lib/api";
import { cn } from "@/lib/utils";

const AdminUserManagement = () => {
  const qc = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'users', { searchQuery, statusFilter, roleFilter, page }],
    queryFn: async () => {
      const { data } = await api.get('/api/admin/users', {
        params: {
          search: searchQuery || undefined,
          status: statusFilter || undefined,
          role: roleFilter || undefined,
          page,
          limit: 20,
        }
      });
      return data;
    },
  });

  const { mutate: updateStatus } = useMutation({
    mutationFn: ({ userId, status }: { userId: string; status: string }) =>
      api.patch(`/api/admin/users/${userId}/status`, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'users'] }),
  });

  const { mutate: updateRole } = useMutation({
    mutationFn: ({ userId, role, department_id }: { userId: string; role: string; department_id?: string }) =>
      api.patch(`/api/admin/users/${userId}/role`, { role, department_id }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'users'] }),
  });

  const { mutate: overrideYear } = useMutation({
    mutationFn: ({ userId, year }: { userId: string; year: string }) =>
      api.patch(`/api/admin/users/${userId}/year`, { year }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'users'] }),
  });

  const users = data?.users || [];
  const totalUsers = data?.total || 0;
  const totalPages = Math.ceil(totalUsers / 20);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-success/15 text-success';
      case 'suspended': return 'bg-warning/15 text-warning';
      case 'banned': return 'bg-danger/15 text-danger';
      default: return 'bg-muted/15 text-muted-foreground';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display font-bold text-2xl text-foreground">User Management</h2>
          <p className="font-body text-sm text-muted-foreground">Manage student and moderator accounts.</p>
        </div>
        <div className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-body font-medium">
          {totalUsers} Total Users
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by name, email or roll number..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            className="bg-surface-1 border border-border rounded-xl pl-10 pr-4 py-2 text-sm font-body w-full focus:outline-none focus:ring-1 focus:ring-primary/40 transition-all"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2 bg-surface-1 border border-border rounded-xl px-3 py-1.5">
            <Filter size={14} className="text-muted-foreground" />
            <select 
              value={roleFilter} 
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setPage(1);
              }}
              className="bg-transparent border-none text-xs font-body text-foreground focus:outline-none cursor-pointer"
            >
              <option value="">All Roles</option>
              <option value="student">Students</option>
              <option value="moderator">Moderators</option>
              <option value="admin">Admins</option>
            </select>
          </div>

          <div className="flex items-center gap-2 bg-surface-1 border border-border rounded-xl px-3 py-1.5">
            <AlertCircle size={14} className="text-muted-foreground" />
            <select 
              value={statusFilter} 
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="bg-transparent border-none text-xs font-body text-foreground focus:outline-none cursor-pointer"
            >
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="banned">Banned</option>
            </select>
          </div>
        </div>
      </div>

      <div className="gradient-border rounded-2xl overflow-hidden bg-card">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-surface-1/50 border-b border-border/40">
              <th className="px-6 py-4 text-[11px] font-display font-semibold uppercase tracking-wider text-muted-foreground">User</th>
              <th className="px-6 py-4 text-[11px] font-display font-semibold uppercase tracking-wider text-muted-foreground">Assignment</th>
              <th className="px-6 py-4 text-[11px] font-display font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
              <th className="px-6 py-4 text-[11px] font-display font-semibold uppercase tracking-wider text-muted-foreground">Joined</th>
              <th className="px-6 py-4 text-[11px] font-display font-semibold uppercase tracking-wider text-muted-foreground text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/20">
            {isLoading ? (
              [1, 2, 3, 4, 5].map(i => (
                <tr key={i} className="animate-pulse">
                  <td colSpan={5} className="px-6 py-4"><div className="h-10 bg-surface-2 rounded-lg w-full" /></td>
                </tr>
              ))
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-sm font-body text-muted-foreground">No users found.</td>
              </tr>
            ) : users.map((user: any) => (
              <tr key={user.id} className="hover:bg-white/5 transition-colors group">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-xs font-display font-bold text-primary group-hover:scale-105 transition-transform">
                      {user.full_name?.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-body font-semibold text-foreground">{user.full_name}</p>
                      <p className="text-[11px] text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-col">
                    <span className="text-xs font-body text-foreground">{user.department?.short_name || 'N/A'}</span>
                    <span className="text-[11px] text-muted-foreground">{user.role} · {user.roll_number}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={cn("px-2.5 py-0.5 rounded-full text-[10px] font-body font-medium capitalize", getStatusColor(user.status))}>
                    {user.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-1.5 text-xs font-body text-muted-foreground">
                    <Calendar size={13} />
                    {new Date(user.created_at).toLocaleDateString()}
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    {/* Suspend/Resume — not for admins */}
                    {user.role !== 'admin' && (
                      user.status === 'active' ? (
                        <button
                          onClick={() => updateStatus({ userId: user.id, status: 'suspended' })}
                          title="Suspend User"
                          className="w-8 h-8 rounded-lg hover:bg-warning/10 text-muted-foreground hover:text-warning flex items-center justify-center transition-colors"
                        >
                          <UserMinus size={14} />
                        </button>
                      ) : (
                        <button
                          onClick={() => updateStatus({ userId: user.id, status: 'active' })}
                          title="Restore User"
                          className="w-8 h-8 rounded-lg hover:bg-success/10 text-muted-foreground hover:text-success flex items-center justify-center transition-colors"
                        >
                          <UserCheck size={14} />
                        </button>
                      )
                    )}

                    {/* Promote to Moderator — only for active students */}
                    {user.role === 'student' && user.status === 'active' && (
                      <button
                        title="Promote to Moderator"
                        onClick={() => updateRole({ userId: user.id, role: 'moderator', department_id: user.department?.id })}
                        className="w-8 h-8 rounded-lg hover:bg-primary/10 text-muted-foreground hover:text-primary flex items-center justify-center transition-colors"
                      >
                        <Shield size={14} />
                      </button>
                    )}

                    {/* Demote to Student — only for moderators */}
                    {user.role === 'moderator' && (
                      <button
                        title="Demote to Student"
                        onClick={() => updateRole({ userId: user.id, role: 'student' })}
                        className="w-8 h-8 rounded-lg hover:bg-warning/10 text-muted-foreground hover:text-warning flex items-center justify-center transition-colors"
                        >
                        <UserMinus size={14} />
                      </button>
                    )}

                    {/* Admin badge — no actions */}
                    {user.role === 'admin' && (
                      <span className="text-[10px] text-danger/60 font-body italic px-2">admin</span>
                    )}

                    {/* Year override for students */}
                    {user.role === 'student' && user.status === 'active' && (
                      <select
                        title={`Override year (currently ${user.year || '?'})`}
                        defaultValue={user.year || '1'}
                        onChange={(e) => {
                          if (window.confirm(`Change ${user.full_name}'s year to ${e.target.value}?`)) {
                            overrideYear({ userId: user.id, year: e.target.value });
                          } else {
                            e.target.value = user.year || '1';
                          }
                        }}
                        className="bg-surface-1 border border-border rounded-lg px-2 py-1 text-[11px] font-body text-foreground focus:ring-1 focus:ring-primary/40 outline-none cursor-pointer hover:border-primary/40 transition-colors"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <option value="1">1st Yr</option>
                        <option value="2">2nd Yr</option>
                        <option value="3">3rd Yr</option>
                        <option value="4">4th Yr</option>
                      </select>
                    )}
                  </div>
                </td>

              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between px-2 py-4">
          <p className="text-xs font-body text-muted-foreground">
            Showing Page <span className="text-foreground">{page}</span> of <span className="text-foreground">{totalPages}</span>
          </p>
          <div className="flex items-center gap-2">
            <button 
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
              className="w-8 h-8 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:bg-surface-1 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft size={16} />
            </button>
            <button 
              disabled={page === totalPages}
              onClick={() => setPage(p => p + 1)}
              className="w-8 h-8 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:bg-surface-1 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUserManagement;
