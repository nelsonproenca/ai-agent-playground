import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useIsAdmin } from "@/watchtower/hooks/useIsAdmin";
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
import { Pencil, Trash2, Plus, Star } from "lucide-react";
import { WatchtowerPlanCardPreview } from "@/watchtower/components/WatchtowerPlanCardPreview";

interface Plan {
  id: string;
  sku: string;
  num: string;
  name: string;
  period: string;
  price: string;
  suffix: string;
  features: string[];
  cta: string;
  highlight: boolean;
  active: boolean;
  display_order: number;
}

const planSchema = z.object({
  sku: z.string().trim().min(1, "SKU obrigatório").max(50),
  num: z.string().trim().min(1, "Número obrigatório").max(10),
  name: z.string().trim().min(1, "Nome obrigatório").max(100),
  period: z.string().trim().min(1, "Período obrigatório").max(100),
  price: z.string().trim().min(1, "Preço obrigatório").max(50),
  suffix: z.string().trim().max(50),
  cta: z.string().trim().min(1, "CTA obrigatório").max(50),
  features: z.string().trim(),
  highlight: z.boolean(),
  active: z.boolean(),
  display_order: z.number().int().min(0),
});

const emptyForm = {
  sku: "",
  num: "",
  name: "",
  period: "",
  price: "",
  suffix: "/mês",
  cta: "ASSINAR",
  features: "",
  highlight: false,
  active: true,
  display_order: 0,
};

