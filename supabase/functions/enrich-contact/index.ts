// Enrich missing fields on a journalist or creator row using Exa + Lovable AI Gateway.
// POST { kind: "journalist" | "creator", id: number, fields?: string[] }
// If `fields` is omitted, enriches all empty/null fields the row supports.
import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const enrichVersionHeaders = { ...corsHeaders, "X-Enrich-Version": "payload-live-006" };
const jsonHeaders = { ...enrichVersionHeaders, "Content-Type": "application/json" };

const JOURNALIST_FIELDS = ["email", "category", "titles", "xhandle", "outlet", "country"] as const;
const CREATOR_FIELDS = ["email", "category", "bio", "ig_handle", "youtube_url", "type"] as const;

const EMAIL_RE = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const BAD_EMAIL_RE = /^(info|hello|contact|support|press|admin|noreply|no-reply|sales|hr|webmaster|privacy|legal|advertising|subscribe|newsletter|tips)@/i;

const FIELD_DESCRIPTIONS: Record<string, string> = {
  email: "Direct professional email address (avoid generic info@/press@).",
  category: "Primary beat or topic category (e.g. Technology, Finance, Health).",
  titles: "Current job title(s) at their outlet (e.g. Senior Reporter).",
  xhandle: "X/Twitter handle starting with @.",
  outlet: "Name of the publication or outlet they write for.",
  country: "Country they are based in.",
  bio: "Short professional bio (1-2 sentences).",
  ig_handle: "Instagram handle starting with @.",
  youtube_url: "Full YouTube channel URL.",
  type: "Creator type (e.g. Influencer, Educator, Vlogger).",
};

function sanitizeQuery(query: string): string {
  return query.replace(/[\n\r\t]+/g, " ").replace(/\s+/g, " ").trim().slice(0, 350);
}

async function hunterFindEmail({ fullName, domain, company }: { fullName: string; domain?: string; company?: string }): Promise<string | null> {
  const key = Deno.env.get("HUNTER_API_KEY");
  if (!key || !fullName || (!domain && !company)) return null;
  try {
    const params = new URLSearchParams({ full_name: fullName, api_key: key });
    if (domain) params.set("domain", domain);
    if (company) params.set("company", company);
    const r = await fetch(`https://api.hunter.io/v2/email-finder?${params.toString()}`);
    if (!r.ok) return null;
    const j = await r.json();
    const email = j?.data?.email;
    return typeof email === "string" && email.includes("@") && !BAD_EMAIL_RE.test(email) ? email : null;
  } catch {
    return null;
  }
}

function scoreHunterEmail(entry: { value?: string; first_name?: string; last_name?: string; position?: string }, fullName: string): number {
  const email = (entry?.value ?? "").toLowerCase();
  if (!email || BAD_EMAIL_RE.test(email)) return -1;
  const parts = fullName.toLowerCase().split(/\s+/).filter((p) => p.length > 1);
  const first = (entry.first_name ?? "").toLowerCase();
  const last = (entry.last_name ?? "").toLowerCase();
  let score = 0;
  if (first && parts.includes(first)) score += 3;
  if (last && parts.includes(last)) score += 3;
  for (const p of parts) if (email.includes(p)) score += 1;
  if (entry.position) score += 0.5;
  return score;
}

async function hunterDomainSearch({ fullName, domain }: { fullName: string; domain: string }): Promise<string | null> {
  const key = Deno.env.get("HUNTER_API_KEY");
  if (!key || !domain || !fullName) return null;
  try {
    const params = new URLSearchParams({ domain, api_key: key, limit: "100" });
    const r = await fetch(`https://api.hunter.io/v2/domain-search?${params.toString()}`);
    if (!r.ok) return null;
    const j = await r.json();
    const emails: Array<{ value?: string; first_name?: string; last_name?: string; position?: string }> = j?.data?.emails ?? [];
    if (!emails.length) return null;
    let best: { email: string; score: number } | null = null;
    for (const e of emails) {
      const s = scoreHunterEmail(e, fullName);
      if (s > 0 && (!best || s > best.score)) best = { email: (e.value ?? "").toLowerCase(), score: s };
    }
    if (!best || best.score < 3) return null;
    return best.email;
  } catch {
    return null;
  }
}

async function exaSearch(query: string, numResults = 5): Promise<{ results: Array<{ url: string; text: string }>; error: string | null; providerResponseText: string | null }> {
  const key = Deno.env.get("EXA_API_KEY");
  if (!key) return { results: [], error: "EXA_API_KEY missing", providerResponseText: null };

  const sanitized = sanitizeQuery(query);
  if (!sanitized || sanitized.length < 3) return { results: [], error: "query_too_short", providerResponseText: null };

  const exaPayload = {
    query: sanitized,
    numResults,
    type: "auto",
    contents: { text: { maxCharacters: 4000 } },
  };

  const r = await fetch("https://api.exa.ai/search", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": key },
    body: JSON.stringify(exaPayload),
  });

  const text = await r.text();
  if (!r.ok) return { results: [], error: text || `status ${r.status}`, providerResponseText: text };

  try {
    const data = JSON.parse(text);
    return {
      results: (data.results ?? []).map((x: { url: string; text?: string }) => ({ url: x.url, text: x.text ?? "" })),
      error: null,
      providerResponseText: text,
    };
  } catch {
    return { results: [], error: "invalid provider JSON", providerResponseText: text };
  }
}

