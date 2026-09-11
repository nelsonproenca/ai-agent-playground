import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { getProjeto, type Projeto } from "@/features/portfolio/api";
import GestaoEtapas from "@/components/dashboard/GestaoEtapas";
import GestaoArtefatos from "@/components/dashboard/GestaoArtefatos";
import GestaoPedidos from "@/components/dashboard/GestaoPedidos";

const ProjetoDetalhePage = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { authenticated } = useAuth();
  const [projeto, setProjeto] = useState<Projeto | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authenticated) navigate("/login", { replace: true });
  }, [authenticated, navigate]);

  useEffect(() => {
    if (!id) return;
    getProjeto(id)
      .then(setProjeto)
      .finally(() => setLoading(false));
  }, [id]);

  if (!authenticated || !id) return null;

  return (
    <div className="min-h-screen bg-background grid-pattern">
      <header className="border-b border-border">
        <div className="container max-w-7xl py-4 flex items-center justify-between">
          <h1 className="font-mono font-bold text-foreground text-lg">
            {loading ? "Carregando..." : projeto?.nome ?? "Projeto não encontrado"}
          </h1>
          <Button asChild variant="outline" size="sm" className="font-mono gap-2">
            <Link to="/admin/projetos">
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Link>
          </Button>
        </div>
      </header>
      <main className="container max-w-7xl py-8 px-4 space-y-6">
        {!loading && !projeto ? (
          <p className="text-muted-foreground font-mono text-center py-12">Projeto não encontrado.</p>
        ) : (
          <>
            <GestaoEtapas projetoId={id} />
            <GestaoArtefatos projetoId={id} />
            <GestaoPedidos projetoId={id} />
          </>
        )}
      </main>
    </div>
  );
};

export default ProjetoDetalhePage;
