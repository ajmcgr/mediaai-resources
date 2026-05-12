import { useState } from "react";
import { Link } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import Layout from "@/components/Layout";
import AdminRoute from "@/components/AdminRoute";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useSeoPagesAdmin, type SeoPage } from "@/hooks/useSeoPages";
import { Loader2, Trash2, ExternalLink, Sparkles } from "lucide-react";

function AdminSeoPagesInner() {
  const { data: pages, isLoading, refetch } = useSeoPagesAdmin();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [topic, setTopic] = useState("");
  const [generating, setGenerating] = useState(false);
  const [autoCount, setAutoCount] = useState(10);
  const [autoRunning, setAutoRunning] = useState(false);
  const [publishOnGenerate, setPublishOnGenerate] = useState(true);
  const [editing, setEditing] = useState<SeoPage | null>(null);

  async function handleGenerate() {
    const t = topic.trim();
    if (!t) return;
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("seo-page-build", {
        body: { topic: t, publish: publishOnGenerate },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      toast({ title: "Page generated", description: (data as any)?.page?.slug });
      setTopic("");
      qc.invalidateQueries({ queryKey: ["seo-pages-admin"] });
      qc.invalidateQueries({ queryKey: ["seo-pages-public"] });
    } catch (e: any) {
      toast({ title: "Failed to generate", description: e.message, variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  }

  async function handleAutoGenerate() {
    setAutoRunning(true);
    try {
      const { data, error } = await supabase.functions.invoke("seo-page-build", {
        body: { auto: true, count: autoCount, publish: publishOnGenerate },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      const results = (data as any)?.generated ?? [];
      const ok = results.filter((r: any) => r.ok).length;
      toast({ title: `Generated ${ok}/${results.length} pages` });
      qc.invalidateQueries({ queryKey: ["seo-pages-admin"] });
      qc.invalidateQueries({ queryKey: ["seo-pages-public"] });
    } catch (e: any) {
      toast({ title: "Auto-generate failed", description: e.message, variant: "destructive" });
    } finally {
      setAutoRunning(false);
    }
  }

  async function togglePublished(p: SeoPage) {
    const { error } = await supabase
      .from("seo_pages" as any)
      .update({ published: !p.published })
      .eq("id", p.id);
    if (error) toast({ title: "Update failed", description: error.message, variant: "destructive" });
    else { refetch(); qc.invalidateQueries({ queryKey: ["seo-pages-public"] }); }
  }

  async function deletePage(p: SeoPage) {
    if (!confirm(`Delete "${p.title}"?`)) return;
    const { error } = await supabase.from("seo_pages" as any).delete().eq("id", p.id);
    if (error) toast({ title: "Delete failed", description: error.message, variant: "destructive" });
    else { refetch(); qc.invalidateQueries({ queryKey: ["seo-pages-public"] }); }
  }

  async function saveEdit() {
    if (!editing) return;
    const { error } = await supabase
      .from("seo_pages" as any)
      .update({
        title: editing.title,
        h1: editing.h1,
        meta_description: editing.meta_description,
        intro_html: editing.intro_html,
        filters: editing.filters,
        faq: editing.faq,
      })
      .eq("id", editing.id);
    if (error) {
      toast({ title: "Save failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Saved" });
      setEditing(null);
      refetch();
    }
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-10 max-w-5xl">
        <h1 className="text-3xl font-medium mb-2">SEO discover pages</h1>
        <p className="text-muted-foreground mb-8">
          Generate programmatic landing pages from a topic. AI infers filters and writes intro copy
          against the journalist & creator database.
        </p>

        <Card className="p-5 mb-8">
          <h2 className="font-medium mb-3 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" /> Generate a new page
          </h2>
          <div className="flex flex-col sm:flex-row gap-3">
            <Input
              placeholder='e.g. "Top AI journalists in San Francisco" or "Best fintech podcasters"'
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleGenerate(); }}
              disabled={generating}
            />
            <Button onClick={handleGenerate} disabled={generating || !topic.trim()}>
              {generating ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Generating</> : "Generate"}
            </Button>
          </div>
          <label className="flex items-center gap-2 mt-3 text-sm text-muted-foreground">
            <Switch checked={publishOnGenerate} onCheckedChange={setPublishOnGenerate} />
            Publish immediately
          </label>
        </Card>

        <h2 className="font-medium mb-4">All pages ({pages?.length ?? 0})</h2>
        {isLoading ? (
          <p className="text-muted-foreground">Loading…</p>
        ) : !pages?.length ? (
          <p className="text-muted-foreground">No pages yet. Generate your first one above.</p>
        ) : (
          <div className="space-y-3">
            {pages.map((p) => (
              <Card key={p.id} className="p-4">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="font-medium">{p.title}</h3>
                      <Badge variant="secondary" className="capitalize text-xs">{p.source}</Badge>
                      {p.published ? (
                        <Badge className="text-xs bg-green-500/15 text-green-700 hover:bg-green-500/20">Live</Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs">Draft</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-1">{p.meta_description}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      <code>/discover/{p.slug}</code> · filters: {Object.keys(p.filters || {}).join(", ") || "none"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-2 text-xs">
                      <Switch checked={p.published} onCheckedChange={() => togglePublished(p)} />
                      Live
                    </label>
                    {p.published && (
                      <Button asChild size="sm" variant="outline">
                        <Link to={`/discover/${p.slug}`} target="_blank">
                          View <ExternalLink className="h-3 w-3 ml-1" />
                        </Link>
                      </Button>
                    )}
                    <Button size="sm" variant="outline" onClick={() => setEditing(p)}>Edit</Button>
                    <Button size="sm" variant="ghost" onClick={() => deletePage(p)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {editing && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setEditing(null)}>
            <Card className="bg-background max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
              <h2 className="text-xl font-medium mb-4">Edit page</h2>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-muted-foreground">Title</label>
                  <Input value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">H1</label>
                  <Input value={editing.h1} onChange={(e) => setEditing({ ...editing, h1: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Meta description</label>
                  <Textarea rows={2} value={editing.meta_description} onChange={(e) => setEditing({ ...editing, meta_description: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Intro HTML</label>
                  <Textarea rows={10} value={editing.intro_html} onChange={(e) => setEditing({ ...editing, intro_html: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Filters (JSON)</label>
                  <Textarea
                    rows={4}
                    value={JSON.stringify(editing.filters, null, 2)}
                    onChange={(e) => {
                      try { setEditing({ ...editing, filters: JSON.parse(e.target.value) }); } catch { /* ignore */ }
                    }}
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">FAQ (JSON array)</label>
                  <Textarea
                    rows={4}
                    value={JSON.stringify(editing.faq, null, 2)}
                    onChange={(e) => {
                      try { setEditing({ ...editing, faq: JSON.parse(e.target.value) }); } catch { /* ignore */ }
                    }}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-5">
                <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
                <Button onClick={saveEdit}>Save</Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </Layout>
  );
}

export default function AdminSeoPages() {
  return (
    <AdminRoute>
      <AdminSeoPagesInner />
    </AdminRoute>
  );
}
