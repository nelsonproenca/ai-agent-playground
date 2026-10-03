import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft, ListOrdered, Paperclip, FileText, Link as LinkIcon, Download,
  MessageSquareText, HelpCircle, ShieldCheck, Loader2, Check, X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useClientAuth } from "@/features/portfolio/useClientAuth";
import {
  approvePedido, getArtefatoUrl, getProjetoDetalhado, listPedidos, listRespostas,
  requestChangesPedido, submitRespostaPedido, type Artefato, type Etapa, type Pedido, type PedidoResposta,
} from "@/features/portfolio/api";

const HistoricoRespostas = ({ pedidoId, refreshKey }: { pedidoId: string; refreshKey: number }) => {
  const [respostas, setRespostas] = useState<PedidoResposta[]>([]);

  useEffect(() => {
    listRespostas(pedidoId).then(setRespostas);
  }, [pedidoId, refreshKey]);

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

const ValidacaoPedidoForm = ({
  pedido, onDecidido,
}: { pedido: Pedido; onDecidido: () => void }) => {
  const [comentario, setComentario] = useState("");
  const [pedindoAjuste, setPedindoAjuste] = useState(false);
  const [sending, setSending] = useState(false);

  const handleAprovar = async () => {
    setSending(true);
    try {
      await approvePedido({ pedidoId: pedido.id, comentario });
      toast.success("Entrega aprovada!");
      onDecidido();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao aprovar.");
    } finally {
      setSending(false);
    }
  };

  const handlePedirAjuste = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    try {
      await requestChangesPedido({ pedidoId: pedido.id, comentario });
      toast.success("Ajuste solicitado!");
      onDecidido();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao pedir ajuste.");
    } finally {
      setSending(false);
    }
  };

  if (pedindoAjuste) {
    return (
      <form onSubmit={handlePedirAjuste} className="space-y-2 mt-2">
        <Textarea
          placeholder="Descreva o que precisa ser ajustado (obrigatório)..."
          value={comentario}
          onChange={(e) => setComentario(e.target.value)}
          className="font-mono bg-background border-border text-foreground"
        />
        <div className="flex gap-2">
          <Button type="submit" size="sm" className="font-mono gap-1" disabled={sending || !comentario.trim()}>
            {sending && <Loader2 className="h-4 w-4 animate-spin" />}
            Enviar pedido de ajuste
          </Button>
          <Button type="button" variant="ghost" size="sm" className="font-mono" onClick={() => setPedindoAjuste(false)}>
            Cancelar
          </Button>
        </div>
      </form>
    );
  }

  return (
    <div className="flex gap-2 mt-2">
      <Button size="sm" className="font-mono gap-1" disabled={sending} onClick={handleAprovar}>
        {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
        Aprovar
      </Button>
      <Button
        variant="outline" size="sm" className="font-mono gap-1"
        disabled={sending}
        onClick={() => setPedindoAjuste(true)}
      >
        <X className="h-4 w-4" />
        Pedir ajustes
      </Button>
    </div>
  );
};

const pedidoStatusLabel: Record<string, string> = {
  pendente: "Pendente",
  respondido: "Respondido",
  aprovado: "Aprovado",
  ajuste_solicitado: "Ajuste solicitado",
};

const RespostaPedidoForm = ({
  pedido, projetoId, onRespondido,
}: { pedido: Pedido; projetoId: string; onRespondido: () => void }) => {
  const [texto, setTexto] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!texto.trim()) return;

    setSending(true);
    try {
      await submitRespostaPedido({ pedidoId: pedido.id, projetoId, texto: texto.trim(), file });
      toast.success("Resposta enviada!");
      onRespondido();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao enviar resposta.");
    } finally {
      setSending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-2 mt-2">
      <Textarea
        placeholder="Sua resposta..."
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        className="font-mono bg-background border-border text-foreground"
      />
      <div className="flex gap-2">
        <Input
          type="file"
          accept="image/*,application/pdf,.doc,.docx"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="font-mono bg-background border-border text-foreground"
        />
        <Button type="submit" size="sm" className="font-mono gap-1 shrink-0" disabled={sending}>
          {sending && <Loader2 className="h-4 w-4 animate-spin" />}
          Responder
        </Button>
      </div>
    </form>
  );
};

const etapaStatusLabel: Record<string, string> = {
  pendente: "Pendente",
  em_andamento: "Em andamento",
  concluida: "Concluída",
};

