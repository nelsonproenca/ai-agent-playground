import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useIsAdmin } from "@/watchtower/hooks/useIsAdmin";
import { adminService } from "@/watchtower/services/adminService";
import type { AdminPlanDto, CreatePlanPayload, PlanTier, PlanFeatures } from "@/watchtower/types/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Pencil, Trash2, Plus, Loader2 } from "lucide-react";

type PlanForm = {
  name: string;
  description: string;
  priceBrl: string;
  durationDays: string;
  planTier: PlanTier;
  features: PlanFeatures;
  recordingDaysLimit: string;
  canDownload: boolean;
  isActive: boolean;
};

const emptyForm: PlanForm = {
  name: "",
  description: "",
  priceBrl: "",
  durationDays: "30",
  planTier: "Bronze",
  features: "LiveOnly",
  recordingDaysLimit: "",
  canDownload: false,
  isActive: true,
};

const PLAN_TIERS: PlanTier[] = ["Acesso24h", "Bronze", "Silver", "Gold"];
const PLAN_FEATURES: { value: PlanFeatures; label: string }[] = [
  { value: "LiveOnly", label: "Ao vivo apenas" },
  { value: "WithRecordings", label: "Com gravações" },
  { value: "WithDownloads", label: "Com downloads" },
];

function formatPrice(priceBrl: number) {
  return `R$ ${priceBrl.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
}

export default function WatchtowerAdminPlans() {
  const { isAdmin, loading: roleLoading } = useIsAdmin();
  const [plans, setPlans] = useState<AdminPlanDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<AdminPlanDto | null>(null);
  const [form, setForm] = useState<PlanForm>(emptyForm);
  const [saving, setSaving] = useState(false);

  const loadPlans = async () => {
    setLoading(true);
    try {
      setPlans(await adminService.getPlans());
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

  const openEdit = (plan: AdminPlanDto) => {
    setEditing(plan);
    setForm({
      name: plan.name,
      description: plan.description,
      priceBrl: plan.priceBrl.toString(),
      durationDays: plan.durationDays.toString(),
      planTier: plan.planTier,
      features: plan.features,
      recordingDaysLimit: plan.recordingDaysLimit?.toString() ?? "",
      canDownload: plan.canDownload,
      isActive: plan.isActive,
    });
    setOpen(true);
  };

  const buildPayload = (): CreatePlanPayload => ({
    name: form.name.trim(),
    description: form.description.trim(),
    priceBrl: parseFloat(form.priceBrl) || 0,
    durationDays: parseInt(form.durationDays) || 30,
    planTier: form.planTier,
    features: form.features,
    recordingDaysLimit: form.recordingDaysLimit ? parseInt(form.recordingDaysLimit) : null,
    canDownload: form.canDownload,
    isActive: form.isActive,
  });

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast({ title: "Nome é obrigatório", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const payload = buildPayload();
      if (editing) {
        await adminService.updatePlan(editing.id, payload);
        toast({ title: "Plano atualizado" });
      } else {
        await adminService.createPlan(payload);
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

  const handleDelete = async (plan: AdminPlanDto) => {
    if (!confirm(`Excluir o plano "${plan.name}"?`)) return;
    try {
      await adminService.deletePlan(plan.id);
      toast({ title: "Plano excluído" });
      loadPlans();
    } catch (e: unknown) {
      toast({ title: "Erro ao excluir", description: (e as Error).message, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-3xl font-bold text-foreground tracking-wider">MANUTENÇÃO DE PLANOS</h2>
          <p className="text-xs tracking-[0.15em] text-muted-foreground mt-2">GERENCIE OS PLANOS DE ASSINATURA</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreate} className="gap-2">
              <Plus className="h-4 w-4" /> Novo Plano
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editing ? "Editar plano" : "Novo plano"}</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-1 gap-4 py-2">
              <div className="space-y-2">
                <Label>Nome *</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Plano Bronze" />
              </div>
              <div className="space-y-2">
                <Label>Descrição</Label>
                <Textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Descrição do plano" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Preço (R$)</Label>
                  <Input type="number" step="0.01" min="0" value={form.priceBrl} onChange={(e) => setForm({ ...form, priceBrl: e.target.value })} placeholder="29.90" />
                </div>
                <div className="space-y-2">
                  <Label>Duração (dias)</Label>
                  <Input type="number" min="1" value={form.durationDays} onChange={(e) => setForm({ ...form, durationDays: e.target.value })} placeholder="30" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tier</Label>
                  <Select value={form.planTier} onValueChange={(v) => setForm({ ...form, planTier: v as PlanTier })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {PLAN_TIERS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Features</Label>
                  <Select value={form.features} onValueChange={(v) => setForm({ ...form, features: v as PlanFeatures })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {PLAN_FEATURES.map((f) => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {(form.features === "WithRecordings" || form.features === "WithDownloads") && (
                <div className="space-y-2">
                  <Label>Dias de gravação</Label>
                  <Input type="number" min="1" value={form.recordingDaysLimit} onChange={(e) => setForm({ ...form, recordingDaysLimit: e.target.value })} placeholder="7" />
                </div>
              )}
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between rounded-md border p-3">
                  <div>
                    <Label className="cursor-pointer">Permite download</Label>
                    <p className="text-xs text-muted-foreground mt-1">Habilita download de gravações.</p>
                  </div>
                  <Switch checked={form.canDownload} onCheckedChange={(v) => setForm({ ...form, canDownload: v })} />
                </div>
                <div className="flex items-center justify-between rounded-md border p-3">
                  <div>
                    <Label className="cursor-pointer">Plano ativo</Label>
                    <p className="text-xs text-muted-foreground mt-1">Exibido na página pública.</p>
                  </div>
                  <Switch checked={form.isActive} onCheckedChange={(v) => setForm({ ...form, isActive: v })} />
                </div>
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
              <TableHead>Tier</TableHead>
              <TableHead>Preço</TableHead>
              <TableHead>Duração</TableHead>
              <TableHead>Features</TableHead>
              <TableHead>Status</TableHead>
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
                <TableRow key={plan.id}>
                  <TableCell>
                    <div className="font-medium">{plan.name}</div>
                    {plan.description && <div className="text-xs text-muted-foreground truncate max-w-[180px]">{plan.description}</div>}
                  </TableCell>
                  <TableCell><Badge variant="outline">{plan.planTier}</Badge></TableCell>
                  <TableCell className="whitespace-nowrap">{formatPrice(plan.priceBrl)}</TableCell>
                  <TableCell>{plan.durationDays === 1 ? "24h" : `${plan.durationDays}d`}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{PLAN_FEATURES.find((f) => f.value === plan.features)?.label ?? plan.features}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={plan.isActive ? "default" : "secondary"}>
                      {plan.isActive ? "Ativo" : "Inativo"}
                    </Badge>
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
