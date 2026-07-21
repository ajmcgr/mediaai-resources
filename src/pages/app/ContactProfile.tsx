import { useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  ArrowLeft, AtSign, Building2, CalendarDays, ExternalLink, Globe2, Instagram,
  Linkedin, Mail, MapPin, Sparkles, Users, Youtube,
} from "lucide-react";
import AppHeader from "@/components/AppHeader";
import { AddToListMenu } from "@/components/dashboard/AddToListMenu";
import { AuthorityBadge } from "@/components/dashboard/AuthorityBadge";
import { ContactIntelligence } from "@/components/profile/ContactIntelligence";
import { resolveAuthority, useOutletAuthorities } from "@/hooks/useOutletAuthority";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { buildMatchExplanation } from "@/lib/matchExplanation";

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
  ig_avg_engagements?: number | null;
  youtube_url?: string | null;
  youtube_subscribers?: number | null;
  youtube_views_per_video?: number | null;
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

function externalUrl(value?: string | null) {
  if (!value) return null;
  try {
    const url = new URL(value.startsWith("http") ? value : `https://${value}`);
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : null;
  } catch {
    return null;
  }
}

function SocialLink({ href, label, icon }: { href: string | null; label: string; icon: React.ReactNode }) {
  if (!href) return null;
  return (
    <a href={href} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm text-primary hover:underline">
      {icon}<span>{label}</span><ExternalLink className="h-3.5 w-3.5" />
    </a>
  );
}

function DetailRow({ icon, label, value }: { icon: React.ReactNode; label: string; value?: string | number | null }) {
  if (value == null || value === "") return null;
  return (
    <div className="flex gap-3 py-3">
      <div className="mt-0.5 text-muted-foreground">{icon}</div>
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="mt-0.5 break-words text-sm text-foreground">{typeof value === "number" ? value.toLocaleString() : value}</p>
      </div>
    </div>
  );
}

