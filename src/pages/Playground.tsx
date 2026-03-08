import { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Terminal, ArrowLeft, Cpu, FlaskConical, Globe, Code2, ChevronRight, Bot } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import LeadForm from "@/components/LeadForm";
import SuccessMessage from "@/components/SuccessMessage";
import TechPlayground from "@/components/TechPlayground";
import LeadEnricher from "@/components/LeadEnricher";
import NovasAtividades from "@/components/NovasAtividades";

const NAV_ITEMS = [
  { id: "novo-desafio", label: "Novo Desafio", icon: Code2 },
  { id: "tech-playground", label: "Consultoria IA", icon: FlaskConical },
  { id: "lead-enricher", label: "Enriquecimento de Leads", icon: Globe },
];

const Playground = () => {
  const [submitted, setSubmitted] = useState(false);
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const scrollTo = (id: string) => {
    sectionRefs.current[id]?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="min-h-screen bg-background grid-pattern">
      {/* Header */}
      <header className="border-b border-border sticky top-0 z-50 bg-background/80 backdrop-blur-md">
        <div className="container max-w-6xl py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Terminal className="h-5 w-5 text-primary" />
            <span className="font-mono font-bold text-foreground tracking-tight">
              nelson.proenca<span className="text-primary">.info</span>
              <span className="text-muted-foreground ml-2 text-sm font-normal">/ playground</span>
            </span>
          </div>
          <Button variant="outline" size="sm" asChild className="font-mono gap-2">
            <Link to="/">
              <ArrowLeft className="h-4 w-4" />
              Voltar para Home
            </Link>
          </Button>
        </div>
      </header>

      <main className="container max-w-6xl py-12 px-4">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12 space-y-4"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/5 px-4 py-1.5 text-sm font-mono text-accent-foreground">
            <Cpu className="h-4 w-4 text-accent" />
            Área de Demonstração
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-foreground leading-tight">
            Playground de <span className="text-gradient-primary">IA &amp; Automação</span>
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Explore demonstrações técnicas de agentes de Inteligência Artificial integrados com
            automações via <span className="text-primary font-semibold">n8n</span>. Teste em tempo real.
          </p>
        </motion.div>

        {/* Navigation */}
        <motion.nav
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="flex flex-wrap justify-center gap-3 mb-16"
        >
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => scrollTo(item.id)}
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-mono text-foreground hover:border-primary/50 hover:bg-primary/5 transition-all group"
            >
              <item.icon className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
              {item.label}
              <ChevronRight className="h-3 w-3 text-muted-foreground group-hover:text-primary transition-colors" />
            </button>
          ))}
        </motion.nav>

        {/* Section: Novo Desafio */}
        <motion.div
          ref={(el) => { sectionRefs.current["novo-desafio"] = el; }}
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.5 }}
        >
          <Card className="max-w-2xl mx-auto mb-20">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Code2 className="h-5 w-5 text-primary" />
                <CardTitle className="font-mono text-lg">Enviar Novo Desafio Técnico</CardTitle>
              </div>
              <p className="text-sm text-muted-foreground">
                Descreva seu desafio e nosso agente IA analisa via n8n.
              </p>
            </CardHeader>
            <CardContent>
              {submitted ? <SuccessMessage /> : <LeadForm onSuccess={() => setSubmitted(true)} />}
            </CardContent>
          </Card>
        </motion.div>

        {/* Section: Tech Playground */}
        <motion.div
          ref={(el) => { sectionRefs.current["tech-playground"] = el; }}
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.5 }}
        >
          <TechPlayground />
        </motion.div>

        {/* Section: Lead Enricher */}
        <motion.div
          ref={(el) => { sectionRefs.current["lead-enricher"] = el; }}
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.5 }}
          className="mb-12"
        >
          <LeadEnricher />
        </motion.div>
      </main>

      <footer className="border-t border-border py-8 text-center">
        <p className="text-sm text-muted-foreground font-mono">
          &copy; {new Date().getFullYear()} nelson.proenca.info — Powered by Agentes IA
        </p>
      </footer>
    </div>
  );
};

export default Playground;
