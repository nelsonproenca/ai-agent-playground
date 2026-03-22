import { Card } from "@/components/ui/card";
import { Video } from "lucide-react";

export default function WatchtowerLive() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Transmissão Ao Vivo</h1>
        <p className="text-muted-foreground">Visualize todas as suas câmeras em tempo real</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i} className="overflow-hidden bg-card border-border">
            <div className="aspect-video bg-muted/50 flex items-center justify-center"><Video className="h-12 w-12 text-muted-foreground" /></div>
            <div className="p-4"><h3 className="font-semibold text-foreground">Câmera {i}</h3><p className="text-sm text-muted-foreground">Localização {i}</p></div>
          </Card>
        ))}
      </div>
    </div>
  );
}
