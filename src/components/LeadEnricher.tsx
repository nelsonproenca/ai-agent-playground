import { useState } from "react";
import MarkdownView from "@/components/MarkdownView";
import { aguardarResultado, iniciarEnrich, obterEnrich } from "@/features/crm/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Globe, Search, Sparkles, Loader2, Zap } from "lucide-react";

const TERMINAL_LINES = [
  "> Conectando ao agente de enriquecimento...",
  "> Searching Web...",
  "> Coletando dados públicos da empresa...",
  "> Generating Insights...",
  "> Montando sugestões de automação...",
];

const LeadEnricher = () => {
  const [domain, setDomain] = useState("");
  const [segment, setSegment] = useState("");
  const [loading, setLoading] = useState(false);
  const [terminalStep, setTerminalStep] = useState(0);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runEnrichment = async () => {
    if (!domain.trim() || !segment.trim()) return;

    setLoading(true);
    setResult(null);
    setError(null);
    setTerminalStep(0);

    const interval = setInterval(() => {
      setTerminalStep((prev) => {
        if (prev >= TERMINAL_LINES.length - 1) {
          clearInterval(interval);
          return prev;
        }
        return prev + 1;
      });
    }, 1000);

    try {
      // O portal-api grava o pedido e avisa o n8n; o resultado volta por polling no próprio portal-api.
      const { id } = await iniciarEnrich({ nomeEmpresa: domain.trim(), segmento: segment.trim() });
      const output = await aguardarResultado(async () => {
        const r = await obterEnrich(id);
        return { pronto: r.pronto, texto: r.outputAi };
      });
      clearInterval(interval);
      setTerminalStep(TERMINAL_LINES.length);

      if (output) {
        setResult(output);
      } else {
        setError("Timeout: o agente não retornou a tempo. Tente novamente.");
      }
    } catch (err) {
      clearInterval(interval);
      setError((err instanceof Error && err.message) || "Erro ao executar enriquecimento.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="mt-20">
      <div className="text-center mb-10 space-y-3">
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-4 py-1.5 text-sm font-mono text-primary">
          <Globe className="h-4 w-4" />
          Lead Enricher
        </div>
        <h2 className="text-3xl md:text-4xl font-extrabold text-foreground">
          Enriqueça empresas com <span className="text-gradient-primary">IA + Web</span>
        </h2>
        <p className="text-muted-foreground max-w-lg mx-auto">
          Informe o domínio e o segmento. O agente pesquisa a web e gera sugestões de automação.
        </p>
      </div>

      <div className="max-w-2xl mx-auto space-y-5">
        {/* Inputs */}
        <div className="rounded-xl border border-border bg-card p-5 space-y-4 transition-all duration-300 hover:shadow-lg hover:scale-[1.02] hover:border-primary/40">
          <div className="flex items-center gap-2 pb-3 border-b border-border">
            <Search className="h-4 w-4 text-primary" />
            <span className="font-mono text-sm text-muted-foreground">enrich_company.sh</span>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <Input
              placeholder="ex: apple.com"
              className="font-mono text-sm bg-background"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              disabled={loading}
            />
            <Input
              placeholder="ex: Dentista"
              className="font-mono text-sm bg-background"
              value={segment}
              onChange={(e) => setSegment(e.target.value)}
              disabled={loading}
            />
          </div>

          <Button
            onClick={runEnrichment}
            disabled={loading || !domain.trim() || !segment.trim()}
            className="font-mono gap-2 w-full"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Analisando...
              </>
            ) : (
              <>
                <Zap className="h-4 w-4" />
                Analisar Oportunidade
              </>
            )}
          </Button>
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
          <div className="rounded-xl border border-primary/30 bg-card p-5 animate-float-in">
            <div className="flex items-center gap-2 mb-3">
              <Globe className="h-4 w-4 text-primary" />
              <span className="font-mono text-sm text-primary font-semibold">Resumo e Sugestões de Automação</span>
            </div>
            <MarkdownView>{result}</MarkdownView>
          </div>
        )}
      </div>
    </section>
  );
};

export default LeadEnricher;
