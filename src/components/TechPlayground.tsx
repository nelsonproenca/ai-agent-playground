import { useState } from "react";
import MarkdownView from "@/components/MarkdownView";
import { aguardarResultado, iniciarPlayground, obterPlayground } from "@/features/crm/api";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Terminal, Play, Loader2, CheckCircle2 } from "lucide-react";

const TERMINAL_LINES = [
  "> Conectando ao agente IA...",
  "> Enviando input técnico...",
  "> Processando análise...",
  "> Aguardando resposta do modelo...",
];

const TechPlayground = () => {
  const [inputTecnico, setInputTecnico] = useState("");
  const [tipoAnalise, setTipoAnalise] = useState("");
  const [loading, setLoading] = useState(false);
  const [terminalStep, setTerminalStep] = useState(0);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runAnalysis = async () => {
    if (!inputTecnico.trim() || !tipoAnalise) return;

    setLoading(true);
    setResult(null);
    setError(null);
    setTerminalStep(0);

    // Animate terminal lines
    const interval = setInterval(() => {
      setTerminalStep((prev) => {
        if (prev >= TERMINAL_LINES.length - 1) {
          clearInterval(interval);
          return prev;
        }
        return prev + 1;
      });
    }, 800);

    try {
      // O portal-api grava a análise e avisa o n8n; o resultado volta por polling no próprio portal-api.
      const { id } = await iniciarPlayground({ tipoAnalise, inputTecnico });
      const output = await aguardarResultado(async () => {
        const r = await obterPlayground(id);
        return { pronto: r.pronto, texto: r.outputIa };
      });
      clearInterval(interval);
      setTerminalStep(TERMINAL_LINES.length);

      if (output) {
        setResult(output);
      } else {
        setError("Timeout: a análise não retornou a tempo. Tente novamente.");
      }
    } catch (err) {
      clearInterval(interval);
      setError((err instanceof Error && err.message) || "Erro ao executar análise.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="mt-20">
      <div className="text-center mb-10 space-y-3">
        <div className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/5 px-4 py-1.5 text-sm font-mono text-accent-foreground">
          <Terminal className="h-4 w-4 text-accent" />
          Tech Playground
        </div>
        <h2 className="text-3xl md:text-4xl font-extrabold text-foreground">
          Consultoria IA <span className="text-gradient-primary">em tempo real</span>
        </h2>
        <p className="text-muted-foreground max-w-lg mx-auto">
          Cole seu código, logs ou query SQL e receba uma análise técnica do agente IA.
        </p>
      </div>

      <div className="max-w-2xl mx-auto space-y-5">
        {/* Input */}
        <div className="rounded-xl border border-border bg-card p-5 space-y-4 transition-all duration-300 hover:shadow-lg hover:scale-[1.02] hover:border-primary/40">
          <div className="flex items-center gap-2 pb-3 border-b border-border">
            <Terminal className="h-4 w-4 text-primary" />
            <span className="font-mono text-sm text-muted-foreground">playground.sh</span>
          </div>

          <Textarea
            placeholder="Cole seu código, log de erro, ou query SQL aqui..."
            className="min-h-[160px] font-mono text-sm bg-background resize-none"
            value={inputTecnico}
            onChange={(e) => setInputTecnico(e.target.value)}
            disabled={loading}
          />

          <div className="flex flex-col sm:flex-row gap-3">
            <Select value={tipoAnalise} onValueChange={setTipoAnalise} disabled={loading}>
              <SelectTrigger className="font-mono text-sm flex-1">
                <SelectValue placeholder="Tipo de análise" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Análise de Erro">Análise de Erro</SelectItem>
                <SelectItem value="Review de Arquitetura">Review de Arquitetura</SelectItem>
                <SelectItem value="Otimização SQL">Otimização SQL</SelectItem>
              </SelectContent>
            </Select>

            <Button
              onClick={runAnalysis}
              disabled={loading || !inputTecnico.trim() || !tipoAnalise}
              className="font-mono gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Analisando...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" />
                  Executar Consultoria IA
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Terminal animation */}
        {loading && (
          <div className="rounded-xl border border-border bg-card p-5 font-mono text-sm space-y-1.5 animate-float-in">
            {TERMINAL_LINES.map((line, i) => (
              <p
                key={i}
                className={`transition-opacity duration-300 ${
                  i <= terminalStep ? "opacity-100 text-primary" : "opacity-20 text-muted-foreground"
                }`}
              >
                {line}
                {i === terminalStep && <span className="animate-pulse ml-1">█</span>}
              </p>
            ))}
          </div>
        )}

        {/* Error */}
        {error && (
          <Card className="border-destructive/50 animate-float-in">
            <CardContent className="p-5 font-mono text-sm text-destructive">
              {error}
            </CardContent>
          </Card>
        )}

        {/* Result */}
        {result && (
          <div className="rounded-xl border border-primary/30 bg-card animate-float-in">
            <div className="flex items-center gap-2 px-5 py-3 border-b border-border">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              <span className="font-mono text-sm text-primary">output_ia.md</span>
            </div>
            <div className="p-5">
              <MarkdownView>{result}</MarkdownView>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default TechPlayground;
