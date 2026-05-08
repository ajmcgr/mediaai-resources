import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import Header from "@/components/Header";

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<"checking" | "ready" | "invalid">("checking");
  const navigate = useNavigate();

  useEffect(() => {
    let active = true;

    const markReady = () => {
      if (!active) return;
      window.history.replaceState(null, "", "/reset-password");
      setStatus("ready");
    };

    const markInvalid = () => {
      if (!active) return;
      setStatus("invalid");
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if ((event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") && session) {
        markReady();
      }
    });

    const prepareRecoverySession = async () => {
      const url = new URL(window.location.href);
      const hashParams = new URLSearchParams(url.hash.replace(/^#/, ""));
      const accessToken = hashParams.get("access_token");
      const refreshToken = hashParams.get("refresh_token");
      const code = url.searchParams.get("code");
      const tokenHash = url.searchParams.get("token_hash");
      const type = url.searchParams.get("type");

      if (accessToken && refreshToken) {
        const { error } = await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
        if (!error) {
          markReady();
          return;
        }
      }

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (!error) {
          markReady();
          return;
        }
      }

      if (tokenHash && type === "recovery") {
        const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: "recovery" });
        if (!error) {
          markReady();
          return;
        }
      }

      const { data } = await supabase.auth.getSession();
      if (data.session) {
        markReady();
        return;
      }

      window.setTimeout(async () => {
        const { data: retry } = await supabase.auth.getSession();
        if (retry.session) markReady();
        else markInvalid();
      }, 1000);
    };

    prepareRecoverySession();

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Password updated");
    navigate("/chat", { replace: true });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="max-w-md mx-auto px-6 py-16">
        <h1 className="text-3xl font-medium mb-2">Set a new password</h1>
        <p className="text-muted-foreground mb-8">Choose a strong password for your account.</p>

        {status === "checking" ? (
          <div className="rounded-lg border p-4 text-sm text-muted-foreground">
            Checking your reset link…
          </div>
        ) : status === "invalid" ? (
          <div className="rounded-lg border p-4 text-sm text-muted-foreground">
            This link is invalid or has expired. Request a new reset email.
          </div>
        ) : (
          <form onSubmit={handleUpdate} className="space-y-4">
            <div>
              <Label htmlFor="password">New password</Label>
              <Input id="password" type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <Button type="submit" className="w-full" disabled={busy}>
              {busy ? "Updating…" : "Update password"}
            </Button>
          </form>
        )}
      </main>
    </div>
  );
};

export default ResetPassword;
