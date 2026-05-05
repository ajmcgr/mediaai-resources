import { useEffect, useRef, useState } from "react";
import { Helmet } from "react-helmet-async";
import { NavLink, useNavigate } from "react-router-dom";
import { ArrowUp, Bell, Database, Download, Loader2, MessageSquare, Pin, PinOff, Plus, Sparkles, Trash2, Zap } from "lucide-react";
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
import { useChatUsage } from "@/hooks/useChatUsage";
import { useSubscription } from "@/hooks/useSubscription";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { isGrowthPlanIdentifier } from "@/lib/plans";

type Msg = { role: "user" | "assistant"; content: string };

type Row = {
  source: "database" | "exa";
  source_id?: number | string;
  source_url?: string;
  source_table?: "journalist" | "creators";
  name: string | null;
  outlet: string | null;
  title: string | null;
  category: string | null;
  country: string | null;
  email: string | null;
  ig_handle?: string | null;
  ig_followers?: number | null;
  youtube_url?: string | null;
  reason?: string;
};
type Results =
  | { kind: "journalists" | "creators"; rows: Row[]; query?: string; intent?: { count?: number } | null; debug?: Record<string, unknown> | null }
  | null;

const JOURNALIST_COLS: { key: keyof Row; label: string }[] = [
  { key: "name", label: "Name" },
  { key: "outlet", label: "Outlet" },
  { key: "category", label: "Topic" },
  { key: "country", label: "Country" },
  { key: "email", label: "Email" },
];
const CREATOR_COLS: { key: keyof Row; label: string }[] = [
  { key: "name", label: "Name" },
  { key: "ig_handle", label: "Handle" },
  { key: "ig_followers", label: "Followers" },
  { key: "category", label: "Topic" },
  { key: "email", label: "Email" },
];

const MIN_CHAT_RESULTS = 25;
const AUTO_PERSIST_WEB_ROWS = 12;
const CHAT_STOPWORDS = new Set([
  "a", "an", "and", "are", "at", "based", "best", "by", "find", "for", "from",
  "get", "give", "help", "i", "i'm", "im", "in", "is", "journalist", "journalists",
  "list", "looking", "me", "need", "of", "on", "or", "please", "reporter", "reporters",
  "search", "show", "that", "the", "to", "want", "who", "with",
]);

const COUNTRY_FALLBACK_ALIASES: Array<{ canonical: string; terms: string[] }> = [
  { canonical: "united kingdom", terms: ["united kingdom", "uk", "britain", "british", "england", "london"] },
  { canonical: "united states", terms: ["united states", "usa", "us", "america", "american"] },
  { canonical: "singapore", terms: ["singapore", "sg"] },
  { canonical: "united arab emirates", terms: ["united arab emirates", "uae", "dubai", "abu dhabi"] },
  { canonical: "canada", terms: ["canada", "canadian"] },
  { canonical: "australia", terms: ["australia", "australian"] },
  { canonical: "india", terms: ["india", "indian"] },
];

const TOPIC_FALLBACK_ALIASES: Array<{ trigger: string; terms: string[] }> = [
  { trigger: "tech", terms: ["tech", "technology", "software", "saas", "startup", "innovation"] },
  { trigger: "ai", terms: ["ai", "artificial intelligence", "machine learning", "technology", "tech"] },
  { trigger: "fintech", terms: ["fintech", "finance", "financial", "banking", "payments"] },
  { trigger: "health", terms: ["health", "healthcare", "medical", "wellness", "fitness"] },
  { trigger: "real estate", terms: ["real estate", "property", "realty", "housing"] },
  { trigger: "beauty", terms: ["beauty", "makeup", "skincare"] },
  { trigger: "gaming", terms: ["gaming", "games", "esports"] },
  { trigger: "travel", terms: ["travel", "tourism", "destination"] },
];

