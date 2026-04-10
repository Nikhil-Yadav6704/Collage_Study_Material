import { ReactNode, useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  BookOpen, LayoutDashboard, Users, Shield, Files, Tag,
  BookOpenCheck, Inbox, BarChart2, Settings, ChevronRight,
  Menu, Sun, Moon, Bell, LogOut,
} from "lucide-react";
import { useAuthStore } from "../store/authStore";
import { useAuth } from "../hooks/useAuth";
import { useNotifications } from "../hooks/useNotifications";
import { useQuery } from "@tanstack/react-query";
import api from "../lib/api";
import NotificationDropdown from "./NotificationDropdown";

const AdminShell = ({ children }: { children: ReactNode }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { signOut } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [avatarOpen, setAvatarOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const avatarRef = useRef<HTMLDivElement>(null);

  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem("theme");
    return saved ? saved === "dark" : true;
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark");
      document.documentElement.classList.remove("light");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      document.documentElement.classList.add("light");
      localStorage.setItem("theme", "light");
    }
  }, [isDark]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node))
        setNotificationsOpen(false);
      if (avatarRef.current && !avatarRef.current.contains(e.target as Node))
        setAvatarOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch live pending count for sidebar badge
  const { data: overview } = useQuery({
    queryKey: ['admin', 'overview'],
    queryFn: () => api.get('/api/admin/analytics/overview').then(r => r.data),
    refetchInterval: 60000,
  });
  const { data: notifData } = useNotifications();
  const unreadCount = notifData?.unread_count || 0;
  const pendingCount = overview?.pending_requests || 0;

  // Real user
  const initials = user?.full_name
    ? user.full_name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)
    : "AD";

  // Nav sections with LIVE badge from API
  const navSections = [
    { label: "OVERVIEW", items: [{ icon: LayoutDashboard, name: "Dashboard", path: "/admin" }] },
    {
      label: "USERS",
      items: [
        { icon: Users, name: "User Management", path: "/admin/users" },
        { icon: Shield, name: "Moderator Management", path: "/admin/moderators" },
      ],
    },
    {
      label: "CONTENT",
      items: [
        { icon: Files, name: "Content Management", path: "/admin/content" },
        { icon: Tag, name: "Tag & Alias Library", path: "/admin/tags" },
        { icon: BookOpenCheck, name: "Study Guidelines", path: "/admin/guidelines" },
      ],
    },
    {
      label: "REQUESTS",
      items: [
        {
          icon: Inbox,
          name: "Request Center",
          path: "/admin/requests",
          // FIXED: live count from API instead of hardcoded "12"
          badge: pendingCount > 0 ? String(pendingCount) : undefined,
        },
      ],
    },
    { label: "ANALYTICS", items: [{ icon: BarChart2, name: "Analytics", path: "/admin/analytics" }] },
    { label: "SETTINGS", items: [{ icon: Settings, name: "Admin Settings", path: "/admin/settings" }] },
  ];

  const pageTitle =
    navSections.flatMap((s) => s.items).find((i) => location.pathname === i.path)?.name || "Admin Dashboard";

  const SidebarContent = () => (
    <>
      <div className="px-4 pt-6 pb-4">
        <Link to="/admin" className="flex items-center gap-2">
          <BookOpen size={18} className="text-primary" />
          <span className="font-display font-bold text-lg">
            <span className="text-foreground">Edu</span>
            <span className="gradient-text">Vault</span>
          </span>
          <span className="text-danger text-[10px] bg-danger/10 rounded px-1 font-body ml-1">Admin</span>
        </Link>
      </div>

      {navSections.map((section) => (
        <div key={section.label}>
          <p className="text-[10px] font-body font-semibold text-muted-foreground/50 tracking-widest px-4 mb-2 mt-4">
            {section.label}
          </p>
          {section.items.map((item: any) => {
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`relative flex items-center gap-3 px-4 py-2.5 rounded-xl mx-2 cursor-pointer transition-all duration-150 ${
                  active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-surface-2 hover:text-foreground"
                }`}
              >
                {active && <span className="nav-active-indicator" />}
                <item.icon size={18} />
                <span className="font-body text-sm font-medium">{item.name}</span>
                {item.badge && (
                  <span className="bg-danger/15 text-danger text-[10px] font-body rounded-full px-1.5 py-0.5 ml-auto">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      ))}

      {/* Real admin info in sidebar bottom */}
      <div className="mt-auto px-4 pb-6">
        <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-surface-2 transition-colors cursor-pointer">
          <div className="w-8 h-8 rounded-full bg-danger/20 flex items-center justify-center text-xs font-display font-bold text-danger">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-body font-medium text-foreground truncate">{user?.full_name || "Admin"}</p>
            <span className="text-[10px] bg-danger/10 text-danger rounded-full px-2 py-0.5 font-body">Admin</span>
          </div>
          <ChevronRight size={14} className="text-muted-foreground" />
        </div>
      </div>
    </>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <aside className="hidden md:flex w-64 flex-col bg-sidebar-bg border-r border-sidebar-border custom-scrollbar overflow-y-auto flex-shrink-0">
        <SidebarContent />
      </aside>

      {sidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-background/80" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-64 bg-sidebar-bg border-r border-sidebar-border flex flex-col custom-scrollbar overflow-y-auto">
            <SidebarContent />
          </aside>
        </div>
      )}

      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <header className="h-16 border-b border-border/40 bg-background/80 backdrop-blur-sm flex items-center px-6 flex-shrink-0 gap-3 relative z-50">
          <button aria-label="Toggle menu" className="md:hidden text-muted-foreground hover:text-foreground" onClick={() => setSidebarOpen(true)}>
            <Menu size={20} />
          </button>
          <h1 className="font-display font-semibold text-lg text-foreground">{pageTitle}</h1>
          <div className="ml-auto flex items-center gap-3">
            {/* Dark mode */}
            <button
              aria-label="Toggle theme"
              onClick={() => setIsDark(!isDark)}
              className="w-9 h-9 rounded-xl bg-surface-1 border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-all active:scale-95"
            >
              {isDark ? <Moon size={16} /> : <Sun size={16} />}
            </button>

            {/* Notification bell */}
            <div ref={notifRef} className="relative">
              <button
                aria-label="Notifications"
                onClick={() => { setNotificationsOpen(!notificationsOpen); setAvatarOpen(false); }}
                className="w-9 h-9 rounded-xl bg-surface-1 border border-border flex items-center justify-center text-muted-foreground hover:text-foreground relative transition-all"
              >
                <Bell size={16} />
                {unreadCount > 0 && (
                  <div className="absolute top-1.5 right-1.5 w-2 h-2 bg-danger rounded-full" />
                )}
              </button>
              {notificationsOpen && (
                <NotificationDropdown onClose={() => setNotificationsOpen(false)} />
              )}
            </div>

            {/* Avatar + dropdown */}
            <div ref={avatarRef} className="relative">
              <button
                aria-label="User profile"
                onClick={() => { setAvatarOpen(!avatarOpen); setNotificationsOpen(false); }}
                className="w-9 h-9 rounded-xl bg-danger/20 flex items-center justify-center text-sm font-display font-bold text-danger cursor-pointer hover:bg-danger/30 transition-all"
              >
                {initials}
              </button>
              {avatarOpen && (
                <div className="absolute top-full right-0 mt-2 w-56 glass-strong rounded-2xl border border-border/50 shadow-2xl overflow-hidden z-50 animate-in fade-in zoom-in duration-200">
                  <div className="px-4 py-3 border-b border-border/40">
                    <p className="text-sm font-body font-semibold text-foreground">{user?.full_name || "Admin"}</p>
                    <p className="text-[11px] text-muted-foreground font-body mt-0.5">{user?.email}</p>
                    <span className="text-[10px] bg-danger/10 text-danger rounded-full px-2 py-0.5 font-body mt-1 inline-block">Admin</span>
                  </div>
                  <div className="p-1.5">
                    <button
                      onClick={() => { navigate("/admin/settings"); setAvatarOpen(false); }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-body text-foreground hover:bg-surface-1 transition-colors"
                    >
                      <Settings size={15} className="text-muted-foreground" />
                      Admin Settings
                    </button>
                    <button
                      onClick={() => { signOut(); setAvatarOpen(false); }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-body text-danger hover:bg-danger/10 transition-colors"
                    >
                      <LogOut size={15} />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto custom-scrollbar px-6 pb-6 pt-2 md:pt-3">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminShell;
