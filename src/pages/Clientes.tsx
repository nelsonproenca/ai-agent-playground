import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Terminal, Building2, ExternalLink, FolderKanban } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { NavLink } from "@/components/NavLink";
import { listClientesPublicos, type Cliente } from "@/features/clientes/api";

const Clientes = () => {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listClientesPublicos()
      .then(setClientes)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-background grid-pattern">
      <header className="border-b border-border">
        <div className="container max-w-6xl py-6 flex items-center gap-3">
          <Terminal className="h-6 w-6 text-primary" />
          <NavLink to="/" className="font-mono font-bold text-foreground tracking-tight text-lg">
            nelson.proenca<span className="text-primary">.info</span>
          </NavLink>
          <span className="text-muted-foreground font-mono text-sm ml-2">/ clientes</span>
        </div>
      </header>

      <main className="container max-w-6xl py-16 px-4">
        <div className="text-center mb-14 space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-4 py-1.5 text-sm font-mono text-primary">
            <Building2 className="h-4 w-4" />
            Portfólio
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-foreground leading-tight">
            Nossos <span className="text-gradient-primary">clientes</span>
          </h1>
        </div>

        {loading ? (
          <p className="text-center text-muted-foreground font-mono">Carregando...</p>
        ) : clientes.length === 0 ? (
          <p className="text-center text-muted-foreground font-mono">Nenhum cliente cadastrado.</p>
        ) : (
          <div className="flex flex-wrap justify-center gap-6 max-w-5xl mx-auto">
            {clientes.map((c, i) => (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
                className="w-full sm:w-[calc(50%-0.75rem)] lg:w-[calc(33.333%-1rem)]"
              >
                <Card className="border-border bg-card hover:border-primary/40 transition-colors group h-full">
                  <CardContent className="p-6 flex flex-col items-center text-center space-y-4">
                    <Avatar className="h-20 w-20 rounded-lg border-2 border-primary/20 group-hover:border-primary/50 transition-colors">
                      {c.logoUrl ? (
                        <AvatarImage src={c.logoUrl} alt={c.empresa ?? c.nome} className="object-contain p-2" />
                      ) : null}
                      <AvatarFallback className="bg-secondary text-foreground font-mono text-lg rounded-lg">
                        {(c.empresa ?? c.nome).slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="space-y-1">
                      <h3 className="font-semibold text-foreground text-lg">{c.empresa ?? c.nome}</h3>
                      {c.segmento && (
                        <p className="text-xs text-muted-foreground font-mono">{c.segmento}</p>
                      )}
                    </div>
                    <div className="flex flex-col items-center gap-2">
                      {c.siteUrl && (
                        <a
                          href={c.siteUrl.startsWith("http") ? c.siteUrl : `https://${c.siteUrl}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-mono text-primary hover:underline flex items-center gap-1.5"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                          Visitar site
                        </a>
                      )}
                      <Link
                        to={`/projetos?clienteId=${encodeURIComponent(c.id)}&clienteNome=${encodeURIComponent(c.empresa ?? c.nome)}`}
                        className="text-xs font-mono text-primary hover:underline flex items-center gap-1.5"
                      >
                        <FolderKanban className="h-3.5 w-3.5" />
                        Projetos
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
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

export default Clientes;
