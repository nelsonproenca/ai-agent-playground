import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useIsAdmin } from "@/watchtower/hooks/useIsAdmin";
import { adminService } from "@/watchtower/services/adminService";
import { healthCheckService } from "@/watchtower/services/healthCheckService";
import type { AdminCameraDto, AdminUserDto, CreateCameraPayload } from "@/watchtower/types/api";
import { useToast } from "@/hooks/use-toast";
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Pencil, Trash2, Wifi, WifiOff, RefreshCw, Loader2 } from "lucide-react";

const UNASSIGNED = "__unassigned__";

const emptyForm: CreateCameraPayload = {
  ownerUserId: UNASSIGNED,
  name: "",
  slug: "",
  locationName: "",
  hlsBaseUrl: "",
  isActive: true,
};

export default function WatchtowerAdminCameras() {
  const { isAdmin, loading: roleLoading } = useIsAdmin();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [cameras, setCameras] = useState<AdminCameraDto[]>([]);
  const [users, setUsers] = useState<AdminUserDto[]>([]);
  const [statusMap, setStatusMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [checkingHealth, setCheckingHealth] = useState(false);

  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<AdminCameraDto | null>(null);
  const [form, setForm] = useState<CreateCameraPayload>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AdminCameraDto | null>(null);

  useEffect(() => {
    if (!roleLoading && !isAdmin) navigate("/watchtower/dashboard", { replace: true });
  }, [isAdmin, roleLoading, navigate]);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [cams, usrs, logs] = await Promise.all([
        adminService.getCameras(),
        adminService.getUsers(),
        healthCheckService.getLogs({ limit: 200 }),
      ]);
      setCameras(cams);
      setUsers(usrs);
      const map: Record<string, string> = {};
      logs.forEach((l) => { if (!map[l.cameraId]) map[l.cameraId] = l.status; });
      setStatusMap(map);
    } catch (e: unknown) {
      toast({ title: "Erro ao carregar dados", description: (e as Error).message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) loadAll();
  }, [isAdmin]);

  const openNew = () => {
    setEditing(null);
    setForm({ ...emptyForm });
    setEditorOpen(true);
  };

  const openEdit = (cam: AdminCameraDto) => {
    setEditing(cam);
    setForm({
      ownerUserId: cam.ownerUserId,
      name: cam.name,
      slug: cam.slug,
      locationName: cam.locationName,
      hlsBaseUrl: "",
      isActive: cam.isActive,
    });
    setEditorOpen(true);
  };

  const save = async () => {
    if (!form.name.trim() || !form.slug.trim()) {
      toast({ title: "Nome e Slug são obrigatórios.", variant: "destructive" });
      return;
    }
    setSaving(true);
    const payload: CreateCameraPayload = {
      ...form,
      ownerUserId: form.ownerUserId === UNASSIGNED ? "" : form.ownerUserId,
    };
    try {
      if (editing) {
        await adminService.updateCamera(editing.id, payload);
        toast({ title: "Câmera atualizada" });
      } else {
        await adminService.createCamera(payload);
        toast({ title: "Câmera cadastrada" });
      }
      setEditorOpen(false);
      loadAll();
    } catch (e: unknown) {
      toast({ title: "Erro ao salvar", description: (e as Error).message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await adminService.deleteCamera(deleteTarget.id);
      toast({ title: "Câmera excluída" });
      setDeleteTarget(null);
      loadAll();
    } catch (e: unknown) {
      toast({ title: "Erro ao excluir", description: (e as Error).message, variant: "destructive" });
    }
  };

  const runHealthCheck = async () => {
    setCheckingHealth(true);
    try {
      await healthCheckService.run();
      toast({ title: "Verificação concluída" });
      await loadAll();
    } catch (e: unknown) {
      toast({ title: "Erro no health check", description: (e as Error).message, variant: "destructive" });
    } finally {
      setCheckingHealth(false);
    }
  };

  if (roleLoading || !isAdmin) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-3xl font-bold tracking-wider">GESTÃO DE CÂMERAS</h2>
          <p className="text-xs tracking-[0.15em] text-muted-foreground mt-2">CADASTRO, VÍNCULO E STATUS EM TEMPO REAL</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={runHealthCheck} disabled={checkingHealth}>
            {checkingHealth ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
            Verificar status
          </Button>
          <Button onClick={openNew}>
            <Plus className="h-4 w-4 mr-2" /> Nova câmera
          </Button>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Status</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Localização</TableHead>
              <TableHead>Dono (userId)</TableHead>
              <TableHead>Ativo</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin inline" />
                </TableCell>
              </TableRow>
            ) : cameras.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">Nenhuma câmera cadastrada.</TableCell>
              </TableRow>
            ) : cameras.map((cam) => {
              const status = statusMap[cam.id];
              return (
                <TableRow key={cam.id}>
                  <TableCell>
                    {status === "Online" ? (
                      <Badge variant="outline" className="border-primary/40 text-primary"><Wifi className="h-3 w-3 mr-1" /> Online</Badge>
                    ) : status === "Offline" ? (
                      <Badge variant="outline" className="border-destructive/40 text-destructive"><WifiOff className="h-3 w-3 mr-1" /> Offline</Badge>
                    ) : (
                      <Badge variant="outline" className="text-muted-foreground">—</Badge>
                    )}
                  </TableCell>
                  <TableCell className="font-medium">{cam.name}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{cam.slug}</TableCell>
                  <TableCell className="text-muted-foreground">{cam.locationName || "—"}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{cam.ownerUserId ? cam.ownerUserId.slice(0, 8) + "…" : "—"}</TableCell>
                  <TableCell>
                    <Badge variant={cam.isActive ? "default" : "secondary"}>{cam.isActive ? "Sim" : "Não"}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button size="icon" variant="ghost" onClick={() => openEdit(cam)}><Pencil className="h-4 w-4" /></Button>
                      <Button size="icon" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => setDeleteTarget(cam)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <Dialog open={editorOpen} onOpenChange={setEditorOpen}>
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
              <Label>Usuário dono</Label>
              <Select value={form.ownerUserId || UNASSIGNED} onValueChange={(v) => setForm({ ...form, ownerUserId: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione um usuário" /></SelectTrigger>
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
            <Button variant="outline" onClick={() => setEditorOpen(false)}>Cancelar</Button>
            <Button onClick={save} disabled={saving}>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : editing ? "Salvar" : "Cadastrar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir câmera?</AlertDialogTitle>
            <AlertDialogDescription>
              A câmera <strong>{deleteTarget?.name}</strong> e seus logs relacionados serão removidos. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
