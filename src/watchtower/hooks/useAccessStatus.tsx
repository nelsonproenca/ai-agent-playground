import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useWatchtowerAuth } from "@/watchtower/contexts/WatchtowerAuthContext";

export type AdminRequestStatus = "none" | "pending" | "approved" | "rejected";

export interface AccessStatus {
  accessReleasedAt: Date | null;
  adminRequestStatus: AdminRequestStatus;
  isAdmin: boolean;
}

/**
 * Consulta o status de acesso do usuário logado via RPC `get_my_access_status`.
 * Recarrega automaticamente a cada 10s enquanto o status for restritivo
 * (acesso ainda não liberado OU pedido admin pendente).
 */
export function useAccessStatus() {
  const { user, loading: authLoading } = useWatchtowerAuth();
  const [status, setStatus] = useState<AccessStatus | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStatus = useCallback(async () => {
    if (!user) {
      setStatus(null);
      setLoading(false);
      return;
    }
    const { data, error } = await supabase.rpc("get_my_access_status");
    if (error) {
      console.error("[useAccessStatus] erro:", error);
      setStatus(null);
    } else if (data && data.length > 0) {
      const row = data[0];
      setStatus({
        accessReleasedAt: row.access_released_at ? new Date(row.access_released_at) : null,
        adminRequestStatus: (row.admin_request_status as AdminRequestStatus) ?? "none",
        isAdmin: Boolean(row.is_admin),
      });
    } else {
      // Sem profile ainda (caso raro): assume liberado para evitar bloqueio infinito.
      setStatus({ accessReleasedAt: new Date(0), adminRequestStatus: "none", isAdmin: false });
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (authLoading) return;
    fetchStatus();
  }, [authLoading, fetchStatus]);

  // Polling enquanto o usuário está em estado restritivo.
  useEffect(() => {
    if (!status) return;
    const now = new Date();
    const isWaitingAccess = status.accessReleasedAt && status.accessReleasedAt > now;
    const isWaitingAdmin = status.adminRequestStatus === "pending";
    if (!isWaitingAccess && !isWaitingAdmin) return;
    const id = setInterval(fetchStatus, 10_000);
    return () => clearInterval(id);
  }, [status, fetchStatus]);

  const isAccessReleased = !status?.accessReleasedAt || status.accessReleasedAt <= new Date();
  const isAdminPending = status?.adminRequestStatus === "pending";
  const isWaiting = !isAccessReleased || isAdminPending;

  return { status, loading, isWaiting, isAccessReleased, isAdminPending, refresh: fetchStatus };
}
