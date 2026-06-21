import { useEffect, useMemo, useState } from "react";
import { Bell, CheckCheck, Info, Sparkles, CreditCard, X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/hooks/useSubscription";
import { useChatUsage } from "@/hooks/useChatUsage";
import { Link } from "react-router-dom";

type Notif = {
  id: string;
  icon: "info" | "sparkles" | "credit";
  title: string;
  body: string;
  ts: number; // ms
  href?: string;
};

const STORAGE_KEY = "mediaai.notifications.dismissed.v1";

function loadDismissed(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw) as string[]);
  } catch {
    return new Set();
  }
}

function saveDismissed(s: Set<string>) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(s))); } catch {/* ignore */}
}

function timeAgo(ts: number): string {
  const diff = Math.max(0, Date.now() - ts);
  const m = Math.floor(diff / 60000);
  if (m < 1) return "Just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

function IconBubble({ kind }: { kind: Notif["icon"] }) {
  const map = {
    info: { Icon: Info, bg: "bg-blue-50", color: "text-blue-600" },
    sparkles: { Icon: Sparkles, bg: "bg-violet-50", color: "text-violet-600" },
    credit: { Icon: CreditCard, bg: "bg-emerald-50", color: "text-emerald-600" },
  } as const;
  const { Icon, bg, color } = map[kind];
  return (
    <div className={`h-9 w-9 rounded-full flex items-center justify-center ${bg} ${color} shrink-0`}>
      <Icon className="h-4 w-4" />
    </div>
  );
}

export function NotificationsBell() {
  const { user } = useAuth();
  const sub = useSubscription();
  const usage = useChatUsage();
  const [open, setOpen] = useState(false);
  const [dismissed, setDismissed] = useState<Set<string>>(() => loadDismissed());

  useEffect(() => { saveDismissed(dismissed); }, [dismissed]);

  const notifications = useMemo<Notif[]>(() => {
    const list: Notif[] = [];
    const createdAt = user?.created_at ? new Date(user.created_at).getTime() : Date.now() - 1000 * 60 * 60;

    list.push({
      id: "welcome",
      icon: "info",
      title: "Welcome to Media AI",
      body: "Your workspace is ready. Start a chat to find journalists, creators and outlets.",
      ts: createdAt,
      href: "/chat",
    });

    const plan = sub?.planIdentifier || (sub?.active ? "Pro" : "Free");
    list.push({
      id: `plan-${plan}`,
      icon: "sparkles",
      title: `You're on the ${plan} plan`,
      body: "Manage your subscription, invoices and add-ons in Account & billing.",
      ts: createdAt + 1000,
      href: "/account",
    });

    const remaining = usage?.usage?.remaining;
    if (typeof remaining === "number") {
      if (remaining <= 0) {
        list.push({
          id: "tokens-empty",
          icon: "credit",
          title: "Monthly tokens used up",
          body: "Top up credits or upgrade to keep chatting this month.",
          ts: Date.now() - 1000 * 60 * 5,
          href: "/pricing",
        });
      } else if (remaining < 5000) {
        list.push({
          id: `tokens-low-${Math.floor(remaining / 1000)}`,
          icon: "credit",
          title: "Running low on tokens",
          body: `About ${remaining.toLocaleString()} tokens left this month.`,
          ts: Date.now() - 1000 * 60 * 30,
          href: "/pricing",
        });
      }
    }

    return list.filter((n) => !dismissed.has(n.id));
  }, [user, sub?.planIdentifier, sub?.active, usage?.usage?.remaining, dismissed]);

  const unreadCount = notifications.length;

  function dismiss(id: string) {
    setDismissed((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  }

  function markAllRead() {
    setDismissed((prev) => {
      const next = new Set(prev);
      notifications.forEach((n) => next.add(n.id));
      return next;
    });
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="Notifications"
          className="relative inline-flex items-center justify-center h-9 w-9 rounded-md text-gray-700 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <Bell className="h-[18px] w-[18px]" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" sideOffset={8} className="w-[360px] p-0 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div>
            <div className="text-sm font-semibold text-gray-900">Notifications</div>
            <div className="text-xs text-muted-foreground">
              {unreadCount === 0 ? "All caught up" : `${unreadCount} new`}
            </div>
          </div>
          <button
            type="button"
            onClick={markAllRead}
            disabled={unreadCount === 0}
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-gray-900 disabled:opacity-50"
          >
            <CheckCheck className="h-3.5 w-3.5" />
            Mark all read
          </button>
        </div>

        <div className="max-h-[420px] overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="px-4 py-10 text-center text-sm text-muted-foreground">
              You're all caught up.
            </div>
          ) : (
            notifications.map((n) => {
              const Body = (
                <div className="flex gap-3 px-4 py-3 hover:bg-gray-50 transition-colors">
                  <IconBubble kind={n.icon} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="text-sm font-medium text-gray-900 truncate">{n.title}</div>
                      <button
                        type="button"
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); dismiss(n.id); }}
                        aria-label="Dismiss"
                        className="text-muted-foreground hover:text-gray-900"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <div className="text-xs text-gray-600 mt-0.5 line-clamp-2">{n.body}</div>
                    <div className="text-[11px] text-muted-foreground mt-1">{timeAgo(n.ts)}</div>
                  </div>
                </div>
              );
              return n.href ? (
                <Link key={n.id} to={n.href} onClick={() => setOpen(false)} className="block border-b border-border last:border-b-0">
                  {Body}
                </Link>
              ) : (
                <div key={n.id} className="border-b border-border last:border-b-0">{Body}</div>
              );
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export default NotificationsBell;
