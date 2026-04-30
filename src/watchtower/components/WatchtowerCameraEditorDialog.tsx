import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { adminService } from "@/watchtower/services/adminService";
import type { AdminCameraDto, AdminUserDto, CreateCameraPayload, StreamProtocol } from "@/watchtower/types/api";
import { useToast } from "@/hooks/use-toast";
import { toast as sonnerToast } from "sonner";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { logAdminEvent } from "@/watchtower/services/auditLogService";

const UNASSIGNED = "__unassigned__";

const emptyForm: CreateCameraPayload = {
  ownerUserId: UNASSIGNED,
  name: "",
  slug: "",
  locationName: "",
  hlsBaseUrl: "",
  protocol: "Rtsp",
  isActive: true,
};

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing?: AdminCameraDto | null;
  /** Lista de usuários para o select de dono. Se não fornecida, é carregada internamente. */
  users?: AdminUserDto[];
  onSaved?: () => void;
}

export function WatchtowerCameraEditorDialog({
  open,
  onOpenChange,
  editing = null,
  users: usersProp,
  onSaved,
}: Props) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<CreateCameraPayload>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [internalUsers, setInternalUsers] = useState<AdminUserDto[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  const users = usersProp ?? internalUsers;

  // Carrega usuários on-demand quando o dialog abre sem lista pré-fornecida.
  useEffect(() => {
    if (!open || usersProp) return;
    let cancelled = false;
    setLoadingUsers(true);
    adminService
      .getUsers()
      .then((u) => { if (!cancelled) setInternalUsers(u); })
      .catch(() => { /* silencioso — campo dono fica vazio */ })
      .finally(() => { if (!cancelled) setLoadingUsers(false); });
    return () => { cancelled = true; };
  }, [open, usersProp]);

  // Sincroniza form com o registro em edição quando o dialog abre.
  useEffect(() => {
    if (!open) return;
    if (editing) {
      setForm({
        ownerUserId: editing.ownerUserId || UNASSIGNED,
        name: editing.name,
        slug: editing.slug,
        locationName: editing.locationName,
        hlsBaseUrl: editing.hlsBaseUrl ?? "",
        protocol: editing.protocol ?? "Rtsp",
        isActive: editing.isActive,
      });
    } else {
      setForm({ ...emptyForm });
    }
  }, [open, editing]);

  const save = async () => {
    if (!form.name.trim() || !form.slug.trim()) {
      toast({ title: "Nome e Slug são obrigatórios.", variant: "destructive" });
      return;
    }
    setSaving(true);
    const payload: CreateCameraPayload = {
      ...form,
      ownerUserId: form.ownerUserId === UNASSIGNED ? null : form.ownerUserId,
    };
    try {
      if (editing) {
        await adminService.updateCamera(editing.id, payload);
        await logAdminEvent({
          entityType: "camera",
          entityId: editing.id,
          entityName: form.name,
          action: "updated",
          details: { slug: form.slug, ownerUserId: payload.ownerUserId || null, isActive: form.isActive },
        });
        sonnerToast.success(`Câmera "${form.name}" atualizada com sucesso!`, {
          description: `Slug: ${form.slug}${form.locationName ? ` • ${form.locationName}` : ""}`,
          duration: 6000,
          icon: <CheckCircle2 className="h-5 w-5 text-primary" />,
          className: "border-primary/40 bg-card",
        });
      } else {
        const newId = await adminService.createCamera(payload);
        await logAdminEvent({
          entityType: "camera",
          entityId: typeof newId === "string" ? newId : form.slug,
          entityName: form.name,
          action: "created",
          details: { slug: form.slug, ownerUserId: payload.ownerUserId || null, isActive: form.isActive },
        });
        sonnerToast.success(`Câmera "${form.name}" cadastrada com sucesso!`, {
          description: `Já está disponível na lista. Slug: ${form.slug}`,
          duration: 6000,
          icon: <CheckCircle2 className="h-5 w-5 text-primary" />,
          className: "border-primary/40 bg-card",
        });
      }
      // Invalida grid do dashboard para refletir a nova câmera imediatamente.
      await queryClient.invalidateQueries({ queryKey: ["watchtower-cameras"] });
      onOpenChange(false);
      onSaved?.();
    } catch (e: unknown) {
      toast({ title: "Erro ao salvar", description: (e as Error).message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{editing ? "Editar câmera" : "Nova câmera"}</DialogTitle>
          <DialogDescription>Preencha os dados da câmera.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Nome *</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Câmera 01 - Entrada" />
          </div>
          <div className="space-y-2">
            <Label>Slug (MediaMTX) *</Label>
            <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="cam-001-entrada" className="font-mono" />
          </div>
          <div className="space-y-2">
            <Label>Localização</Label>
            <Input value={form.locationName} onChange={(e) => setForm({ ...form, locationName: e.target.value })} placeholder="Portaria A" />
          </div>
          <div className="space-y-2">
            <Label>HLS Base URL *</Label>
            <Input value={form.hlsBaseUrl} onChange={(e) => setForm({ ...form, hlsBaseUrl: e.target.value })} placeholder="http://127.0.0.1:8888" className="font-mono" />
          </div>
          <div className="space-y-2">
            <Label>Protocolo de ingestão</Label>
            <Select value={form.protocol} onValueChange={(v) => setForm({ ...form, protocol: v as StreamProtocol })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Rtsp">RTSP (padrão)</SelectItem>
                <SelectItem value="Rtmp">RTMP (porta 1935)</SelectItem>
              </SelectContent>
            </Select>
            {form.protocol === "Rtmp" && form.slug && (
              <p className="text-xs text-muted-foreground font-mono">
                rtmp://&lt;vps-ip&gt;:1935/live/{form.slug}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label>Usuário dono</Label>
            <Select value={form.ownerUserId || UNASSIGNED} onValueChange={(v) => setForm({ ...form, ownerUserId: v })}>
              <SelectTrigger>
                <SelectValue placeholder={loadingUsers ? "Carregando..." : "Selecione um usuário"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={UNASSIGNED}>Sem dono</SelectItem>
                {users.map((u) => (
                  <SelectItem key={u.userId} value={u.userId}>
                    {u.userId.slice(0, 8)}… {u.planName ? `— ${u.planName}` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between rounded-md border p-3">
            <Label className="cursor-pointer">Câmera ativa</Label>
            <Switch checked={form.isActive} onCheckedChange={(v) => setForm({ ...form, isActive: v })} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={save} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : editing ? "Salvar" : "Cadastrar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
