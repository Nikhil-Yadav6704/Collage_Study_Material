import { ReactNode, useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  BookOpen,
  LayoutDashboard,
  ShieldCheck,
  FolderOpen,
  Upload,
  Inbox,
  MessageSquare,
  BookMarked,
  Bookmark,
  Users,
  User,
  ChevronRight,
  Menu,
  Search,
  Bell,
  Sun,
  Moon,
  X,
  LogOut,
  Settings
} from "lucide-react";

import NotificationDropdown from "./NotificationDropdown";
import { useAuthStore } from "../store/authStore";
import { useAuth } from "../hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import api from "../lib/api";
import { useNotifications } from "../hooks/useNotifications";


const navSections = [
  {
    label: "PORTAL",
    items: [
      { icon: LayoutDashboard, name: "Dashboard", path: "/moderator" },
      { icon: BookOpen, name: "Browse & Study", path: "/moderator/browse" },
      { icon: FolderOpen, name: "File Manager", path: "/moderator/files" },
      { icon: Upload, name: "Upload Material", path: "/moderator/upload" },
      { icon: Inbox, name: "Student Requests", path: "/moderator/requests" },
      { icon: MessageSquare, name: "Feedback Center", path: "/moderator/feedback" },
      { icon: BookMarked, name: "Study Guidelines", path: "/moderator/guidelines" },
      { icon: Bookmark, name: "My Bookmarks", path: "/moderator/bookmarks" },
      { icon: Users, name: "Other Moderators", path: "/moderator/colleagues" },
    ],
  },
  {
    label: "ACCOUNT",
    items: [
      { icon: User, name: "Profile & Settings", path: "/moderator/settings" },
    ],
  },
];

