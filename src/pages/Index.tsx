import { Link } from "react-router-dom";
import { Terminal, Cpu, FlaskConical, Shield, Users, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import InstagramCTA from "@/components/InstagramCTA";
import InternationalSection from "@/components/InternationalSection";

const Index = () => {
  return (
    <div className="min-h-screen bg-background grid-pattern">
      {/* Hero */}
      <header className="border-b border-border">
        <div className="container max-w-6xl py-6 flex items-center gap-3">
          <Terminal className="h-6 w-6 text-primary" />
          <span className="font-mono font-bold text-foreground tracking-tight text-lg">
            nelson<span className="text-primary">.dev</span>
          </span>
        </div>
      </header>

      <main className="container max-w-6xl py-16 px-4">
        {/* Section Header */}
        <div className="text-center mb-14 space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-4 py-1.5 text-sm font-mono text-primary">
            <Cpu className="h-4 w-4" />
            Arquitetura de Software + IA
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-foreground leading-tight">
            Descreva seu desafio,<br />
            <span className="text-gradient-primary">meu agente resolve.</span>
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Especialista em .NET Core e Azure com 15 anos de XP, integrando sistemas legados e modernos via Agentes IA.
          </p>
        </div>

        {/* Playground CTA */}
        <div className="max-w-4xl mx-auto text-center space-y-4 mb-20">
          <h2 className="text-2xl font-extrabold text-foreground font-mono">
            Experimente nossos <span className="text-gradient-primary">Playgrounds de IA</span>
          </h2>
          <p className="text-muted-foreground max-w-md mx-auto text-sm">
            Teste consultoria IA em tempo real e enriquecimento de leads com automações n8n.
          </p>
          <Button asChild className="glow-primary font-mono gap-2">
            <Link to="/playground">
              <FlaskConical className="h-4 w-4" />
              Acessar Playground
            </Link>
          </Button>
        </div>

        {/* Admin Section */}
        <div className="max-w-4xl mx-auto mb-20">
          <div className="text-center mb-8 space-y-2">
            <h2 className="text-2xl font-extrabold text-foreground font-mono">
              Área <span className="text-gradient-primary">Administrativa</span>
            </h2>
            <p className="text-muted-foreground text-sm">
              Gerencie leads, equipe e clientes em um só lugar.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { to: "/dashboard", icon: Shield, label: "Painel de Controle", desc: "Leads e análises IA" },
              { to: "/colabs", icon: Users, label: "Colaboradores", desc: "Equipe e departamentos" },
              { to: "/clientes", icon: Building2, label: "Clientes", desc: "Empresas e contatos" },
            ].map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="group rounded-xl border border-border bg-card p-6 hover:border-primary/50 transition-all hover:shadow-lg hover:shadow-primary/5"
              >
                <div className="flex flex-col items-center text-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <item.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-mono font-bold text-foreground">{item.label}</h3>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <InternationalSection />

        {/* Instagram CTA + Stats before footer */}
        <div className="grid lg:grid-cols-2 gap-8 max-w-4xl mx-auto mt-20">
          <InstagramCTA />
          <div className="rounded-xl border border-border bg-card p-6 space-y-4">
            <h4 className="font-mono text-sm text-muted-foreground">{"// stats"}</h4>
            <div className="space-y-3">
              {[
                { label: "Anos de XP", value: "15+" },
                { label: "Stack", value: ".NET, React.JS, MS SQL Server, Azure, IA" },
                { label: "Automações", value: "n8n · IA" },
                { label: "Infra", value: "VPS, Docker" },
              ].map((stat) => (
                <div key={stat.label} className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">{stat.label}</span>
                  <span className="text-sm font-mono font-semibold text-primary">{stat.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t border-border py-8 text-center mt-12">
        <p className="text-sm text-muted-foreground font-mono">
          &copy; {new Date().getFullYear()} nelson.dev — Powered by Agentes IA
        </p>
      </footer>
    </div>
  );
};

export default Index;
