import { useEffect, useMemo, useRef, useState } from "react";
import { Helmet } from "react-helmet-async";
import { NavLink, useNavigate } from "react-router-dom";
import {
  Search, Users, Database, Download,
  ChevronLeft, ChevronRight, Pin, PinOff, Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import logoMedia from "@/assets/brand/logo-media-blue.png";
import { useJournalists, useCreators, PAGE_SIZE } from "@/hooks/useDirectory";
import { ListsSheet } from "@/components/dashboard/ListsSheet";
import { AddToListMenu } from "@/components/dashboard/AddToListMenu";
import { ChatSheet } from "@/components/dashboard/ChatSheet";
import { InboxSheet } from "@/components/dashboard/InboxSheet";
import { toCsv, downloadCsv } from "@/lib/csv";
import {
  useSavedSearches,
  useUpsertSavedSearch,
  useTogglePinSavedSearch,
  useDeleteSavedSearch,
} from "@/hooks/useSavedSearches";

type Tab = "journalists" | "creators";


const JOURNALIST_COLS = ["Name", "Email", "Category", "Titles", "Topics", "xHandle", "Outlet", "Country"];
const CREATOR_COLS = ["Name", "IG Handle", "IG Followers", "Engagement", "Category", "Type", "YouTube"];

const Cell = ({ children }: { children: React.ReactNode }) => (
  <div className="px-3 py-3 text-sm text-foreground truncate" title={typeof children === "string" ? children : undefined}>
    {children ?? <span className="text-muted-foreground">—</span>}
  </div>
);

const Dashboard = () => {
  const [tab, setTab] = useState<Tab>("journalists");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const initials = (user?.email ?? "?").slice(0, 2).toUpperCase();

  const filters = useMemo(() => ({ q: search.trim() || undefined }), [search]);

  const journalists = useJournalists(page, filters);
  const creators = useCreators(page, filters);
  const active = tab === "journalists" ? journalists : creators;

  // Auto-save searches with a small debounce after typing stops
  const upsertSearch = useUpsertSavedSearch();
  const debounceRef = useRef<number | null>(null);
  useEffect(() => {
    const q = search.trim();
    if (!q || !user) return;
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => {
      upsertSearch.mutate({ tab, query: { q } });
    }, 800);
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, tab, user?.id]);

  const handleSignOut = async () => { await signOut(); navigate("/"); };
  const handleSearch = (v: string) => { setSearch(v); setPage(0); };
  const handleTab = (t: Tab) => { setTab(t); setPage(0); };

  const handleExportView = () => {
    const rows = active.data?.rows ?? [];
    if (!rows.length) return;
    const headers = Object.keys(rows[0]);
    downloadCsv(`${tab}-page${page + 1}-${Date.now()}.csv`, toCsv(rows as Record<string, unknown>[] as never, headers));
  };

  const total = active.data?.count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Helmet><title>Dashboard — Media AI</title></Helmet>

      <header className="h-14 border-b border-border bg-white flex items-center justify-between px-4 flex-shrink-0">
        <div className="flex items-center gap-3">
          <NavLink to="/dashboard" className="flex items-center">
            <img src={logoMedia} alt="Media AI" className="h-6" />
          </NavLink>
        </div>

        <div className="flex items-center gap-2">
          <div className="text-sm text-muted-foreground mr-2 hidden md:block">
            {active.isLoading ? "Loading…" : `${total.toLocaleString()} results`}
          </div>
          <ChatSheet />
          <Button variant="outline" size="sm" className="gap-1.5"><Database className="h-3.5 w-3.5" />Database</Button>
          <InboxSheet />
          <ListsSheet />
          <Button variant="outline" size="sm" className="gap-1.5" onClick={handleExportView} disabled={!active.data?.rows.length}>
            <Download className="h-3.5 w-3.5" />Export
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button type="button" className="ml-2 rounded-full focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1" aria-label="Account menu">
                <Avatar className="h-8 w-8 border border-border">
                  <AvatarFallback className="bg-secondary text-foreground text-xs font-medium">{initials}</AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="font-normal">
                <div className="text-xs text-muted-foreground">Signed in as</div>
                <div className="text-sm truncate">{user?.email}</div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => navigate("/account")}>Account & billing</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => navigate("/pricing")}>Plans</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={handleSignOut}>Sign out</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <div className="flex flex-1 min-h-0">
        <aside className="w-64 border-r border-border bg-white flex flex-col flex-shrink-0">
          <div className="p-3 space-y-1">
            <button type="button" onClick={() => handleTab("journalists")}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${tab === "journalists" ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-secondary"}`}>
              <Users className="h-4 w-4" />Journalists
            </button>
            <button type="button" onClick={() => handleTab("creators")}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${tab === "creators" ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-secondary"}`}>
              <Users className="h-4 w-4" />Creators
            </button>
          </div>

          <SavedSearchesList
            onApply={(s) => { setTab(s.tab); setSearch(s.query.q ?? ""); setPage(0); }}
          />
        </aside>

        <main className="flex-1 min-w-0 overflow-auto flex flex-col">
          <div className="p-3 border-b border-border bg-white flex items-center gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder={tab === "journalists" ? "Search names, outlets, topics…" : "Search names, handles, bio…"}
                className="pl-9 h-9"
              />
            </div>
            <div className="flex items-center gap-2 ml-auto">
              <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage((p) => Math.max(0, p - 1))}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-xs text-muted-foreground tabular-nums">
                {page + 1} / {totalPages}
              </span>
              <Button variant="outline" size="sm" disabled={page + 1 >= totalPages} onClick={() => setPage((p) => p + 1)}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {tab === "journalists" ? (
            <div className="min-w-[1100px]">
              <div className="border-b border-border bg-secondary/40 sticky top-0">
                <div className="grid grid-cols-[minmax(180px,1.2fr)_minmax(220px,1.4fr)_140px_160px_160px_140px_160px_120px] text-xs font-medium text-muted-foreground">
                  {JOURNALIST_COLS.map((c) => <div key={c} className="px-3 py-3">{c}</div>)}
                </div>
              </div>
              {journalists.isLoading ? (
                <div className="p-8 text-center text-sm text-muted-foreground">Loading…</div>
              ) : journalists.error ? (
                <div className="p-8 text-center text-sm text-destructive">Failed to load journalists.</div>
              ) : (journalists.data?.rows.length ?? 0) === 0 ? (
                <div className="p-12 text-center text-sm text-muted-foreground">No journalists match your search.</div>
              ) : (
                journalists.data!.rows.map((r) => (
                  <div key={r.id} className="group grid grid-cols-[minmax(180px,1.2fr)_minmax(220px,1.4fr)_140px_160px_160px_140px_160px_120px] border-b border-border hover:bg-secondary/30">
                    <div className="px-3 py-3 text-sm flex items-center gap-2 min-w-0">
                      <span className="truncate">{r.name ?? <span className="text-muted-foreground">—</span>}</span>
                      <AddToListMenu journalistId={r.id} />
                    </div>
                    <Cell>{r.email}</Cell><Cell>{r.category}</Cell>
                    <Cell>{r.titles}</Cell><Cell>{r.topics}</Cell><Cell>{r.xhandle}</Cell>
                    <Cell>{r.outlet}</Cell><Cell>{r.country}</Cell>
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="min-w-[1100px]">
              <div className="border-b border-border bg-secondary/40 sticky top-0">
                <div className="grid grid-cols-[minmax(180px,1.2fr)_160px_140px_140px_160px_140px_minmax(180px,1fr)] text-xs font-medium text-muted-foreground">
                  {CREATOR_COLS.map((c) => <div key={c} className="px-3 py-3">{c}</div>)}
                </div>
              </div>
              {creators.isLoading ? (
                <div className="p-8 text-center text-sm text-muted-foreground">Loading…</div>
              ) : creators.error ? (
                <div className="p-8 text-center text-sm text-destructive">Failed to load creators.</div>
              ) : (creators.data?.rows.length ?? 0) === 0 ? (
                <div className="p-12 text-center text-sm text-muted-foreground">No creators match your search.</div>
              ) : (
                creators.data!.rows.map((r) => (
                  <div key={r.id} className="group grid grid-cols-[minmax(180px,1.2fr)_160px_140px_140px_160px_140px_minmax(180px,1fr)] border-b border-border hover:bg-secondary/30">
                    <div className="px-3 py-3 text-sm flex items-center gap-2 min-w-0">
                      <span className="truncate">{r.name ?? <span className="text-muted-foreground">—</span>}</span>
                      <AddToListMenu creatorId={r.id} />
                    </div>
                    <Cell>{r.ig_handle}</Cell>
                    <Cell>{r.ig_followers != null ? r.ig_followers.toLocaleString() : null}</Cell>
                    <Cell>{r.ig_engagement_rate != null ? `${(r.ig_engagement_rate * 100).toFixed(2)}%` : null}</Cell>
                    <Cell>{r.category}</Cell>
                    <Cell>{r.type}</Cell>
                    <Cell>
                      {r.youtube_url ? (
                        <a href={r.youtube_url} target="_blank" rel="noreferrer" className="text-primary hover:underline truncate block">
                          {r.youtube_subscribers != null ? `${r.youtube_subscribers.toLocaleString()} subs` : "YouTube"}
                        </a>
                      ) : null}
                    </Cell>
                  </div>
                ))
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

function SavedSearchesList({
  currentTab, currentQuery, onApply,
}: {
  currentTab: Tab;
  currentQuery: string;
  onApply: (s: { tab: Tab; query: { q?: string } }) => void;
}) {
  const { data: items = [], isLoading } = useSavedSearches();
  const create = useCreateSavedSearch();
  const remove = useDeleteSavedSearch();

  const handleSave = () => {
    const q = currentQuery.trim();
    if (!q) return toast.error("Type a search first");
    const name = window.prompt("Name this search", q.slice(0, 40));
    if (!name) return;
    create.mutate(
      { name: name.trim(), tab: currentTab, query: { q } },
      { onSuccess: () => toast.success("Saved"), onError: (e) => toast.error((e as Error).message) },
    );
  };

  return (
    <div className="px-3 pt-2 pb-3 border-t border-border flex-1 min-h-0 flex flex-col">
      <div className="flex items-center justify-between px-3 py-2">
        <div className="text-xs font-medium text-muted-foreground">Saved searches</div>
        <button type="button" onClick={handleSave} title="Save current search"
          className="text-muted-foreground hover:text-foreground">
          <BookmarkPlus className="h-4 w-4" />
        </button>
      </div>
      <div className="space-y-0.5 overflow-auto">
        {isLoading ? (
          <div className="px-3 py-2 text-xs text-muted-foreground">Loading…</div>
        ) : items.length === 0 ? (
          <div className="px-3 py-2 text-xs text-muted-foreground">
            No saved searches yet. Type a query and tap the bookmark to save it.
          </div>
        ) : (
          items.map((s) => (
            <div key={s.id} className="group flex items-center rounded-lg hover:bg-secondary">
              <button type="button" onClick={() => onApply({ tab: s.tab as Tab, query: s.query })}
                className="flex-1 flex items-center gap-2 px-3 py-2 text-sm text-foreground min-w-0 text-left">
                <Bookmark className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <span className="truncate">{s.name}</span>
                <span className="ml-auto text-[10px] uppercase tracking-wide text-muted-foreground flex-shrink-0">
                  {s.tab === "journalists" ? "J" : "C"}
                </span>
              </button>
              <button type="button" onClick={() => remove.mutate(s.id)}
                className="opacity-0 group-hover:opacity-100 px-2 text-muted-foreground hover:text-destructive">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default Dashboard;
