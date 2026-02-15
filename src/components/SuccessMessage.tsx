import { CheckCircle2, Sparkles } from "lucide-react";

const SuccessMessage = () => {
  return (
    <div className="animate-float-in text-center space-y-6 py-8">
      <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 glow-primary animate-pulse-glow">
        <CheckCircle2 className="h-10 w-10 text-primary" />
      </div>

      <div className="space-y-3">
        <h3 className="text-2xl font-bold text-foreground flex items-center justify-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          Obrigado!
          <Sparkles className="h-5 w-5 text-primary" />
        </h3>
        <p className="text-muted-foreground leading-relaxed max-w-md mx-auto">
          Meu agente processou seu pedido. Como sou um especialista com{" "}
          <span className="text-primary font-semibold">+15 anos de XP em .NET e Azure</span>,
          analisarei seu caso pessoalmente.
        </p>
      </div>

      <div className="pt-2">
        <p className="text-sm text-muted-foreground font-mono">
          {"// retorno em até 24h"}
        </p>
      </div>
    </div>
  );
};

export default SuccessMessage;
