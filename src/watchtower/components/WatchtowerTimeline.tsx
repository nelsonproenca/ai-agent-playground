import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useWatchtowerAuth } from "@/watchtower/contexts/WatchtowerAuthContext";
import { useIsAdmin } from "@/watchtower/hooks/useIsAdmin";
import { cameraService, paymentService, healthCheckService } from "@/watchtower/services";
import type { HealthLogDto, HealthStatus } from "@/watchtower/types/api";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Video } from "lucide-react";
import { getDateGroup, formatTime, DATE_GROUP_ORDER } from "@/watchtower/lib/dateGroups";

const STATUS_OPTIONS = [
  { value: "all", label: "Todos os status" },
  { value: "Online", label: "Online" },
  { value: "Offline", label: "Offline" },
  { value: "Unknown", label: "Desconhecido" },
];

// ─── Sub-components ─────────────────────────────────────────────────────────

function StatusDot({ status }: { status: HealthStatus }) {
  const cls =
    status === "Online"
      ? "bg-primary animate-pulse"
      : status === "Offline"
        ? "bg-destructive"
        : "bg-muted-foreground/40";
  return <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${cls}`} />;
}

function TimelineItem({ log }: { log: HealthLogDto }) {
  const statusLabel =
    log.status === "Online" ? "Online" : log.status === "Offline" ? "Offline" : "Unknown";
  const statusClass =
    log.status === "Online"
      ? "text-primary border-primary/30 bg-primary/5"
      : log.status === "Offline"
        ? "text-destructive border-destructive/30 bg-destructive/5"
        : "text-muted-foreground border-border";

  return (
    <div className="flex items-center gap-3 py-2 px-3 rounded-sm hover:bg-muted/30 transition-colors">
      <StatusDot status={log.status} />
      <span className="font-mono text-[11px] text-muted-foreground w-12 shrink-0 tabular-nums">
        {formatTime(log.checkedAt)}
      </span>
      <span className="font-mono text-[11px] text-foreground truncate flex-1 min-w-0">{log.cameraName}</span>
      <Badge variant="outline" className={`font-mono text-[10px] tracking-wider shrink-0 ${statusClass}`}>
        {statusLabel}
      </Badge>
      {log.responseTimeMs !== null && (
        <span className="font-mono text-[10px] text-muted-foreground/50 w-14 text-right shrink-0 tabular-nums hidden sm:block">
          {log.responseTimeMs}ms
        </span>
      )}
    </div>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────

export function WatchtowerTimeline() {
  const { user } = useWatchtowerAuth();
  const { isAdmin } = useIsAdmin();
  const [filterCamera, setFilterCamera] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  const { data: cameras } = useQuery({
    queryKey: ["watchtower-cameras"],
    queryFn: () => cameraService.getAll(),
    enabled: !!user,
  });

  const { data: accessStatus } = useQuery({
    queryKey: ["watchtower-payment-status", user?.id],
    queryFn: () => paymentService.getStatus(),
    enabled: !!user && !isAdmin,
  });

  const { data: logs, isLoading } = useQuery({
    queryKey: ["watchtower-timeline-logs", filterCamera],
    queryFn: () =>
      healthCheckService.getLogs({
        limit: 200,
        cameraId: filterCamera !== "all" ? filterCamera : undefined,
      }),
    enabled: !!user,
    staleTime: 60_000,
  });

  const hasAccess = isAdmin || accessStatus?.userAccessStatus === "Active";

  const grouped = useMemo(() => {
    if (!logs) return [];
    const filtered = filterStatus === "all" ? logs : logs.filter((l) => l.status === filterStatus);
    const byGroup: Record<string, HealthLogDto[]> = {};
    for (const log of filtered) {
      const g = getDateGroup(log.checkedAt);
      if (!byGroup[g]) byGroup[g] = [];
      byGroup[g].push(log);
    }
    return DATE_GROUP_ORDER.filter((g) => (byGroup[g]?.length ?? 0) > 0).map((g) => ({
      label: g,
      logs: byGroup[g],
    }));
  }, [logs, filterStatus]);

  return (
    <div className="space-y-6">
      {/* Filter bar */}
      <div className="flex flex-wrap gap-3">
        <Select value={filterCamera} onValueChange={setFilterCamera}>
          <SelectTrigger className="h-9 w-52 bg-secondary border-border font-mono text-xs tracking-wide">
            <SelectValue placeholder="Câmera" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="font-mono text-xs">
              Todas as câmeras
            </SelectItem>
            {cameras?.map((c) => (
              <SelectItem key={c.id} value={c.id} className="font-mono text-xs">
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="h-9 w-44 bg-secondary border-border font-mono text-xs tracking-wide">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((s) => (
              <SelectItem key={s.value} value={s.value} className="font-mono text-xs">
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="space-y-1">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-full rounded-sm" />
          ))}
        </div>
      ) : !hasAccess ? (
        <div className="text-center py-16 space-y-3 border border-dashed border-border rounded-sm">
          <Video className="h-10 w-10 mx-auto text-muted-foreground/30" />
          <p className="font-mono text-xs tracking-widest text-muted-foreground">// sem acesso ativo</p>
          <p className="text-sm text-muted-foreground max-w-xs mx-auto leading-relaxed">
            Histórico de eventos e gravações disponíveis nos planos{" "}
            <span className="text-foreground font-medium">Prata</span> e{" "}
            <span className="text-foreground font-medium">Ouro</span>.
          </p>
        </div>
      ) : grouped.length === 0 ? (
        <div className="text-center py-16 space-y-3 border border-dashed border-border rounded-sm">
          <Video className="h-10 w-10 mx-auto text-muted-foreground/30" />
          <p className="font-mono text-xs tracking-widest text-muted-foreground">// sem eventos registrados</p>
          <p className="text-sm text-muted-foreground">
            Nenhum evento encontrado para os filtros selecionados.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {grouped.map(({ label, logs: groupLogs }) => (
            <div key={label}>
              <div className="flex items-center gap-3 mb-2">
                <span className="font-mono text-[10px] font-bold tracking-widest text-muted-foreground">
                  {label.toUpperCase()}
                </span>
                <div className="h-px flex-1 bg-border/60" />
                <span className="font-mono text-[10px] text-muted-foreground/50">
                  {groupLogs.length} {groupLogs.length === 1 ? "evento" : "eventos"}
                </span>
              </div>
              <div className="divide-y divide-border/30 border border-border/40 rounded-sm overflow-hidden">
                {groupLogs.map((log) => (
                  <TimelineItem key={log.id} log={log} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
