import { useState } from "react";
import { Terminal, Code2, Cpu } from "lucide-react";
import LeadForm from "@/components/LeadForm";
import SuccessMessage from "@/components/SuccessMessage";
import InstagramCTA from "@/components/InstagramCTA";
import InternationalSection from "@/components/InternationalSection";
import TechPlayground from "@/components/TechPlayground";
import LeadEnricher from "@/components/LeadEnricher";

const Index = () => {
  const [submitted, setSubmitted] = useState(false);

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

        {/* Content Grid */}
        <div className="grid lg:grid-cols-5 gap-8 max-w-4xl mx-auto">
          {/* Form Card */}
          <div className="lg:col-span-3 rounded-xl border border-border bg-card p-6 md:p-8">
            <div className="flex items-center gap-2 mb-6 pb-4 border-b border-border">
              <Code2 className="h-4 w-4 text-primary" />
              <span className="font-mono text-sm text-muted-foreground">novo_desafio.tsx</span>
              <div className="ml-auto flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-destructive/60" />
                <div className="w-2.5 h-2.5 rounded-full bg-primary/40" />
                <div className="w-2.5 h-2.5 rounded-full bg-primary/60" />
              </div>
            </div>

            {submitted ? <SuccessMessage /> : <LeadForm onSuccess={() => setSubmitted(true)} />}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-2 space-y-6">
            <InstagramCTA />

            {/* Stats */}
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
        </div>

        <TechPlayground />
        <LeadEnricher />
        <InternationalSection />
      </main>

      <footer className="border-t border-border py-8 text-center">
        <p className="text-sm text-muted-foreground font-mono">
          &copy; {new Date().getFullYear()} nelson.dev — Powered by Agentes IA
        </p>
      </footer>
    </div>
  );
};

export default Index;
