import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Terminal, Lock, Eye, Filter, X, Calendar, User, MessageSquare } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import type { Tables } from "@/integrations/supabase/types";

type Lead = Tables<"leads_ia">;

type FilterKey = "all" | "alta_complexidade" | "automacao" | "consultoria_dotnet";

const FILTER_CONFIG: Record<FilterKey, { label: string; keywords: string[] }> = {
  all: { label: "Todos", keywords: [] },
  alta_complexidade: {
    label: "Alta Complexidade",
    keywords: ["complexo", "complexidade", "crítico", "avançado", "desafiador", "alta complexidade"],
  },
  automacao: {
    label: "Automação",
    keywords: ["automação", "automatizar", "n8n", "workflow", "pipeline", "bot", "agente"],
  },
  consultoria_dotnet: {
    label: "Consultoria .NET",
    keywords: [".net", "dotnet", "c#", "csharp", "azure", "asp.net", "blazor", "entity framework"],
  },
};

const Dashboard = () => {
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterKey>("all");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === "nelson2024") {
      setAuthenticated(true);
      setPasswordError("");
    } else {
      setPasswordError("Senha incorreta.");
    }
  };

  useEffect(() => {
    if (!authenticated) return;

    const fetchLeads = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("leads_ia")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error && data) setLeads(data);
      setLoading(false);
    };

    fetchLeads();

    const channel = supabase
      .channel("leads-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "leads_ia" }, () => {
        fetchLeads();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [authenticated]);

  const filteredLeads = leads.filter((lead) => {
    if (activeFilter === "all") return true;
    const keywords = FILTER_CONFIG[activeFilter].keywords;
    const text = `${lead.analise_ia ?? ""} ${lead.desafio_tecnico ?? ""}`.toLowerCase();
    return keywords.some((kw) => text.includes(kw));
  });

  const getStatusBadge = (lead: Lead) => {
    if (lead.analise_ia) {
      return <Badge className="bg-primary/20 text-primary border-primary/30">Analisado</Badge>;
    }
    return <Badge variant="secondary" className="text-muted-foreground">Pendente</Badge>;
  };

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-background grid-pattern flex items-center justify-center p-4">
        <Card className="w-full max-w-sm border-border bg-card">
          <CardHeader className="text-center space-y-3">
            <div className="mx-auto inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 glow-primary">
              <Lock className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="font-mono text-foreground">Dashboard Admin</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <Input
                type="password"
                placeholder="Senha de acesso"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="font-mono bg-secondary border-border text-foreground"
              />
              {passwordError && (
                <p className="text-sm text-destructive font-mono">{passwordError}</p>
              )}
              <Button type="submit" className="w-full font-mono">
                Acessar
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background grid-pattern">
      {/* Header */}
      <header className="border-b border-border sticky top-0 z-40 bg-background/80 backdrop-blur-sm">
        <div className="container max-w-7xl py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Terminal className="h-5 w-5 text-primary" />
            <span className="font-mono font-bold text-foreground">
              nelson<span className="text-primary">.admin</span>
            </span>
          </div>
          <Badge variant="outline" className="font-mono text-xs border-primary/30 text-primary">
            {leads.length} leads
          </Badge>
        </div>
      </header>

      <main className="container max-w-7xl py-8 px-4 space-y-6">
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          {(Object.keys(FILTER_CONFIG) as FilterKey[]).map((key) => (
            <Button
              key={key}
              variant={activeFilter === key ? "default" : "secondary"}
              size="sm"
              className="font-mono text-xs"
              onClick={() => setActiveFilter(key)}
            >
              {FILTER_CONFIG[key].label}
            </Button>
          ))}
        </div>

        {/* Table */}
        <Card className="border-border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="font-mono text-xs text-muted-foreground">Data</TableHead>
                <TableHead className="font-mono text-xs text-muted-foreground">Nome</TableHead>
                <TableHead className="font-mono text-xs text-muted-foreground">Canal</TableHead>
                <TableHead className="font-mono text-xs text-muted-foreground">Status</TableHead>
                <TableHead className="font-mono text-xs text-muted-foreground w-[60px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground font-mono py-12">
                    Carregando...
                  </TableCell>
                </TableRow>
              ) : filteredLeads.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground font-mono py-12">
                    Nenhum lead encontrado.
                  </TableCell>
                </TableRow>
              ) : (
                filteredLeads.map((lead) => (
                  <TableRow
                    key={lead.id}
                    className="border-border cursor-pointer hover:bg-secondary/50 transition-colors"
                    onClick={() => setSelectedLead(lead)}
                  >
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {new Date(lead.created_at).toLocaleDateString("pt-BR")}
                    </TableCell>
                    <TableCell className="font-medium text-foreground">{lead.nome ?? "—"}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{lead.canal ?? "—"}</TableCell>
                    <TableCell>{getStatusBadge(lead)}</TableCell>
                    <TableCell>
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      </main>

      {/* Detail Sheet */}
      <Sheet open={!!selectedLead} onOpenChange={(open) => !open && setSelectedLead(null)}>
        <SheetContent className="bg-card border-border overflow-y-auto w-full sm:max-w-lg">
          <SheetHeader className="space-y-1">
            <SheetTitle className="font-mono text-foreground flex items-center gap-2">
              <User className="h-4 w-4 text-primary" />
              {selectedLead?.nome ?? "Lead"}
            </SheetTitle>
            <SheetDescription className="font-mono text-xs text-muted-foreground flex items-center gap-2">
              <Calendar className="h-3 w-3" />
              {selectedLead && new Date(selectedLead.created_at).toLocaleString("pt-BR")}
              {selectedLead?.canal && (
                <Badge variant="secondary" className="ml-2 text-xs">{selectedLead.canal}</Badge>
              )}
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6 space-y-6">
            {/* Contact */}
            {selectedLead?.contato && (
              <div className="space-y-2">
                <h4 className="font-mono text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                  <MessageSquare className="h-3 w-3" />
                  Contato
                </h4>
                <p className="text-sm text-foreground bg-secondary/50 rounded-lg p-3 font-mono">
                  {selectedLead.contato}
                </p>
              </div>
            )}

            {/* Challenge */}
            <div className="space-y-2">
              <h4 className="font-mono text-xs text-muted-foreground uppercase tracking-wider">
                {"// desafio_tecnico"}
              </h4>
              <div className="rounded-lg bg-secondary/50 p-4 text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                {selectedLead?.desafio_tecnico || "Nenhum desafio informado."}
              </div>
            </div>

            {/* AI Analysis */}
            <div className="space-y-2">
              <h4 className="font-mono text-xs text-primary uppercase tracking-wider flex items-center gap-2">
                ✦ Análise da Consultoria (IA)
              </h4>
              <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 text-sm text-foreground leading-relaxed whitespace-pre-wrap glow-primary">
                {selectedLead?.analise_ia || (
                  <span className="text-muted-foreground italic">Análise pendente...</span>
                )}
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default Dashboard;
