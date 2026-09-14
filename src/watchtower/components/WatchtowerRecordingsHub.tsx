import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Download, Loader2, Video } from "lucide-react";
import { useWatchtowerAuth } from "@/watchtower/contexts/WatchtowerAuthContext";
import { useIsAdmin } from "@/watchtower/hooks/useIsAdmin";
import { cameraService, paymentService, recordingService } from "@/watchtower/services";
import type { RecordingWindowWithCamera } from "@/watchtower/services/recordingService";
import { getDateGroup, formatTime, DATE_GROUP_ORDER } from "@/watchtower/lib/dateGroups";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

function formatDuration(seconds: number): string {
  const minutes = Math.round(seconds / 60);
  return minutes >= 1 ? `${minutes} min` : `${Math.round(seconds)}s`;
}

function RecordingRow({ window }: { window: RecordingWindowWithCamera }) {
  const [downloading, setDownloading] = useState(false);
  const { toast } = useToast();

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const { blob, filename } = await recordingService.download(window.cameraSlug, window);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename ?? `gravacao-${window.start}.mp4`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch {
      toast({
        variant: "destructive",
        title: "Não foi possível baixar essa gravação",
        description: "Tente novamente em instantes.",
      });
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="flex items-center gap-3 py-2 px-3 rounded-sm hover:bg-muted/30 transition-colors">
      <span className="font-mono text-[11px] text-muted-foreground w-12 shrink-0 tabular-nums">
        {formatTime(window.start)}
      </span>
      <span className="font-mono text-[11px] text-foreground truncate flex-1 min-w-0">{window.cameraName}</span>
      <span className="font-mono text-[10px] text-muted-foreground/70 w-16 text-right shrink-0 tabular-nums">
        {formatDuration(window.durationSeconds)}
      </span>
      <button
        onClick={handleDownload}
        disabled={downloading}
        className="text-muted-foreground hover:text-foreground transition-colors shrink-0 disabled:opacity-50"
        aria-label="Baixar gravação"
      >
        {downloading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
      </button>
    </div>
  );
}

export function WatchtowerRecordingsHub() {
  const { user } = useWatchtowerAuth();
  const { isAdmin } = useIsAdmin();
  const [filterCamera, setFilterCamera] = useState("all");

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

  const hasAccess = isAdmin || accessStatus?.userAccessStatus === "Active";
  const canDownload = isAdmin || !!accessStatus?.canDownload;

  const camerasToQuery = useMemo(() => {
    if (!cameras) return [];
    return filterCamera === "all" ? cameras : cameras.filter((c) => c.id === filterCamera);
  }, [cameras, filterCamera]);

  const { data: windows, isLoading } = useQuery({
    queryKey: ["watchtower-recordings-hub", camerasToQuery.map((c) => c.slug)],
    queryFn: () => recordingService.listAllWindows(camerasToQuery),
    enabled: !!user && hasAccess && canDownload && camerasToQuery.length > 0,
  });

  const grouped = useMemo(() => {
    if (!windows) return [];
    const byGroup: Record<string, RecordingWindowWithCamera[]> = {};
    for (const w of windows) {
      const g = getDateGroup(w.start);
      if (!byGroup[g]) byGroup[g] = [];
      byGroup[g].push(w);
    }
    return DATE_GROUP_ORDER.filter((g) => (byGroup[g]?.length ?? 0) > 0).map((g) => ({
      label: g,
      windows: byGroup[g],
    }));
  }, [windows]);

  return (
    <div className="space-y-6">
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
      </div>

      {!hasAccess ? (
        <div className="text-center py-16 space-y-3 border border-dashed border-border rounded-sm">
          <Video className="h-10 w-10 mx-auto text-muted-foreground/30" />
          <p className="font-mono text-xs tracking-widest text-muted-foreground">// sem acesso ativo</p>
          <p className="text-sm text-muted-foreground max-w-xs mx-auto leading-relaxed">
            Gravações disponíveis nos planos <span className="text-foreground font-medium">Prata</span> e{" "}
            <span className="text-foreground font-medium">Ouro</span>.
          </p>
        </div>
      ) : !canDownload ? (
        <div className="text-center py-16 space-y-3 border border-dashed border-border rounded-sm">
          <Video className="h-10 w-10 mx-auto text-muted-foreground/30" />
          <p className="font-mono text-xs tracking-widest text-muted-foreground">// download indisponível no seu plano</p>
          <p className="text-sm text-muted-foreground max-w-xs mx-auto leading-relaxed">
            Baixar gravações está disponível nos planos <span className="text-foreground font-medium">Prata</span> e{" "}
            <span className="text-foreground font-medium">Ouro</span>.
          </p>
        </div>
      ) : isLoading ? (
        <div className="space-y-1">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-full rounded-sm" />
          ))}
        </div>
      ) : grouped.length === 0 ? (
        <div className="text-center py-16 space-y-3 border border-dashed border-border rounded-sm">
          <Video className="h-10 w-10 mx-auto text-muted-foreground/30" />
          <p className="font-mono text-xs tracking-widest text-muted-foreground">// sem gravações registradas</p>
          <p className="text-sm text-muted-foreground">
            Nenhuma gravação encontrada para os filtros selecionados.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {grouped.map(({ label, windows: groupWindows }) => (
            <div key={label}>
              <div className="flex items-center gap-3 mb-2">
                <span className="font-mono text-[10px] font-bold tracking-widest text-muted-foreground">
                  {label.toUpperCase()}
                </span>
                <div className="h-px flex-1 bg-border/60" />
                <span className="font-mono text-[10px] text-muted-foreground/50">
                  {groupWindows.length} {groupWindows.length === 1 ? "gravação" : "gravações"}
                </span>
              </div>
              <div className="divide-y divide-border/30 border border-border/40 rounded-sm overflow-hidden">
                {groupWindows.map((w) => (
                  <RecordingRow key={`${w.cameraSlug}-${w.start}`} window={w} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
