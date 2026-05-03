import { useEffect, useRef, useState } from "react";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageSquare, Send, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import ReactMarkdown from "react-markdown";

type Msg = { role: "user" | "assistant"; content: string };

export const ChatSheet = () => {
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
      if (data?.content) {
        setMessages((m) => [...m, { role: "assistant", content: data.content }]);
      } else if (data?.message) {
        setMessages((m) => [...m, { role: "assistant", content: data.message }]);
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
            disabled={loading}
          />
          <Button onClick={send} disabled={loading || !input.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};
