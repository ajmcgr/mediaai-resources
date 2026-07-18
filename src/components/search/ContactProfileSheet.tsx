import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  AtSign, Building2, CalendarDays, ExternalLink, Globe2, Instagram,
  Linkedin, Mail, MapPin, Sparkles, Users, Youtube,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AddToListMenu } from "@/components/dashboard/AddToListMenu";
import { AuthorityBadge } from "@/components/dashboard/AuthorityBadge";
import { ContactIntelligence } from "@/components/profile/ContactIntelligence";
import { resolveAuthority, useOutletAuthorities } from "@/hooks/useOutletAuthority";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";

type ContactKind = "journalist" | "creator";

type Contact = Record<string, unknown> & {
  id: number;
  name?: string | null;
  email?: string | null;
  category?: string | null;
  country?: string | null;
  outlet?: string | null;
  titles?: string | null;
  topics?: string | null;
  bio?: string | null;
  linkedin_url?: string | null;
  xhandle?: string | null;
  ig_handle?: string | null;
  ig_followers?: number | null;
  ig_engagement_rate?: number | null;
  youtube_url?: string | null;
  youtube_subscribers?: number | null;
  type?: string | null;
};

type CoverageItem = {
  id: string;
  headline: string;
  canonical_url: string;
  outlet?: string | null;
  published_at?: string | null;
  summary?: string | null;
};

type ContactProfileSheetProps = {
  profile: { kind: ContactKind; id: number; query?: string; matchScore?: number } | null;
  onOpenChange: (open: boolean) => void;
};

const STOP_WORDS = new Set(["a", "about", "and", "are", "for", "give", "in", "journalist", "journalists", "list", "me", "of", "on", "that", "the", "to", "who", "with", "write", "writes", "creator", "creators"]);

function externalUrl(value?: string | null) {
  if (!value) return null;
  try {
    const url = new URL(value.startsWith("http") ? value : `https://${value}`);
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : null;
  } catch {
    return null;
  }
}

function DetailRow({ icon, label, value }: { icon: ReactNode; label: string; value?: string | number | null }) {
  if (value == null || value === "") return null;
  return <div className="flex gap-3 py-3"><div className="mt-0.5 text-muted-foreground">{icon}</div><div className="min-w-0"><p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p><p className="mt-0.5 break-words text-sm">{typeof value === "number" ? value.toLocaleString() : value}</p></div></div>;
}

function SocialLink({ href, label, icon }: { href: string | null; label: string; icon: ReactNode }) {
  if (!href) return null;
  return <a href={href} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm text-primary hover:underline">{icon}<span>{label}</span><ExternalLink className="h-3.5 w-3.5" /></a>;
}

