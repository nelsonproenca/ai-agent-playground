import { Receipt } from "lucide-react";

export default function WatchtowerBilling() {
  return (
    <div className="space-y-6">
      <div><h2 className="text-2xl font-bold text-foreground">Histórico de Faturas</h2><p className="text-sm text-muted-foreground mt-1">Acompanhe suas transações e pagamentos.</p></div>
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-secondary mb-4"><Receipt className="h-8 w-8 text-muted-foreground" /></div>
        <h3 className="text-lg font-semibold text-foreground mb-1">Nenhuma fatura</h3>
        <p className="text-sm text-muted-foreground">Seu histórico de faturas aparecerá aqui.</p>
      </div>
    </div>
  );
}
