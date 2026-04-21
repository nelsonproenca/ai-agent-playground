import { Receipt } from "lucide-react";

export default function WatchtowerBilling() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-3xl font-bold text-foreground tracking-wider">HISTÓRICO DE FATURAS</h2>
        <p className="text-xs tracking-[0.15em] text-muted-foreground mt-2">ACOMPANHE SUAS TRANSAÇÕES E PAGAMENTOS</p>
      </div>
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-secondary mb-4"><Receipt className="h-8 w-8 text-muted-foreground" /></div>
        <h3 className="font-display text-lg tracking-wider text-foreground mb-1">NENHUMA FATURA</h3>
        <p className="text-xs text-muted-foreground">SEU HISTÓRICO DE FATURAS APARECERÁ AQUI.</p>
      </div>
    </div>
  );
}
