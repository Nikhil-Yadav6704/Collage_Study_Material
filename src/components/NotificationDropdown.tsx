import { Inbox, CheckCircle, Star, Flag, Settings, UserPlus, BookOpen, Bell } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNotifications, useMarkNotificationsRead } from "../hooks/useNotifications";

const typeConfigs: Record<string, any> = {
  new_student_request: { icon: Inbox, bg: "bg-warning/10", text: "text-warning" },
  upload_request_decision: { icon: CheckCircle, bg: "bg-success/10", text: "text-success" },
  material_rated: { icon: Star, bg: "bg-primary/10", text: "text-primary" },
  comment_reported_confirmation: { icon: Flag, bg: "bg-[hsl(172_70%_42%/0.1)]", text: "text-[hsl(172_70%_55%)]" },
  admin_action_in_dept: { icon: Settings, bg: "bg-danger/10", text: "text-danger" },
  moderator_added: { icon: UserPlus, bg: "bg-accent/10", text: "text-accent" },
  moderator_request_decision: { icon: UserPlus, bg: "bg-accent/10", text: "text-accent" },
  guideline_reminder: { icon: BookOpen, bg: "bg-warning/10", text: "text-warning" },
  system_alert: { icon: Bell, bg: "bg-surface-2", text: "text-muted-foreground" },
  request_approved_by_admin: { icon: CheckCircle, bg: "bg-success/10", text: "text-success" },
};

const defaultConfig = { icon: Bell, bg: "bg-surface-2", text: "text-muted-foreground" };

const NotificationDropdown = ({ onClose }: { onClose: () => void }) => {
  const { data, isLoading } = useNotifications();
  const { mutate: markRead } = useMarkNotificationsRead();

  const notifications = data?.notifications || [];
  const unread_count = data?.unread_count || 0;

  return (
    <div className="absolute top-full right-0 mt-2 w-[380px] glass-strong rounded-2xl border border-border/50 shadow-2xl overflow-hidden z-50 animate-in fade-in zoom-in duration-200">
      <div className="px-4 py-3 flex items-center justify-between border-b border-border/40">
        <h3 className="font-display font-semibold text-sm text-foreground">Notifications</h3>
        <div className="flex items-center gap-2">
          {unread_count > 0 && (
            <span className="bg-danger text-white text-[10px] rounded-full w-5 h-5 flex items-center justify-center font-bold">
              {unread_count}
            </span>
          )}
          <button
            onClick={() => markRead(undefined)}
            className="text-[11px] text-primary hover:underline font-body"
          >
            Mark all read
          </button>
        </div>
      </div>

      <div className="max-h-[420px] overflow-y-auto custom-scrollbar divide-y divide-border/25">
        {isLoading ? (
          <div className="p-6 text-center">
            <div className="w-6 h-6 rounded-full border-2 border-border border-t-primary animate-spin mx-auto" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-8 text-center">
            <Bell size={24} className="text-border mx-auto mb-2" />
            <p className="text-xs text-muted-foreground font-body">No notifications yet</p>
          </div>
        ) : notifications.map((notif: any) => {
          const config = typeConfigs[notif.type] || defaultConfig;
          return (
            <div
              key={notif.id}
              className="flex items-start gap-3 px-4 py-3.5 hover:bg-white/5 transition-colors cursor-pointer group"
              onClick={() => {
                if (!notif.is_read) markRead(notif.id);
                onClose();
              }}
            >
              {!notif.is_read && (
                <div className="w-1.5 h-1.5 rounded-full bg-[hsl(var(--mod-accent))] mt-2 flex-shrink-0" />
              )}
              {notif.is_read && <div className="w-1.5 flex-shrink-0" />}
              <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0", config.bg, config.text)}>
                <config.icon size={14} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-body text-xs text-foreground leading-snug">{notif.body}</p>
                <p className="text-[10px] text-muted-foreground mt-1 font-body">
                  {new Date(notif.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="px-4 py-3 border-t border-border/40 flex items-center justify-between">
        <button className="text-[11px] text-muted-foreground hover:text-foreground font-body transition-colors">
          View Older
        </button>
        <button className="text-[11px] text-primary hover:underline font-body transition-colors">
          Settings
        </button>
      </div>
    </div>
  );
};

export default NotificationDropdown;
