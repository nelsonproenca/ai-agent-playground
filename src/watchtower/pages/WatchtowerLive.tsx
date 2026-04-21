import { Card } from "@/components/ui/card";
import { Video } from "lucide-react";

export default function WatchtowerLive() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-3xl font-bold text-foreground tracking-wider">TRANSMISSÃO AO VIVO</h2>
        <p className="text-xs tracking-[0.15em] text-muted-foreground mt-2">VISUALIZE TODAS AS SUAS CÂMERAS EM TEMPO REAL</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i} className="overflow-hidden bg-card border-border">
            <div className="aspect-video bg-muted/50 flex items-center justify-center"><Video className="h-12 w-12 text-muted-foreground" /></div>
            <div className="p-4"><h3 className="font-display text-sm tracking-wider text-foreground">CÂMERA {i}</h3><p className="text-xs text-muted-foreground mt-1">LOCALIZAÇÃO {i}</p></div>
          </Card>
        ))}
      </div>
    </div>
  );
}
