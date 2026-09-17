import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Terminal, FolderKanban, ExternalLink, X } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { listProjetosPublicos, type Projeto } from "@/features/portfolio/api";

const statusLabel: Record<string, string> = {
  em_andamento: "Em andamento",
  concluido: "Concluído",
};

const PortfolioPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const clienteId = searchParams.get("clienteId") ?? undefined;
  const clienteNome = searchParams.get("clienteNome") ?? undefined;

  const [projetos, setProjetos] = useState<Projeto[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<string>("todos");

  useEffect(() => {
    setLoading(true);
    listProjetosPublicos(status === "todos" ? undefined : (status as Projeto["status_publico"]), clienteId)
      .then(setProjetos)
      .finally(() => setLoading(false));
  }, [status, clienteId]);

  const limparFiltroCliente = () => {
    const next = new URLSearchParams(searchParams);
    next.delete("clienteId");
    next.delete("clienteNome");
    setSearchParams(next);
  };

  return (
    <div className="min-h-screen bg-background grid-pattern">
      <header className="border-b border-border">
        <div className="container max-w-6xl py-6 flex items-center gap-3">
          <Terminal className="h-6 w-6 text-primary" />
          <NavLink to="/" className="font-mono font-bold text-foreground tracking-tight text-lg">
            nelson.proenca<span className="text-primary">.info</span>
          </NavLink>
          <span className="text-muted-foreground font-mono text-sm ml-2">/ projetos</span>
        </div>
      </header>

      <main className="container max-w-6xl py-16 px-4">
        <div className="text-center mb-10 space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-4 py-1.5 text-sm font-mono text-primary">
            <FolderKanban className="h-4 w-4" />
            Portfólio
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-foreground leading-tight">
            Projetos <span className="text-gradient-primary">recentes</span>
          </h1>
          {clienteId && (
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary/50 pl-4 pr-2 py-1.5 text-sm font-mono text-muted-foreground">
              {clienteNome ? (
                <span>
                  Filtrado por <span className="text-foreground">{clienteNome}</span>
                </span>
              ) : (
                <span>Filtrado por cliente</span>
              )}
              <button
                type="button"
                onClick={limparFiltroCliente}
                className="rounded-full p-1 hover:bg-secondary hover:text-foreground transition-colors"
                aria-label="Remover filtro de cliente"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>

        <div className="max-w-xs mx-auto mb-10">
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="font-mono bg-secondary border-border text-foreground">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os status</SelectItem>
              <SelectItem value="em_andamento">Em andamento</SelectItem>
              <SelectItem value="concluido">Concluído</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <p className="text-center text-muted-foreground font-mono">Carregando...</p>
        ) : projetos.length === 0 ? (
          <p className="text-center text-muted-foreground font-mono">Nenhum projeto público cadastrado.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {projetos.map((p) => (
              <Card key={p.id} className="border-border bg-card hover:border-primary/40 transition-colors overflow-hidden">
                {p.imagem_capa_url && (
                  <div className="aspect-video bg-secondary overflow-hidden">
                    <img src={p.imagem_capa_url} alt={p.nome} className="w-full h-full object-cover" loading="lazy" />
                  </div>
                )}
                <CardContent className="p-5 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-semibold text-foreground">{p.nome}</h3>
                    <span className="text-xs text-muted-foreground font-mono shrink-0">
                      {new Date(p.created_at).getFullYear()}
                    </span>
                  </div>
                  {p.categoria && (
                    <p className="text-xs text-muted-foreground font-mono">{p.categoria}</p>
                  )}
                  <p className="text-xs font-mono text-primary">{statusLabel[p.status_publico] ?? p.status_publico}</p>
                  {p.link_url && (
                    <a
                      href={p.link_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-mono text-primary hover:underline flex items-center gap-1.5 pt-1"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      Visitar
                    </a>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      <footer className="border-t border-border py-8 text-center">
        <p className="text-sm text-muted-foreground font-mono">
          &copy; {new Date().getFullYear()} nelson.proenca.info — Powered by Agentes IA
        </p>
      </footer>
    </div>
  );
};

export default PortfolioPage;
