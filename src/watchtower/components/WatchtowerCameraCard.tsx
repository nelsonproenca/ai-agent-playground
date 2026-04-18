import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Lock, Download, Maximize2, Eye } from "lucide-react";
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

  const { data: streamData } = useQuery({
    queryKey: ["watchtower-stream", camera.slug],
    queryFn: () => streamService.getUrl(camera.slug),
    enabled: hasAccess,
    staleTime: 50 * 60 * 1000, // 50 min — token dura 60 min
  });

  return (
    <>
      <Card className="overflow-hidden border-border bg-card group">
        <div className="relative aspect-video bg-secondary/50">
          {hasAccess && streamData ? (
            <>
              <WatchtowerHLSPlayer streamUrl={streamData.streamUrl} />
              <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded bg-destructive/90">
                <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse-glow" />
                <span className="text-[10px] font-bold text-white tracking-wider">AO VIVO</span>
              </div>
            </>
          ) : (
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
            {hasAccess && (
              <>
                <button className="text-muted-foreground hover:text-foreground transition-colors">
                  <Download className="h-4 w-4" />
                </button>
                <button className="text-muted-foreground hover:text-foreground transition-colors">
                  <Eye className="h-4 w-4" />
                </button>
                <button className="text-muted-foreground hover:text-foreground transition-colors">
                  <Maximize2 className="h-4 w-4" />
                </button>
              </>
            )}
            <Badge
              variant="outline"
              className={`text-[10px] tracking-wider font-semibold shrink-0 ${
                hasAccess
                  ? "bg-primary/10 text-primary border-primary/30"
                  : "border-border text-muted-foreground"
              }`}
            >
              {hasAccess ? "ATIVO" : "SEM PLANO"}
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
