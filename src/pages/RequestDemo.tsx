import { useState } from "react";
import Layout from "@/components/Layout";
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const RequestDemo = () => {
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    company: "",
    role: "",
    teamSize: "",
    message: "",
  });

  const update = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.company.trim()) {
      toast({ title: "Please fill in name, email, and company.", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-demo-request", {
        body: form,
      });
      if (error || (data && data.success === false)) {
        throw new Error(error?.message || data?.error || "Failed to send");
      }
      // Push to HubSpot (non-blocking)
      supabase.functions
        .invoke("hubspot-upsert-contact", {
          body: {
            email: form.email,
            fullName: form.name,
            company: form.company,
            source: "Demo Request",
          },
        })
        .catch((e) => console.warn("HubSpot sync failed", e));
      toast({
        title: "Request sent!",
        description: "Thanks — we'll be in touch within one business day.",
      });
      setForm({ name: "", email: "", company: "", role: "", teamSize: "", message: "" });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      toast({ title: "Could not send request", description: msg, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Layout>
      <Helmet>
        <title>Request a Demo — Media AI</title>
        <meta
          name="description"
          content="See Media AI in action. Request a personalized demo of our AI-powered PR and influencer marketing platform."
        />
        <link rel="canonical" href="https://trymedia.ai/request-demo" />
      </Helmet>

      <section className="container mx-auto px-4 py-16 max-w-2xl">
        <header className="mb-10 text-center">
          <h1 className="text-4xl md:text-5xl font-medium text-foreground mb-3">Request a demo</h1>
          <p className="text-lg text-muted-foreground">
            Tell us a little about your team and we'll be in touch within one business day.
          </p>
        </header>

        <form onSubmit={handleSubmit} className="space-y-5 bg-card border border-border rounded-xl p-6 md:p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input id="name" value={form.name} onChange={update("name")} required maxLength={120} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Work email *</Label>
              <Input id="email" type="email" value={form.email} onChange={update("email")} required maxLength={200} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company">Company *</Label>
              <Input id="company" value={form.company} onChange={update("company")} required maxLength={120} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Input id="role" value={form.role} onChange={update("role")} maxLength={120} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="teamSize">Team size</Label>
              <Input id="teamSize" placeholder="e.g. 1–10, 11–50, 51–200, 200+" value={form.teamSize} onChange={update("teamSize")} maxLength={40} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">What would you like to see?</Label>
            <Textarea id="message" rows={5} value={form.message} onChange={update("message")} maxLength={2000} />
          </div>

          <Button type="submit" disabled={submitting} className="w-full h-12 text-sm font-medium">
            {submitting ? "Sending…" : "Request demo"}
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            By submitting, you agree to be contacted about Media AI.
          </p>
        </form>
      </section>
    </Layout>
  );
};

export default RequestDemo;
