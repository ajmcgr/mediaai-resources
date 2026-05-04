import { useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { NavLink, useNavigate } from "react-router-dom";
import {
  Plus, Trash2, RefreshCw, Bell, BellOff, Database, MessageSquare, ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Spinner } from "@/components/ui/spinner";
import { useAuth } from "@/contexts/AuthContext";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import logoMedia from "@/assets/brand/logo-media-blue.png";
import {
  useMonitors, useUpdates, useCreateMonitor, useDeleteMonitor,
  useUpdateMonitor, useRunMonitorCheck, type AlertFrequency, type BrandMonitor,
} from "@/hooks/useMonitor";
import { toast } from "sonner";

const Monitor = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const initials = (user?.email ?? "?").slice(0, 2).toUpperCase();

  const monitors = useMonitors();
  const updates = useUpdates();
  const createMon = useCreateMonitor();
  const deleteMon = useDeleteMonitor();
  const updateMon = useUpdateMonitor();
  const runCheck = useRunMonitorCheck();

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    brand_name: "",
    website_url: "",
    competitor_urls: "",
    keywords: "",
    email_alerts: true,
    alert_frequency: "instant" as AlertFrequency,
  });

  const monitorById = useMemo(() => {
    const map = new Map<string, BrandMonitor>();
    (monitors.data ?? []).forEach((m) => map.set(m.id, m));
    return map;
  }, [monitors.data]);

  const handleCreate = async () => {
    if (!form.brand_name.trim() || !form.website_url.trim()) {
      toast.error("Brand name and website URL are required");
      return;
    }
    try {
      await createMon.mutateAsync({
        brand_name: form.brand_name.trim(),
        website_url: form.website_url.trim(),
        competitor_urls: form.competitor_urls
          .split(/[\n,]+/).map((s) => s.trim()).filter(Boolean),
        keywords: form.keywords
          .split(/[\n,]+/).map((s) => s.trim()).filter(Boolean),
        email_alerts: form.email_alerts,
        alert_frequency: form.alert_frequency,
      });
      toast.success("Brand added to monitor");
      setOpen(false);
      setForm({
        brand_name: "", website_url: "", competitor_urls: "", keywords: "",
        email_alerts: true, alert_frequency: "instant",
      });
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const handleSignOut = async () => { await signOut(); navigate("/"); };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Helmet><title>Monitor — Media AI</title></Helmet>

      <header className="h-14 border-b border-border bg-white flex items-center justify-between px-4 flex-shrink-0">
        <NavLink to="/dashboard" className="flex items-center">
          <img src={logoMedia} alt="Media AI" className="h-5" />
        </NavLink>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => navigate("/chat")}>
            <MessageSquare className="h-3.5 w-3.5" />Chat
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => navigate("/dashboard")}>
            <Database className="h-3.5 w-3.5" />Database
          </Button>
          <Button variant="default" size="sm" className="gap-1.5">
            <Bell className="h-3.5 w-3.5" />Monitor
          </Button>
          <InboxSheet />
          <ListsSheet />
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

      <main className="flex-1 overflow-auto">
        <div className="max-w-6xl mx-auto p-6 space-y-10">
          {/* Brands */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-2xl font-medium" style={{ fontFamily: "var(--font-heading)" }}>Brand Monitor</h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Track brands and competitors. We check daily and surface PR opportunities.
                </p>
              </div>
              <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="gap-1.5"><Plus className="h-4 w-4" />Add brand</Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader><DialogTitle>Add brand to monitor</DialogTitle></DialogHeader>
                  <div className="space-y-3">
                    <div>
                      <Label>Brand name</Label>
                      <Input value={form.brand_name} onChange={(e) => setForm({ ...form, brand_name: e.target.value })} placeholder="Acme Inc." />
                    </div>
                    <div>
                      <Label>Website URL</Label>
                      <Input value={form.website_url} onChange={(e) => setForm({ ...form, website_url: e.target.value })} placeholder="https://acme.com" />
                    </div>
                    <div>
                      <Label>Competitor URLs (comma or newline separated)</Label>
                      <Textarea rows={2} value={form.competitor_urls} onChange={(e) => setForm({ ...form, competitor_urls: e.target.value })} placeholder="https://competitor1.com, https://competitor2.com" />
                    </div>
                    <div>
                      <Label>Keywords (optional)</Label>
                      <Textarea rows={2} value={form.keywords} onChange={(e) => setForm({ ...form, keywords: e.target.value })} placeholder="funding, launch, partnership" />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Email alerts</Label>
                        <p className="text-xs text-muted-foreground">Send a summary email when a meaningful change is detected.</p>
                      </div>
                      <Switch checked={form.email_alerts} onCheckedChange={(v) => setForm({ ...form, email_alerts: v })} />
                    </div>
                    <div>
                      <Label>Frequency</Label>
                      <Select value={form.alert_frequency} onValueChange={(v) => setForm({ ...form, alert_frequency: v as AlertFrequency })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="instant">Instant</SelectItem>
                          <SelectItem value="daily">Daily digest</SelectItem>
                          <SelectItem value="weekly">Weekly digest</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                    <Button onClick={handleCreate} disabled={createMon.isPending}>
                      {createMon.isPending ? "Adding…" : "Add brand"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            <div className="rounded-lg border border-border bg-white overflow-hidden">
              {monitors.isLoading ? (
                <div className="p-8 flex justify-center"><Spinner /></div>
              ) : (monitors.data?.length ?? 0) === 0 ? (
                <div className="p-12 text-center text-sm text-muted-foreground">
                  No brands yet. Add your first brand to start tracking.
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {monitors.data!.map((m) => (
                    <div key={m.id} className="p-4 flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{m.brand_name}</span>
                          <a href={m.website_url} target="_blank" rel="noreferrer" className="text-xs text-primary inline-flex items-center gap-1 truncate">
                            {m.website_url}<ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {m.competitor_urls.length} competitor{m.competitor_urls.length === 1 ? "" : "s"} • {m.keywords.length} keyword{m.keywords.length === 1 ? "" : "s"} • {m.alert_frequency}
                          {m.last_checked_at && <> • last checked {new Date(m.last_checked_at).toLocaleString()}</>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          type="button"
                          onClick={() => updateMon.mutate({ id: m.id, patch: { email_alerts: !m.email_alerts } })}
                          className="text-muted-foreground hover:text-foreground"
                          title={m.email_alerts ? "Disable email alerts" : "Enable email alerts"}
                        >
                          {m.email_alerts ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
                        </button>
                        <Button
                          variant="outline" size="sm"
                          disabled={runCheck.isPending}
                          onClick={async () => {
                            try {
                              await runCheck.mutateAsync(m.id);
                              toast.success("Check complete");
                            } catch (e) { toast.error((e as Error).message); }
                          }}
                        >
                          <RefreshCw className={`h-3.5 w-3.5 mr-1 ${runCheck.isPending ? "animate-spin" : ""}`} />Run check
                        </Button>
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm(`Delete monitor for ${m.brand_name}?`)) deleteMon.mutate(m.id);
                          }}
                          className="text-muted-foreground hover:text-destructive"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* Updates */}
          <section>
            <h2 className="text-lg font-medium mb-3" style={{ fontFamily: "var(--font-heading)" }}>Updates</h2>
            <div className="rounded-lg border border-border bg-white overflow-hidden">
              {updates.isLoading ? (
                <div className="p-8 flex justify-center"><Spinner /></div>
              ) : (updates.data?.length ?? 0) === 0 ? (
                <div className="p-12 text-center text-sm text-muted-foreground">
                  No updates yet. Run a check on a brand or wait for the daily scan.
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {updates.data!.map((u) => {
                    const m = monitorById.get(u.monitor_id);
                    return (
                      <div key={u.id} className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-medium">{m?.brand_name ?? "Brand"}</span>
                              <span className="text-xs px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">
                                {u.url_kind}
                              </span>
                              <a href={u.url} target="_blank" rel="noreferrer" className="text-xs text-primary inline-flex items-center gap-1 truncate max-w-[280px]">
                                {u.url}<ExternalLink className="h-3 w-3" />
                              </a>
                            </div>
                            <p className="text-sm mt-2">{u.summary}</p>
                            {u.why_it_matters && <p className="text-xs text-muted-foreground mt-1">Why it matters: {u.why_it_matters}</p>}
                            {u.next_action && <p className="text-xs mt-1"><strong>Next action:</strong> {u.next_action}</p>}
                            {u.pitch_angle && <p className="text-xs mt-1"><strong>Pitch angle:</strong> {u.pitch_angle}</p>}
                          </div>
                          <div className="flex flex-col items-end gap-1 flex-shrink-0">
                            {u.pr_score != null && (
                              <span className="text-sm font-medium px-2 py-1 rounded bg-primary/10 text-primary">
                                PR {u.pr_score}
                              </span>
                            )}
                            <span className="text-xs text-muted-foreground">{new Date(u.detected_at).toLocaleDateString()}</span>
                            <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                              {u.email_sent ? "Emailed" : "No email"}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default Monitor;
