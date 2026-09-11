import { useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Lock, Maximize2, Play, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useWatchtowerAuth } from "@/watchtower/contexts/WatchtowerAuthContext";
import { useIsAdmin } from "@/watchtower/hooks/useIsAdmin";
import { cameraService, streamService, paymentService, healthCheckService } from "@/watchtower/services";
import { WatchtowerHLSPlayer } from "@/watchtower/components/WatchtowerHLSPlayer";
import { WatchtowerCameraInspector } from "@/watchtower/components/WatchtowerCameraInspector";

export default function WatchtowerLive() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useWatchtowerAuth();
  const { isAdmin } = useIsAdmin();
  const containerRef = useRef<HTMLDivElement>(null);

  const { data: cameras, isLoading: camerasLoading } = useQuery({
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

  const slugParam = searchParams.get("camera");
  const selectedCamera = cameras?.find((c) => c.slug === slugParam) ?? cameras?.[0] ?? null;

  const { data: streamData, isLoading: streamLoading } = useQuery({
    queryKey: ["watchtower-stream", selectedCamera?.slug],
    queryFn: () => streamService.getUrl(selectedCamera!.slug),
    enabled: !!selectedCamera && hasAccess,
    staleTime: 5 * 60 * 1000,
  });

  const { data: healthLogs = [] } = useQuery({
    queryKey: ["watchtower-health-logs-inspector", selectedCamera?.id],
    queryFn: () => healthCheckService.getLogs({ limit: 20, cameraId: selectedCamera!.id }),
    enabled: !!selectedCamera,
    staleTime: 60_000,
  });

  const handleCameraChange = (slug: string) => {
    setSearchParams({ camera: slug }, { replace: true });
  };

  const handleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen();
    }
  };

  if (camerasLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-3xl font-bold text-foreground tracking-wider">AO VIVO</h2>
          <p className="text-xs tracking-[0.15em] text-muted-foreground mt-1">TRANSMISSÃO EM TEMPO REAL</p>
        </div>

        {cameras && cameras.length > 1 && (
          <Select value={selectedCamera?.slug ?? ""} onValueChange={handleCameraChange}>
            <SelectTrigger className="w-52 h-9 bg-secondary border-border font-mono text-xs tracking-wide">
              <SelectValue placeholder="Selecionar câmera" />
            </SelectTrigger>
            <SelectContent>
              {cameras.map((c) => (
                <SelectItem key={c.id} value={c.slug} className="font-mono text-xs">
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* ── Main layout ─────────────────────────────────────────────────── */}
      {!selectedCamera ? (
        <div className="text-center py-16 border border-dashed border-border rounded-sm">
          <p className="text-sm text-muted-foreground">Nenhuma câmera disponível.</p>
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Left column: player + controls */}
          <div className="flex-1 min-w-0">
            <div className="border border-border rounded-sm overflow-hidden">
              {/* Player */}
              <div ref={containerRef} className="relative aspect-video bg-black">
                {!hasAccess ? (
                  <div className="absolute inset-0 flex items-center justify-center glass-overlay">
                    <div className="text-center space-y-4">
                      <Lock className="h-10 w-10 text-primary mx-auto" />
                      <p className="text-xs tracking-[0.2em] font-semibold text-foreground">
                        ACESSO BLOQUEADO
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Contrate um plano para visualizar ao vivo.
                      </p>
                    </div>
                  </div>
                ) : streamLoading ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-black">
                    <Loader2 className="h-8 w-8 text-primary animate-spin" />
                  </div>
                ) : streamData ? (
                  <>
                    <WatchtowerHLSPlayer streamUrl={streamData.streamUrl} />
                    <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded bg-destructive/90 pointer-events-none z-10">
                      <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse-glow" />
                      <span className="text-[10px] font-bold text-white tracking-wider">AO VIVO</span>
                    </div>
                  </>
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center bg-black">
                    <Loader2 className="h-6 w-6 text-muted-foreground animate-spin" />
                  </div>
                )}
              </div>

              {/* Playback controls */}
              <div className="bg-card px-4 py-3 border-t border-border space-y-2">
                {/* Progress bar — stub for future recordings */}
                <div
                  className="h-0.5 bg-muted rounded-full cursor-not-allowed"
                  title="Controles de gravação disponíveis nos planos Prata e Ouro"
                >
                  <div className="h-full w-0 bg-primary rounded-full" />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0 text-muted-foreground/50"
                      disabled
                      title="Play/Pause disponível com gravações"
                    >
                      <Play className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0 text-muted-foreground/50"
                      disabled
                      title="Volume"
                    >
                      <Volume2 className="h-3.5 w-3.5" />
                    </Button>
                    <span className="font-mono text-[10px] text-muted-foreground/50 ml-2 tracking-widest">
                      AO VIVO
                    </span>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                    onClick={handleFullscreen}
                    title="Tela cheia"
                  >
                    <Maximize2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Right column: inspector */}
          <div className="w-full lg:w-80 shrink-0 border border-border rounded-sm bg-card overflow-hidden">
            <WatchtowerCameraInspector camera={selectedCamera} logs={healthLogs} />
          </div>
        </div>
      )}
    </div>
  );
}
