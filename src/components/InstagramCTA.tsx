import { Instagram, Bot, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

const InstagramCTA = () => {
  return (
    <div className="rounded-xl border border-border bg-card p-6 space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg gradient-instagram flex items-center justify-center">
          <Instagram className="h-5 w-5 text-foreground" />
        </div>
        <h3 className="text-lg font-bold text-foreground">Atendimento Automatizado</h3>
      </div>

      <p className="text-muted-foreground text-sm leading-relaxed">
        Quer ver IA em ação? Meu Instagram é{" "}
        <span className="text-primary font-semibold">100% automatizado</span> via{" "}
        <span className="font-mono text-accent">n8n</span>. Envie uma mensagem e receba uma resposta
        inteligente em segundos.
      </p>

      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Bot className="h-4 w-4 text-primary" />
          <span>Respostas automáticas com IA</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Zap className="h-4 w-4 text-primary" />
          <span>Fluxos orquestrados via n8n</span>
        </div>
      </div>

      <a
        href="https://www.instagram.com/nelson.ari/"
        target="_blank"
        rel="noopener noreferrer"
        className="block"
      >
        <Button className="w-full gradient-instagram border-0 text-foreground font-semibold py-5 hover:opacity-90 transition-opacity">
          <Instagram className="mr-2 h-5 w-5" />
          Testar no Instagram
        </Button>
      </a>
    </div>
  );
};

export default InstagramCTA;
