import { useState, useEffect } from "react";
import { Filter, Calendar, User, MessageSquare, CheckCircle2, Eye, UserPlus, Loader2, Trash2 } from "lucide-react";
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
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { createCliente } from "@/features/clientes/api";
import { createContato, excluirLead, listLeads, marcarLeadVisto, type Lead } from "@/features/crm/api";

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
  const [leadParaExcluir, setLeadParaExcluir] = useState<Lead | null>(null);
  const [excluindo, setExcluindo] = useState(false);

  useEffect(() => {
    let ativo = true;
    const fetchLeads = async (primeira: boolean) => {
      if (primeira) setLoading(true);
      try {
        const data = await listLeads();
        if (ativo) setLeads(data);
      } catch {
        if (primeira) toast.error("Erro ao carregar leads.");
      }
      if (ativo && primeira) setLoading(false);
    };

    fetchLeads(true);
    // Sem atualização em tempo real: relê a lista de tempos em tempos (a análise da IA chega depois do envio).
    const timer = setInterval(() => fetchLeads(false), 30_000);

    return () => {
      ativo = false;
      clearInterval(timer);
    };
  }, []);

  const toggleVisto = async (e: React.MouseEvent, lead: Lead) => {
    e.stopPropagation();
    const newValue = !lead.vistoPeloNelson;
    const aplicar = (valor: boolean) => {
      setLeads((prev) => prev.map((l) => l.id === lead.id ? { ...l, vistoPeloNelson: valor } : l));
      setSelectedLead((prev) => prev && prev.id === lead.id ? { ...prev, vistoPeloNelson: valor } : prev);
    };
    aplicar(newValue);
    try {
      await marcarLeadVisto(lead.id, newValue);
    } catch {
      aplicar(!newValue); // desfaz a marcação otimista
      toast.error("Não foi possível atualizar o lead.");
    }
  };

  const confirmarExclusao = async () => {
    if (!leadParaExcluir) return;
    setExcluindo(true);
    try {
      await excluirLead(leadParaExcluir.id);
      setLeads((prev) => prev.filter((l) => l.id !== leadParaExcluir.id));
      setSelectedLead((prev) => (prev?.id === leadParaExcluir.id ? null : prev));
      setLeadParaExcluir(null);
      toast.success("Lead excluído.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível excluir o lead.");
    } finally {
      setExcluindo(false);
    }
  };

  const convertLeadToCliente = async (lead: Lead) => {
    setConverting(true);
    const nome = lead.nome ?? "Sem nome";
    const email = lead.contato ?? "";
    const empresa = lead.empresa;

    let cliente;
    try {
      cliente = await createCliente({
        nome, email, empresa, segmento: null, siteUrl: null, logoUrl: null, status: null,
      });
    } catch {
      toast.error("Erro ao criar cliente.");
      setConverting(false);
      return;
    }

    if (email) {
      try {
        await createContato({ clienteId: cliente.id, nome, email, telefone: null });
      } catch {
        toast.warning("Cliente criado, mas o contato não pôde ser adicionado.");
      }
    }

    toast.success("Lead convertido em cliente com sucesso!");
    setConverting(false);
  };

  const filteredLeads = leads.filter((lead) => {
    if (activeFilter === "all") return true;
    const keywords = FILTER_CONFIG[activeFilter].keywords;
    const text = `${lead.analiseIa ?? ""} ${lead.desafioTecnico ?? ""}`.toLowerCase();
    return keywords.some((kw) => text.includes(kw));
  });

  const getStatusBadge = (lead: Lead) => {
    if (lead.analiseIa) {
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
              <TableHead className="font-mono text-xs text-muted-foreground">Desafio</TableHead>
              <TableHead className="font-mono text-xs text-muted-foreground">Análise IA</TableHead>
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
                    {new Date(lead.createdAt).toLocaleDateString("pt-BR")}
                  </TableCell>
                  <TableCell className="font-medium text-foreground">{lead.nome ?? "—"}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">{lead.canal ?? "—"}</TableCell>
                  <TableCell className="text-muted-foreground text-sm max-w-[200px] truncate" title={lead.desafioTecnico ?? ""}>{lead.desafioTecnico ?? "—"}</TableCell>
                  <TableCell className="text-muted-foreground text-sm max-w-[200px] truncate" title={lead.analiseIa ?? ""}>{lead.analiseIa ?? "—"}</TableCell>
                  <TableCell className="text-center">
                    <button
                      className="h-8 w-8 inline-flex items-center justify-center rounded-md hover:bg-primary transition-colors group"
                      onClick={(e) => toggleVisto(e, lead)}
                      title={lead.vistoPeloNelson ? "Marcar como não visto" : "Marcar como visto"}
                    >
                      {lead.vistoPeloNelson ? (
                        <CheckCircle2 className="h-4 w-4 text-primary" />
                      ) : (
                        <Eye className="h-5 w-5 text-foreground stroke-[2.5] group-hover:text-black transition-colors" />
                      )}
                    </button>
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
              {selectedLead && new Date(selectedLead.createdAt).toLocaleString("pt-BR")}
              {selectedLead?.canal && (
                <Badge variant="secondary" className="ml-2 text-xs">{selectedLead.canal}</Badge>
              )}
            </SheetDescription>
          </SheetHeader>

          {selectedLead && (
            <div className="mt-4">
              <Button
                variant={selectedLead.vistoPeloNelson ? "default" : "secondary"}
                size="sm"
                className="font-mono text-xs w-full gap-2"
                onClick={(e) => toggleVisto(e, selectedLead)}
              >
                {selectedLead.vistoPeloNelson ? (
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

          {selectedLead && (
            <div className="mt-3">
              <Button
                variant="outline"
                size="sm"
                className="font-mono text-xs w-full gap-2 border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
                onClick={() => setLeadParaExcluir(selectedLead)}
              >
                <Trash2 className="h-4 w-4" /> Excluir lead
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
                {selectedLead?.desafioTecnico || "Nenhum desafio informado."}
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-mono text-xs text-primary uppercase tracking-wider flex items-center gap-2">
                ✦ Análise da Consultoria (IA)
              </h4>
              <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 text-sm text-foreground leading-relaxed whitespace-pre-wrap glow-primary">
                {selectedLead?.analiseIa || (
                  <span className="text-muted-foreground italic">Análise pendente...</span>
                )}
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Confirmação de exclusão */}
      <AlertDialog open={!!leadParaExcluir} onOpenChange={(o) => { if (!o && !excluindo) setLeadParaExcluir(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir este lead?</AlertDialogTitle>
            <AlertDialogDescription>
              O lead <strong>{leadParaExcluir?.nome ?? "sem nome"}</strong> e a análise da IA serão apagados.
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={excluindo}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); confirmarExclusao(); }}
              disabled={excluindo}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {excluindo ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Excluindo...</> : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default GestaoLeads;
