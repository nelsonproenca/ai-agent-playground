import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { MessageSquareText, Plus, Loader2, HelpCircle, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import {
  createPedido, listEtapas, listPedidos, listRespostas,
  type Etapa, type Pedido, type PedidoResposta,
} from "@/features/portfolio/api";

const HistoricoRespostas = ({ pedidoId }: { pedidoId: string }) => {
  const [respostas, setRespostas] = useState<PedidoResposta[]>([]);

  useEffect(() => { listRespostas(pedidoId).then(setRespostas); }, [pedidoId]);

  if (respostas.length === 0) return null;

  return (
    <div className="space-y-1.5 mt-2 border-t border-border pt-2">
      {respostas.map((r) => (
        <div key={r.id} className="text-xs">
          <p className="text-foreground">{r.texto}</p>
          <p className="text-muted-foreground font-mono">{new Date(r.created_at).toLocaleString("pt-BR")}</p>
        </div>
      ))}
    </div>
  );
};

const statusLabel: Record<string, string> = {
  pendente: "Pendente",
  respondido: "Respondido",
  aprovado: "Aprovado",
  ajuste_solicitado: "Ajuste solicitado",
};

const statusVariant: Record<string, "outline" | "default" | "destructive"> = {
  pendente: "outline",
  respondido: "default",
  aprovado: "default",
  ajuste_solicitado: "destructive",
};

const GestaoPedidos = ({ projetoId }: { projetoId: string }) => {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [etapas, setEtapas] = useState<Etapa[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [tipo, setTipo] = useState<"pergunta" | "validacao">("pergunta");
  const [etapaId, setEtapaId] = useState<string>("none");
  const [titulo, setTitulo] = useState("");

  const fetchData = async () => {
    setLoading(true);
    try {
      const [p, e] = await Promise.all([listPedidos(projetoId), listEtapas(projetoId)]);
      setPedidos(p);
      setEtapas(e);
    } catch {
      toast.error("Erro ao carregar pedidos.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [projetoId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo.trim()) return;

    setSaving(true);
    try {
      await createPedido({
        projeto_id: projetoId,
        etapa_id: etapaId === "none" ? null : etapaId,
        tipo,
        titulo: titulo.trim(),
      });
      toast.success("Pedido criado!");
      setTitulo("");
      fetchData();
    } catch {
      toast.error("Erro ao criar pedido.");
    } finally {
      setSaving(false);
    }
  };

  const etapaNome = (id: string | null) => etapas.find((e) => e.id === id)?.nome ?? null;

  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <CardTitle className="font-mono text-foreground flex items-center gap-2 text-base">
          <MessageSquareText className="h-4 w-4 text-primary" />
          Pedidos
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select value={tipo} onValueChange={(v) => setTipo(v as "pergunta" | "validacao")}>
              <SelectTrigger className="font-mono bg-secondary border-border text-foreground">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pergunta">Pergunta</SelectItem>
                <SelectItem value="validacao">Validação de entrega</SelectItem>
              </SelectContent>
            </Select>
            <Select value={etapaId} onValueChange={setEtapaId}>
              <SelectTrigger className="font-mono bg-secondary border-border text-foreground">
                <SelectValue placeholder="Etapa (opcional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sem etapa</SelectItem>
                {etapas.map((et) => (
                  <SelectItem key={et.id} value={et.id}>{et.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Textarea
            placeholder={tipo === "pergunta" ? "O que você quer perguntar ao cliente?" : "O que precisa ser validado?"}
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            className="font-mono bg-secondary border-border text-foreground"
          />
          <Button type="submit" size="sm" className="font-mono gap-1" disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Criar Pedido
          </Button>
        </form>

        {loading ? (
          <p className="text-sm text-muted-foreground font-mono text-center py-4">Carregando...</p>
        ) : pedidos.length === 0 ? (
          <p className="text-sm text-muted-foreground font-mono text-center py-4">Nenhum pedido criado.</p>
        ) : (
          <div className="space-y-2">
            {pedidos.map((p) => (
              <div key={p.id} className="bg-secondary/50 rounded-lg p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2 min-w-0">
                    {p.tipo === "pergunta" ? (
                      <HelpCircle className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    ) : (
                      <ShieldCheck className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    )}
                    <div className="min-w-0">
                      <p className="text-sm text-foreground">{p.titulo}</p>
                      {etapaNome(p.etapa_id) && (
                        <p className="text-xs text-muted-foreground font-mono">{etapaNome(p.etapa_id)}</p>
                      )}
                    </div>
                  </div>
                  <Badge variant={statusVariant[p.status]} className="font-mono text-xs shrink-0">
                    {statusLabel[p.status]}
                  </Badge>
                </div>
                <HistoricoRespostas pedidoId={p.id} />
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default GestaoPedidos;
