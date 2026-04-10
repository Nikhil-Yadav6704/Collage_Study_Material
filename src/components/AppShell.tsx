import { ReactNode, useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  BookOpen, LayoutDashboard, FolderOpen, Bookmark, Upload,
  MessageSquare, User, Settings, ChevronRight, Bell,
  Sun, Moon, Menu, X, LogOut,
} from "lucide-react";
import { useAuthStore } from "../store/authStore";
import { useAuth } from "../hooks/useAuth";
import { useNotifications, useMarkNotificationsRead } from "../hooks/useNotifications";
import NotificationDropdown from "./NotificationDropdown";

const navItems = [
  {
    label: "NAVIGATION",
    items: [
      { icon: LayoutDashboard, name: "Study Materials", path: "/study" },
      { icon: FolderOpen, name: "File Manager", path: "/files" },
      { icon: Bookmark, name: "My Bookmarks", path: "/bookmarks" },
      { icon: Upload, name: "Suggest a Material", path: "/suggest" },
      // Chat removed — uncomment when feature ships:
      // { icon: MessageSquare, name: "Chat", path: "/chat", badge: "Soon" },
    ],
  },
  {
    label: "ACCOUNT",
    items: [
      { icon: User, name: "Profile & Settings", path: "/settings" },
    ],
  },
];

const AppShell = ({ children }: { children: ReactNode }) => {
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

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotificationsOpen(false);
      }
      if (avatarRef.current && !avatarRef.current.contains(e.target as Node)) {
        setAvatarOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const { data: notifData } = useNotifications();
  const unreadCount = notifData?.unread_count || 0;

  // Real user initials
  const initials = user?.full_name
    ? user.full_name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "?";

  const firstInitial = user?.full_name?.[0]?.toUpperCase() || "?";

  const pageTitle =
    navItems.flatMap((s) => s.items)
      .find((i) => location.pathname.startsWith(i.path))?.name || "Study Materials";

  const SidebarContent = () => (
    <>
      <div className="px-4 pt-6 pb-4">
        <Link to="/" className="flex items-center gap-2">
          <BookOpen size={18} className="text-primary" />
          <span className="font-display font-bold text-lg">
            <span className="text-foreground">Edu</span>
            <span className="gradient-text">Vault</span>
          </span>
        </Link>
      </div>

      {navItems.map((section) => (
        <div key={section.label}>
          <p className="text-[10px] font-body font-semibold text-muted-foreground/50 tracking-widest px-4 mb-2 mt-6">
            {section.label}
          </p>
          {section.items.map((item) => {
            const active = location.pathname.startsWith(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`relative flex items-center gap-3 px-4 py-2.5 rounded-xl mx-2 cursor-pointer transition-all duration-150 ${
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground"
                }`}
              >
                {active && <span className="nav-active-indicator" />}
                <item.icon size={18} />
                <span className="font-body text-sm font-medium">{item.name}</span>
              </Link>
            );
          })}
        </div>
      ))}

      {/* Real user info in sidebar bottom */}
      <div className="mt-auto px-4 pb-6">
        <Link
          to="/settings"
          className="flex items-center gap-3 p-3 rounded-xl hover:bg-sidebar-accent transition-colors cursor-pointer"
        >
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-display font-bold text-primary">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-body font-medium text-foreground truncate">
              {user?.full_name || "Student"}
            </p>
            <span className="text-[10px] bg-primary/10 text-primary rounded-full px-2 py-0.5 font-body capitalize">
              {user?.role || "student"}
            </span>
          </div>
          <ChevronRight size={14} className="text-muted-foreground" />
        </Link>
      </div>
    </>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-64 flex-col bg-sidebar-bg border-r border-sidebar-border custom-scrollbar overflow-y-auto flex-shrink-0">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-background/80" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-64 bg-sidebar-bg border-r border-sidebar-border flex flex-col custom-scrollbar overflow-y-auto">
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main area */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <header className="h-16 border-b border-border/40 bg-background/80 backdrop-blur-sm flex items-center justify-between px-6 flex-shrink-0 relative z-50">
          <div className="flex items-center gap-3">
            <button aria-label="Toggle menu" className="md:hidden text-muted-foreground hover:text-foreground" onClick={() => setSidebarOpen(true)}>
              <Menu size={20} />
            </button>
            <h1 className="font-display font-semibold text-lg text-foreground">{pageTitle}</h1>
          </div>
          <div className="flex items-center gap-3">
            {/* Dark mode toggle */}
            <div
              role="button"
              aria-label="Toggle theme"
              onClick={() => setIsDark(!isDark)}
              className="w-9 h-9 rounded-xl bg-surface-1 hover:bg-surface-2 border border-border flex items-center justify-center cursor-pointer transition-all active:scale-95"
            >
              {isDark ? <Moon size={16} className="text-muted-foreground" /> : <Sun size={16} className="text-muted-foreground" />}
            </div>

            {/* Notification bell */}
            <div ref={notifRef} className="relative">
              <button
                aria-label="Notifications"
                onClick={() => { setNotificationsOpen(!notificationsOpen); setAvatarOpen(false); }}
                className="w-9 h-9 rounded-xl bg-surface-1 hover:bg-surface-2 border border-border flex items-center justify-center cursor-pointer relative transition-all"
              >
                <Bell size={16} className="text-muted-foreground" />
                {unreadCount > 0 && (
                  <div className="w-2 h-2 bg-danger rounded-full absolute top-1.5 right-1.5" />
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
                className="w-9 h-9 rounded-xl bg-primary/20 flex items-center justify-center text-sm font-display font-bold text-primary cursor-pointer hover:bg-primary/30 transition-all"
              >
                {firstInitial}
              </button>
              {avatarOpen && (
                <div className="absolute top-full right-0 mt-2 w-56 glass-strong rounded-2xl border border-border/50 shadow-2xl overflow-hidden z-50 animate-in fade-in zoom-in duration-200">
                  {/* User info header */}
                  <div className="px-4 py-3 border-b border-border/40">
                    <p className="text-sm font-body font-semibold text-foreground">{user?.full_name}</p>
                    <p className="text-[11px] text-muted-foreground font-body mt-0.5">{user?.email}</p>
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <span className="text-[10px] bg-primary/10 text-primary rounded-full px-2 py-0.5 font-body capitalize">{user?.role}</span>
                      {user?.department?.short_name && (
                        <span className="text-[10px] text-muted-foreground font-body">{user.department.short_name}</span>
                      )}
                    </div>
                  </div>
                  {/* Actions */}
                  <div className="p-1.5">
                    <button
                      onClick={() => { navigate("/settings"); setAvatarOpen(false); }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-body text-foreground hover:bg-surface-1 transition-colors"
                    >
                      <Settings size={15} className="text-muted-foreground" />
                      Settings
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

export default AppShell;
