import { useState, useEffect } from "react";
import { listColaboradores, type Colaborador } from "@/features/crm/api";
import { motion } from "framer-motion";
import { Terminal, Users, Mail, Briefcase } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { NavLink } from "@/components/NavLink";

const Colabs = () => {
  const [colabs, setColabs] = useState<Colaborador[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listColaboradores()
      .then((data) => setColabs([...data].sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"))))
      .catch(() => setColabs([]))
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
          <span className="text-muted-foreground font-mono text-sm ml-2">/ equipe</span>
        </div>
      </header>

      <main className="container max-w-6xl py-16 px-4">
        <div className="text-center mb-14 space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-4 py-1.5 text-sm font-mono text-primary">
            <Users className="h-4 w-4" />
            Nossa Equipe
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-foreground leading-tight">
            Conheça nossos <span className="text-gradient-primary">colaboradores</span>
          </h1>
        </div>

        {loading ? (
          <p className="text-center text-muted-foreground font-mono">Carregando...</p>
        ) : colabs.length === 0 ? (
          <p className="text-center text-muted-foreground font-mono">Nenhum colaborador cadastrado.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {colabs.map((c, i) => (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
              >
                <Card className="border-border bg-card hover:border-primary/40 transition-colors group">
                  <CardContent className="p-6 flex flex-col items-center text-center space-y-4">
                    <Avatar className="h-20 w-20 border-2 border-primary/20 group-hover:border-primary/50 transition-colors">
                      {c.fotoUrl ? (
                        <AvatarImage src={c.fotoUrl} alt={c.nome} />
                      ) : null}
                      <AvatarFallback className="bg-secondary text-foreground font-mono text-lg">
                        {c.nome.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="space-y-1">
                      <h3 className="font-semibold text-foreground text-lg">{c.nome}</h3>
                      {c.cargo && (
                        <p className="text-sm text-muted-foreground flex items-center justify-center gap-1.5">
                          <Briefcase className="h-3.5 w-3.5" />
                          {c.cargo}
                        </p>
                      )}
                    </div>
                    <a
                      href={`mailto:${c.email}`}
                      className="text-xs font-mono text-primary hover:underline flex items-center gap-1.5 max-w-full overflow-hidden"
                    >
                      <Mail className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{c.email}</span>
                    </a>
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

export default Colabs;
