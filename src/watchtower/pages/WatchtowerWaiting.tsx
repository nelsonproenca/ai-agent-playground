import { useEffect, useMemo, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useWatchtowerAuth } from "@/watchtower/contexts/WatchtowerAuthContext";
import { useAccessStatus } from "@/watchtower/hooks/useAccessStatus";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, Shield, ShieldCheck, LogOut, Clock } from "lucide-react";
import watchtowerLogo from "@/assets/watchtower/watchtower-logo-gold.png";

const CLIENT_MESSAGES = [
  "Estamos preparando seu acesso com todo o capricho ✨",
  "Como estamos felizes em ter você no Watchtower! 🎉",
  "Polindo as lentes das câmeras enquanto você espera... 🔍",
  "Aquecendo os servidores especialmente para você 🔥",
  "Seu acesso está sendo criado com 100% de carinho ❤️",
  "Boas vindas! Já já liberamos a portaria 🚪",
  "Conferindo se o café da equipe está fresquinho ☕",
];

const ADMIN_MESSAGES = [
  "Seu pedido é especial — chamamos os melhores admins para revisar 🛡️",
  "Estamos preparando o tapete vermelho administrativo 🔴",
  "Convocando os guardiões para validar seu acesso ⚔️",
  "Lendo seu currículo administrativo com atenção máxima 📜",
  "Polindo o crachá dourado de ADMIN 🥇",
  "Avisamos os outros admins — eles estão a caminho 📨",
];

function formatRemaining(ms: number): string {
  if (ms <= 0) return "00:00";
  const totalSec = Math.ceil(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function WatchtowerWaiting() {
  const navigate = useNavigate();
  const { user, loading: authLoading, signOut } = useWatchtowerAuth();
  const { status, loading: statusLoading, isWaiting, isAdminPending, refresh } = useAccessStatus();

  const [now, setNow] = useState(Date.now());
  const [msgIndex, setMsgIndex] = useState(0);

  const messagePool = useMemo(
    () => (isAdminPending ? ADMIN_MESSAGES : CLIENT_MESSAGES),
    [isAdminPending]
  );

  // Tick a cada segundo (countdown). Para admins serve só pra rotacionar mensagens.
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  // Rotação de mensagens a cada 4s
  useEffect(() => {
    const id = setInterval(() => {
      setMsgIndex((i) => (i + 1) % messagePool.length);
    }, 4000);
    return () => clearInterval(id);
  }, [messagePool.length]);

  if (authLoading || statusLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return <Navigate to="/watchtower/auth" replace />;

  // Já pode entrar — manda pro dashboard
  if (!isWaiting) {
    return <Navigate to="/watchtower/dashboard" replace />;
  }

  const releaseTime = status?.accessReleasedAt?.getTime() ?? 0;
  const remainingMs = Math.max(0, releaseTime - now);
  const releaseDateStr = status?.accessReleasedAt?.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
      {/* glow decorativo */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      </div>

      <Card className="relative w-full max-w-lg p-8 md:p-12 bg-card/80 backdrop-blur border-border text-center space-y-6">
        <div className="flex flex-col items-center gap-4">
          <img src={watchtowerLogo} alt="Watchtower" className="h-20 w-auto" />
          <div className="w-16 h-0.5 bg-primary" />
        </div>

        {isAdminPending ? (
          <>
            <div className="mx-auto inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 border border-primary/30">
              <ShieldCheck className="h-10 w-10 text-primary" />
            </div>
            <div>
              <h1 className="font-display text-2xl md:text-3xl font-bold tracking-wider text-foreground">
                AGUARDANDO APROVAÇÃO DE ACESSO ADMIN
              </h1>
              <p className="text-xs tracking-[0.2em] text-primary mt-2">
                ★ ACESSO ESPECIAL ★
              </p>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed px-4">
              Seu pedido foi enviado a outro administrador. Você receberá um e-mail assim que
              for aprovado ou rejeitado.
            </p>
          </>
        ) : (
          <>
            <div className="mx-auto inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 border border-primary/30">
              <Clock className="h-10 w-10 text-primary" />
            </div>
            <div>
              <h1 className="font-display text-2xl md:text-3xl font-bold tracking-wider text-foreground">
                ACESSO EM PREPARAÇÃO
              </h1>
              <p className="text-xs tracking-[0.2em] text-muted-foreground mt-2">
                LIBERAÇÃO AUTOMÁTICA EM
              </p>
            </div>
            <div className="font-mono text-6xl md:text-7xl font-bold text-primary tabular-nums tracking-wider">
              {formatRemaining(remainingMs)}
            </div>
            {releaseDateStr && (
              <p className="text-xs text-muted-foreground">
                Previsto para <span className="text-foreground font-mono">{releaseDateStr}</span>
              </p>
            )}
          </>
        )}

        {/* Mensagem rotativa */}
        <div className="min-h-[60px] flex items-center justify-center px-4">
          <p
            key={msgIndex}
            className="text-sm md:text-base text-foreground/80 italic animate-in fade-in slide-in-from-bottom-2 duration-700"
          >
            {messagePool[msgIndex]}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <Button variant="outline" onClick={refresh} className="font-mono text-xs">
            <Loader2 className="h-3 w-3 mr-2" />
            VERIFICAR AGORA
          </Button>
          <Button
            variant="ghost"
            onClick={async () => {
              await signOut();
              navigate("/watchtower/auth");
            }}
            className="font-mono text-xs text-muted-foreground"
          >
            <LogOut className="h-3 w-3 mr-2" />
            SAIR
          </Button>
        </div>
      </Card>
    </div>
  );
}
