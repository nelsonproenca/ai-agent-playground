import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, LogOut, FolderKanban, Terminal, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useClientAuth } from "@/features/portfolio/useClientAuth";
import { listProjetosDoCliente, type Projeto } from "@/features/portfolio/api";

const statusLabel: Record<string, string> = {
  em_andamento: "Em andamento",
  concluido: "Concluído",
};

const PortalLogin = () => {
  const { requestMagicLink } = useClientAuth();
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSending(true);
    setError(null);
    const { error: err } = await requestMagicLink(email.trim());
    setSending(false);
    if (err) setError(err);
    else setSent(true);
  };

  return (
    <div className="min-h-screen bg-background grid-pattern flex items-center justify-center p-4">
      <Card className="w-full max-w-sm border-border bg-card">
        <CardHeader className="text-center space-y-3">
          <div className="mx-auto inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 glow-primary">
            <Terminal className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="font-mono text-foreground">Portal do Cliente</CardTitle>
        </CardHeader>
        <CardContent>
          {sent ? (
            <div className="text-center space-y-3">
              <Mail className="h-8 w-8 text-primary mx-auto" />
              <p className="text-sm text-foreground">
                Enviamos um link de acesso para <strong>{email}</strong>. Confira sua caixa de entrada.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                type="email"
                placeholder="Seu e-mail"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="font-mono bg-secondary border-border text-foreground"
              />
              {error && <p className="text-sm text-destructive font-mono">{error}</p>}
              <Button type="submit" className="w-full font-mono gap-2" disabled={sending}>
                {sending && <Loader2 className="h-4 w-4 animate-spin" />}
                Receber link de acesso
              </Button>
              <Button asChild variant="ghost" className="w-full font-mono text-muted-foreground">
                <Link to="/">← Voltar para Home</Link>
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

const PortalLista = () => {
  const { cliente, logout } = useClientAuth();
  const navigate = useNavigate();
  const [projetos, setProjetos] = useState<Projeto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!cliente) return;
    listProjetosDoCliente(cliente.id)
      .then(setProjetos)
      .finally(() => setLoading(false));
  }, [cliente]);

  const handleLogout = async () => {
    await logout();
    navigate("/portal");
  };

  return (
    <div className="min-h-screen bg-background grid-pattern">
      <header className="border-b border-border">
        <div className="container max-w-5xl py-4 flex items-center justify-between">
          <h1 className="font-mono font-bold text-foreground text-lg">
            Olá, <span className="text-primary">{cliente?.nome}</span>
          </h1>
          <Button variant="ghost" size="sm" className="font-mono gap-2 text-muted-foreground" onClick={handleLogout}>
            <LogOut className="h-4 w-4" />
            Sair
          </Button>
        </div>
      </header>
      <main className="container max-w-5xl py-8 px-4">
        {loading ? (
          <p className="text-muted-foreground font-mono text-center py-12">Carregando...</p>
        ) : projetos.length === 0 ? (
          <p className="text-muted-foreground font-mono text-center py-12">Nenhum projeto encontrado.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {projetos.map((p) => (
              <Card
                key={p.id}
                className="border-border bg-card cursor-pointer hover:border-primary/40 transition-colors"
                onClick={() => navigate(`/portal/${p.id}`)}
              >
                <CardContent className="p-5 space-y-2">
                  <div className="flex items-center gap-2">
                    <FolderKanban className="h-4 w-4 text-primary" />
                    <h3 className="font-semibold text-foreground">{p.nome}</h3>
                  </div>
                  <p className="text-xs text-muted-foreground font-mono">
                    {statusLabel[p.status_publico] ?? p.status_publico}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

const PortalPage = () => {
  const { session, cliente, loading } = useClientAuth();

  if (loading) return null;
  if (!session || !cliente) return <PortalLogin />;
  return <PortalLista />;
};

export default PortalPage;
