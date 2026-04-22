import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useIsAdmin } from "@/watchtower/hooks/useIsAdmin";
import { useWatchtowerAuth } from "@/watchtower/contexts/WatchtowerAuthContext";
import { adminService } from "@/watchtower/services/adminService";
import { logAdminEvent } from "@/watchtower/services/auditLogService";
import type { AdminUserDto } from "@/watchtower/types/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Shield, ShieldOff, Search, Loader2 } from "lucide-react";

export default function WatchtowerAdminUsers() {
  const { isAdmin, loading: roleLoading } = useIsAdmin();
  const { user: currentUser } = useWatchtowerAuth();
  const [users, setUsers] = useState<AdminUserDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      setUsers(await adminService.getUsers());
    } catch (e: unknown) {
      toast.error("Erro ao carregar usuários: " + (e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) fetchUsers();
  }, [isAdmin]);

  if (roleLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) return <Navigate to="/watchtower/dashboard" replace />;

  const togglePromotion = async (u: AdminUserDto) => {
    if (u.userId === currentUser?.id && u.isAdmin) {
      toast.error("Você não pode remover seus próprios privilégios de admin.");
      return;
    }
    setUpdatingId(u.userId);
    try {
      if (u.isAdmin) {
        await adminService.demoteUser(u.userId);
        await logAdminEvent({
          entityType: "admin",
          entityId: u.userId,
          entityName: u.planName ?? u.userId.slice(0, 8),
          action: "demoted",
          details: { targetUserId: u.userId },
        });
        toast.success("Usuário rebaixado.");
      } else {
        await adminService.promoteUser(u.userId);
        await logAdminEvent({
          entityType: "admin",
          entityId: u.userId,
          entityName: u.planName ?? u.userId.slice(0, 8),
          action: "promoted",
          details: { targetUserId: u.userId },
        });
        toast.success("Usuário promovido a admin.");
      }
      fetchUsers();
    } catch (e: unknown) {
      toast.error("Erro: " + (e as Error).message);
    } finally {
      setUpdatingId(null);
    }
  };

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    return u.userId.toLowerCase().includes(q) || (u.planName ?? "").toLowerCase().includes(q);
  });

  const adminCount = users.filter((u) => u.isAdmin).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h2 className="font-display text-3xl font-bold text-foreground tracking-wider">ADMINISTRADORES</h2>
        <p className="text-xs tracking-[0.15em] text-muted-foreground">
          GERENCIE PRIVILÉGIOS DE ACESSO. TOTAL: {users.length} USUÁRIO(S) — {adminCount} ADMIN(S)
        </p>
      </div>

      <Card className="p-6 space-y-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por ID ou plano..."
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
                  <TableHead>User ID</TableHead>
                  <TableHead>Plano ativo</TableHead>
                  <TableHead>Expira em</TableHead>
                  <TableHead>Status acesso</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      Nenhum usuário encontrado.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((u) => (
                    <TableRow key={u.userId}>
                      <TableCell className="font-mono text-xs">
                        {u.userId.slice(0, 8)}…
                        {u.userId === currentUser?.id && (
                          <span className="ml-2 text-muted-foreground">(você)</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">{u.planName ?? "—"}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {u.accessExpiresAt ? new Date(u.accessExpiresAt).toLocaleDateString("pt-BR") : "—"}
                      </TableCell>
                      <TableCell>
                        {u.accessStatus ? (
                          <Badge variant={u.accessStatus === "Active" ? "default" : "secondary"}>
                            {u.accessStatus}
                          </Badge>
                        ) : "—"}
                      </TableCell>
                      <TableCell>
                        {u.isAdmin ? (
                          <Badge className="bg-primary/15 text-primary border-primary/30">Admin</Badge>
                        ) : (
                          <Badge variant="outline">Usuário</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant={u.isAdmin ? "outline" : "default"}
                          onClick={() => togglePromotion(u)}
                          disabled={updatingId === u.userId || (u.userId === currentUser?.id && u.isAdmin)}
                        >
                          {updatingId === u.userId ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : u.isAdmin ? (
                            <><ShieldOff className="h-4 w-4 mr-1" /> Rebaixar</>
                          ) : (
                            <><Shield className="h-4 w-4 mr-1" /> Promover</>
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
    </div>
  );
}
