import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { ListOrdered, Plus, Loader2, ArrowUp, ArrowDown } from "lucide-react";
import { toast } from "sonner";
import {
  createEtapa, listEtapas, updateEtapa, updateEtapaStatus, type Etapa,
} from "@/features/portfolio/api";

const statusLabel: Record<string, string> = {
  pendente: "Pendente",
  em_andamento: "Em andamento",
  concluida: "Concluída",
};

const GestaoEtapas = ({ projetoId }: { projetoId: string }) => {
  const [etapas, setEtapas] = useState<Etapa[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [nome, setNome] = useState("");

  const fetchEtapas = async () => {
    setLoading(true);
    try {
      setEtapas(await listEtapas(projetoId));
    } catch {
      toast.error("Erro ao carregar etapas.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchEtapas(); }, [projetoId]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) return;

    setSaving(true);
    try {
      const ordem = etapas.length > 0 ? Math.max(...etapas.map((et) => et.ordem)) + 1 : 0;
      await createEtapa({ projeto_id: projetoId, nome: nome.trim(), ordem });
      setNome("");
      fetchEtapas();
    } catch {
      toast.error("Erro ao criar etapa.");
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (etapa: Etapa, status: string) => {
    try {
      await updateEtapaStatus(etapa.id, status);
      fetchEtapas();
    } catch {
      toast.error("Erro ao atualizar status.");
    }
  };

  const handleMove = async (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= etapas.length) return;

    const a = etapas[index];
    const b = etapas[target];
    try {
      await Promise.all([
        updateEtapa(a.id, { ordem: b.ordem }),
        updateEtapa(b.id, { ordem: a.ordem }),
      ]);
      fetchEtapas();
    } catch {
      toast.error("Erro ao reordenar etapas.");
    }
  };

  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <CardTitle className="font-mono text-foreground flex items-center gap-2 text-base">
          <ListOrdered className="h-4 w-4 text-primary" />
          Etapas
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleAdd} className="flex gap-2">
          <Input
            placeholder="Nome da etapa"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            className="font-mono bg-secondary border-border text-foreground"
          />
          <Button type="submit" size="sm" className="font-mono gap-1" disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Adicionar
          </Button>
        </form>

        {loading ? (
          <p className="text-sm text-muted-foreground font-mono text-center py-4">Carregando...</p>
        ) : etapas.length === 0 ? (
          <p className="text-sm text-muted-foreground font-mono text-center py-4">Nenhuma etapa cadastrada.</p>
        ) : (
          <div className="space-y-2">
            {etapas.map((etapa, index) => (
              <div key={etapa.id} className="flex items-center justify-between gap-2 bg-secondary/50 rounded-lg p-3">
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost" size="icon" className="h-6 w-6"
                    disabled={index === 0}
                    onClick={() => handleMove(index, -1)}
                  >
                    <ArrowUp className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost" size="icon" className="h-6 w-6"
                    disabled={index === etapas.length - 1}
                    onClick={() => handleMove(index, 1)}
                  >
                    <ArrowDown className="h-3 w-3" />
                  </Button>
                </div>
                <p className="flex-1 text-sm font-medium text-foreground">{etapa.nome}</p>
                <Select value={etapa.status} onValueChange={(v) => handleStatusChange(etapa, v)}>
                  <SelectTrigger className="w-40 h-8 font-mono text-xs bg-background border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pendente">{statusLabel.pendente}</SelectItem>
                    <SelectItem value="em_andamento">{statusLabel.em_andamento}</SelectItem>
                    <SelectItem value="concluida">{statusLabel.concluida}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default GestaoEtapas;
