import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useIsAdmin } from "@/watchtower/hooks/useIsAdmin";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

interface Camera {
  id: string;
  display_name: string;
  internal_stream_key: string;
  location: string | null;
  owner_user_id: string | null;
  created_at: string;
}

interface AdminUser {
  user_id: string;
  display_name: string | null;
  email: string;
}

interface HealthRow {
  camera_id: string;
  status: string;
  checked_at: string;
}

const UNASSIGNED = "__unassigned__";

export default function WatchtowerAdminCameras() {
  const { isAdmin, loading: roleLoading } = useIsAdmin();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [cameras, setCameras] = useState<Camera[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [healthMap, setHealthMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [checkingHealth, setCheckingHealth] = useState(false);

  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<Camera | null>(null);
  const [form, setForm] = useState({
    display_name: "",
    internal_stream_key: "",
    location: "",
    owner_user_id: UNASSIGNED,
  });
  const [deleteTarget, setDeleteTarget] = useState<Camera | null>(null);

  useEffect(() => {
    if (!roleLoading && !isAdmin) navigate("/watchtower/dashboard", { replace: true });
  }, [isAdmin, roleLoading, navigate]);

  const loadAll = async () => {
    setLoading(true);
    const [camsRes, usersRes, healthRes] = await Promise.all([
      supabase.from("cameras").select("*").order("display_name"),
      supabase.rpc("list_users_with_admin_status"),
      supabase
        .from("camera_health_logs")
        .select("camera_id,status,checked_at")
        .order("checked_at", { ascending: false })
        .limit(500),
    ]);

    if (camsRes.error) {
      toast({ title: "Erro ao carregar câmeras", description: camsRes.error.message, variant: "destructive" });
    } else {
      setCameras((camsRes.data ?? []) as unknown as Camera[]);
    }

    if (!usersRes.error && usersRes.data) {
      setUsers(
        (usersRes.data as AdminUser[]).map((u) => ({
          user_id: u.user_id,
          display_name: u.display_name,
          email: u.email,
        }))
      );
    }

    if (!healthRes.error && healthRes.data) {
      const map: Record<string, string> = {};
      (healthRes.data as HealthRow[]).forEach((row) => {
        if (!map[row.camera_id]) map[row.camera_id] = row.status;
      });
      setHealthMap(map);
    }

    setLoading(false);
  };

  useEffect(() => {
    if (isAdmin) loadAll();
  }, [isAdmin]);

  const userById = useMemo(() => {
    const m: Record<string, AdminUser> = {};
    users.forEach((u) => (m[u.user_id] = u));
    return m;
  }, [users]);

  const openNew = () => {
    setEditing(null);
    setForm({ display_name: "", internal_stream_key: "", location: "", owner_user_id: UNASSIGNED });
    setEditorOpen(true);
  };

  const openEdit = (cam: Camera) => {
    setEditing(cam);
    setForm({
      display_name: cam.display_name,
      internal_stream_key: cam.internal_stream_key,
      location: cam.location ?? "",
      owner_user_id: cam.owner_user_id ?? UNASSIGNED,
    });
    setEditorOpen(true);
  };

  const save = async () => {
    if (!form.display_name.trim() || !form.internal_stream_key.trim()) {
      toast({ title: "Campos obrigatórios", description: "Nome e stream key são obrigatórios.", variant: "destructive" });
      return;
    }
    const payload = {
      display_name: form.display_name.trim(),
      internal_stream_key: form.internal_stream_key.trim(),
      location: form.location.trim() || null,
      owner_user_id: form.owner_user_id === UNASSIGNED ? null : form.owner_user_id,
    };

    const res = editing
      ? await supabase.from("cameras").update(payload).eq("id", editing.id)
      : await supabase.from("cameras").insert(payload);

    if (res.error) {
      toast({ title: "Erro ao salvar", description: res.error.message, variant: "destructive" });
      return;
    }
    toast({ title: editing ? "Câmera atualizada" : "Câmera cadastrada" });
    setEditorOpen(false);
    loadAll();
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const { error } = await supabase.from("cameras").delete().eq("id", deleteTarget.id);
    if (error) {
      toast({ title: "Erro ao excluir", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Câmera excluída" });
    setDeleteTarget(null);
    loadAll();
  };

  const runHealthCheck = async () => {
    setCheckingHealth(true);
    const { error } = await supabase.functions.invoke("camera-health-check");
    if (error) {
      toast({ title: "Erro no health check", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Verificação concluída" });
      await loadAll();
    }
    setCheckingHealth(false);
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
          <p className="text-xs tracking-[0.15em] text-muted-foreground mt-2">
            CADASTRO, VÍNCULO E STATUS EM TEMPO REAL
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={runHealthCheck} disabled={checkingHealth}>
            {checkingHealth ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
            Verificar status
          </Button>
          <Button onClick={openNew}>
            <Plus className="h-4 w-4 mr-2" />
            Nova câmera
          </Button>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Status</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>Stream key</TableHead>
              <TableHead>Localização</TableHead>
              <TableHead>Cliente vinculado</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin inline" />
                </TableCell>
              </TableRow>
            ) : cameras.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                  Nenhuma câmera cadastrada.
                </TableCell>
              </TableRow>
            ) : (
              cameras.map((cam) => {
                const status = healthMap[cam.id];
                const owner = cam.owner_user_id ? userById[cam.owner_user_id] : null;
                return (
                  <TableRow key={cam.id}>
                    <TableCell>
                      {status === "online" ? (
                        <Badge variant="outline" className="border-primary/40 text-primary">
                          <Wifi className="h-3 w-3 mr-1" /> Online
                        </Badge>
                      ) : status === "offline" ? (
                        <Badge variant="outline" className="border-destructive/40 text-destructive">
                          <WifiOff className="h-3 w-3 mr-1" /> Offline
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-muted-foreground">—</Badge>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">{cam.display_name}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {cam.internal_stream_key}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{cam.location ?? "—"}</TableCell>
                    <TableCell>
                      {owner ? (
                        <div className="text-sm">
                          <div>{owner.display_name ?? owner.email}</div>
                          <div className="text-xs text-muted-foreground">{owner.email}</div>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground italic">Não vinculada</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button size="icon" variant="ghost" onClick={() => openEdit(cam)} title="Editar">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="text-destructive hover:text-destructive"
                          onClick={() => setDeleteTarget(cam)}
                          title="Excluir"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={editorOpen} onOpenChange={setEditorOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar câmera" : "Nova câmera"}</DialogTitle>
            <DialogDescription>
              Preencha os dados da câmera e, opcionalmente, vincule a um cliente.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nome de exibição *</Label>
              <Input
                value={form.display_name}
                onChange={(e) => setForm({ ...form, display_name: e.target.value })}
                placeholder="Câmera 01 - Entrada"
              />
            </div>
            <div className="space-y-2">
              <Label>Stream key (MediaMTX) *</Label>
              <Input
                value={form.internal_stream_key}
                onChange={(e) => setForm({ ...form, internal_stream_key: e.target.value })}
                placeholder="cam-001-entrada"
                className="font-mono"
              />
            </div>
            <div className="space-y-2">
              <Label>Localização</Label>
              <Input
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                placeholder="Portaria A"
              />
            </div>
            <div className="space-y-2">
              <Label>Cliente vinculado</Label>
              <Select value={form.owner_user_id} onValueChange={(v) => setForm({ ...form, owner_user_id: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um cliente" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={UNASSIGNED}>Não vinculada (visível a todos)</SelectItem>
                  {users.map((u) => (
                    <SelectItem key={u.user_id} value={u.user_id}>
                      {u.display_name ?? u.email} — {u.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditorOpen(false)}>Cancelar</Button>
            <Button onClick={save}>{editing ? "Salvar" : "Cadastrar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir câmera?</AlertDialogTitle>
            <AlertDialogDescription>
              A câmera <strong>{deleteTarget?.display_name}</strong> e seus logs/assinaturas relacionados serão removidos. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