export default function ContactProfile() {
  const navigate = useNavigate();
  const { kind, id } = useParams();
  const [searchParams] = useSearchParams();
  const [contact, setContact] = useState<Contact | null>(null);
  const [coverage, setCoverage] = useState<CoverageItem[]>([]);
  const [coverageAvailable, setCoverageAvailable] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const profileKind = kind === "journalist" || kind === "creator" ? kind : null;
  const contactId = Number(id);
  const searchQuery = searchParams.get("q")?.trim() ?? "";
  const matchScore = Number(searchParams.get("score"));
  const hasMatchScore = Number.isFinite(matchScore) && matchScore >= 0 && matchScore <= 100;
  const authorities = useOutletAuthorities(profileKind === "journalist" ? [contact?.outlet ?? null] : []);

  useEffect(() => {
    let active = true;
    if (!profileKind || !Number.isInteger(contactId) || contactId < 1) {
      setError("This profile link is invalid.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    void (async () => {
      const table = profileKind === "journalist" ? "journalist" : "creators";
      const { data, error: fetchError } = await supabase
        .from(table)
        .select("*")
        .eq("id", contactId)
        .maybeSingle();
      if (!active) return;
      if (fetchError) {
        setError("We could not load this profile. Please try again.");
      } else if (!data) {
        setError("This profile is no longer available.");
      } else {
        setContact(data as Contact);
      }
      setLoading(false);
    })();
    return () => { active = false; };
  }, [profileKind, contactId]);

  useEffect(() => {
    let active = true;
    if (!profileKind || !Number.isInteger(contactId) || contactId < 1) return;
    void (async () => {
      const { data, error: coverageError } = await supabase
        .from("contact_coverage")
        .select("id,headline,canonical_url,outlet,published_at,summary")
        .eq("contact_kind", profileKind)
        .eq("contact_id", contactId)
        .order("published_at", { ascending: false, nullsFirst: false })
        .limit(5);
      if (!active) return;
      if (coverageError) {
        setCoverageAvailable(false);
        setCoverage([]);
      } else {
        setCoverageAvailable(true);
        setCoverage((data ?? []) as CoverageItem[]);
      }
    })();
    return () => { active = false; };
  }, [profileKind, contactId]);

  const matchExplanation = useMemo(
    () => contact ? buildMatchExplanation(contact, searchQuery, hasMatchScore ? matchScore : undefined) : null,
    [contact, searchQuery, hasMatchScore, matchScore],
  );

  const name = contact?.name || "Unnamed contact";
  const subtitle = profileKind === "journalist"
    ? [contact?.titles, contact?.outlet].filter(Boolean).join(" at ") || "Journalist"
    : [contact?.type, contact?.category].filter(Boolean).join(" · ") || "Creator";
  const xHandle = contact?.xhandle?.trim().replace(/^@/, "") || "";
  const igHandle = contact?.ig_handle?.trim().replace(/^@/, "") || "";
  const authority = resolveAuthority(authorities.data, contact?.outlet);

  return (
    <div className="min-h-screen bg-background">
      <Helmet><title>{contact ? `${name} | Media AI` : "Profile | Media AI"}</title></Helmet>
      <AppHeader hideNav />
      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <Button variant="ghost" size="sm" className="mb-5 -ml-2 gap-2" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />Back
        </Button>

        {loading ? (
          <div className="space-y-6"><Skeleton className="h-48 w-full rounded-xl" /><div className="grid gap-6 md:grid-cols-[1.35fr_0.65fr]"><Skeleton className="h-72" /><Skeleton className="h-72" /></div></div>
        ) : error ? (
          <section className="rounded-xl border border-border bg-card p-10 text-center">
            <h1 className="text-xl font-semibold">Profile unavailable</h1><p className="mt-2 text-sm text-muted-foreground">{error}</p>
            <Button className="mt-5" onClick={() => navigate("/database")}>Browse database</Button>
          </section>
        ) : contact && (
          <>
            <section className="rounded-xl border border-border bg-card p-6 shadow-sm sm:p-8">
              <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-start">
                <div className="flex min-w-0 items-center gap-4">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xl font-semibold text-primary">
                    {name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="mb-1 flex flex-wrap items-center gap-2"><h1 className="text-2xl font-semibold tracking-tight">{name}</h1><span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium capitalize text-secondary-foreground">{profileKind}</span></div>
                    <p className="text-sm text-muted-foreground">{subtitle}</p>
                    {contact.country && <p className="mt-1 inline-flex items-center gap-1 text-sm text-muted-foreground"><MapPin className="h-3.5 w-3.5" />{contact.country}</p>}
                  </div>
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                  {contact.email && <Button asChild variant="outline"><a href={`mailto:${contact.email}`}><Mail className="mr-2 h-4 w-4" />Email</a></Button>}
                  <AddToListMenu journalistId={profileKind === "journalist" ? contact.id : undefined} creatorId={profileKind === "creator" ? contact.id : undefined} />
                </div>
              </div>
            </section>

            {searchQuery && (
              <section className="mt-6 rounded-xl border border-primary/20 bg-primary/5 p-5">
                <div className="flex gap-3"><Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-primary" /><div><h2 className="font-semibold">Why this match</h2>
                  <p className="mt-1 text-sm text-muted-foreground">{matchExplanation?.confidence ?? "Low"} confidence for "{searchQuery}". Review the evidence before outreach.</p>
                  {hasMatchScore && <p className="mt-2 text-xs font-medium text-primary">AI fit score: {Math.round(matchScore)}%</p>}
                  {!!matchExplanation?.reasons.length && <ul className="mt-3 space-y-1.5 text-sm text-muted-foreground">{matchExplanation.reasons.map((reason) => <li key={reason}>- {reason}</li>)}</ul>}
                </div></div>
              </section>
            )}

            {profileKind && <div className="mt-6"><ContactIntelligence kind={profileKind} id={contact.id} contactName={name} outlet={contact.outlet ?? contact.category} /></div>}

            <div className="mt-6 grid gap-6 md:grid-cols-[1.35fr_0.65fr]">
              <section className="rounded-xl border border-border bg-card p-6">
                <h2 className="text-base font-semibold">{profileKind === "journalist" ? "Coverage" : "Audience and content"}</h2>
                <div className="mt-3 divide-y divide-border">
                  <DetailRow icon={<Building2 className="h-4 w-4" />} label={profileKind === "journalist" ? "Outlet" : "Category"} value={profileKind === "journalist" ? contact.outlet : contact.category} />
                  <DetailRow icon={<Users className="h-4 w-4" />} label={profileKind === "journalist" ? "Role" : "Creator type"} value={profileKind === "journalist" ? contact.titles : contact.type} />
                  <DetailRow icon={<Sparkles className="h-4 w-4" />} label="Topics" value={profileKind === "journalist" ? (contact.topics || contact.category) : contact.bio} />
                  {profileKind === "creator" && <>
                    <DetailRow icon={<Instagram className="h-4 w-4" />} label="Instagram followers" value={contact.ig_followers} />
                    <DetailRow icon={<Users className="h-4 w-4" />} label="Engagement rate" value={contact.ig_engagement_rate == null ? null : `${(Number(contact.ig_engagement_rate) * 100).toFixed(2).replace(/\.00$/, "")}%`} />
                    <DetailRow icon={<Youtube className="h-4 w-4" />} label="YouTube subscribers" value={contact.youtube_subscribers} />
                  </>}
                  {profileKind === "journalist" && <div className="flex items-center justify-between py-3"><div><p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Outlet authority</p><p className="mt-0.5 text-sm text-muted-foreground">Cached Domain Rating</p></div><AuthorityBadge score={authority} /></div>}
                </div>
              </section>

              <aside className="rounded-xl border border-border bg-card p-6">
                <h2 className="text-base font-semibold">Contact and links</h2>
                <div className="mt-4 space-y-4">
                  {contact.email ? <SocialLink href={`mailto:${contact.email}`} label={contact.email} icon={<Mail className="h-4 w-4" />} /> : <p className="text-sm text-muted-foreground">No email available</p>}
                  <SocialLink href={externalUrl(contact.linkedin_url)} label="LinkedIn" icon={<Linkedin className="h-4 w-4" />} />
                  <SocialLink href={xHandle ? `https://x.com/${xHandle}` : null} label={xHandle ? `@${xHandle}` : ""} icon={<AtSign className="h-4 w-4" />} />
                  <SocialLink href={igHandle ? `https://instagram.com/${igHandle}` : null} label={igHandle ? `@${igHandle}` : ""} icon={<Instagram className="h-4 w-4" />} />
                  <SocialLink href={externalUrl(contact.youtube_url)} label="YouTube" icon={<Youtube className="h-4 w-4" />} />
                  {contact.country && <DetailRow icon={<Globe2 className="h-4 w-4" />} label="Country" value={contact.country} />}
                </div>
              </aside>
            </div>

            <section className="mt-6 rounded-xl border border-border bg-card p-6">
              <h2 className="text-base font-semibold">Recent verified coverage</h2>
              <p className="mt-1 text-sm text-muted-foreground">Attributable articles and posts linked to this profile.</p>
              {coverage.length ? (
                <div className="mt-5 divide-y divide-border">
                  {coverage.map((item) => (
                    <a key={item.id} href={item.canonical_url} target="_blank" rel="noreferrer" className="group block py-4 first:pt-0 last:pb-0 hover:bg-secondary/30">
                      <div className="flex items-start justify-between gap-4"><div className="min-w-0"><p className="font-medium group-hover:text-primary group-hover:underline">{item.headline}</p>
                        <p className="mt-1 text-sm text-muted-foreground">{[item.outlet, item.published_at ? new Date(item.published_at).toLocaleDateString(undefined, { month: "short", year: "numeric" }) : null].filter(Boolean).join(" · ")}</p>
                        {item.summary && <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{item.summary}</p>}
                      </div><ExternalLink className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" /></div>
                    </a>
                  ))}
                </div>
              ) : (
                <div className="mt-5 rounded-lg border border-dashed border-border bg-secondary/20 px-4 py-5 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2"><CalendarDays className="h-4 w-4" />{coverageAvailable ? "No verified article evidence has been linked to this profile yet." : "Article evidence will appear here once coverage ingestion is enabled."}</div>
                </div>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}
