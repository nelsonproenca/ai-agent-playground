import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useIsAdmin } from "@/watchtower/hooks/useIsAdmin";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Pencil, Trash2, Plus, Loader2, Star } from "lucide-react";
import { WatchtowerPlanCardPreview } from "@/watchtower/components/WatchtowerPlanCardPreview";

type PlanRow = Tables<"plans">;

type PlanForm = {
  name: string;
  sku: string;
  num: string;
  period: string;
  price: string;
  suffix: string;
  cta: string;
  features: string; // textarea, one per line
  display_order: number;
  active: boolean;
  highlight: boolean;
};

const emptyForm: PlanForm = {
  name: "",
  sku: "",
  num: "",
  period: "",
  price: "",
  suffix: "",
  cta: "Contratar",
  features: "",
  display_order: 0,
  active: true,
  highlight: false,
};

export default function WatchtowerAdminPlans() {
  const { isAdmin, loading: roleLoading } = useIsAdmin();
  const [plans, setPlans] = useState<PlanRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<PlanRow | null>(null);
  const [form, setForm] = useState<PlanForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [highlightingId, setHighlightingId] = useState<string | null>(null);

  const loadPlans = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("plans")
        .select("*")
        .order("display_order", { ascending: true });
      if (error) throw error;
      setPlans(data ?? []);
    } catch (e: unknown) {
      toast({ title: "Erro ao carregar planos", description: (e as Error).message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) loadPlans();
  }, [isAdmin]);

  if (roleLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (!isAdmin) return <Navigate to="/watchtower/dashboard" replace />;

  const openCreate = () => {
    setEditing(null);
    setForm({ ...emptyForm });
    setOpen(true);
  };

  const openEdit = (plan: PlanRow) => {
    setEditing(plan);
    setForm({
      name: plan.name,
      sku: plan.sku,
      num: plan.num,
      period: plan.period,
      price: plan.price,
      suffix: plan.suffix,
      cta: plan.cta,
      features: Array.isArray(plan.features) ? (plan.features as string[]).join("\n") : "",
      display_order: plan.display_order,
      active: plan.active,
      highlight: plan.highlight,
    });
    setOpen(true);
  };

  const buildPayload = (): TablesInsert<"plans"> => ({
    name: form.name.trim(),
    sku: form.sku.trim(),
    num: form.num.trim(),
    period: form.period.trim(),
    price: form.price.trim(),
    suffix: form.suffix.trim(),
    cta: form.cta.trim() || "Contratar",
    features: form.features
      .split("\n")
      .map((f) => f.trim())
      .filter(Boolean),
    display_order: form.display_order,
    active: form.active,
    highlight: form.highlight,
  });

  // Ensures only one plan is highlighted at a time.
  const enforceUniqueHighlight = async (highlightedId: string) => {
    const { error } = await supabase
      .from("plans")
      .update({ highlight: false })
      .neq("id", highlightedId)
      .eq("highlight", true);
    if (error) throw error;
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.sku.trim()) {
      toast({ title: "Nome e SKU são obrigatórios", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const payload = buildPayload();
      if (editing) {
        const { error } = await supabase.from("plans").update(payload).eq("id", editing.id);
        if (error) throw error;
        if (payload.highlight) await enforceUniqueHighlight(editing.id);
        toast({ title: "Plano atualizado" });
      } else {
        const { data, error } = await supabase.from("plans").insert(payload).select("id").single();
        if (error) throw error;
        if (payload.highlight && data) await enforceUniqueHighlight(data.id);
        toast({ title: "Plano criado" });
      }
      setOpen(false);
      loadPlans();
    } catch (e: unknown) {
      toast({ title: "Erro ao salvar", description: (e as Error).message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (plan: PlanRow) => {
    if (!confirm(`Excluir o plano "${plan.name}"?`)) return;
    try {
      const { error } = await supabase.from("plans").delete().eq("id", plan.id);
      if (error) throw error;
      toast({ title: "Plano excluído" });
      loadPlans();
    } catch (e: unknown) {
      toast({ title: "Erro ao excluir", description: (e as Error).message, variant: "destructive" });
    }
  };

  // Toggle highlight directly from the table — promotes any plan to be the current highlight.
  const handleToggleHighlight = async (plan: PlanRow) => {
    setHighlightingId(plan.id);
    try {
      const newValue = !plan.highlight;
      const { error } = await supabase.from("plans").update({ highlight: newValue }).eq("id", plan.id);
      if (error) throw error;
      if (newValue) await enforceUniqueHighlight(plan.id);
      toast({
        title: newValue ? "Plano em destaque" : "Destaque removido",
        description: newValue ? `"${plan.name}" agora é o plano em destaque.` : undefined,
      });
      loadPlans();
    } catch (e: unknown) {
      toast({ title: "Erro ao atualizar destaque", description: (e as Error).message, variant: "destructive" });
    } finally {
      setHighlightingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-3xl font-bold text-foreground tracking-wider">MANUTENÇÃO DE PLANOS</h2>
          <p className="text-xs tracking-[0.15em] text-muted-foreground mt-2">GERENCIE OS PLANOS DE ASSINATURA E O DESTAQUE</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreate} className="gap-2">
              <Plus className="h-4 w-4" /> Novo Plano
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editing ? "Editar plano" : "Novo plano"}</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 py-2">
              {/* ─── Form column ─────────────────────────────────────── */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 md:col-span-2">
                  <Label>Nome *</Label>
                  <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Plano Bronze" />
                </div>
                <div className="space-y-2">
                  <Label>SKU *</Label>
                  <Input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} placeholder="PLAN_BRONZE" />
                </div>
                <div className="space-y-2">
                  <Label>Numeração / Tag</Label>
                  <Input value={form.num} onChange={(e) => setForm({ ...form, num: e.target.value })} placeholder="01" />
                </div>
                <div className="space-y-2">
                  <Label>Preço (texto)</Label>
                  <Input value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="R$ 29,90" />
                </div>
                <div className="space-y-2">
                  <Label>Sufixo</Label>
                  <Input value={form.suffix} onChange={(e) => setForm({ ...form, suffix: e.target.value })} placeholder="/mês" />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Período / Subtítulo</Label>
                  <Input value={form.period} onChange={(e) => setForm({ ...form, period: e.target.value })} placeholder="Mensal" />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Features (uma por linha)</Label>
                  <Textarea
                    rows={4}
                    value={form.features}
                    onChange={(e) => setForm({ ...form, features: e.target.value })}
                    placeholder={"Visualização ao vivo\nGravação 7 dias\nSuporte 24/7"}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Texto do botão (CTA)</Label>
                  <Input value={form.cta} onChange={(e) => setForm({ ...form, cta: e.target.value })} placeholder="Contratar" />
                </div>
                <div className="space-y-2">
                  <Label>Ordem de exibição</Label>
                  <Input
                    type="number"
                    value={form.display_order}
                    onChange={(e) => setForm({ ...form, display_order: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="flex flex-col gap-3 md:col-span-2">
                  <div className="flex items-center justify-between rounded-md border p-3">
                    <div>
                      <Label className="cursor-pointer">Plano ativo</Label>
                      <p className="text-xs text-muted-foreground mt-1">Exibido na página pública.</p>
                    </div>
                    <Switch checked={form.active} onCheckedChange={(v) => setForm({ ...form, active: v })} />
                  </div>
                  <div className="flex items-center justify-between rounded-md border border-primary/30 bg-primary/5 p-3">
                    <div>
                      <Label className="cursor-pointer flex items-center gap-2">
                        <Star className="h-4 w-4 text-primary" /> Em destaque
                      </Label>
                      <p className="text-xs text-muted-foreground mt-1">
                        Marca este plano como "MAIS POPULAR". Apenas um plano pode estar em destaque por vez.
                      </p>
                    </div>
                    <Switch checked={form.highlight} onCheckedChange={(v) => setForm({ ...form, highlight: v })} />
                  </div>
                </div>
              </div>

              {/* ─── Live preview column ─────────────────────────────── */}
              <div className="lg:sticky lg:top-0 lg:self-start">
                <WatchtowerPlanCardPreview
                  num={form.num}
                  name={form.name}
                  period={form.period}
                  price={form.price}
                  suffix={form.suffix}
                  cta={form.cta}
                  features={form.features.split("\n").map((f) => f.trim()).filter(Boolean)}
                  highlight={form.highlight}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? "Salvando…" : "Salvar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-lg border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>Preço</TableHead>
              <TableHead>Ordem</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Destaque</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  <Loader2 className="h-5 w-5 animate-spin inline" />
                </TableCell>
              </TableRow>
            ) : plans.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  Nenhum plano cadastrado
                </TableCell>
              </TableRow>
            ) : (
              plans.map((plan) => (
                <TableRow
                  key={plan.id}
                  className={
                    plan.highlight
                      ? "relative bg-amber-500/10 hover:bg-amber-500/15 border-l-4 border-l-amber-500 shadow-[inset_0_0_30px_rgba(251,191,36,0.08)]"
                      : ""
                  }
                >
                  <TableCell>
                    <div className="font-medium flex items-center gap-2">
                      {plan.highlight && <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500 shrink-0" />}
                      <span className="truncate">{plan.name}</span>
                    </div>
                    <div className="text-xs text-muted-foreground truncate max-w-[180px]">{plan.period}</div>
                  </TableCell>
                  <TableCell><Badge variant="outline">{plan.sku}</Badge></TableCell>
                  <TableCell className="whitespace-nowrap">{plan.price}<span className="text-xs text-muted-foreground">{plan.suffix}</span></TableCell>
                  <TableCell>{plan.display_order}</TableCell>
                  <TableCell>
                    <Badge variant={plan.active ? "default" : "secondary"}>
                      {plan.active ? "Ativo" : "Inativo"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={plan.highlight}
                        disabled={highlightingId === plan.id}
                        onCheckedChange={() => handleToggleHighlight(plan)}
                        aria-label={plan.highlight ? "Remover destaque" : "Tornar este o plano em destaque"}
                      />
                      {plan.highlight && (
                        <Badge className="bg-amber-500 text-white hover:bg-amber-500 text-[10px] tracking-wider font-semibold gap-1">
                          <Star className="h-3 w-3 fill-current" />
                          EM DESTAQUE
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(plan)} aria-label="Editar plano">
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(plan)} aria-label="Excluir plano">
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