function deriveDomain(explicitDomain: string, outlet: string, sourceUrl: string): string {
  const fromDomain = hostFrom(explicitDomain);
  if (fromDomain) return fromDomain;
  const fromUrl = hostFrom(sourceUrl);
  if (fromUrl) return fromUrl;
  if (!outlet) return "";
  const fromOutlet = hostFrom(outlet);
  if (fromOutlet && fromOutlet.includes(".")) return fromOutlet;
  return "";
}

function hostFrom(value: string): string | null {
  try { return new URL(value.startsWith("http") ? value : `https://${value}`).hostname.replace(/^www\./, ""); } catch { return null; }
}

function pickEmail(snippets: Array<{ url: string; text: string }>, name: string): { email: string; source_url: string } | null {
  const nameParts = name.toLowerCase().split(/\s+/).filter((p) => p.length > 2);
  const matches = snippets.flatMap((s) => (`${s.url}\n${s.text}`.match(EMAIL_RE) ?? []).map((raw) => ({
    email: raw.trim().replace(/[),.;:]+$/, ""),
    source_url: s.url,
  }))).filter((m) => !BAD_EMAIL_RE.test(m.email) && !/\.(png|jpg|jpeg|gif|webp|svg)$/i.test(m.email));
  if (!matches.length) return null;
  return matches.find((m) => nameParts.some((p) => m.email.toLowerCase().includes(p))) ?? matches[0];
}

function json(payload: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(payload), { status, headers: jsonHeaders });
}

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function clean(value: unknown): string {
  return typeof value === "string" || typeof value === "number" ? String(value).trim() : "";
}