export function ContactProfileSheet({ profile, onOpenChange }: ContactProfileSheetProps) {
  const [contact, setContact] = useState<Contact | null>(null);
  const [coverage, setCoverage] = useState<CoverageItem[]>([]);
  const [coverageAvailable, setCoverageAvailable] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const authorities = useOutletAuthorities(profile?.kind === "journalist" ? [contact?.outlet ?? null] : []);

  useEffect(() => {
    let active = true;
    if (!profile) {
      setContact(null);
      setCoverage([]);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    setContact(null);
    setCoverage([]);
    void (async () => {
      const table = profile.kind === "journalist" ? "journalist" : "creators";
      const { data, error: fetchError } = await supabase.from(table).select("*").eq("id", profile.id).maybeSingle();
      if (!active) return;
      if (fetchError || !data) {
        setError(fetchError ? "We could not load this profile. Please try again." : "This profile is no longer available.");
        setLoading(false);
        return;
      }
      setContact(data as Contact);
      setLoading(false);

      const { data: coverageData, error: coverageError } = await supabase
        .from("contact_coverage")
        .select("id,headline,canonical_url,outlet,published_at,summary")
        .eq("contact_kind", profile.kind)
        .eq("contact_id", profile.id)
        .order("published_at", { ascending: false, nullsFirst: false })
        .limit(5);
      if (!active) return;
      setCoverageAvailable(!coverageError);
      setCoverage((coverageData ?? []) as CoverageItem[]);
    })();
    return () => { active = false; };
  }, [profile]);

  const queryMatches = useMemo(() => {
    if (!contact || !profile?.query) return [];
    const terms = profile.query.toLowerCase().match(/[a-z0-9][a-z0-9'-]{2,}/g) ?? [];
    const meaningful = [...new Set(terms.filter((term) => !STOP_WORDS.has(term)))].slice(0, 8);
    const fields: Array<[string, string]> = [
      ["their topics", `${contact.topics ?? ""} ${contact.category ?? ""}`],
      ["their role and outlet", `${contact.titles ?? ""} ${contact.outlet ?? ""}`],
      ["their profile", `${contact.bio ?? ""} ${contact.type ?? ""}`],
    ];
    return fields.flatMap(([label, value]) => meaningful.some((term) => value.toLowerCase().includes(term)) ? [label] : []).slice(0, 2);
  }, [contact, profile?.query]);

  const name = contact?.name || "Unnamed contact";
  const subtitle = profile?.kind === "journalist"
    ? [contact?.titles, contact?.outlet].filter(Boolean).join(" at ") || "Journalist"
    : [contact?.type, contact?.category].filter(Boolean).join(" · ") || "Creator";
  const xHandle = contact?.xhandle?.trim().replace(/^@/, "") || "";
  const igHandle = contact?.ig_handle?.trim().replace(/^@/, "") || "";
  const authority = resolveAuthority(authorities.data, contact?.outlet);
  const profileUrl = profile ? `/profiles/${profile.kind}/${profile.id}${profile.query ? `?q=${encodeURIComponent(profile.query)}${typeof profile.matchScore === "number" ? `&score=${profile.matchScore}` : ""}` : ""}` : "";

  return (
    <Sheet open={!!profile} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto p-0 sm:max-w-2xl">
        <SheetHeader className="border-b border-border px-6 py-5 pr-14">
          <SheetTitle>{loading ? "Loading profile" : name}</SheetTitle>
          <p className="text-sm text-muted-foreground">Profile details without leaving your results.</p>
        </SheetHeader>

        <div className="space-y-5 p-6">
          {loading ? (
            <div className="space-y-5"><Skeleton className="h-28 w-full rounded-xl" /><Skeleton className="h-56 w-full rounded-xl" /><Skeleton className="h-40 w-full rounded-xl" /></div>
          ) : error ? (
            <div className="rounded-xl border border-border p-8 text-center"><h2 className="font-semibold">Profile unavailable</h2><p className="mt-2 text-sm text-muted-foreground">{error}</p></div>
          ) : contact && profile ? (
            <>
              <section className="rounded-xl border border-border bg-card p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex min-w-0 gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary">{name.slice(0, 2).toUpperCase()}</div>
                    <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h2 className="text-xl font-semibold">{name}</h2><span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-medium capitalize">{profile.kind}</span></div><p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>{contact.country && <p className="mt-1 inline-flex items-center gap-1 text-sm text-muted-foreground"><MapPin className="h-3.5 w-3.5" />{contact.country}</p>}</div>
                  </div>
                  <div className="flex flex-wrap gap-2"><Button asChild variant="outline" size="sm"><Link to={profileUrl}>Open page</Link></Button><AddToListMenu journalistId={profile.kind === "journalist" ? contact.id : undefined} creatorId={profile.kind === "creator" ? contact.id : undefined} /></div>
                </div>
              </section>

              {profile.query && <section className="rounded-xl border border-primary/20 bg-primary/5 p-4"><div className="flex gap-3"><Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-primary" /><div><h3 className="font-semibold">Why this match</h3><p className="mt-1 text-sm text-muted-foreground">{queryMatches.length ? `Matches “${profile.query}” through ${queryMatches.join(" and ")}.` : `Opened from your search for “${profile.query}”.`}</p>{typeof profile.matchScore === "number" && <p className="mt-2 text-xs font-medium text-primary">Evidence-based match score: {Math.round(profile.matchScore)}/100</p>}</div></div></section>}

              <ContactIntelligence kind={profile.kind} id={profile.id} compact />

              <section className="rounded-xl border border-border bg-card p-5"><h3 className="font-semibold">Profile and outreach</h3><div className="mt-3 divide-y divide-border"><DetailRow icon={<Building2 className="h-4 w-4" />} label={profile.kind === "journalist" ? "Outlet" : "Category"} value={profile.kind === "journalist" ? contact.outlet : contact.category} /><DetailRow icon={<Users className="h-4 w-4" />} label={profile.kind === "journalist" ? "Role" : "Creator type"} value={profile.kind === "journalist" ? contact.titles : contact.type} /><DetailRow icon={<Sparkles className="h-4 w-4" />} label="Topics" value={profile.kind === "journalist" ? (contact.topics || contact.category) : contact.bio} />{profile.kind === "journalist" && <div className="flex items-center justify-between py-3"><div><p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Outlet authority</p><p className="mt-0.5 text-sm text-muted-foreground">Cached Domain Rating</p></div><AuthorityBadge score={authority} /></div>}</div></section>

              <section className="rounded-xl border border-border bg-card p-5"><h3 className="font-semibold">Contact and links</h3><div className="mt-4 space-y-3">{contact.email ? <SocialLink href={`mailto:${contact.email}`} label={contact.email} icon={<Mail className="h-4 w-4" />} /> : <p className="text-sm text-muted-foreground">No email available</p>}<SocialLink href={externalUrl(contact.linkedin_url)} label="LinkedIn" icon={<Linkedin className="h-4 w-4" />} /><SocialLink href={xHandle ? `https://x.com/${xHandle}` : null} label={xHandle ? `@${xHandle}` : ""} icon={<AtSign className="h-4 w-4" />} /><SocialLink href={igHandle ? `https://instagram.com/${igHandle}` : null} label={igHandle ? `@${igHandle}` : ""} icon={<Instagram className="h-4 w-4" />} /><SocialLink href={externalUrl(contact.youtube_url)} label="YouTube" icon={<Youtube className="h-4 w-4" />} />{contact.country && <DetailRow icon={<Globe2 className="h-4 w-4" />} label="Country" value={contact.country} />}</div></section>

              <section className="rounded-xl border border-border bg-card p-5"><h3 className="font-semibold">Recent verified coverage</h3>{coverage.length ? <div className="mt-3 divide-y divide-border">{coverage.map((item) => <a key={item.id} href={item.canonical_url} target="_blank" rel="noreferrer" className="group block py-3 first:pt-0"><p className="font-medium group-hover:text-primary group-hover:underline">{item.headline}</p><p className="mt-1 text-xs text-muted-foreground">{[item.outlet, item.published_at ? new Date(item.published_at).toLocaleDateString(undefined, { month: "short", year: "numeric" }) : null].filter(Boolean).join(" · ")}</p>{item.summary && <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{item.summary}</p>}</a>)}</div> : <div className="mt-4 flex items-center gap-2 rounded-lg border border-dashed px-3 py-4 text-sm text-muted-foreground"><CalendarDays className="h-4 w-4" />{coverageAvailable ? "No verified article evidence has been linked yet." : "Article evidence will appear here once coverage ingestion is enabled."}</div>}</section>
            </>
          ) : null}
        </div>
      </SheetContent>
    </Sheet>
  );
}
