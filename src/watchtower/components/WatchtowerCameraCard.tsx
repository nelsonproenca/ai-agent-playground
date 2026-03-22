import { useState } from "react";
import { Lock, Download, Maximize2, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { WatchtowerHLSPlayer } from "./WatchtowerHLSPlayer";
import { WatchtowerPlanModal } from "./WatchtowerPlanModal";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Subscription {
  plan_type: string;
  expires_at: string;
}

interface CameraCardProps {
  camera: {
    id: string;
    display_name: string;
    internal_stream_key: string;
    location: string | null;
  };
  subscription: Subscription | null;
}

const planLabels: Record<string, string> = { "24h": "24H", bronze: "BRONZE", prata: "PRATA", ouro: "OURO" };
const planColors: Record<string, string> = { "24h": "bg-primary/10 text-primary border-primary/30", bronze: "bg-primary/10 text-primary border-primary/30", prata: "bg-primary/10 text-primary border-primary/30", ouro: "bg-primary/10 text-primary border-primary/30" };

export function WatchtowerCameraCard({ camera, subscription }: CameraCardProps) {
  const [showPlanModal, setShowPlanModal] = useState(false);
  const isActive = subscription && new Date(subscription.expires_at) > new Date();
  const isExpired = subscription && new Date(subscription.expires_at) <= new Date();
  const planType = subscription?.plan_type ?? "";
  const hasVOD = planType === "prata" || planType === "ouro";
  const hasDownload = planType === "ouro";
  const displayName = camera.display_name.toUpperCase();

  return (
    <>
      <Card className="overflow-hidden border-border bg-card group">
        <div className="relative aspect-video bg-secondary/50">
          {isActive ? (
            <>
              <WatchtowerHLSPlayer streamKey={camera.internal_stream_key} />
              <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded bg-destructive/90">
                <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse-glow" />
                <span className="text-[10px] font-bold text-white tracking-wider">AO VIVO</span>
              </div>
              <div className="absolute top-3 right-3"><span className="text-[10px] text-white/70 font-mono">{format(new Date(), "HH:mm:ss")}</span></div>
            </>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center glass-overlay">
              <div className="text-center space-y-4">
                <Lock className="h-10 w-10 text-primary mx-auto" />
                <p className="text-xs tracking-[0.2em] font-semibold text-foreground">ACESSO BLOQUEADO</p>
                <Button size="sm" variant="outline" className="border-primary/30 text-foreground text-[10px] tracking-wider font-semibold px-6" onClick={() => setShowPlanModal(true)}>
                  {isExpired ? "LIBERAR ACESSO →" : "VER PLANOS →"}
                </Button>
              </div>
            </div>
          )}
        </div>
        <div className="p-4 flex items-center justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <h3 className="font-display text-xs font-semibold text-foreground tracking-wider truncate">{displayName}</h3>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {isActive && (
              <>
                {hasDownload && <button className="text-muted-foreground hover:text-foreground transition-colors"><Download className="h-4 w-4" /></button>}
                {hasVOD && <button className="text-muted-foreground hover:text-foreground transition-colors"><Eye className="h-4 w-4" /></button>}
                <button className="text-muted-foreground hover:text-foreground transition-colors"><Maximize2 className="h-4 w-4" /></button>
              </>
            )}
            {isActive ? (
              <Badge variant="outline" className={`text-[10px] tracking-wider font-semibold shrink-0 ${planColors[planType] || "border-border"}`}>{planLabels[planType]} ATIVO</Badge>
            ) : isExpired ? (
              <Badge variant="outline" className="text-[10px] tracking-wider font-semibold border-destructive/30 text-destructive">EXPIRADO</Badge>
            ) : (
              <Badge variant="outline" className="text-[10px] tracking-wider font-semibold border-border text-muted-foreground">SEM PLANO</Badge>
            )}
          </div>
        </div>
        {isActive && subscription && (
          <div className="px-4 pb-3">
            <p className="text-[10px] text-muted-foreground">
              Exp: {format(new Date(subscription.expires_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
              {(planType === "24h" || planType === "bronze") && <span className="ml-3 text-muted-foreground">Apenas Live</span>}
              {hasVOD && <span className="ml-3 text-muted-foreground">⏱ VOD</span>}
            </p>
          </div>
        )}
      </Card>
      <WatchtowerPlanModal open={showPlanModal} onClose={() => setShowPlanModal(false)} cameraId={camera.id} cameraName={camera.display_name} />
    </>
  );
}
