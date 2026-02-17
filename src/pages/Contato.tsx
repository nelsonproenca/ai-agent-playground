import { useState } from "react";
import { Terminal, MessageSquarePlus } from "lucide-react";
import NavLink from "@/components/NavLink";
import LeadForm from "@/components/LeadForm";
import SuccessMessage from "@/components/SuccessMessage";

const Contato = () => {
  const [submitted, setSubmitted] = useState(false);

  return (
    <div className="min-h-screen bg-background grid-pattern">
      <header className="border-b border-border">
        <div className="container max-w-6xl py-6 flex items-center gap-3">
          <Terminal className="h-6 w-6 text-primary" />
          <NavLink to="/" className="font-mono font-bold text-foreground tracking-tight text-lg">
            nelson.proenca<span className="text-primary">.info</span>
          </NavLink>
          <span className="text-muted-foreground font-mono text-sm ml-2">/ contato</span>
        </div>
      </header>

      <main className="container max-w-2xl py-16 px-4">
        <div className="text-center mb-10 space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-4 py-1.5 text-sm font-mono text-primary">
            <MessageSquarePlus className="h-4 w-4" />
            Envie seu desafio
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-foreground leading-tight">
            Vamos <span className="text-gradient-primary">conversar?</span>
          </h1>
          <p className="text-muted-foreground max-w-md mx-auto text-sm">
            Descreva seu desafio técnico e receba uma análise via IA.
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 md:p-8">
          {submitted ? (
            <SuccessMessage />
          ) : (
            <LeadForm onSuccess={() => setSubmitted(true)} />
          )}
        </div>
      </main>

      <footer className="border-t border-border py-8 text-center">
        <p className="text-sm text-muted-foreground font-mono">
          &copy; {new Date().getFullYear()} nelson.proenca.info — Powered by Agentes IA
        </p>
      </footer>
    </div>
  );
};

export default Contato;
