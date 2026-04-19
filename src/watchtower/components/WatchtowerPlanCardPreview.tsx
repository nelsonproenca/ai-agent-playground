import { Button } from "@/components/ui/button";

interface PlanCardPreviewProps {
  num: string;
  name: string;
  period: string;
  price: string;
  suffix: string;
  cta: string;
  features: string[];
  highlight: boolean;
}

export function WatchtowerPlanCardPreview({
  num,
  name,
  period,
  price,
  suffix,
  cta,
  features,
  highlight,
}: PlanCardPreviewProps) {
  return (
    <div className="space-y-2">
      <p className="text-[10px] tracking-[0.2em] text-muted-foreground font-medium">
        PRÉVIA NA LANDING
      </p>
      <div
        className={`rounded-lg border p-6 flex flex-col relative transition-colors ${
          highlight ? "border-primary bg-primary/5" : "border-border bg-card"
        }`}
      >
        {highlight && (
          <span className="absolute -top-3 right-4 bg-primary text-primary-foreground text-[10px] tracking-wider font-semibold px-3 py-1 rounded-sm">
            MAIS POPULAR
          </span>
        )}
        <span className="text-xs text-muted-foreground">{num || "00"}</span>
        <h3 className="font-display text-sm font-semibold tracking-wider mt-2">
          {name || "NOME DO PLANO"}
        </h3>
        <p className="text-xs text-muted-foreground mt-1 mb-4">
          {period || "subtítulo"}
        </p>
        <div className="mb-6">
          <span className="font-display text-3xl font-bold">{price || "R$ 0,00"}</span>
          <span className="text-xs text-muted-foreground">{suffix}</span>
        </div>
        <ul className="space-y-2 mb-8 flex-1 min-h-[80px]">
          {features.length === 0 ? (
            <li className="text-xs text-muted-foreground/60 italic">
              Adicione features para visualizar…
            </li>
          ) : (
            features.map((f, i) => (
              <li key={`${f}-${i}`} className="text-xs text-muted-foreground flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                {f}
              </li>
            ))
          )}
        </ul>
        <Button
          variant={highlight ? "default" : "outline"}
          className="w-full text-xs tracking-wider font-semibold pointer-events-none"
        >
          {cta || "ASSINAR"}
        </Button>
      </div>
    </div>
  );
}
