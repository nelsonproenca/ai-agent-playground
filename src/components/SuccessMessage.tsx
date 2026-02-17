import { useState, useEffect } from "react";
import { CheckCircle2, Sparkles, Server, Workflow, Brain } from "lucide-react";
import { Progress } from "@/components/ui/progress";

const STEPS = [
  { label: "Enviando para VPS...", icon: Server, duration: 1000 },
  { label: "Orquestrando via n8n...", icon: Workflow, duration: 1000 },
  { label: "Analisando via Gemini 1.5 Pro...", icon: Brain, duration: 1000 },
];

const SuccessMessage = () => {
  const [stepIndex, setStepIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (done) return;

    const totalDuration = STEPS.reduce((s, st) => s + st.duration, 0);
    const tick = 50;
    let elapsed = 0;

    const interval = setInterval(() => {
      elapsed += tick;
      const pct = Math.min((elapsed / totalDuration) * 100, 100);
      setProgress(pct);

      // determine current step
      let acc = 0;
      for (let i = 0; i < STEPS.length; i++) {
        acc += STEPS[i].duration;
        if (elapsed <= acc) {
          setStepIndex(i);
          break;
        }
      }

      if (elapsed >= totalDuration) {
        clearInterval(interval);
        setTimeout(() => setDone(true), 300);
      }
    }, tick);

    return () => clearInterval(interval);
  }, [done]);

  if (!done) {
    const CurrentIcon = STEPS[stepIndex].icon;
    return (
      <div className="animate-float-in text-center space-y-6 py-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 animate-pulse-glow">
          <CurrentIcon className="h-8 w-8 text-primary animate-pulse" />
        </div>

        <div className="space-y-4 max-w-sm mx-auto">
          <p className="font-mono text-sm text-primary">{STEPS[stepIndex].label}</p>
          <Progress value={progress} className="h-2" />
          <div className="flex justify-between text-[10px] font-mono text-muted-foreground/50">
            {STEPS.map((s, i) => (
              <span key={i} className={i <= stepIndex ? "text-primary/70" : ""}>
                {s.label.split("...")[0]}
              </span>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-float-in text-center space-y-6 py-8">
      <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 glow-primary animate-pulse-glow">
        <CheckCircle2 className="h-10 w-10 text-primary" />
      </div>

      <div className="space-y-3">
        <h3 className="text-2xl font-bold text-foreground flex items-center justify-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          Obrigado!
          <Sparkles className="h-5 w-5 text-primary" />
        </h3>
        <p className="text-muted-foreground leading-relaxed max-w-md mx-auto">
          Meu agente processou seu pedido. Como sou um especialista com{" "}
          <span className="text-primary font-semibold">+15 anos de XP em .NET e Azure</span>,
          analisarei seu caso pessoalmente.
        </p>
      </div>

      <div className="pt-2">
        <p className="text-sm text-muted-foreground font-mono">
          {"// retorno em até 24h"}
        </p>
      </div>
    </div>
  );
};

export default SuccessMessage;
