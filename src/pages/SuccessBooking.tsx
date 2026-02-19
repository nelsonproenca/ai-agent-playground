import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle, Mail, ArrowLeft, Linkedin, Server, Cloud, Brain, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

const PILLARS = [
  {
    icon: Server,
    title: "Legacy Modernization",
    description: "Especialista em migração de .NET Framework para .NET 6/8+, refatoração de monólitos e adoção de arquiteturas modernas.",
  },
  {
    icon: Cloud,
    title: "Cloud & Architecture",
    description: "Desenho de soluções SOA, Multi-cloud (Azure, AWS, OCI) e infraestrutura escalável com alta disponibilidade.",
  },
  {
    icon: Brain,
    title: "AI Integration",
    description: "Implementação de agentes autônomos e automação de processos com LLMs (Gemini/n8n) integrados ao seu pipeline.",
  },
];

const SuccessBooking = () => {
  const [showCheck, setShowCheck] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setShowCheck(true), 400);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Subtle gradient orbs */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-[hsl(230_60%_30%/0.15)] blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-[hsl(260_60%_40%/0.12)] blur-[120px]" />
      </div>

      <div className="relative z-10">
        {/* Header */}
        <header className="border-b border-border/50">
          <div className="container max-w-5xl py-5 flex items-center gap-3">
            <span className="font-mono font-bold text-foreground tracking-tight text-lg">
              nelson.proenca<span className="text-primary">.info</span>
            </span>
          </div>
        </header>

        <main className="container max-w-3xl py-16 px-4 flex flex-col items-center">
          {/* Animated Check */}
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={showCheck ? { scale: 1, opacity: 1 } : {}}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            className="relative mb-8"
          >
            <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center glow-primary animate-pulse-glow">
              <CheckCircle className="h-12 w-12 text-primary" strokeWidth={1.5} />
            </div>
          </motion.div>

          {/* Title */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="text-center mb-10 space-y-3"
          >
            <h1 className="text-3xl md:text-4xl font-extrabold text-foreground leading-tight">
              Reunião <span className="text-gradient-primary">Confirmada</span> com Nelson Proença
            </h1>
            <p className="text-muted-foreground text-sm font-mono">
              {"// consultoria agendada com sucesso"}
            </p>
          </motion.div>

          {/* Glassmorphism Card — Next Steps */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.5 }}
            className="w-full rounded-xl border border-border/60 bg-card/40 backdrop-blur-md p-6 md:p-8 mb-16"
          >
            <div className="flex items-start gap-4">
              <div className="shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Mail className="h-5 w-5 text-primary" />
              </div>
              <div className="space-y-2">
                <h2 className="text-lg font-bold text-foreground">Próximo Passo</h2>
                <p className="text-muted-foreground leading-relaxed text-sm">
                  O convite com o link do <span className="font-mono text-primary font-semibold">Google Meet/Teams</span> foi
                  enviado para o seu e-mail. Por favor, verifique também sua{" "}
                  <span className="text-foreground font-medium">caixa de spam</span>.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Pillars of Expertise */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1, duration: 0.5 }}
            className="w-full mb-16"
          >
            <p className="text-center text-xs font-mono text-muted-foreground uppercase tracking-widest mb-8">
              Enquanto você aguarda — Pillars of Expertise
            </p>

            <div className="grid gap-4 md:grid-cols-3">
              {PILLARS.map((pillar, i) => (
                <motion.div
                  key={pillar.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.1 + i * 0.15, duration: 0.4 }}
                  className="group rounded-xl border border-border/50 bg-card/30 backdrop-blur-sm p-5 hover:border-primary/40 hover:bg-primary/5 transition-all duration-300"
                >
                  <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center mb-4 group-hover:bg-primary/10 transition-colors">
                    <pillar.icon className="h-4.5 w-4.5 text-accent group-hover:text-primary transition-colors" />
                  </div>
                  <h3 className="font-mono font-bold text-sm text-foreground mb-2">{pillar.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{pillar.description}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Actions */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5, duration: 0.5 }}
            className="flex flex-col items-center gap-4"
          >
            <Button asChild size="lg" className="font-mono gap-2 glow-primary">
              <Link to="/">
                <ArrowLeft className="h-4 w-4" />
                Voltar para o Início
              </Link>
            </Button>

            <a
              href="https://www.linkedin.com/in/nelson-proenca/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-mono text-muted-foreground hover:text-primary transition-colors"
            >
              <Linkedin className="h-3.5 w-3.5" />
              Conecte-se no LinkedIn
              <ExternalLink className="h-3 w-3" />
            </a>
          </motion.div>
        </main>
      </div>
    </div>
  );
};

export default SuccessBooking;
