import { useCallback, useEffect, useRef, useState } from "react";

export type BackendStatus = "checking" | "online" | "offline";

export interface BackendStatusInfo {
  status: BackendStatus;
  baseUrl: string;
  responseTimeMs: number | null;
  errorMessage: string | null;
  lastCheckedAt: Date | null;
  check: () => Promise<void>;
}

const BASE_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? "";
const HEALTH_PATH = "/api/health-check/ping";
const TIMEOUT_MS = 8000;

/**
 * Monitora a disponibilidade do backend externo (VITE_API_URL).
 * Faz uma requisição leve e mede o tempo de resposta. Detecta "Failed to fetch"
 * (CORS/DNS/offline) e timeouts como Offline.
 */
export function useBackendStatus(autoIntervalMs = 60_000): BackendStatusInfo {
  const [status, setStatus] = useState<BackendStatus>("checking");
  const [responseTimeMs, setResponseTimeMs] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastCheckedAt, setLastCheckedAt] = useState<Date | null>(null);
  const inFlight = useRef(false);

  const check = useCallback(async () => {
    if (inFlight.current) return;
    if (!BASE_URL) {
      setStatus("offline");
      setErrorMessage("VITE_API_URL não configurada");
      setResponseTimeMs(null);
      setLastCheckedAt(new Date());
      return;
    }

    inFlight.current = true;
    setStatus("checking");
    const start = performance.now();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      // Tenta um endpoint leve. Mesmo que retorne 401/404, significa que
      // o servidor RESPONDEU (logo, está online).
      const res = await fetch(`${BASE_URL}${HEALTH_PATH}`, {
        method: "GET",
        signal: controller.signal,
        cache: "no-store",
      });
      const elapsed = Math.round(performance.now() - start);
      setResponseTimeMs(elapsed);
      setStatus("online");
      setErrorMessage(
        res.ok ? null : `Servidor respondeu HTTP ${res.status}`,
      );
    } catch (err) {
      const elapsed = Math.round(performance.now() - start);
      setResponseTimeMs(elapsed);
      setStatus("offline");
      const msg =
        err instanceof DOMException && err.name === "AbortError"
          ? `Timeout após ${TIMEOUT_MS}ms`
          : err instanceof TypeError
            ? "Failed to fetch (CORS, DNS ou servidor offline)"
            : err instanceof Error
              ? err.message
              : "Erro desconhecido";
      setErrorMessage(msg);
    } finally {
      clearTimeout(timeout);
      setLastCheckedAt(new Date());
      inFlight.current = false;
    }
  }, []);

  useEffect(() => {
    void check();
    if (autoIntervalMs > 0) {
      const id = setInterval(() => void check(), autoIntervalMs);
      return () => clearInterval(id);
    }
  }, [check, autoIntervalMs]);

  return {
    status,
    baseUrl: BASE_URL,
    responseTimeMs,
    errorMessage,
    lastCheckedAt,
    check,
  };
}
