import { useEffect, useRef, useState } from "react";
import { Helmet } from "react-helmet-async";
import { NavLink, useNavigate } from "react-router-dom";
import { ArrowUp, Database, Download, Loader2, MessageSquare, Pin, PinOff, Plus, Sparkles, Trash2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { InboxSheet } from "@/components/dashboard/InboxSheet";
import { ListsSheet } from "@/components/dashboard/ListsSheet";
import { AddToListMenu } from "@/components/dashboard/AddToListMenu";
import {
  useSavedSearches, useUpsertSavedSearch,
  useTogglePinSavedSearch, useDeleteSavedSearch,
} from "@/hooks/useSavedSearches";
import { toCsv, downloadCsv } from "@/lib/csv";
import logoMedia from "@/assets/brand/logo-media-blue.png";

type Msg = { role: "user" | "assistant"; content: string };
type Results =
  | { kind: "journalists"; rows: Array<Record<string, unknown>> }
  | { kind: "creators"; rows: Array<Record<string, unknown>> }
  | null;

const JOURNALIST_COLS = [
  { key: "name", label: "Name" },
  { key: "outlet", label: "Outlet" },
  { key: "category", label: "Category" },
  { key: "topics", label: "Topics" },
  { key: "email", label: "Email" },
  { key: "country", label: "Country" },
];
const CREATOR_COLS = [
  { key: "name", label: "Name" },
  { key: "ig_handle", label: "IG Handle" },
  { key: "ig_followers", label: "Followers" },
  { key: "category", label: "Category" },
  { key: "type", label: "Type" },
];

const Chat = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const initials = (user?.email ?? "?").slice(0, 2).toUpperCase();

  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Results>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const savedSearches = useSavedSearches(!!user);
  const upsertSearch = useUpsertSavedSearch();
  const togglePin = useTogglePinSavedSearch();
  const deleteSearch = useDeleteSavedSearch();

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages, loading]);

  const sendText = async (text: string, reset = false) => {
    if (!text.trim() || loading) return;
    const base = reset ? [] : messages;
    const next: Msg[] = [...base, { role: "user", content: text }];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("chat", {
        body: { messages: next },
      });
      if (error) throw error;
      setMessages((m) => [
        ...m,
        { role: "assistant", content: data?.content || "(no response)" },
      ]);
      if (data?.results) {
        setResults(data.results);
        upsertSearch.mutate({ tab: data.results.kind, query: { q: text } });
      }
    } catch (e) {
      setMessages((m) => [
        ...m,
        { role: "assistant", content: `Error: ${(e as Error).message}` },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const send = () => sendText(input.trim());

  const handleSignOut = async () => { await signOut(); navigate("/"); };
  const newChat = () => { setMessages([]); setResults(null); setInput(""); };

  const cols = results?.kind === "creators" ? CREATOR_COLS : JOURNALIST_COLS;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Helmet><title>Chat — Media AI</title></Helmet>

      <header className="h-14 border-b border-border bg-white flex items-center justify-between px-4 flex-shrink-0">
        <div className="flex items-center gap-3">
          <NavLink to="/dashboard" className="flex items-center">
            <img src={logoMedia} alt="Media AI" className="h-5" />
          </NavLink>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1.5 bg-secondary">
            <MessageSquare className="h-3.5 w-3.5" />Chat
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => navigate("/dashboard")}>
            <Database className="h-3.5 w-3.5" />Database
          </Button>
          <InboxSheet />
          <ListsSheet />
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            disabled={!results?.rows.length}
            onClick={() => {
              const rows = (results?.rows ?? []) as Record<string, unknown>[];
              if (!rows.length) return;
              const headers = Object.keys(rows[0]);
              downloadCsv(`${results!.kind}-${Date.now()}.csv`, toCsv(rows as never, headers));
            }}
          >
            <Download className="h-3.5 w-3.5" />Export
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={newChat}>
            <Plus className="h-3.5 w-3.5" />New chat
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
        {/* Left: saved searches */}
        <aside className="w-60 border-r border-border bg-white flex flex-col flex-shrink-0">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Saved searches</span>
          </div>
          <div className="flex-1 overflow-auto px-2 py-2">
            {savedSearches.isLoading ? (
              <div className="px-2 py-3 text-xs text-muted-foreground">Loading…</div>
            ) : (savedSearches.data?.length ?? 0) === 0 ? (
              <div className="px-2 py-3 text-xs text-muted-foreground">
                Your searches will appear here.
              </div>
            ) : (
              <ul className="space-y-0.5">
                {savedSearches.data!.map((s) => (
                  <li key={s.id} className="group flex items-center gap-1 rounded-md hover:bg-secondary/60">
                    <button
                      type="button"
                      onClick={() => sendText(s.query.q ?? s.name, true)}
                      className="flex-1 text-left px-2 py-1.5 text-sm truncate"
                      title={s.query.q ?? s.name}
                    >
                      {s.pinned && <Pin className="inline h-3 w-3 mr-1 text-primary" />}
                      {s.name}
                    </button>
                    <button
                      type="button"
                      onClick={() => togglePin.mutate({ id: s.id, pinned: !s.pinned })}
                      className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-foreground"
                      aria-label={s.pinned ? "Unpin" : "Pin"}
                    >
                      {s.pinned ? <PinOff className="h-3 w-3" /> : <Pin className="h-3 w-3" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteSearch.mutate(s.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 mr-1 text-muted-foreground hover:text-destructive"
                      aria-label="Delete"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>

        {/* Center: chat */}
        <section className={`flex flex-col ${results ? "w-[440px] border-r border-border" : "flex-1 items-center"}`}>
          <div ref={scrollRef} className={`flex-1 overflow-auto w-full ${results ? "px-4 py-6" : "max-w-2xl px-6 py-12"}`}>
            {messages.length === 0 ? (
              <div className="text-center mt-24">
                <div className="inline-flex items-center justify-center h-12 w-12 rounded-2xl bg-primary/10 text-primary mb-4">
                  <Sparkles className="h-6 w-6" />
                </div>
                <h1 className="text-2xl font-medium mb-2">What are you looking for?</h1>
                <p className="text-sm text-muted-foreground">
                  Ask things like "find tech journalists in the UK" or "beauty creators with 100k+ followers".
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((m, i) => (
                  <div key={i} className={`text-sm rounded-xl px-4 py-3 ${m.role === "user" ? "bg-primary text-primary-foreground ml-12" : "bg-secondary mr-12"}`}>
                    {m.role === "assistant" ? (
                      <div className="prose prose-sm max-w-none prose-p:my-1 prose-headings:my-2">
                        <ReactMarkdown>{m.content}</ReactMarkdown>
                      </div>
                    ) : (
                      m.content
                    )}
                  </div>
                ))}
                {loading && (
                  <div className="text-sm text-muted-foreground flex items-center gap-2">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />Thinking…
                  </div>
                )}
              </div>
            )}
          </div>

          <div className={`w-full ${results ? "" : "max-w-2xl"} px-4 pb-6`}>
            <div className="relative rounded-2xl border border-border bg-white shadow-sm focus-within:border-primary/60">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send();
                  }
                }}
                placeholder="Ask Media AI to find journalists or creators…"
                disabled={loading}
                rows={2}
                className="resize-none border-0 focus-visible:ring-0 shadow-none px-4 py-3 pr-14 min-h-[64px]"
              />
              <Button
                onClick={send}
                disabled={loading || !input.trim()}
                size="icon"
                className="absolute right-2 bottom-2 h-9 w-9 rounded-full"
              >
                <ArrowUp className="h-4 w-4" />
              </Button>
            </div>
            <p className="mt-2 text-xs text-muted-foreground text-center">Enter to send · Shift+Enter for newline</p>
          </div>
        </section>

        {/* Right: results */}
        {results && (
          <section className="flex-1 min-w-0 overflow-auto bg-white">
            <div className="px-5 py-4 border-b border-border flex items-center justify-between sticky top-0 bg-white z-10">
              <div>
                <div className="text-sm font-medium capitalize">{results.kind}</div>
                <div className="text-xs text-muted-foreground">{results.rows.length} results</div>
              </div>
            </div>
            {results.rows.length === 0 ? (
              <div className="p-12 text-center text-sm text-muted-foreground">No matches.</div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-secondary/40 text-xs text-muted-foreground">
                  <tr>
                    <th className="w-8" />
                    {cols.map((c) => (
                      <th key={c.key} className="text-left font-medium px-4 py-2.5">{c.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {results.rows.map((r, i) => {
                    const id = Number(r.id);
                    return (
                      <tr key={(r.id as string) ?? i} className="group border-b border-border hover:bg-secondary/30">
                        <td className="px-2 py-2.5 align-top">
                          {Number.isFinite(id) && (
                            <AddToListMenu
                              journalistId={results.kind === "journalists" ? id : undefined}
                              creatorId={results.kind === "creators" ? id : undefined}
                            />
                          )}
                        </td>
                        {cols.map((c) => {
                          const v = r[c.key];
                          return (
                            <td key={c.key} className="px-4 py-2.5 align-top">
                              {v == null || v === "" ? (
                                <span className="text-muted-foreground">—</span>
                              ) : typeof v === "number" ? (
                                v.toLocaleString()
                              ) : (
                                String(v)
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </section>
        )}
      </div>
    </div>
  );
};

export default Chat;