const PortalProjetoDetalheContent = ({ projetoId }: { projetoId: string }) => {
  const [nome, setNome] = useState<string | null>(null);
  const [etapas, setEtapas] = useState<Etapa[]>([]);
  const [artefatos, setArtefatos] = useState<Artefato[]>([]);
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const fetchPedidos = () => {
    setRefreshKey((k) => k + 1);
    return listPedidos(projetoId).then(setPedidos);
  };

  useEffect(() => {
    Promise.all([getProjetoDetalhado(projetoId), fetchPedidos()])
      .then(([{ projeto, etapas, artefatos }]) => {
        if (!projeto) {
          setNotFound(true);
          return;
        }
        setNome(projeto.nome);
        setEtapas(etapas);
        setArtefatos(artefatos);
      })
      .finally(() => setLoading(false));
  }, [projetoId]);

  const handleOpen = async (artefato: Artefato) => {
    try {
      const url = await getArtefatoUrl(artefato);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch {
      toast.error("Erro ao gerar link de acesso.");
    }
  };

  if (loading) return <p className="text-muted-foreground font-mono text-center py-12">Carregando...</p>;
  if (notFound) {
    return (
      <p className="text-muted-foreground font-mono text-center py-12">
        Projeto não encontrado, ou você não tem acesso a ele.
      </p>
    );
  }

  return (
    <>
      <h2 className="text-2xl font-bold text-foreground mb-6">{nome}</h2>

      <Card className="border-border bg-card mb-6">
        <CardHeader>
          <CardTitle className="font-mono text-foreground flex items-center gap-2 text-base">
            <ListOrdered className="h-4 w-4 text-primary" />
            Andamento
          </CardTitle>
        </CardHeader>
        <CardContent>
          {etapas.length === 0 ? (
            <p className="text-sm text-muted-foreground font-mono text-center py-4">Sem etapas cadastradas ainda.</p>
          ) : (
            <div className="space-y-2">
              {etapas.map((et) => (
                <div key={et.id} className="flex items-center justify-between gap-2 bg-secondary/50 rounded-lg p-3">
                  <p className="text-sm font-medium text-foreground">{et.nome}</p>
                  <Badge variant="outline" className="font-mono text-xs">{etapaStatusLabel[et.status] ?? et.status}</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="font-mono text-foreground flex items-center gap-2 text-base">
            <Paperclip className="h-4 w-4 text-primary" />
            Artefatos
          </CardTitle>
        </CardHeader>
        <CardContent>
          {artefatos.length === 0 ? (
            <p className="text-sm text-muted-foreground font-mono text-center py-4">Nenhum artefato disponível ainda.</p>
          ) : (
            <div className="space-y-2">
              {artefatos.map((a) => (
                <div key={a.id} className="flex items-center justify-between gap-2 bg-secondary/50 rounded-lg p-3">
                  <div className="flex items-center gap-2 min-w-0">
                    {a.tipo === "link" ? (
                      <LinkIcon className="h-4 w-4 text-primary shrink-0" />
                    ) : (
                      <FileText className="h-4 w-4 text-primary shrink-0" />
                    )}
                    <p className="text-sm font-medium text-foreground truncate">{a.nome}</p>
                  </div>
                  <Button variant="ghost" size="sm" className="font-mono gap-1 shrink-0" onClick={() => handleOpen(a)}>
                    <Download className="h-3 w-3" />
                    Abrir
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-border bg-card mt-6">
        <CardHeader>
          <CardTitle className="font-mono text-foreground flex items-center gap-2 text-base">
            <MessageSquareText className="h-4 w-4 text-primary" />
            Pedidos
          </CardTitle>
        </CardHeader>
        <CardContent>
          {pedidos.length === 0 ? (
            <p className="text-sm text-muted-foreground font-mono text-center py-4">Nenhum pedido no momento.</p>
          ) : (
            <div className="space-y-3">
              {pedidos.map((p) => (
                <div key={p.id} className="bg-secondary/50 rounded-lg p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2 min-w-0">
                      {p.tipo === "pergunta" ? (
                        <HelpCircle className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      ) : (
                        <ShieldCheck className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      )}
                      <p className="text-sm text-foreground">{p.titulo}</p>
                    </div>
                    <Badge variant="outline" className="font-mono text-xs shrink-0">
                      {pedidoStatusLabel[p.status] ?? p.status}
                    </Badge>
                  </div>
                  {p.tipo === "pergunta" && p.status === "pendente" && (
                    <RespostaPedidoForm pedido={p} projetoId={projetoId} onRespondido={fetchPedidos} />
                  )}
                  {p.tipo === "validacao" && p.status === "pendente" && (
                    <ValidacaoPedidoForm pedido={p} onDecidido={fetchPedidos} />
                  )}
                  <HistoricoRespostas pedidoId={p.id} refreshKey={refreshKey} />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
};

const PortalProjetoDetalhePage = () => {
  const { id } = useParams<{ id: string }>();
  const { authenticated, loading } = useClientAuth();

  if (loading) return null;
  if (!authenticated) return <p className="text-muted-foreground font-mono text-center py-12">Faça login para ver este projeto.</p>;
  if (!id) return null;

  return (
    <div className="min-h-screen bg-background grid-pattern">
      <header className="border-b border-border">
        <div className="container max-w-5xl py-4 flex items-center justify-between">
          <h1 className="font-mono font-bold text-foreground text-lg">Portal do Cliente</h1>
          <Button asChild variant="outline" size="sm" className="font-mono gap-2">
            <Link to="/portal">
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Link>
          </Button>
        </div>
      </header>
      <main className="container max-w-5xl py-8 px-4">
        <PortalProjetoDetalheContent projetoId={id} />
      </main>
    </div>
  );
};

export default PortalProjetoDetalhePage;
