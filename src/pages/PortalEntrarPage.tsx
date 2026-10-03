import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Loader2, Terminal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useClientAuth } from "@/features/portfolio/useClientAuth";
import { verificarLink } from "@/features/portfolio/clientAuthApi";

/**
 * Destino do link enviado por e-mail (`/portal/entrar?token=...`). Troca o token (uso único) pela sessão e leva
 * o cliente ao portal. É uma página, e não o GET direto na API, para que programas que abrem links de e-mail
 * (antivírus, pré-visualização) não gastem o token só de olhar.
 */
const PortalEntrarPage = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { refresh } = useClientAuth();
  const [erro, setErro] = useState<string | null>(null);
  // O React em modo dev monta o efeito duas vezes; o token só pode ser gasto uma.
  const iniciou = useRef(false);

  useEffect(() => {
    if (iniciou.current) return;
    iniciou.current = true;

    const token = params.get("token");
    if (!token) {
      setErro("Link inválido. Peça um novo acesso.");
      return;
    }

    // Tira o token da barra de endereço (histórico, compartilhamento de tela) antes de qualquer coisa.
    window.history.replaceState(null, "", window.location.pathname);

    verificarLink(token).then(async (r) => {
      if ("error" in r) {
        setErro(r.error);
        return;
      }
      await refresh();
      navigate("/portal", { replace: true });
    });
  }, [params, navigate, refresh]);

  return (
    <div className="min-h-screen bg-background grid-pattern flex items-center justify-center p-4">
      <Card className="w-full max-w-sm border-border bg-card">
        <CardHeader className="text-center space-y-3">
          <div className="mx-auto inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 glow-primary">
            <Terminal className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="font-mono text-foreground">Portal do Cliente</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          {erro ? (
            <>
              <p className="text-sm text-destructive font-mono">{erro}</p>
              <Button asChild className="w-full font-mono">
                <Link to="/portal">Pedir novo acesso</Link>
              </Button>
            </>
          ) : (
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground font-mono">
              <Loader2 className="h-4 w-4 animate-spin" /> Entrando...
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PortalEntrarPage;
