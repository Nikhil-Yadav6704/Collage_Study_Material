import { MessageSquare, Clock } from "lucide-react";

const ChatPlaceholder = () => {
  return (
    <div className="flex items-center justify-center h-full min-h-[60vh]">
      <div className="text-center">
        <div className="w-24 h-24 rounded-3xl bg-surface-1 border-2 border-dashed border-border flex items-center justify-center mx-auto mb-6">
          <MessageSquare size={36} className="text-muted-foreground/40" />
        </div>
        <h2 className="font-display font-bold text-2xl text-foreground">
          Chat is Coming Soon
        </h2>
        <p className="font-body text-sm text-muted-foreground mt-3 max-w-xs mx-auto leading-relaxed">
          We're building a real-time chat feature for students and moderators.
          Check back soon! 🚀
        </p>
        <div className="glass rounded-full px-4 py-2 inline-flex items-center gap-2 mt-6">
          <Clock size={14} className="text-accent" />
          <span className="text-xs text-muted-foreground">In Development</span>
        </div>
      </div>
    </div>
  );
};

export default ChatPlaceholder;
