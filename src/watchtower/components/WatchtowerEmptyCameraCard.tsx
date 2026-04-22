import { useState } from "react";
import { CameraOff, Plus, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { WatchtowerPlanModal } from "./WatchtowerPlanModal";
import { WatchtowerCameraEditorDialog } from "./WatchtowerCameraEditorDialog";

interface EmptyCameraCardProps {
  /** Quando true, o CTA abre o modal de cadastro de câmera (admin). */
  isAdmin: boolean;
  /** Índice do placeholder (1..n) — apenas para rotular visualmente. */
  index: number;
}

/**
 * Placeholder visual exibido no grid quando o cliente ainda não possui câmeras
 * ativas (ou para o admin, slots disponíveis para cadastro). Mantém a mesma
 * estrutura visual do WatchtowerCameraCard para preservar o layout do grid.
 */
export function WatchtowerEmptyCameraCard({ isAdmin, index }: EmptyCameraCardProps) {
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [showEditor, setShowEditor] = useState(false);

  const handleAction = () => {
    if (isAdmin) {
      setShowEditor(true);
    } else {
      setShowPlanModal(true);
    }
  };

  return (
    <>
      <Card className="overflow-hidden border-dashed border-border bg-card/40 group">
        <div className="relative aspect-video bg-secondary/40 flex items-center justify-center overflow-hidden">
          {/* Linhas de "scan" sutis para reforçar a estética terminal */}
          <div className="absolute inset-0 opacity-20 bg-[repeating-linear-gradient(0deg,transparent,transparent_3px,hsl(var(--border))_3px,hsl(var(--border))_4px)]" />
          <div className="relative flex flex-col items-center gap-2 text-center px-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary border border-border">
              <CameraOff className="h-6 w-6 text-muted-foreground" />
            </div>
            <span className="text-[10px] font-bold tracking-[0.2em] text-muted-foreground">
              {isAdmin ? "SLOT DE CADASTRO" : "CÂMERA INATIVA"}
            </span>
          </div>
          <div className="absolute top-3 left-3">
            <Badge variant="outline" className="text-[10px] tracking-wider bg-background/60 backdrop-blur-sm">
              SLOT {String(index).padStart(2, "0")}
            </Badge>
          </div>
        </div>
        <div className="p-4 space-y-3">
          <div>
            <h3 className="font-semibold text-foreground text-sm tracking-wide truncate">
              {isAdmin ? "Slot disponível" : "Nenhum plano ativo"}
            </h3>
            <p className="text-xs text-muted-foreground truncate">
              {isAdmin ? "Cadastre uma nova câmera" : "Contrate um plano para ativar"}
            </p>
          </div>
          <Button
            onClick={handleAction}
            size="sm"
            className="w-full gap-2"
            variant={isAdmin ? "outline" : "default"}
          >
            {isAdmin ? (
              <>
                <Plus className="h-4 w-4" />
                CADASTRAR CÂMERA
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                VER PLANOS
              </>
            )}
          </Button>
        </div>
      </Card>

      {!isAdmin && (
        <WatchtowerPlanModal
          open={showPlanModal}
          onClose={() => setShowPlanModal(false)}
          cameraId=""
          cameraName="Nova ativação"
        />
      )}

      {isAdmin && (
        <WatchtowerCameraEditorDialog
          open={showEditor}
          onOpenChange={setShowEditor}
        />
      )}
    </>
  );
}
