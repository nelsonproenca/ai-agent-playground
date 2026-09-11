import { Link } from "react-router-dom";
import { ArrowLeft, Box } from "lucide-react";

const Claw3D = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border shrink-0">
        <div className="container max-w-6xl py-4 flex items-center gap-4">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm font-mono text-muted-foreground hover:text-primary transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Link>
          <div className="flex items-center gap-2">
            <Box className="h-5 w-5 text-primary" />
            <span className="font-mono font-bold text-foreground">Claw3D</span>
          </div>
        </div>
      </header>
      <main className="flex-1">
        <iframe
          src="https://claw3d.nelson-proenca-info.com.br"
          title="Claw3D — Escritório de Agentes IA"
          className="w-full h-full border-0 block"
          style={{ height: "calc(100vh - 65px)" }}
          allow="clipboard-write"
        />
      </main>
    </div>
  );
};

export default Claw3D;