const ModeratorShell = ({ children }: { children: ReactNode }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { signOut } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [avatarOpen, setAvatarOpen] = useState(false);
  const avatarRef = useRef<HTMLDivElement>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/moderator/browse?search=${encodeURIComponent(searchTerm.trim())}`);
      setSearchTerm("");
    }
  };

  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem("theme");
    return saved ? saved === "dark" : true;
  });

  const { data: notifData } = useNotifications();
  const unreadCount = notifData?.unread_count || 0;

  const { data: pendingCountData } = useQuery({
    queryKey: ['moderator', 'pending-count'],
    queryFn: () => api.get('/api/moderator/dashboard/pending-count').then(r => r.data),
    refetchInterval: 60000,
    staleTime: 30000,
  });
  const pendingRequestCount = pendingCountData?.count || 0;

  // Real user initials
  const modInitials = user?.full_name
    ? user.full_name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)
    : "MO";
  const deptName = user?.department?.short_name || "Dept";


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

  const pageTitle =
    navSections
      .flatMap((s) => s.items)
      .find((i) => location.pathname === i.path)?.name || "Moderator Dashboard";

  const SidebarContent = () => (
    <>
      <div className="px-4 pt-6 pb-4">
        <Link to="/moderator" className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <BookOpen size={18} className="text-foreground" />
            <span className="font-display font-bold text-lg">
              <span className="text-foreground">Edu</span>
              <span className="gradient-text">Vault</span>
            </span>
          </div>
          <div className="mod-role-badge self-start">
            <ShieldCheck size={11} />
            <span>{deptName} Moderator</span>
          </div>
        </Link>
      </div>

      <nav className="mt-6">
        {navSections.map((section) => (
          <div key={section.label} className="mb-6">
            <p className="text-[10px] font-body font-semibold text-muted-foreground/50 tracking-widest px-4 mb-2 uppercase">
              {section.label}
            </p>
            {section.items.map((item) => {
              const active = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`relative flex items-center gap-3 px-4 py-2.5 rounded-xl mx-2 cursor-pointer transition-all duration-150 group ${
                    active
                      ? "bg-[hsl(172_70%_42%/0.12)] text-[hsl(172_70%_55%)] font-medium"
                      : "text-muted-foreground hover:bg-sidebar-item-hover hover:text-foreground"
                  }`}
                >
                  {active && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-3/5 bg-[hsl(172_70%_42%)] rounded-r-full shadow-[0_0_8px_hsl(172_70%_42%)]" />}
                  <item.icon size={18} className={active ? "text-[hsl(172_70%_55%)]" : "text-muted-foreground group-hover:text-foreground"} />
                  <span className="font-body text-sm">
                    {item.name}
                  </span>
                  {item.path === "/moderator/requests" && pendingRequestCount > 0 && (
                    <span className="bg-warning/20 text-warning text-[10px] font-body rounded-full px-1.5 py-0.5 ml-auto animate-pulse">
                      {pendingRequestCount}
                    </span>
                  )}
                  {/* Remove conflict: Only show dynamic badges for requests now */}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="mt-auto px-4 pb-6">
        <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-sidebar-item-hover transition-colors cursor-pointer group">
          <div className="w-8 h-8 rounded-full bg-[hsl(172_70%_42%/0.2)] flex items-center justify-center text-xs font-display font-bold text-[hsl(172_70%_55%)]">
            {modInitials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-body font-medium text-foreground truncate group-hover:text-[hsl(172_70%_55%)] transition-colors">
              {user?.full_name || "Moderator"}
            </p>
            <div className="mod-role-badge mt-0.5 scale-90 origin-left">
               <ShieldCheck size={10} />
               <span>Moderator</span>
            </div>
          </div>
          <ChevronRight size={14} className="text-muted-foreground group-hover:text-[hsl(172_70%_55%)] transition-colors" />
        </div>
      </div>
    </>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar Desktop */}
      <aside className="hidden lg:flex w-64 flex-col bg-sidebar-bg border-r border-sidebar-border flex-shrink-0">
        <SidebarContent />
      </aside>

      {/* Sidebar Mobile Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-64 bg-sidebar-bg border-r border-sidebar-border flex flex-col animate-in slide-in-from-left duration-300">
            <div className="absolute top-4 right-4 lg:hidden">
              <button 
                aria-label="Close menu"
                onClick={() => setSidebarOpen(false)}
                className="w-8 h-8 rounded-xl bg-surface-2 flex items-center justify-center text-muted-foreground hover:text-foreground"
              >
                <X size={18} />
              </button>
            </div>
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <header className="h-16 border-b border-border/40 bg-background/80 backdrop-blur-md flex items-center px-4 md:px-6 flex-shrink-0 gap-4 relative z-50">
          <button
            aria-label="Toggle menu"
            className="lg:hidden text-muted-foreground hover:text-foreground"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={20} />
          </button>
          
          <div className="flex flex-col">
            <h1 className="font-display font-semibold text-lg text-foreground whitespace-nowrap">
              {pageTitle}
            </h1>
          </div>

          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-sm mx-4 relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground group-focus-within:text-[hsl(172_70%_55%)] transition-colors" />
            <input 
              type="text" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search library materials..."
              className="w-full bg-surface-1 border border-border/50 rounded-xl pl-9 pr-4 py-2 text-xs font-body text-foreground focus:outline-none focus:ring-1 focus:ring-[hsl(172_70%_42%/0.4)] focus:border-[hsl(172_70%_42%/0.3)] transition-all"
            />
          </form>

          <div className="flex items-center gap-2 md:gap-3 ml-auto relative">
             <button 
                aria-label="Toggle theme"
                onClick={() => setIsDark(!isDark)}
                className="w-9 h-9 rounded-xl bg-surface-1 border border-border/50 flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-[hsl(172_70%_42%/0.4)] transition-all"
             >
                {isDark ? <Moon size={16} /> : <Sun size={16} />}
             </button>
             
             <div className="relative">
               <button 
                  aria-label="Notifications"
                  onClick={() => setNotificationsOpen(!notificationsOpen)}
                  className={`w-9 h-9 rounded-xl border border-border/50 flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-[hsl(172_70%_42%/0.4)] transition-all ${notificationsOpen ? 'bg-surface-2 border-[hsl(172_70%_42%/0.4)] text-[hsl(172_70%_55%)]' : 'bg-surface-1'}`}
               >
                  <Bell size={16} />
                  {unreadCount > 0 && (
                    <div className="absolute top-1.5 right-1.5 w-2 h-2 bg-danger rounded-full border-2 border-background" />
                  )}
               </button>
               {notificationsOpen && <NotificationDropdown onClose={() => setNotificationsOpen(false)} />}
             </div>

             <div className="relative" ref={avatarRef}>
               <button 
                  aria-label="User profile"
                  onClick={() => setAvatarOpen(!avatarOpen)}
                  className="w-9 h-9 rounded-xl bg-[hsl(172_70%_42%/0.2)] flex items-center justify-center text-sm font-display font-bold text-[hsl(172_70%_55%)] border border-[hsl(172_70%_42%/0.2)] hover:bg-[hsl(172_70%_42%/0.3)] transition-all"
               >
                  {modInitials}
               </button>
               {avatarOpen && (
                 <div className="absolute top-full right-0 mt-2 w-56 glass-strong rounded-2xl border border-border/50 shadow-2xl overflow-hidden z-50 animate-in fade-in zoom-in duration-200">
                   <div className="px-4 py-3 border-b border-border/40">
                     <p className="text-sm font-body font-semibold text-foreground">{user?.full_name || "Moderator"}</p>
                     <p className="text-[11px] text-muted-foreground font-body mt-0.5">{user?.email}</p>
                     <span className="text-[10px] bg-[hsl(172_70%_42%/0.12)] text-[hsl(172_70%_55%)] rounded-full px-2 py-0.5 font-body mt-1 inline-block">Moderator</span>
                   </div>
                   <div className="p-1.5">
                     <button
                       onClick={() => { navigate("/moderator/settings"); setAvatarOpen(false); }}
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

        <main className="flex-1 overflow-y-auto custom-scrollbar bg-background px-4 pb-4 pt-2 md:px-6 md:pb-6 md:pt-3">
          {children}
        </main>
      </div>
    </div>
  );
};

export default ModeratorShell;
