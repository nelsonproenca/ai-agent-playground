import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Lock, Download, Maximize2, Eye, Play, Pause, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { WatchtowerHLSPlayer } from "./WatchtowerHLSPlayer";
import { WatchtowerPlanModal } from "./WatchtowerPlanModal";
import { streamService } from "@/watchtower/services";
import type { CameraDto } from "@/watchtower/types/api";

interface CameraCardProps {
  camera: CameraDto;
  hasAccess: boolean;
}

export function WatchtowerCameraCard({ camera, hasAccess }: CameraCardProps) {
  const [showPlanModal, setShowPlanModal] = useState(false);
  // Opt-in: o stream só inicia quando o usuário clica em "VISUALIZAR AO VIVO".
  const [isWatching, setIsWatching] = useState(false);

  const { data: streamData, isFetching: streamLoading } = useQuery({
    queryKey: ["watchtower-stream", camera.slug],
    queryFn: () => streamService.getUrl(camera.slug),
    enabled: hasAccess && isWatching,
    staleTime: 50 * 60 * 1000, // 50 min — token dura 60 min
  });

  return (
    <>
      <Card className="overflow-hidden border-border bg-card group">
        <div className="relative aspect-video bg-secondary/50">
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
          ) : isWatching && streamData ? (
            <>
              <WatchtowerHLSPlayer streamUrl={streamData.streamUrl} />
              <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded bg-destructive/90">
                <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse-glow" />
                <span className="text-[10px] font-bold text-white tracking-wider">AO VIVO</span>
              </div>
            </>
          ) : (
            // Estado padrão: câmera cadastrada e acessível, mas stream desligado.
            <div className="absolute inset-0 flex items-center justify-center bg-secondary/30">
              <div className="text-center space-y-4 px-4">
                <div className="h-12 w-12 rounded-full border border-primary/30 bg-primary/10 flex items-center justify-center mx-auto">
                  {streamLoading ? (
                    <Loader2 className="h-6 w-6 text-primary animate-spin" />
                  ) : (
                    <Play className="h-6 w-6 text-primary ml-0.5" />
                  )}
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
            {hasAccess && isWatching && (
              <>
                <button
                  className="text-muted-foreground hover:text-destructive transition-colors"
                  onClick={() => setIsWatching(false)}
                  title="Parar visualização"
                  aria-label="Parar visualização"
                >
                  <Pause className="h-4 w-4" />
                </button>
                <button className="text-muted-foreground hover:text-foreground transition-colors" aria-label="Download">
                  <Download className="h-4 w-4" />
                </button>
                <button className="text-muted-foreground hover:text-foreground transition-colors" aria-label="Detalhes">
                  <Eye className="h-4 w-4" />
                </button>
                <button className="text-muted-foreground hover:text-foreground transition-colors" aria-label="Tela cheia">
                  <Maximize2 className="h-4 w-4" />
                </button>
              </>
            )}
            <Badge
              variant="outline"
              className={`text-[10px] tracking-wider font-semibold shrink-0 ${
                hasAccess
                  ? isWatching
                    ? "bg-destructive/10 text-destructive border-destructive/30"
                    : "bg-primary/10 text-primary border-primary/30"
                  : "border-border text-muted-foreground"
              }`}
            >
              {hasAccess ? (isWatching ? "AO VIVO" : "ATIVO") : "SEM PLANO"}
            </Badge>
          </div>
        </div>
      </Card>

      <WatchtowerPlanModal
        open={showPlanModal}
        onClose={() => setShowPlanModal(false)}
        cameraId={camera.id}
        cameraName={camera.name}
      />
    </>
  );
}
