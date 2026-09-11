import { Link } from "react-router-dom";
import type { CameraDto, HealthLogDto } from "@/watchtower/types/api";

interface CameraInspectorProps {
  camera: CameraDto;
  logs: HealthLogDto[];
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

export function WatchtowerCameraInspector({ camera, logs }: CameraInspectorProps) {
  const latestLog = logs[0];
  const isOnline = latestLog?.status === "Online";
  const hasStatus = !!latestLog;

  return (
    <div className="flex flex-col h-full">
      {/* ── Inspector info ──────────────────────────────────────────── */}
      <div className="p-4 border-b border-border space-y-4">
        <p className="font-mono text-[10px] tracking-widest text-muted-foreground">// INSPECTOR</p>

        <div>
          <h3 className="font-mono text-sm font-bold text-foreground tracking-wider leading-tight">
            {camera.name.toUpperCase()}
          </h3>
          {camera.locationName && (
            <p className="text-xs text-muted-foreground mt-1">{camera.locationName}</p>
          )}
        </div>

        <div className="space-y-2 text-xs">
          <div className="flex items-center justify-between gap-2">
            <span className="text-muted-foreground">Status</span>
            <div className="flex items-center gap-1.5">
              <span
                className={`h-1.5 w-1.5 rounded-full shrink-0 ${
                  isOnline
                    ? "bg-primary animate-pulse"
                    : hasStatus
                      ? "bg-destructive"
                      : "bg-muted-foreground/40"
                }`}
              />
              <span
                className={
                  isOnline ? "text-primary" : hasStatus ? "text-destructive" : "text-muted-foreground"
                }
              >
                {isOnline ? "Online" : hasStatus ? "Offline" : "Desconhecido"}
              </span>
            </div>
          </div>

          {latestLog && (
            <div className="flex items-center justify-between gap-2">
              <span className="text-muted-foreground">Última check</span>
              <span className="font-mono text-[11px] text-muted-foreground tabular-nums">
                {formatTime(latestLog.checkedAt)}
              </span>
            </div>
          )}

          {latestLog?.responseTimeMs !== null && latestLog?.responseTimeMs !== undefined && (
            <div className="flex items-center justify-between gap-2">
              <span className="text-muted-foreground">Latência</span>
              <span className="font-mono text-[11px] text-muted-foreground tabular-nums">
                {latestLog.responseTimeMs}ms
              </span>
            </div>
          )}

          <div className="flex items-center justify-between gap-2">
            <span className="text-muted-foreground">Câmera</span>
            <span className={camera.isActive ? "text-primary" : "text-muted-foreground"}>
              {camera.isActive ? "Ativa" : "Inativa"}
            </span>
          </div>
        </div>
      </div>

      {/* ── Event log ────────────────────────────────────────────────── */}
      <div className="flex flex-col flex-1 min-h-0">
        <div className="px-4 py-3 border-b border-border">
          <p className="font-mono text-[10px] tracking-widest text-muted-foreground">// LOG DE EVENTOS</p>
        </div>

        <div className="overflow-y-auto max-h-64">
          {logs.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-6 px-4">
              Nenhum log disponível para esta câmera.
            </p>
          ) : (
            logs.map((log) => (
              <div
                key={log.id}
                className="flex items-center gap-2 px-4 py-2 border-b border-border/30 hover:bg-muted/20 transition-colors font-mono text-[10px]"
              >
                <span className="text-muted-foreground tabular-nums w-10 shrink-0">
                  {formatTime(log.checkedAt)}
                </span>
                <span
                  className={
                    log.status === "Online"
                      ? "text-primary"
                      : log.status === "Offline"
                        ? "text-destructive"
                        : "text-muted-foreground"
                  }
                >
                  {log.status}
                </span>
                {log.responseTimeMs !== null && (
                  <span className="text-muted-foreground/50 ml-auto tabular-nums">
                    {log.responseTimeMs}ms
                  </span>
                )}
              </div>
            ))
          )}
        </div>

        <div className="px-4 py-3 border-t border-border mt-auto">
          <Link
            to="/watchtower/dashboard/health"
            className="font-mono text-[10px] tracking-widest text-muted-foreground hover:text-primary transition-colors"
          >
            Ver todos →
          </Link>
        </div>
      </div>
    </div>
  );
}
