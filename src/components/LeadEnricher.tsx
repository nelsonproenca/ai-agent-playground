import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
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

const TryParseSuggestions = (output: string): { summary: string; suggestions: string[] } => {
  const lines = output.split("\n").map((l) => l.trim()).filter(Boolean);
  const suggestions: string[] = [];
  const summaryLines: string[] = [];

  for (const line of lines) {
    const match = line.match(/^\d+[\.\)]\s*(.+)/);
    if (match) {
      suggestions.push(match[1]);
    } else {
      summaryLines.push(line);
    }
  }

  return {
    summary: summaryLines.join("\n"),
    suggestions: suggestions.length > 0 ? suggestions.slice(0, 5) : [],
  };
};

const LeadEnricher = () => {
  const [domain, setDomain] = useState("");
  const [segment, setSegment] = useState("");
  const [loading, setLoading] = useState(false);
  const [terminalStep, setTerminalStep] = useState(0);
  const [result, setResult] = useState<{ summary: string; suggestions: string[] } | null>(null);
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
      // 1. Insert into Supabase
      const { data: inserted, error: insertError } = await supabase
        .from("enrich_company")
        .insert({
          company_name: domain.trim(),
          segment: segment.trim(),
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // 2. Call n8n webhook
      await fetch(
        "https://n8n.nelson-proenca-info.com.br/webhook/enriquecer-empresa",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          mode: "no-cors",
          body: JSON.stringify({
            id: inserted.id,
            nome_empresa: domain.trim(),
            segmento_empresa: segment.trim(),
          }),
        }
      );

      // 3. Poll for output_ia
      const pollForResult = async (id: string, attempts = 0): Promise<string | null> => {
        if (attempts > 30) return null;
        await new Promise((r) => setTimeout(r, 2000));
        const { data } = await supabase
          .from("enrich_company")
          .select("output_ai")
          .eq("id", id)
          .maybeSingle();
        if (data?.output_ai) return data.output_ai;
        return pollForResult(id, attempts + 1);
      };

      const output = await pollForResult(inserted.id);
      clearInterval(interval);
      setTerminalStep(TERMINAL_LINES.length);

      if (output) {
        setResult(TryParseSuggestions(output));
      } else {
        setError("Timeout: o agente não retornou a tempo. Tente novamente.");
      }
    } catch (err: any) {
      clearInterval(interval);
      setError(err.message || "Erro ao executar enriquecimento.");
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
        <div className="rounded-xl border border-border bg-card p-5 space-y-4">
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
          <div className="space-y-4 animate-float-in">
            {/* Summary */}
            {result.summary && (
              <div className="rounded-xl border border-primary/30 bg-card p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Globe className="h-4 w-4 text-primary" />
                  <span className="font-mono text-sm text-primary font-semibold">Resumo da Pesquisa</span>
                </div>
                <pre className="font-mono text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                  {result.summary}
                </pre>
              </div>
            )}

            {/* Suggestions */}
            {result.suggestions.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-mono text-sm text-muted-foreground flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-accent" />
                  Sugestões de Automação
                </h3>
                <div className="grid gap-3">
                  {result.suggestions.map((suggestion, i) => (
                    <Card key={i} className="border-accent/20 hover:border-accent/40 transition-colors">
                      <CardContent className="p-4 flex items-start gap-3">
                        <div className="mt-0.5 rounded-md bg-accent/10 p-1.5 shrink-0">
                          <Sparkles className="h-4 w-4 text-accent" />
                        </div>
                        <p className="text-sm text-foreground leading-relaxed">{suggestion}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
};

export default LeadEnricher;
