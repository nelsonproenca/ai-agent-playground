import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import GestaoProjetos from "@/components/dashboard/GestaoProjetos";

const ProjetosPage = () => {
  const navigate = useNavigate();
  const { authenticated } = useAuth();

  useEffect(() => {
    if (!authenticated) navigate("/login", { replace: true });
  }, [authenticated, navigate]);

  if (!authenticated) return null;

  return (
    <div className="min-h-screen bg-background grid-pattern">
      <header className="border-b border-border">
        <div className="container max-w-7xl py-4 flex items-center justify-between">
          <h1 className="font-mono font-bold text-foreground text-lg">
            Gestão de <span className="text-primary">Projetos</span>
          </h1>
          <Button asChild variant="outline" size="sm" className="font-mono gap-2">
            <Link to="/admin">
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Link>
          </Button>
        </div>
      </header>
      <main className="container max-w-7xl py-8 px-4 space-y-6">
        <GestaoProjetos />
      </main>
    </div>
  );
};

export default ProjetosPage;
