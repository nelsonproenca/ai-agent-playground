import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useIsAdmin } from "@/watchtower/hooks/useIsAdmin";
import { adminService } from "@/watchtower/services/adminService";
import { healthCheckService } from "@/watchtower/services/healthCheckService";
import type { AdminCameraDto, AdminUserDto } from "@/watchtower/types/api";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Pencil, Trash2, Wifi, WifiOff, RefreshCw, Loader2, AlertTriangle } from "lucide-react";
import { logAdminEvent } from "@/watchtower/services/auditLogService";
import { WatchtowerCameraEditorDialog } from "@/watchtower/components/WatchtowerCameraEditorDialog";

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
  const [deleteTarget, setDeleteTarget] = useState<AdminCameraDto | null>(null);
  const [deleting, setDeleting] = useState(false);

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
    setEditorOpen(true);
  };

  const openEdit = (cam: AdminCameraDto) => {
    setEditing(cam);
    setEditorOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await adminService.deleteCamera(deleteTarget.id);
      await logAdminEvent({
        entityType: "camera",
        entityId: deleteTarget.id,
        entityName: deleteTarget.name,
        action: "deleted",
        details: { slug: deleteTarget.slug },
      });
      toast({ title: "Câmera excluída com sucesso." });
      setDeleteTarget(null);
      loadAll();
    } catch (e: unknown) {
      toast({ title: "Erro ao excluir", description: (e as Error).message, variant: "destructive" });
    } finally {
      setDeleting(false);
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
          <h2 className="font-display text-3xl font-bold text-foreground tracking-wider">GESTÃO DE CÂMERAS</h2>
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
              <TableHead>Protocolo</TableHead>
              <TableHead>Localização</TableHead>
              <TableHead>Dono (userId)</TableHead>
              <TableHead>Ativo</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-10 text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin inline" />
                </TableCell>
              </TableRow>
            ) : cameras.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-10 text-muted-foreground">Nenhuma câmera cadastrada.</TableCell>
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
                  <TableCell>
                    <Badge variant="outline" className={cam.protocol === "Rtmp" ? "border-orange-400/40 text-orange-400" : "text-muted-foreground"}>
                      {cam.protocol ?? "RTSP"}
                    </Badge>
                  </TableCell>
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

      <WatchtowerCameraEditorDialog
        open={editorOpen}
        onOpenChange={setEditorOpen}
        editing={editing}
        users={users}
        onSaved={loadAll}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => { if (!o && !deleting) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center gap-3 mb-1">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10 shrink-0">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
              <AlertDialogTitle className="text-lg">Excluir câmera permanentemente?</AlertDialogTitle>
            </div>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p>
                  Você está prestes a excluir a câmera{" "}
                  <span className="font-semibold text-foreground">{deleteTarget?.name}</span>.
                  Esta ação <span className="font-semibold text-destructive">não pode ser desfeita</span>.
                </p>
                <div className="rounded-md border border-border bg-muted/50 px-3 py-2 text-xs space-y-1">
                  <div className="flex gap-2">
                    <span className="text-muted-foreground w-16 shrink-0">Slug</span>
                    <span className="font-mono text-foreground">{deleteTarget?.slug}</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-muted-foreground w-16 shrink-0">Protocolo</span>
                    <span className="text-foreground">{deleteTarget?.protocol ?? "RTSP"}</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-muted-foreground w-16 shrink-0">Localização</span>
                    <span className="text-foreground">{deleteTarget?.locationName || "—"}</span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Todos os logs de health check vinculados também serão removidos.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Excluindo...</>
              ) : (
                <><Trash2 className="h-4 w-4 mr-2" /> Excluir câmera</>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
