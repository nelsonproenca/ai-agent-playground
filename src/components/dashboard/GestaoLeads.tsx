import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Filter, Calendar, User, MessageSquare, CheckCircle2, Eye, UserPlus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
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

const GestaoLeads = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterKey>("all");
  const [converting, setConverting] = useState(false);

  useEffect(() => {
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
  }, []);

  const toggleVisto = async (e: React.MouseEvent, lead: Lead) => {
    e.stopPropagation();
    const newValue = !lead.visto_pelo_nelson;
    setLeads((prev) => prev.map((l) => l.id === lead.id ? { ...l, visto_pelo_nelson: newValue } : l));
    if (selectedLead?.id === lead.id) setSelectedLead((prev) => prev ? { ...prev, visto_pelo_nelson: newValue } : prev);
    await supabase.from("leads_ia").update({ visto_pelo_nelson: newValue }).eq("id", lead.id);
  };

  const convertLeadToCliente = async (lead: Lead) => {
    setConverting(true);
    const nome = lead.nome ?? "Sem nome";
    const email = lead.contato ?? "";
    const empresa = (lead as any).empresa ?? null;

    const { data: cliente, error: clienteError } = await supabase
      .from("clientes")
      .insert({ nome, email, empresa, segmento: null, site_url: null })
      .select()
      .single();

    if (clienteError || !cliente) {
      toast.error("Erro ao criar cliente.");
      setConverting(false);
      return;
    }

    if (email) {
      await supabase.from("contatos_clientes").insert({
        cliente_id: cliente.id, nome, email, telefone: null,
      });
    }

    toast.success("Lead convertido em cliente com sucesso!");
    setConverting(false);
  };

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

  return (
    <>
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
              <TableHead className="font-mono text-xs text-muted-foreground text-center">Visto</TableHead>
              
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground font-mono py-12">
                  Carregando...
                </TableCell>
              </TableRow>
            ) : filteredLeads.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground font-mono py-12">
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
                  <TableCell className="text-center">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={(e) => toggleVisto(e, lead)}
                      title={lead.visto_pelo_nelson ? "Marcar como não visto" : "Marcar como visto"}
                    >
                      {lead.visto_pelo_nelson ? (
                        <CheckCircle2 className="h-4 w-4 text-primary" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

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

          {selectedLead && (
            <div className="mt-4">
              <Button
                variant={selectedLead.visto_pelo_nelson ? "default" : "secondary"}
                size="sm"
                className="font-mono text-xs w-full gap-2"
                onClick={(e) => toggleVisto(e, selectedLead)}
              >
                {selectedLead.visto_pelo_nelson ? (
                  <><CheckCircle2 className="h-4 w-4" /> Visto pelo Nelson</>
                ) : (
                  <><Eye className="h-4 w-4" /> Marcar como visto</>
                )}
              </Button>
            </div>
          )}

          {selectedLead && (
            <div className="mt-3">
              <Button
                variant="secondary"
                size="sm"
                className="font-mono text-xs w-full gap-2"
                disabled={converting}
                onClick={() => convertLeadToCliente(selectedLead)}
              >
                {converting ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Convertendo...</>
                ) : (
                  <><UserPlus className="h-4 w-4" /> Converter em Cliente</>
                )}
              </Button>
            </div>
          )}

          <div className="mt-6 space-y-6">
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

            <div className="space-y-2">
              <h4 className="font-mono text-xs text-muted-foreground uppercase tracking-wider">
                {"// desafio_tecnico"}
              </h4>
              <div className="rounded-lg bg-secondary/50 p-4 text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                {selectedLead?.desafio_tecnico || "Nenhum desafio informado."}
              </div>
            </div>

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
    </>
  );
};

export default GestaoLeads;