function numericId(value: unknown): number | null {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function sourceTable(value: unknown): "journalist" | "creators" | null {
  if (value === "journalist" || value === "journalists") return "journalist";
  if (value === "creator" || value === "creators") return "creators";
  return null;
}

async function extractFields(
  name: string,
  context: string,
  snippets: Array<{ url: string; text: string }>,
  fields: string[],
): Promise<Record<string, string>> {
  const key = Deno.env.get("LOVABLE_API_KEY");
  if (!key || !snippets.length) return {};

  const fieldList = fields.map((f) => `- ${f}: ${FIELD_DESCRIPTIONS[f] ?? f}`).join("\n");
  const corpus = snippets.slice(0, 6).map((s, i) => `[Source ${i + 1}] ${s.url}\n${s.text.slice(0, 1500)}`).join("\n\n");
  const prompt = `You are extracting verified contact details for "${name}"${context ? ` (${context})` : ""}.
Only return values explicitly supported by the sources. If unsure, omit the field.
Return JSON with these fields (omit any you cannot verify):
${fieldList}

Sources:
${corpus}`;

  try {
    const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "Return only a single JSON object. No markdown." },
          { role: "user", content: prompt },
        ],
      }),
    });
    if (!r.ok) return {};
    const j = await r.json();
    const txt = j.choices?.[0]?.message?.content ?? "";
    const m = txt.match(/\{[\s\S]*\}/);
    if (!m) return {};
    const parsed = JSON.parse(m[0]);
    const out: Record<string, string> = {};
    for (const f of fields) {
      const v = parsed[f];
      if (typeof v === "string" && v.trim()) out[f] = v.trim();
    }
    return out;
  } catch {
    return {};
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: enrichVersionHeaders });

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader) return json({ email: null, found: false, source: "none", confidence: null, error: "auth" }, 401);

    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return json({ email: null, found: false, source: "none", confidence: null, error: "auth" }, 401);

    const body = await req.json().catch(() => ({}));
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return json({ email: null, found: false, source: "none", confidence: null, error: "invalid_payload" });
    }

    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const root = record(body);
    const contact = { ...record(root.contact), ...root };
    const table = sourceTable(contact.source_table) ?? (root.kind === "creator" ? "creators" : "journalist");
    const allFields = (table === "journalist" ? JOURNALIST_FIELDS : CREATOR_FIELDS) as readonly string[];
    const requestedFields = root.fields;
    const sourceId = numericId(contact.source_id ?? root.id);
    const shouldUpdateDb = sourceId !== null && sourceTable(contact.source_table ?? root.kind) !== null;

    let row: Record<string, unknown> = {};
    if (shouldUpdateDb) {
      const { data: dbRow } = await admin.from(table).select("*").eq("id", sourceId).maybeSingle();
      if (dbRow) row = dbRow;
    }

    const targetFields = (Array.isArray(requestedFields) && requestedFields.length
      ? requestedFields.filter((f: string) => allFields.includes(f))
      : allFields.filter((f) => row[f] === null || row[f] === undefined || row[f] === ""));
    const fieldsToExtract = targetFields.length ? targetFields : ["email"];

    const name = clean(contact.name);
    if (!name) return json({ email: null, found: false, source: "none", confidence: null, error: "missing_name" });

    const outlet = clean(contact.outlet);
    const title = clean(contact.title);
    const country = clean(contact.country ?? row.country);
    const sourceUrl = clean(contact.url ?? contact.source_url);
    const outletDomain = deriveDomain(clean(contact.domain ?? root.domain), outlet, sourceUrl);
    const context = [outlet, title, country].filter(Boolean).join(" · ");

    // Hunter first pass (only when email is among target fields)
    if (fieldsToExtract.includes("email") && (outletDomain || outlet)) {
      const hunterEmail = await hunterFindEmail({ fullName: name, domain: outletDomain || undefined, company: outlet || undefined });
      if (hunterEmail) {
        if (shouldUpdateDb && sourceId !== null) {
          const update: Record<string, unknown> = { email: hunterEmail, enrichment_source_url: `hunter:${outletDomain || outlet}`, enriched_at: new Date().toISOString() };
          let { error: upErr } = await admin.from(table).update(update).eq("id", sourceId);
          if (upErr && /enrichment_source_url|enriched_at/.test(upErr.message ?? "")) {
            await admin.from(table).update({ email: hunterEmail }).eq("id", sourceId);
          }
        }
        return json({ email: hunterEmail, found: true, source: "hunter", confidence: 0.88, error: null });
      }

      // Hunter domain-search fallback
      if (outletDomain) {
        const domainEmail = await hunterDomainSearch({ fullName: name, domain: outletDomain });
        if (domainEmail) {
          if (shouldUpdateDb && sourceId !== null) {
            const update: Record<string, unknown> = { email: domainEmail, enrichment_source_url: `hunter-domain:${outletDomain}`, enriched_at: new Date().toISOString() };
            let { error: upErr } = await admin.from(table).update(update).eq("id", sourceId);
            if (upErr && /enrichment_source_url|enriched_at/.test(upErr.message ?? "")) {
              await admin.from(table).update({ email: domainEmail }).eq("id", sourceId);
            }
          }
          return json({ email: domainEmail, found: true, source: "hunter-domain", confidence: 0.78, error: null });
        }
      }
    }

    const queries = [
      `"${name}" ${outlet} ${title} ${outletDomain ? `site:${outletDomain}` : ""} email contact`,
      `"${name}" ${outlet} email`,
      `"${name}" email`,
      table === "journalist" && outletDomain ? `"${name}" journalist contact site:${outletDomain}` : "",
      table === "journalist" && outlet ? `"${name}" ${outlet} journalist contact profile` : "",
      table === "creators" ? `"${name}" creator instagram youtube profile email` : "",
    ].map(sanitizeQuery).filter((q, i, arr) => q.length >= 3 && arr.indexOf(q) === i);

    const settled = await Promise.all(queries.map((q) => exaSearch(q, 10)));
    const providerErrors = settled.map((s) => s.error).filter(Boolean) as string[];
    const allSnippets = settled.flatMap((s) => s.results)
      .filter((s, i, arr) => s.url && arr.findIndex((x) => x.url === s.url) === i)
      .slice(0, 30);

    if (!allSnippets.length) {
      // Graceful no-result response to avoid UI hard failure on provider-side invalid_input.
      return json({ email: null, found: false, source: "none", confidence: null, error: null, provider_error: providerErrors[0] ?? null });
    }

    const extracted = await extractFields(name, context, allSnippets, fieldsToExtract);
    if (extracted.email) {
      const cleaned = extracted.email.trim().replace(/[),.;:]+$/, "");
      if (!cleaned.includes("@") || BAD_EMAIL_RE.test(cleaned)) delete extracted.email;
      else extracted.email = cleaned;
    }

    let emailSourceUrl = allSnippets[0]?.url ?? null;
    if (fieldsToExtract.includes("email") && !extracted.email) {
      const directEmail = pickEmail(allSnippets, name);
      if (directEmail) {
        extracted.email = directEmail.email;
        emailSourceUrl = directEmail.source_url;
      }
    }

    if (!Object.keys(extracted).length) {
      return json({ email: null, found: false, source: "none", confidence: null, error: null });
    }

    const email = extracted.email ?? null;
    if (!shouldUpdateDb || sourceId === null) {
      return json({ email, found: Boolean(email), source: email ? "exa" : "none", confidence: email ? 0.72 : null, error: null });
    }

    const update: Record<string, unknown> = { ...extracted, enrichment_source_url: emailSourceUrl, enriched_at: new Date().toISOString() };
    let { error: upErr } = await admin.from(table).update(update).eq("id", sourceId);
    if (upErr && /enrichment_source_url|enriched_at/.test(upErr.message ?? "")) {
      const r = await admin.from(table).update(extracted).eq("id", sourceId);
      upErr = r.error;
    }

    if (upErr) {
      return json({ email, found: Boolean(email), source: email ? "exa" : "none", confidence: email ? 0.72 : null, error: null });
    }

    return json({ email, found: Boolean(email), source: email ? "exa" : "none", confidence: email ? 0.72 : null, error: null });
  } catch (e) {
    return json({ email: null, found: false, source: "none", confidence: null, error: null, internal_error: e instanceof Error ? e.message : String(e) });
  }
});
