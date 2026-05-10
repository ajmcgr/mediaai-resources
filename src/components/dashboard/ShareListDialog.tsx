import { useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Share2, Copy, Check, Mail, Loader2, Linkedin, MessageCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

interface ShareListDialogProps {
  listId: string;
  listName: string;
}

export const ShareListDialog = ({ listId, listName }: ShareListDialogProps) => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [senderName, setSenderName] = useState(
    user?.user_metadata?.full_name || (user?.email ? user.email.split("@")[0] : "")
  );
  const [note, setNote] = useState("");
  const [token, setToken] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [recipients, setRecipients] = useState("");
  const [sending, setSending] = useState(false);
  const [copied, setCopied] = useState(false);

  const shareUrl = token ? `${window.location.origin}/shared/${token}` : "";

  const reset = () => {
    setToken(null);
    setRecipients("");
    setCopied(false);
  };

  const handleCreate = async () => {
    setCreating(true);
    try {
      const { data, error } = await supabase.functions.invoke("share-list-create", {
        body: {
          listId,
          senderName: senderName.trim() || null,
          note: note.trim() || null,
          includeEmails: true,
        },
      });
      if (error) throw error;
      const t = (data as { token?: string })?.token;
      if (!t) throw new Error("No token returned");
      setToken(t);
    } catch (e) {
      toast({ title: "Couldn't create share link", description: (e as Error).message, variant: "destructive" });
    } finally {
      setCreating(false);
    }
  };

  const handleCopy = async () => {
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const handleSendEmail = async () => {
    if (!token) return;
    const list = recipients
      .split(/[,\s]+/)
      .map((r) => r.trim())
      .filter(Boolean);
    if (!list.length) {
      toast({ title: "Add at least one email" });
      return;
    }
    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke("share-list-email", {
        body: {
          token,
          recipients: list,
          note: note.trim(),
          senderName: senderName.trim(),
          shareUrl,
        },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      toast({ title: "Email sent", description: `Sent to ${list.length} recipient${list.length === 1 ? "" : "s"}.` });
      setRecipients("");
    } catch (e) {
      toast({ title: "Couldn't send email", description: (e as Error).message, variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  const shareText = `${senderName ? `${senderName} shared` : "Check out"} "${listName}" — a media list on Media AI`;

  const socialLinks = token ? {
    twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`,
    whatsapp: `https://wa.me/?text=${encodeURIComponent(`${shareText} ${shareUrl}`)}`,
  } : null;

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) reset(); }}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="gap-1.5">
          <Share2 className="h-3.5 w-3.5" />Share
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share "{listName}"</DialogTitle>
          <DialogDescription>
            Create a read-only link anyone can open to view this list.
          </DialogDescription>
        </DialogHeader>

        {!token ? (
          <div className="space-y-3">
            <div>
              <Label htmlFor="sender-name">Your name</Label>
              <Input
                id="sender-name"
                value={senderName}
                onChange={(e) => setSenderName(e.target.value)}
                placeholder="Your name"
                maxLength={120}
              />
            </div>
            <div>
              <Label htmlFor="note">Add a note (optional)</Label>
              <Textarea
                id="note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Hey, thought this list might help with your launch…"
                maxLength={1000}
                rows={3}
              />
            </div>
            <DialogFooter>
              <Button onClick={handleCreate} disabled={creating}>
                {creating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Create share link
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <Label>Shareable link</Label>
              <div className="flex gap-2 mt-1.5">
                <Input value={shareUrl} readOnly className="font-mono text-xs" />
                <Button type="button" size="sm" variant="outline" onClick={handleCopy} className="shrink-0 gap-1.5">
                  {copied ? <><Check className="h-3.5 w-3.5" />Copied</> : <><Copy className="h-3.5 w-3.5" />Copy</>}
                </Button>
              </div>
            </div>

            <div className="border-t border-border pt-4">
              <Label htmlFor="recipients" className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" />Send via email</Label>
              <Input
                id="recipients"
                value={recipients}
                onChange={(e) => setRecipients(e.target.value)}
                placeholder="friend@example.com, another@example.com"
                className="mt-1.5"
              />
              <Button onClick={handleSendEmail} disabled={sending} size="sm" className="mt-2 w-full">
                {sending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Send email
              </Button>
            </div>

            {socialLinks && (
              <div className="border-t border-border pt-4">
                <Label>Share on socials</Label>
                <div className="grid grid-cols-3 gap-2 mt-1.5">
                  <Button asChild variant="outline" size="sm" className="gap-1.5">
                    <a href={socialLinks.twitter} target="_blank" rel="noreferrer noopener">
                      <span className="font-bold">𝕏</span> Twitter
                    </a>
                  </Button>
                  <Button asChild variant="outline" size="sm" className="gap-1.5">
                    <a href={socialLinks.linkedin} target="_blank" rel="noreferrer noopener">
                      <Linkedin className="h-3.5 w-3.5" /> LinkedIn
                    </a>
                  </Button>
                  <Button asChild variant="outline" size="sm" className="gap-1.5">
                    <a href={socialLinks.whatsapp} target="_blank" rel="noreferrer noopener">
                      <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
                    </a>
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
