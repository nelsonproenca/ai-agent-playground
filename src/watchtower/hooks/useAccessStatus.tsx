import { useCallback, useEffect, useState } from "react";
import { paymentService } from "@/watchtower/services/paymentService";
import { useIsAdmin } from "./useIsAdmin";
import { useWatchtowerAuth } from "@/watchtower/contexts/WatchtowerAuthContext";

export type AdminRequestStatus = "none" | "pending" | "approved" | "rejected";

export interface AccessStatus {
  accessReleasedAt: Date | null;
  adminRequestStatus: AdminRequestStatus;
  isAdmin: boolean;
}

export function useAccessStatus() {
  const { user, loading: authLoading } = useWatchtowerAuth();
  const { isAdmin } = useIsAdmin();
  const [status, setStatus] = useState<AccessStatus | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStatus = useCallback(async () => {
    if (!user) {
      setStatus(null);
      setLoading(false);
      return;
    }
    try {
      const dto = await paymentService.getStatus();
      const isActive = dto.userAccessStatus === "Active";
      const expiresAt = dto.accessExpiresAt ? new Date(dto.accessExpiresAt) : null;
      const isPending = dto.userAccessStatus === "PendingSetup";
      setStatus({
        // accessReleasedAt usado pelo WatchtowerWaiting para countdown.
        // Quando ativo, aponta para o vencimento do acesso (já liberado).
        accessReleasedAt: isActive ? (expiresAt ?? new Date()) : null,
        // Backend não tem workflow de pedido admin — mapeamos PendingSetup como
        // "pending" para que WatchtowerWaiting mostre a tela de aguardo correta.
        adminRequestStatus: isPending ? "pending" : "none",
        isAdmin,
      });
    } catch {
      setStatus({ accessReleasedAt: null, adminRequestStatus: "none", isAdmin });
    }
    setLoading(false);
  }, [user, isAdmin]);

  useEffect(() => {
    if (authLoading) return;
    fetchStatus();
  }, [authLoading, fetchStatus]);

  // Polling enquanto aguardando aprovação.
  useEffect(() => {
    if (!status) return;
    const isPending = status.adminRequestStatus === "pending";
    if (!isPending) return;
    const id = setInterval(fetchStatus, 10_000);
    return () => clearInterval(id);
  }, [status, fetchStatus]);

  const isAccessReleased = status?.accessReleasedAt !== null && status?.accessReleasedAt !== undefined;
  const isAdminPending = status?.adminRequestStatus === "pending";
  const isWaiting = isAdminPending;

  return { status, loading, isWaiting, isAccessReleased, isAdminPending, refresh: fetchStatus };
}
