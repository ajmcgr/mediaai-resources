import { useEffect, useRef, useState } from "react";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageSquare, Send, Loader2, KeyRound } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useOpenAIKey } from "@/hooks/useOpenAIKey";
import { Link } from "react-router-dom";
import ReactMarkdown from "react-markdown";

type Msg = { role: "user" | "assistant"; content: string };

export const ChatSheet = () => {
  const { user } = useAuth();
  const keyQ = useOpenAIKey(user?.id);
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages, loading]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    const next = [...messages, { role: "user" as const, content: text }];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("chat", {
        body: { messages: next },
      });
      if (error) throw error;
      if (data?.error === "missing_key") {
        setMessages((m) => [...m, { role: "assistant", content: data.message }]);
      } else if (data?.content) {
        setMessages((m) => [...m, { role: "assistant", content: data.content }]);
      } else {
        setMessages((m) => [...m, { role: "assistant", content: "(no response)" }]);
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

  const hasKey = !!keyQ.data?.api_key;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <MessageSquare className="h-3.5 w-3.5" />Chat
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md flex flex-col p-0">
        <SheetHeader className="px-4 py-3 border-b border-border">
          <SheetTitle>Assistant</SheetTitle>
        </SheetHeader>

        {!keyQ.isLoading && !hasKey ? (
          <div className="p-4 m-4 rounded-lg border border-border bg-secondary/40 text-sm space-y-2">
            <div className="flex items-center gap-2 font-medium">
              <KeyRound className="h-4 w-4" />Connect your OpenAI key
            </div>
            <p className="text-muted-foreground">
              Bring your own OpenAI API key to use chat. It's stored privately to your account.
            </p>
            <Button asChild size="sm">
              <Link to="/account">Add key in Account</Link>
            </Button>
          </div>
        ) : null}

        <div ref={scrollRef} className="flex-1 overflow-auto px-4 py-3 space-y-3">
          {messages.length === 0 ? (
            <div className="text-sm text-muted-foreground">
              Ask things like "find tech journalists in the UK" or "show me beauty creators with 100k+ followers".
            </div>
          ) : (
            messages.map((m, i) => (
              <div
                key={i}
                className={`text-sm rounded-lg px-3 py-2 ${
                  m.role === "user"
                    ? "bg-primary text-primary-foreground ml-8"
                    : "bg-secondary mr-8"
                }`}
              >
                {m.role === "assistant" ? (
                  <div className="prose prose-sm max-w-none prose-p:my-1 prose-headings:my-2">
                    <ReactMarkdown>{m.content}</ReactMarkdown>
                  </div>
                ) : (
                  m.content
                )}
              </div>
            ))
          )}
          {loading && (
            <div className="text-sm text-muted-foreground flex items-center gap-2">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />Thinking…
            </div>
          )}
        </div>

        <div className="border-t border-border p-3 flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), send())}
            placeholder="Ask anything…"
            disabled={loading || !hasKey}
          />
          <Button onClick={send} disabled={loading || !input.trim() || !hasKey}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};