function normalizeQuery(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function safeSearchFragment(text: string) {
  return text
    .toLowerCase()
    .replace(/[,%()]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function buildFallbackTerms(text: string) {
  const normalized = normalizeQuery(text)
    .replace(/\bi am looking for\b/g, " ")
    .replace(/\bi m looking for\b/g, " ")
    .replace(/\blooking for\b/g, " ")
    .replace(/\bcan you find\b/g, " ")
    .replace(/\bfind me\b/g, " ")
    .replace(/\bfind\b/g, " ")
    .replace(/\bshow me\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const rawTokens = normalized
    .split(" ")
    .map((token) => token.trim())
    .filter(Boolean);

  const tokens = rawTokens.filter((token) => token.length > 1 && !CHAT_STOPWORDS.has(token));
  const collected = new Set<string>();
  const push = (value: string) => {
    const cleaned = safeSearchFragment(value);
    if (!cleaned) return;
    collected.add(cleaned);
  };

  push(normalized);
  push(normalized.replace(/\bjournalists?\b/g, " ").replace(/\breporters?\b/g, " ").trim());
  push(tokens.join(" "));

  for (const token of tokens) push(token);
  for (let i = 0; i < tokens.length - 1; i += 1) push(`${tokens[i]} ${tokens[i + 1]}`);
  for (let i = 0; i < tokens.length - 2; i += 1) push(`${tokens[i]} ${tokens[i + 1]} ${tokens[i + 2]}`);

  const normalizedBlob = ` ${normalized} `;
  for (const { canonical, terms } of COUNTRY_FALLBACK_ALIASES) {
    if (normalizedBlob.includes(` ${canonical} `) || terms.some((term) => normalizedBlob.includes(` ${term} `))) {
      for (const term of terms) push(term);
    }
  }

  for (const { trigger, terms } of TOPIC_FALLBACK_ALIASES) {
    if (normalizedBlob.includes(` ${trigger} `)) {
      for (const term of terms) push(term);
    }
  }

  return [...collected].slice(0, 16);
}

function dedupeRows(rows: Row[]) {
  const seen = new Set<string>();
  const out: Row[] = [];
  for (const row of rows) {
    const key = row.source === "database"
      ? `db:${row.source_table ?? "unknown"}:${String(row.source_id ?? row.email ?? `${row.name}|${row.outlet}`)}`
      : `exa:${String(row.source_url ?? row.email ?? `${row.name}|${row.outlet}`)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(row);
  }
  return out;
}

function buildOrExpression(fields: string[], terms: string[]) {
  return terms
    .flatMap((term) => {
      const fragment = safeSearchFragment(term);
      if (!fragment) return [] as string[];
      return fields.map((field) => `${field}.ilike.%${fragment}%`);
    })
    .join(",");
}

function rowPersistenceKey(row: Row) {
  return String(row.source_url ?? row.email ?? `${row.name}|${row.outlet}|${row.title}`);
}

function shouldAutoPersistRow(kind: "journalists" | "creators", row: Row) {
  if (row.source !== "exa" || !row.name) return false;
  if (kind === "journalists") return !!(row.email || row.outlet || row.title);
  return !!(row.email || row.ig_handle || row.youtube_url || row.outlet);
}

async function fetchJournalistFallback(query: string): Promise<Row[]> {
  const terms = buildFallbackTerms(query);
  if (!terms.length) return [];

  const collected: Row[] = [];
  const expression = buildOrExpression(
    ["name", "email", "outlet", "titles", "topics", "xhandle", "country", "category"],
    terms,
  );

  if (expression) {
    const { data, error } = await supabase
      .from("journalist")
      .select("id,name,email,category,titles,topics,xhandle,outlet,country")
      .or(expression)
      .limit(75);

    if (!error) {
      for (const row of data ?? []) {
        collected.push({
          source: "database",
          source_id: row.id,
          source_table: "journalist",
          name: row.name,
          outlet: row.outlet,
          title: row.titles,
          category: row.category ?? row.topics,
          country: row.country,
          email: row.email,
        });
      }
    }
  }

  if (collected.length < 12) {
    const simpleTokens = terms.filter((term) => !term.includes(" ")).slice(0, 6);
    for (const term of simpleTokens) {
      const pattern = `%${safeSearchFragment(term)}%`;
      const { data, error } = await supabase
        .from("journalist")
        .select("id,name,email,category,titles,topics,xhandle,outlet,country")
        .or(`name.ilike.${pattern},email.ilike.${pattern},outlet.ilike.${pattern},titles.ilike.${pattern},topics.ilike.${pattern},xhandle.ilike.${pattern},country.ilike.${pattern},category.ilike.${pattern}`)
        .limit(25);

      if (error) continue;
      for (const row of data ?? []) {
        collected.push({
          source: "database",
          source_id: row.id,
          source_table: "journalist",
          name: row.name,
          outlet: row.outlet,
          title: row.titles,
          category: row.category ?? row.topics,
          country: row.country,
          email: row.email,
        });
      }
      if (collected.length >= 75) break;
    }
  }

  return dedupeRows(collected).slice(0, 75);
}

async function fetchCreatorFallback(query: string): Promise<Row[]> {
  const terms = buildFallbackTerms(query);
  if (!terms.length) return [];

  const collected: Row[] = [];
  const expression = buildOrExpression(
    ["name", "email", "category", "bio", "ig_handle", "youtube_url", "type"],
    terms,
  );

  if (expression) {
    const { data, error } = await supabase
      .from("creators")
      .select("id,name,category,email,bio,ig_handle,ig_followers,youtube_url,type")
      .or(expression)
      .limit(75);

    if (!error) {
      for (const row of data ?? []) {
        collected.push({
          source: "database",
          source_id: row.id,
          source_table: "creators",
          name: row.name,
          outlet: row.type,
          title: row.bio,
          category: row.category,
          country: null,
          email: row.email,
          ig_handle: row.ig_handle,
          ig_followers: row.ig_followers,
          youtube_url: row.youtube_url,
        });
      }
    }
  }

  if (collected.length < 12) {
    const simpleTokens = terms.filter((term) => !term.includes(" ")).slice(0, 6);
    for (const term of simpleTokens) {
      const pattern = `%${safeSearchFragment(term)}%`;
      const { data, error } = await supabase
        .from("creators")
        .select("id,name,category,email,bio,ig_handle,ig_followers,youtube_url,type")
        .or(`name.ilike.${pattern},email.ilike.${pattern},category.ilike.${pattern},bio.ilike.${pattern},ig_handle.ilike.${pattern},youtube_url.ilike.${pattern},type.ilike.${pattern}`)
        .limit(25);

      if (error) continue;
      for (const row of data ?? []) {
        collected.push({
          source: "database",
          source_id: row.id,
          source_table: "creators",
          name: row.name,
          outlet: row.type,
          title: row.bio,
          category: row.category,
          country: null,
          email: row.email,
          ig_handle: row.ig_handle,
          ig_followers: row.ig_followers,
          youtube_url: row.youtube_url,
        });
      }
      if (collected.length >= 75) break;
    }
  }

  return dedupeRows(collected).slice(0, 75);
}

async function expandChatResults(base: Exclude<Results, null>, query: string): Promise<Exclude<Results, null>> {
  const dbRows = base.rows.filter((row) => row.source === "database").length;
  if (base.rows.length >= MIN_CHAT_RESULTS && dbRows >= 8) return base;

  const supplemental = base.kind === "journalists"
    ? await fetchJournalistFallback(query)
    : await fetchCreatorFallback(query);

  if (!supplemental.length) return base;

  const merged = dedupeRows([
    ...base.rows.filter((row) => row.source === "database"),
    ...supplemental,
    ...base.rows.filter((row) => row.source === "exa"),
  ]);

  return {
    ...base,
    rows: merged,
    debug: {
      ...(base.debug ?? {}),
      ui_fallback_query: query,
      ui_fallback_terms: buildFallbackTerms(query),
      ui_fallback_added: Math.max(0, merged.length - base.rows.length),
    },
  };
}

const Chat = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const initials = (user?.email ?? "?").slice(0, 2).toUpperCase();

  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Results>(null);
  const [savingIdx, setSavingIdx] = useState<Record<number, "saving" | "saved">>({});
  const [enrichingIdx, setEnrichingIdx] = useState<Record<number, boolean>>({});
  const scrollRef = useRef<HTMLDivElement>(null);
  const autoPersistedWebRows = useRef<Set<string>>(new Set());

  const savedSearches = useSavedSearches(!!user);
  const upsertSearch = useUpsertSavedSearch();
  const togglePin = useTogglePinSavedSearch();
  const deleteSearch = useDeleteSavedSearch();

  const { usage, applyServerUsage, refresh: refreshUsage } = useChatUsage();
  const { planIdentifier } = useSubscription();
  const hasGrowth = isGrowthPlanIdentifier(planIdentifier);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages, loading]);

  useEffect(() => {
    if (!results) return;

    const persistable = results.rows
      .map((row, index) => ({ row, index }))
      .filter(({ row }) => shouldAutoPersistRow(results.kind, row))
      .filter(({ row }) => !autoPersistedWebRows.current.has(rowPersistenceKey(row)))
      .slice(0, AUTO_PERSIST_WEB_ROWS);

    if (!persistable.length) return;

    let cancelled = false;
    (async () => {
      for (const { row } of persistable) {
        if (cancelled) break;
        const key = rowPersistenceKey(row);
        autoPersistedWebRows.current.add(key);
        try {
          const { data, error } = await supabase.functions.invoke("save-contact", {
            body: {
              kind: results.kind,
              row: {
                name: row.name,
                outlet: row.outlet,
                title: row.title,
                category: row.category,
                country: row.country,
                email: row.email,
                ig_handle: row.ig_handle,
                youtube_url: row.youtube_url,
                source_url: row.source_url,
              },
            },
          });
          if (cancelled || error || !data?.ok) continue;
          setResults((prev) => {
            if (!prev || prev.kind !== results.kind) return prev;
            const sourceTable: Row["source_table"] = prev.kind === "journalists" ? "journalist" : "creators";
            const rows = prev.rows.map((candidate) => {
              if (rowPersistenceKey(candidate) !== key) return candidate;
              return {
                ...candidate,
                source: "database" as const,
                source_id: data.id,
                source_table: sourceTable,
              };
            });
            return { ...prev, rows };
          });
        } catch {
          // Silent on background persistence.
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [results]);

  const sendText = async (text: string, reset = false) => {
    if (!text.trim() || loading) return;
    if (usage && usage.remaining <= 0) {
      setMessages((m) => [
        ...m,
        { role: "assistant", content: "You've used all your chat credits for this month. Click the **Buy credits** button in the header to buy a top-up pack, or [upgrade your plan](/pricing)." },
      ]);
      return;
    }
    const base = reset ? [] : messages;
    const next: Msg[] = [...base, { role: "user", content: text }];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("chat", {
        body: { messages: next },
      });
      if (error) {
        const ctx = (error as { context?: Response }).context;
        let detail = "";
        try { detail = ctx ? await ctx.clone().text() : ""; } catch { /* ignore */ }
        if (detail.includes("quota_exhausted")) {
          setMessages((m) => [...m, { role: "assistant", content: "You've used all your chat credits for this month. Click the **Buy credits** button in the header to buy a top-up pack, or [upgrade your plan](/pricing)." }]);
          await refreshUsage();
          return;
        }
        throw error;
      }
      setMessages((m) => [
        ...m,
        { role: "assistant", content: data?.content || "(no response)" },
      ]);
      if (data?.usage) applyServerUsage(data.usage);
      if (data?.results) {
        const expanded = await expandChatResults(data.results, text);
        setResults(expanded);
        setSavingIdx({});
        upsertSearch.mutate({ tab: expanded.kind, query: { q: text } });
      } else {
        setResults(null);
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

  const buyTokens = async (pack: "small" | "medium" | "large") => {
    if (!user) { navigate("/login"); return; }
    try {
      const { data, error } = await supabase.functions.invoke("create-topup", {
        body: { user_id: user.id, user_email: user.email, pack },
      });
      if (error) throw error;
      if (data?.url) window.location.href = data.url;
      else throw new Error(data?.error || "Could not start checkout");
    } catch (e) {
      toast.error((e as Error).message || "Top-up failed");
    }
  };

  const handleSignOut = async () => { await signOut(); navigate("/"); };
  const newChat = () => { setMessages([]); setResults(null); setSavingIdx({}); setEnrichingIdx({}); setInput(""); };

  const enrichEmail = async (idx: number) => {
    if (!results) return;
    let row = results.rows[idx];
    if (!row) return;
    setEnrichingIdx((s) => ({ ...s, [idx]: true }));
    try {
      let dbId = typeof row.source_id === "number" ? row.source_id : null;
      let table: "journalist" | "creators" =
        row.source_table ?? (results.kind === "journalists" ? "journalist" : "creators");
      if (row.source === "exa" || dbId === null) {
        setSavingIdx((s) => ({ ...s, [idx]: "saving" }));
        const { data: saveData, error: saveErr } = await supabase.functions.invoke("save-contact", {
          body: {
            kind: results.kind,
            row: {
              name: row.name, outlet: row.outlet, title: row.title,
              category: row.category, country: row.country, email: row.email,
              ig_handle: row.ig_handle, youtube_url: row.youtube_url,
              source_url: row.source_url,
            },
          },
        });
        if (saveErr || !saveData?.ok) throw saveErr || new Error(saveData?.error || "Save failed");
        dbId = saveData.id;
        table = results.kind === "journalists" ? "journalist" : "creators";
        setSavingIdx((s) => ({ ...s, [idx]: "saved" }));
        setResults((prev) => {
          if (!prev) return prev;
          const rows: Row[] = prev.rows.map((r, i) => i === idx
            ? { ...r, source: "database", source_id: dbId!, source_table: table }
            : r);
          return { ...prev, rows };
        });
      }
      const kindArg = table === "journalist" ? "journalist" : "creator";
      const { data, error } = await supabase.functions.invoke("enrich-contact", {
        body: {
          kind: kindArg,
          id: dbId,
          fields: ["email"],
          contact: { name: row.name, outlet: row.outlet, source_url: row.source_url },
        },
      });
      if (error) throw error;
      const found = data?.updated?.email;
      if (found) {
        setResults((prev) => {
          if (!prev) return prev;
          const rows: Row[] = prev.rows.map((r, i) => i === idx ? { ...r, email: found } : r);
          return { ...prev, rows };
        });
        toast.success("Email found");
      } else {
        toast.message(data?.message ?? "Email not publicly found");
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Email lookup failed");
    } finally {
      setEnrichingIdx((s) => { const c = { ...s }; delete c[idx]; return c; });
    }
  };

  const saveExaRow = async (idx: number) => {
    if (!results) return;
    const row = results.rows[idx];
    if (!row || row.source !== "exa") return;
    setSavingIdx((s) => ({ ...s, [idx]: "saving" }));
    try {
      const { data, error } = await supabase.functions.invoke("save-contact", {
        body: {
          kind: results.kind,
          row: {
            name: row.name,
            outlet: row.outlet,
            title: row.title,
            category: row.category,
            country: row.country,
            email: row.email,
            ig_handle: row.ig_handle,
            youtube_url: row.youtube_url,
            source_url: row.source_url,
          },
        },
      });
      if (error || !data?.ok) throw error || new Error(data?.error || "Save failed");
      setSavingIdx((s) => ({ ...s, [idx]: "saved" }));
      setResults((prev) => {
        if (!prev) return prev;
        const newSourceTable: "journalist" | "creators" = prev.kind === "journalists" ? "journalist" : "creators";
        const rows: Row[] = prev.rows.map((r, i) => i === idx
          ? { ...r, source: "database", source_id: data.id, source_table: newSourceTable }
          : r);
        return { ...prev, rows };
      });
    } catch (_) {
      toast.error("Could not save this web result");
      setSavingIdx((s) => { const c = { ...s }; delete c[idx]; return c; });
    }
  };

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
          {hasGrowth && (
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => navigate("/dashboard")}>
              <Database className="h-3.5 w-3.5" />Database
            </Button>
          )}
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => navigate("/monitor")}>
            <Bell className="h-3.5 w-3.5" />Monitor
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

        {results && (
          <section className="flex-1 min-w-0 overflow-auto bg-white">
            <div className="px-5 py-4 border-b border-border flex items-center justify-between sticky top-0 bg-white z-10">
              <div>
                <div className="text-sm font-medium capitalize">{results.kind}</div>
                <div className="text-xs text-muted-foreground">
                  {results.rows.length} results
                  {(() => {
                    const dbN = results.rows.filter((r) => r.source === "database").length;
                    const exaN = results.rows.length - dbN;
                    if (dbN === 0) return ` · Expanded search to find more relevant contacts · ${exaN} from web`;
                    return ` · ${dbN} from database · ${exaN} from web`;
                  })()}
                </div>
              </div>
            </div>
            {results.rows.length === 0 ? (
              <div className="p-12 text-center text-sm text-muted-foreground">No results from database or web.</div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-secondary/40 text-xs text-muted-foreground">
                  <tr>
                    <th className="w-8" />
                    {cols.map((c) => (
                      <th key={String(c.key)} className="text-left font-medium px-4 py-2.5">{c.label}</th>
                    ))}
                    <th className="w-24" />
                  </tr>
                </thead>
                <tbody>
                  {results.rows.map((r, i) => {
                    const dbId = r.source === "database" && typeof r.source_id === "number" ? r.source_id : null;
                    const enriching = !!enrichingIdx[i];
                    const saving = savingIdx[i] === "saving";
                    return (
                      <tr key={i} className="group border-b border-border hover:bg-secondary/30 align-top">
                        <td className="px-2 py-2.5">
                          {dbId !== null && (
                            <AddToListMenu
                              journalistId={results.kind === "journalists" ? dbId : undefined}
                              creatorId={results.kind === "creators" ? dbId : undefined}
                            />
                          )}
                        </td>
                        {cols.map((c) => {
                          const v = r[c.key];
                          return (
                            <td key={String(c.key)} className="px-4 py-2.5">
                              {c.key === "email" ? (
                                v ? (
                                  <span className="break-all">{String(v)}</span>
                                ) : enriching ? (
                                  <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                                    <Loader2 className="h-3 w-3 animate-spin" />Finding…
                                  </span>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => enrichEmail(i)}
                                    className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                                    title="Use Exa + AI to find this email"
                                  >
                                    <Sparkles className="h-3 w-3" />Find email
                                  </button>
                                )
                              ) : v == null || v === "" ? (
                                <span className="text-muted-foreground">—</span>
                              ) : typeof v === "number" ? (
                                v.toLocaleString()
                              ) : (
                                String(v)
                              )}
                            </td>
                          );
                        })}
                        <td className="px-3 py-2.5 text-right">
                          {r.source === "exa" ? (
                            saving ? (
                              <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                                <Loader2 className="h-3 w-3 animate-spin" />Saving
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => saveExaRow(i)}
                                className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100"
                                title="Save this web result to your database"
                              >
                                Save
                              </button>
                            )
                          ) : savingIdx[i] === "saved" ? (
                            <span className="text-[10px] text-emerald-700">Saved</span>
                          ) : null}
                          {r.source === "exa" && r.source_url && (
                            <a href={r.source_url} target="_blank" rel="noreferrer" className="ml-2 text-[10px] text-muted-foreground hover:underline">source</a>
                          )}
                        </td>
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