export default function WatchtowerAdminPlans() {
  const { isAdmin, loading: roleLoading } = useIsAdmin();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Plan | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const loadPlans = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("plans")
      .select("*")
      .order("display_order", { ascending: true });
    if (error) {
      toast({ title: "Erro ao carregar planos", description: error.message, variant: "destructive" });
    } else {
      setPlans((data ?? []) as unknown as Plan[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (isAdmin) loadPlans();
  }, [isAdmin]);

  if (roleLoading) return <div className="p-8 text-muted-foreground">Carregando…</div>;
  if (!isAdmin) return <Navigate to="/watchtower/dashboard" replace />;

  const openCreate = () => {
    setEditing(null);
    setForm({ ...emptyForm, display_order: plans.length + 1 });
    setOpen(true);
  };

  const openEdit = (plan: Plan) => {
    setEditing(plan);
    setForm({
      sku: plan.sku,
      num: plan.num,
      name: plan.name,
      period: plan.period,
      price: plan.price,
      suffix: plan.suffix,
      cta: plan.cta,
      features: (plan.features ?? []).join("\n"),
      highlight: plan.highlight,
      active: plan.active,
      display_order: plan.display_order,
    });
    setOpen(true);
  };

  const handleSave = async () => {
    const parsed = planSchema.safeParse(form);
    if (!parsed.success) {
      toast({
        title: "Dados inválidos",
        description: parsed.error.issues[0]?.message ?? "Verifique os campos",
        variant: "destructive",
      });
      return;
    }
    setSaving(true);
    const features = parsed.data.features.split("\n").map((f) => f.trim()).filter(Boolean);
    const payload = {
      sku: parsed.data.sku,
      num: parsed.data.num,
      name: parsed.data.name,
      period: parsed.data.period,
      price: parsed.data.price,
      suffix: parsed.data.suffix,
      cta: parsed.data.cta,
      features,
      highlight: parsed.data.highlight,
      active: parsed.data.active,
      display_order: parsed.data.display_order,
    };

    let error;
    if (editing) {
      ({ error } = await supabase.from("plans").update(payload).eq("id", editing.id));
    } else {
      ({ error } = await supabase.from("plans").insert(payload));
    }

    if (!error && payload.highlight) {
      const query = supabase.from("plans").update({ highlight: false }).eq("highlight", true);
      const { error: clearError } = editing
        ? await query.neq("id", editing.id)
        : await query.neq("sku", payload.sku);
      if (clearError) {
        toast({ title: "Aviso", description: "Plano salvo, mas falhou ao limpar outros destaques.", variant: "destructive" });
      }
    }

    setSaving(false);

    if (error) {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: editing ? "Plano atualizado" : "Plano criado" });
    setOpen(false);
    loadPlans();
  };

  const handleDelete = async (plan: Plan) => {
    if (!confirm(`Excluir o plano "${plan.name}"?`)) return;
    const { error } = await supabase.from("plans").delete().eq("id", plan.id);
    if (error) {
      toast({ title: "Erro ao excluir", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Plano excluído" });
    loadPlans();
  };

  const toggleActive = async (plan: Plan) => {
    const { error } = await supabase.from("plans").update({ active: !plan.active }).eq("id", plan.id);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
      return;
    }
    loadPlans();
  };

  const setAsHighlight = async (plan: Plan) => {
    const { error: clearError } = await supabase.from("plans").update({ highlight: false }).neq("id", plan.id);
    if (clearError) {
      toast({ title: "Erro", description: clearError.message, variant: "destructive" });
      return;
    }
    const { error } = await supabase.from("plans").update({ highlight: !plan.highlight }).eq("id", plan.id);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: plan.highlight ? "Destaque removido" : "Plano destacado" });
    loadPlans();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold">Manutenção de Planos</h1>
          <p className="text-sm text-muted-foreground mt-1">Gerencie os planos exibidos na página inicial</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreate} className="gap-2">
              <Plus className="h-4 w-4" /> Novo Plano
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editing ? "Editar plano" : "Novo plano"}</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 py-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sku">SKU (identificador)</Label>
                  <Input id="sku" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} placeholder="bronze" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="num">Número exibido</Label>
                  <Input id="num" value={form.num} onChange={(e) => setForm({ ...form, num: e.target.value })} placeholder="01" />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="name">Nome do plano</Label>
                  <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="PLANO BRONZE" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="period">Período / subtítulo</Label>
                  <Input id="period" value={form.period} onChange={(e) => setForm({ ...form, period: e.target.value })} placeholder="AO VIVO" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="display_order">Ordem de exibição</Label>
                  <Input
                    id="display_order"
                    type="number"
                    value={form.display_order}
                    onChange={(e) => setForm({ ...form, display_order: Number(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price">Preço</Label>
                  <Input id="price" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="R$ 29,90" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="suffix">Sufixo do preço</Label>
                  <Input id="suffix" value={form.suffix} onChange={(e) => setForm({ ...form, suffix: e.target.value })} placeholder="/mês" />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="cta">Texto do botão (CTA)</Label>
                  <Input id="cta" value={form.cta} onChange={(e) => setForm({ ...form, cta: e.target.value })} placeholder="ASSINAR BRONZE" />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="features">Features (uma por linha)</Label>
                  <Textarea
                    id="features"
                    rows={5}
                    value={form.features}
                    onChange={(e) => setForm({ ...form, features: e.target.value })}
                    placeholder={"Streaming em tempo real\nAlertas de movimento"}
                  />
                </div>
                <div className="flex items-center justify-between rounded-md border p-3">
                  <Label htmlFor="highlight" className="cursor-pointer">Destacar como popular</Label>
                  <Switch id="highlight" checked={form.highlight} onCheckedChange={(v) => setForm({ ...form, highlight: v })} />
                </div>
                <div className="flex items-center justify-between rounded-md border p-3">
                  <Label htmlFor="active" className="cursor-pointer">Plano ativo</Label>
                  <Switch id="active" checked={form.active} onCheckedChange={(v) => setForm({ ...form, active: v })} />
                </div>
              </div>
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

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">Ordem</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>Preço</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Carregando…</TableCell></TableRow>
            ) : plans.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Nenhum plano cadastrado</TableCell></TableRow>
            ) : plans.map((plan) => (
              <TableRow
                key={plan.id}
                className={plan.highlight ? "bg-primary/5 hover:bg-primary/10 border-l-2 border-l-primary" : ""}
              >
                <TableCell>{plan.display_order}</TableCell>
                <TableCell>
                  <div className="font-medium">{plan.name}</div>
                  <div className="text-xs text-muted-foreground">{plan.period}</div>
                </TableCell>
                <TableCell><code className="text-xs">{plan.sku}</code></TableCell>
                <TableCell>{plan.price}<span className="text-xs text-muted-foreground">{plan.suffix}</span></TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Switch checked={plan.active} onCheckedChange={() => toggleActive(plan)} />
                    {plan.highlight && <Badge variant="secondary" className="text-[10px]">DESTAQUE</Badge>}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setAsHighlight(plan)}
                      title={plan.highlight ? "Remover destaque" : "Definir como destaque"}
                    >
                      <Star className={`h-4 w-4 ${plan.highlight ? "fill-primary text-primary" : "text-muted-foreground"}`} />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => openEdit(plan)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(plan)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
