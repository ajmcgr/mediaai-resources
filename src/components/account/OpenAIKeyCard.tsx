import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { useOpenAIKey, useSaveOpenAIKey, useDeleteOpenAIKey } from "@/hooks/useOpenAIKey";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";

const mask = (k: string) => (k.length <= 8 ? "••••" : `${k.slice(0, 3)}••••${k.slice(-4)}`);

export const OpenAIKeyCard = () => {
  const { user } = useAuth();
  const keyQ = useOpenAIKey(user?.id);
  const save = useSaveOpenAIKey(user?.id);
  const del = useDeleteOpenAIKey(user?.id);
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState("");
  const [show, setShow] = useState(false);

  useEffect(() => { if (!keyQ.data?.api_key) setEditing(true); }, [keyQ.data]);

  const handleSave = async () => {
    const v = value.trim();
    if (!v.startsWith("sk-")) {
      toast.error("OpenAI keys start with sk-");
      return;
    }
    try {
      await save.mutateAsync(v);
      toast.success("Key saved");
      setValue(""); setEditing(false);
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const handleDelete = async () => {
    try {
      await del.mutateAsync();
      toast.success("Key removed");
      setEditing(true);
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  return (
    <section className="rounded-2xl border border-border bg-white p-6 mb-6">
      <h2 className="text-sm font-medium text-muted-foreground mb-2">AI assistant</h2>
      <p className="text-sm text-muted-foreground mb-4">
        Add your own OpenAI API key to use the in-app chat. Get one at{" "}
        <a href="https://platform.openai.com/api-keys" target="_blank" rel="noreferrer" className="text-primary hover:underline">
          platform.openai.com/api-keys
        </a>.
      </p>

      {keyQ.isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      ) : !editing && keyQ.data?.api_key ? (
        <div className="flex items-center justify-between text-sm">
          <span className="font-mono">{mask(keyQ.data.api_key)}</span>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => setEditing(true)}>Replace</Button>
            <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={handleDelete}>
              Remove
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="relative">
            <Input
              type={show ? "text" : "password"}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="sk-…"
              className="pr-10 font-mono"
            />
            <button
              type="button"
              onClick={() => setShow((s) => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleSave} disabled={save.isPending || !value.trim()}>
              {save.isPending ? "Saving…" : "Save key"}
            </Button>
            {keyQ.data?.api_key && (
              <Button size="sm" variant="ghost" onClick={() => { setEditing(false); setValue(""); }}>
                Cancel
              </Button>
            )}
          </div>
        </div>
      )}
    </section>
  );
};
