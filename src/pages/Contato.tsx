import { useState } from "react";
import { Link } from "react-router-dom";
import { Terminal, ArrowLeft } from "lucide-react";
import LeadForm from "@/components/LeadForm";
import SuccessMessage from "@/components/SuccessMessage";

const Contato = () => {
  const [submitted, setSubmitted] = useState(false);

  return (
    <div className="min-h-screen bg-background grid-pattern">
      <header className="border-b border-border">
        <div className="container max-w-6xl py-6 flex items-center gap-3">
          <Terminal className="h-6 w-6 text-primary" />
          <Link to="/" className="font-mono font-bold text-foreground tracking-tight text-lg hover:text-primary transition-colors">
            nelson.proenca<span className="text-primary">.info</span>
          </Link>
        </div>
      </header>

      <main className="container max-w-2xl py-16 px-4">
        <Link to="/" className="inline-flex items-center gap-2 text-sm font-mono text-muted-foreground hover:text-primary transition-colors mb-8">
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Link>

        <div className="text-center mb-10 space-y-3">
          <h1 className="text-3xl md:text-4xl font-extrabold text-foreground">
            Envie seu <span className="text-gradient-primary">Desafio Técnico</span>
          </h1>
          <p className="text-muted-foreground text-sm max-w-md mx-auto">
            Descreva seu projeto ou problema e entrarei em contato para discutirmos a melhor solução.
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 md:p-8">
          {submitted ? <SuccessMessage /> : <LeadForm onSuccess={() => setSubmitted(true)} />}
        </div>
      </main>

      <footer className="border-t border-border py-8 text-center mt-12">
        <p className="text-sm text-muted-foreground font-mono">
          &copy; {new Date().getFullYear()} nelson.proenca.info — Powered by Agentes IA
        </p>
      </footer>
    </div>
  );
};

export default Contato;
