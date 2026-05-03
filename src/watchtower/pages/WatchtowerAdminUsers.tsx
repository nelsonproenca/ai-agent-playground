import { useEffect, useState, useCallback } from "react";
import { Navigate } from "react-router-dom";
import { useIsAdmin } from "@/watchtower/hooks/useIsAdmin";
import { useWatchtowerAuth } from "@/watchtower/contexts/WatchtowerAuthContext";
import { adminService } from "@/watchtower/services/adminService";
import { logAdminEvent } from "@/watchtower/services/auditLogService";
import type { AdminUserDto } from "@/watchtower/types/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Shield, ShieldOff, Search, Loader2, UserPlus } from "lucide-react";

export default function WatchtowerAdminUsers() {
  const { isAdmin, loading: roleLoading } = useIsAdmin();
  const { user: currentUser } = useWatchtowerAuth();
  const [users, setUsers] = useState<AdminUserDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const [promoteOpen, setPromoteOpen] = useState(false);
  const [promoteSearch, setPromoteSearch] = useState("");
  const [promoteTarget, setPromoteTarget] = useState<AdminUserDto | null>(null);
  const [promoting, setPromoting] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      setUsers(await adminService.getUsers());
    } catch (e: unknown) {
      toast.error("Erro ao carregar administradores: " + (e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAdmin) fetchUsers();
  }, [isAdmin, fetchUsers]);

  if (roleLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) return <Navigate to="/watchtower/dashboard" replace />;

  const demote = async (u: AdminUserDto) => {
    if (u.userId === currentUser?.id) {
      toast.error("Você não pode remover seus próprios privilégios de admin.");
      return;
    }
    setUpdatingId(u.userId);
    try {
      await adminService.demoteUser(u.userId);
      await logAdminEvent({
        entityType: "admin",
        entityId: u.userId,
        entityName: u.displayName ?? u.email ?? u.userId.slice(0, 8),
        action: "demoted",
        details: { targetUserId: u.userId },
      });
      toast.success("Admin removido.");
      fetchUsers();
    } catch (e: unknown) {
      toast.error("Erro: " + (e as Error).message);
    } finally {
      setUpdatingId(null);
    }
  };

  const handlePromote = async () => {
    if (!promoteTarget) return;
    setPromoting(true);
    try {
      await adminService.promoteUser(promoteTarget.userId);
      await logAdminEvent({
        entityType: "admin",
        entityId: promoteTarget.userId,
        entityName: promoteTarget.displayName ?? promoteTarget.email ?? promoteTarget.userId.slice(0, 8),
        action: "promoted",
        details: { targetUserId: promoteTarget.userId },
      });
      toast.success("Usuário promovido a administrador.");
      setPromoteOpen(false);
      setPromoteSearch("");
      setPromoteTarget(null);
      fetchUsers();
    } catch (e: unknown) {
      toast.error("Erro: " + (e as Error).message);
    } finally {
      setPromoting(false);
    }
  };

  const admins = users.filter((u) => u.isAdmin);
  const nonAdmins = users.filter((u) => !u.isAdmin);

  const filtered = admins.filter((u) => {
    const q = search.toLowerCase();
    return (
      u.userId.toLowerCase().includes(q) ||
      (u.email ?? "").toLowerCase().includes(q) ||
      (u.displayName ?? "").toLowerCase().includes(q)
    );
  });

  const promoteResults = promoteSearch.length >= 2
    ? nonAdmins.filter((u) => {
        const q = promoteSearch.toLowerCase();
        return (
          (u.email ?? "").toLowerCase().includes(q) ||
          (u.displayName ?? "").toLowerCase().includes(q)
        );
      }).slice(0, 8)
    : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-3xl font-bold text-foreground tracking-wider">ADMINISTRADORES</h2>
          <p className="text-xs tracking-[0.15em] text-muted-foreground mt-2">
            {admins.length} ADMINISTRADOR(ES) — {users.length} USUÁRIO(S) NO SISTEMA
          </p>
        </div>
        <Button onClick={() => setPromoteOpen(true)}>
          <UserPlus className="h-4 w-4 mr-2" /> Adicionar administrador
        </Button>
      </div>

      <Card className="p-6 space-y-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou e-mail..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <div className="rounded-md border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Administrador</TableHead>
                  <TableHead>User ID</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                      Nenhum administrador encontrado.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((u) => (
                    <TableRow key={u.userId}>
                      <TableCell>
                        <div className="flex flex-col gap-0.5">
                          <span className="text-sm font-medium text-foreground leading-tight">
                            {u.displayName || u.email?.split("@")[0] || "—"}
                            {u.userId === currentUser?.id && (
                              <span className="ml-2 text-xs text-muted-foreground font-normal">(você)</span>
                            )}
                          </span>
                          {u.email && (
                            <span className="text-xs text-muted-foreground">{u.email}</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {u.userId.slice(0, 8)}…
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => demote(u)}
                          disabled={updatingId === u.userId || u.userId === currentUser?.id}
                        >
                          {updatingId === u.userId ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <><ShieldOff className="h-4 w-4 mr-1" /> Remover admin</>
                          )}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      {/* Dialog: Promover usuário */}
      <Dialog open={promoteOpen} onOpenChange={(o) => { if (!promoting) { setPromoteOpen(o); setPromoteSearch(""); setPromoteTarget(null); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" /> Adicionar administrador
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="promote-search">Buscar por nome ou e-mail</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="promote-search"
                  placeholder="Digite pelo menos 2 caracteres..."
                  value={promoteSearch}
                  onChange={(e) => { setPromoteSearch(e.target.value); setPromoteTarget(null); }}
                  className="pl-9"
                  autoComplete="off"
                />
              </div>
            </div>

            {promoteResults.length > 0 && !promoteTarget && (
              <div className="rounded-md border border-border divide-y divide-border max-h-52 overflow-y-auto">
                {promoteResults.map((u) => (
                  <button
                    key={u.userId}
                    type="button"
                    onClick={() => { setPromoteTarget(u); setPromoteSearch(u.email ?? u.displayName ?? u.userId); }}
                    className="w-full text-left px-3 py-2.5 hover:bg-muted/60 transition-colors"
                  >
                    <div className="text-sm font-medium">{u.displayName || u.email?.split("@")[0]}</div>
                    <div className="text-xs text-muted-foreground">{u.email}</div>
                  </button>
                ))}
              </div>
            )}

            {promoteSearch.length >= 2 && promoteResults.length === 0 && !promoteTarget && (
              <p className="text-sm text-muted-foreground text-center py-2">Nenhum usuário encontrado.</p>
            )}

            {promoteTarget && (
              <div className="rounded-md border border-primary/30 bg-primary/5 px-3 py-2.5 space-y-0.5">
                <p className="text-sm font-medium">{promoteTarget.displayName || promoteTarget.email?.split("@")[0]}</p>
                <p className="text-xs text-muted-foreground">{promoteTarget.email}</p>
              </div>
            )}
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" disabled={promoting}>Cancelar</Button>
            </DialogClose>
            <Button onClick={handlePromote} disabled={!promoteTarget || promoting}>
              {promoting ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Promovendo...</>
              ) : (
                <><Shield className="h-4 w-4 mr-2" /> Promover</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
