import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useWatchtowerAuth } from "@/watchtower/contexts/WatchtowerAuthContext";

export function useIsAdmin() {
  const { user, loading: authLoading } = useWatchtowerAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    if (authLoading) return;
    if (!user) {
      setIsAdmin(false);
      setLoading(false);
      return;
    }
    (async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();
      if (!cancelled) {
        setIsAdmin(!error && !!data);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, authLoading]);

  return { isAdmin, loading };
}
