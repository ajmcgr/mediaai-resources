import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // CRITICAL: subscribe BEFORE getSession to avoid missing events
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);

      // Sync to HubSpot on sign-in (idempotent, once per session)
      if (event === "SIGNED_IN" && newSession?.user?.email) {
        const u = newSession.user;
        const syncKey = `hs_synced_${u.id}`;
        if (!sessionStorage.getItem(syncKey)) {
          sessionStorage.setItem(syncKey, "1");
          const meta = (u.user_metadata ?? {}) as Record<string, string | undefined>;
          const fullName = meta.display_name || meta.full_name || meta.name;
          setTimeout(() => {
            supabase.functions.invoke("hubspot-upsert-contact", {
              body: {
                email: u.email,
                fullName,
                company: meta.company,
                source: "app-signup",
              },
            }).catch(() => { /* silent — HubSpot sync is non-critical */ });
          }, 0);
        }
      }
    });

    supabase.auth.getSession().then(({ data: { session: existing } }) => {
      setSession(existing);
      setUser(existing?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ session, user, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
