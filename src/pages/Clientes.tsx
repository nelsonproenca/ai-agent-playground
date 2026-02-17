import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { Terminal, Building2, ExternalLink } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { NavLink } from "@/components/NavLink";
import type { Tables } from "@/integrations/supabase/types";

type Cliente = Tables<"clientes">;

const Clientes = () => {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("clientes")
        .select("*")
        .eq("status", "ativo")
        .order("empresa", { ascending: true });
      if (data) setClientes(data);
      setLoading(false);
    };
    fetch();
  }, []);

  return (
    <div className="min-h-screen bg-background grid-pattern">
      <header className="border-b border-border">
        <div className="container max-w-6xl py-6 flex items-center gap-3">
          <Terminal className="h-6 w-6 text-primary" />
          <NavLink to="/" className="font-mono font-bold text-foreground tracking-tight text-lg">
            nelson<span className="text-primary">.dev</span>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {clientes.map((c, i) => (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
              >
                <Card className="border-border bg-card hover:border-primary/40 transition-colors group h-full">
                  <CardContent className="p-6 flex flex-col items-center text-center space-y-4">
                    <Avatar className="h-20 w-20 rounded-lg border-2 border-primary/20 group-hover:border-primary/50 transition-colors">
                      {c.logo_url ? (
                        <AvatarImage src={c.logo_url} alt={c.empresa ?? c.nome} className="object-contain p-2" />
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
                    {c.site_url && (
                      <a
                        href={c.site_url.startsWith("http") ? c.site_url : `https://${c.site_url}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-mono text-primary hover:underline flex items-center gap-1.5"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        Visitar site
                      </a>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </main>

      <footer className="border-t border-border py-8 text-center">
        <p className="text-sm text-muted-foreground font-mono">
          &copy; {new Date().getFullYear()} nelson.dev — Powered by Agentes IA
        </p>
      </footer>
    </div>
  );
};

export default Clientes;
