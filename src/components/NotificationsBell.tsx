import { Bell, Check } from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNotifications } from "@/hooks/useNotifications";
import { cn } from "@/lib/utils";

function timeAgo(ts: number) {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

export default function NotificationsBell() {
  const { items, unread, markAllRead, clear } = useNotifications();

  return (
    <DropdownMenu onOpenChange={(o) => { if (!o) markAllRead(); }}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Notifications"
          className="relative inline-flex h-9 w-9 items-center justify-center rounded-full text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
        >
          <Bell className="h-4.5 w-4.5" />
          {unread > 0 && (
            <span className="absolute top-1.5 right-1.5 inline-flex h-2 w-2 rounded-full bg-primary ring-2 ring-white" />
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between px-3 py-2 border-b border-border">
          <div className="text-sm font-semibold">Notifications</div>
          <div className="flex items-center gap-3 text-xs">
            {items.length > 0 && (
              <>
                <button className="text-muted-foreground hover:text-foreground" onClick={markAllRead}>
                  Mark all read
                </button>
                <button className="text-muted-foreground hover:text-foreground" onClick={clear}>
                  Clear
                </button>
              </>
            )}
          </div>
        </div>
        <div className="max-h-80 overflow-y-auto">
          {items.length === 0 ? (
            <div className="px-3 py-8 text-center text-sm text-muted-foreground">
              You're all caught up.
            </div>
          ) : (
            items.map((n) => (
              <div
                key={n.id}
                className={cn(
                  "flex gap-3 px-3 py-2.5 border-b border-border last:border-b-0",
                  !n.read && "bg-primary/5"
                )}
              >
                <div className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Check className="h-3.5 w-3.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium truncate">{n.title}</div>
                  {n.description && (
                    <div className="text-xs text-muted-foreground truncate">{n.description}</div>
                  )}
                  <div className="text-[11px] text-muted-foreground mt-0.5">{timeAgo(n.createdAt)}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
