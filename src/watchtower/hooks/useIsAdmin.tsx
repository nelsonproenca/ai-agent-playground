import { useEffect, useState } from "react";
import { apiClient } from "@/watchtower/services/apiClient";
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
      try {
        const { isAdmin: flag } = await apiClient.get<{ isAdmin: boolean }>("/api/users/is-admin");
        if (!cancelled) {
          setIsAdmin(flag);
          setLoading(false);
        }
      } catch {
        if (!cancelled) {
          setIsAdmin(false);
          setLoading(false);
        }
      }
    })();
    return () => { cancelled = true; };
  }, [user, authLoading]);

  return { isAdmin, loading };
}
