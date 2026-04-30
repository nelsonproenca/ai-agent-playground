import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Lock, Download, Maximize2, Minimize2, Eye, Play, Square, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { WatchtowerHLSPlayer } from "./WatchtowerHLSPlayer";
import { WatchtowerPlanModal } from "./WatchtowerPlanModal";
import { streamService } from "@/watchtower/services";
import { useToast } from "@/hooks/use-toast";
import type { CameraDto } from "@/watchtower/types/api";

interface CameraCardProps {
  camera: CameraDto;
  hasAccess: boolean;
}

export function WatchtowerCameraCard({ camera, hasAccess }: CameraCardProps) {
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [isWatching, setIsWatching] = useState(false);
  const [theaterOpen, setTheaterOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const { data: streamData, isFetching: streamLoading } = useQuery({
    queryKey: ["watchtower-stream", camera.slug],
    queryFn: () => streamService.getUrl(camera.slug),
    enabled: hasAccess && isWatching,
    staleTime: 5 * 60 * 1000, // 5 min — revalida antes do token de 60 min expirar
  });

  // Rastreia entrada/saída de fullscreen via evento nativo para manter estado sincronizado
  useEffect(() => {
    const onFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  const handleStop = () => {
    setIsWatching(false);
    setTheaterOpen(false);
    if (document.fullscreenElement) document.exitFullscreen();
  };

  const handleFullscreen = () => {
    if (!document.fullscreenElement) {
      videoContainerRef.current?.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  const handleDownload = () => {
    toast({
      title: "Download indisponível para streaming ao vivo",
      description: "Gravações estão disponíveis nos planos Prata e Ouro.",
    });
  };

  const handleOpenTheater = () => {
    // Sai do fullscreen antes de abrir o teatro para evitar conflito de contexto
    if (document.fullscreenElement) document.exitFullscreen();
    setTheaterOpen(true);
  };

  const isStreaming = isWatching && !!streamData;

  return (
    <>
      <Card className="overflow-hidden border-border bg-card group">
        <div ref={videoContainerRef} className="relative aspect-video bg-black">

          {/* ── Acesso bloqueado ─────────────────────────────────────── */}
          {!hasAccess ? (
            <div className="absolute inset-0 flex items-center justify-center glass-overlay">
              <div className="text-center space-y-4">
                <Lock className="h-10 w-10 text-primary mx-auto" />
                <p className="text-xs tracking-[0.2em] font-semibold text-foreground">
                  ACESSO BLOQUEADO
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-primary/30 text-foreground text-[10px] tracking-wider font-semibold px-6"
                  onClick={() => setShowPlanModal(true)}
                >
                  VER PLANOS →
                </Button>
              </div>
            </div>

          /* ── Placeholder do modo teatro (card congela) ─────────── */
          ) : isStreaming && theaterOpen ? (
            <div className="absolute inset-0 flex items-center justify-center bg-black/85">
              <div className="text-center space-y-3">
                <Eye className="h-8 w-8 text-white/50 mx-auto" />
                <p className="text-[10px] tracking-[0.2em] font-semibold text-white/50">
                  MODO TEATRO ATIVO
                </p>
                <button
                  onClick={() => setTheaterOpen(false)}
                  className="text-[10px] text-white/40 hover:text-white/80 transition-colors tracking-wider"
                >
                  FECHAR TEATRO →
                </button>
              </div>
            </div>

          /* ── Player ativo ───────────────────────────────────────── */
          ) : isStreaming ? (
            <>
              {/* Player ocupa absolute inset-0 internamente */}
              <WatchtowerHLSPlayer streamUrl={streamData.streamUrl} />

              {/* Overlays posicionados sobre o player */}
              <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded bg-destructive/90 pointer-events-none z-10">
                <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse-glow" />
                <span className="text-[10px] font-bold text-white tracking-wider">AO VIVO</span>
              </div>

              {isFullscreen && (
                <button
                  onClick={handleFullscreen}
                  className="absolute top-3 right-3 p-1.5 rounded bg-black/50 hover:bg-black/75 text-white transition-colors z-10"
                  aria-label="Sair da tela cheia"
                >
                  <Minimize2 className="h-4 w-4" />
                </button>
              )}
            </>

          /* ── Estado inicial / conectando ────────────────────────── */
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-secondary/30">
              <div className="text-center space-y-4 px-4">
                <div className="h-12 w-12 rounded-full border border-primary/30 bg-primary/10 flex items-center justify-center mx-auto">
                  {streamLoading
                    ? <Loader2 className="h-6 w-6 text-primary animate-spin" />
                    : <Play className="h-6 w-6 text-primary ml-0.5" />
                  }
                </div>
                <p className="text-[10px] tracking-[0.25em] font-semibold text-muted-foreground">
                  {streamLoading ? "CONECTANDO..." : "STREAM DESLIGADO"}
                </p>
                <Button
                  size="sm"
                  className="text-[10px] tracking-wider font-semibold px-6"
                  onClick={() => setIsWatching(true)}
                  disabled={streamLoading}
                >
                  <Play className="h-3 w-3 mr-1.5" />
                  VISUALIZAR AO VIVO
                </Button>
              </div>
              <Badge
                variant="outline"
                className="absolute top-3 left-3 text-[10px] tracking-wider bg-background/60 backdrop-blur-sm"
              >
                PRONTA
              </Badge>
            </div>
          )}
        </div>

        {/* ── Rodapé do card ─────────────────────────────────────────── */}
        <div className="p-4 flex items-center justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <h3 className="font-display text-xs font-semibold text-foreground tracking-wider truncate">
              {camera.name.toUpperCase()}
            </h3>
            {camera.locationName && (
              <span className="text-[10px] text-muted-foreground truncate">
                {camera.locationName}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {hasAccess && isStreaming && (
              <TooltipProvider delayDuration={300}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      className="text-muted-foreground hover:text-destructive transition-colors"
                      onClick={handleStop}
                    >
                      <Square className="h-4 w-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent><p>Parar stream</p></TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      className="text-muted-foreground hover:text-foreground transition-colors"
                      onClick={handleDownload}
                    >
                      <Download className="h-4 w-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent><p>Download de gravação</p></TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      className="text-muted-foreground hover:text-foreground transition-colors"
                      onClick={handleOpenTheater}
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent><p>Modo teatro</p></TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      className="text-muted-foreground hover:text-foreground transition-colors"
                      onClick={handleFullscreen}
                    >
                      {isFullscreen
                        ? <Minimize2 className="h-4 w-4" />
                        : <Maximize2 className="h-4 w-4" />
                      }
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{isFullscreen ? "Sair da tela cheia" : "Tela cheia"}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}

            <Badge
              variant="outline"
              className={`text-[10px] tracking-wider font-semibold shrink-0 ${
                hasAccess
                  ? isStreaming
                    ? "bg-destructive/10 text-destructive border-destructive/30"
                    : "bg-primary/10 text-primary border-primary/30"
                  : "border-border text-muted-foreground"
              }`}
            >
              {hasAccess ? (isStreaming ? "AO VIVO" : "ATIVO") : "SEM PLANO"}
            </Badge>
          </div>
        </div>
      </Card>

      {/* ── Dialog modo teatro — único player ativo ────────────────── */}
      <Dialog open={theaterOpen} onOpenChange={(o) => { if (!o) setTheaterOpen(false); }}>
        <DialogContent className="max-w-5xl p-0 overflow-hidden bg-black border-border">
          {streamData && (
            <div className="relative aspect-video">
              <WatchtowerHLSPlayer streamUrl={streamData.streamUrl} />

              {/* Badge AO VIVO */}
              <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded bg-destructive/90 pointer-events-none">
                <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse-glow" />
                <span className="text-[10px] font-bold text-white tracking-wider">AO VIVO</span>
              </div>

              {/* Rodapé com nome da câmera */}
              <div className="absolute bottom-0 left-0 right-0 px-4 py-3 bg-gradient-to-t from-black/80 to-transparent pointer-events-none">
                <p className="text-xs font-display font-bold text-white tracking-wider">
                  {camera.name.toUpperCase()}
                  {camera.locationName && (
                    <span className="font-normal text-white/60 ml-2">· {camera.locationName}</span>
                  )}
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <WatchtowerPlanModal
        open={showPlanModal}
        onClose={() => setShowPlanModal(false)}
        cameraId={camera.id}
        cameraName={camera.name}
      />
    </>
  );
}
