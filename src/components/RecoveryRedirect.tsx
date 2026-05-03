import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

/**
 * Listens for Supabase PASSWORD_RECOVERY events. When the user clicks a
 * password reset link, Supabase establishes a recovery session and fires
 * this event — we must route them to /reset-password so they can set a new
 * password instead of landing on the dashboard.
 */
const RecoveryRedirect = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Handle direct landing with recovery hash (covers initial page load)
    const hash = window.location.hash;
    if (hash.includes("type=recovery")) {
      if (window.location.pathname !== "/reset-password") {
        navigate("/reset-password" + window.location.hash, { replace: true });
      }
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        navigate("/reset-password", { replace: true });
      }
    });
    return () => subscription.unsubscribe();
  }, [navigate]);

  return null;
};

export default RecoveryRedirect;
