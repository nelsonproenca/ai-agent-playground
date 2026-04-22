import { useEffect, useState, useCallback } from "react";
import { Navigate } from "react-router-dom";
import { useIsAdmin } from "@/watchtower/hooks/useIsAdmin";
import { useWatchtowerAuth } from "@/watchtower/contexts/WatchtowerAuthContext";
import { adminService } from "@/watchtower/services/adminService";
import { logAdminEvent } from "@/watchtower/services/auditLogService";
import { supabase } from "@/integrations/supabase/client";
import type { AdminUserDto } from "@/watchtower/types/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Shield, ShieldOff, Search, Loader2, Check, X, ClipboardList } from "lucide-react";

interface PendingAdminRequest {
  user_id: string;
  display_name: string | null;
  email: string | null;
  created_at: string;
  access_released_at: string | null;
}

export default function WatchtowerAdminUsers() {
  const { isAdmin, loading: roleLoading } = useIsAdmin();
  const { user: currentUser } = useWatchtowerAuth();
  const [users, setUsers] = useState<AdminUserDto[]>([]);
  const [pending, setPending] = useState<PendingAdminRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingPending, setLoadingPending] = useState(true);
  const [search, setSearch] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [decidingId, setDecidingId] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      setUsers(await adminService.getUsers());
    } catch (e: unknown) {
      toast.error("Erro ao carregar usuários: " + (e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchPending = useCallback(async () => {
    setLoadingPending(true);
    try {
      const { data, error } = await supabase.rpc("list_pending_admin_requests");
      if (error) throw error;
      setPending((data as PendingAdminRequest[]) ?? []);
    } catch (e: unknown) {
      toast.error("Erro ao carregar pedidos: " + (e as Error).message);
    } finally {
      setLoadingPending(false);
    }
  }, []);

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
      fetchPending();
    }
  }, [isAdmin, fetchUsers, fetchPending]);

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

  const decidePending = async (req: PendingAdminRequest, decision: "approve" | "reject") => {
    setDecidingId(req.user_id);
    try {
      const rpc = decision === "approve" ? "approve_admin_request" : "reject_admin_request";
      const { error } = await supabase.rpc(rpc, { _user_id: req.user_id });
      if (error) throw error;

      // Notifica o usuário por e-mail (não bloqueia em caso de falha)
      try {
        await supabase.functions.invoke("watchtower-notify-access", {
          body: {
            event: decision === "approve" ? "admin_approved" : "admin_rejected",
            email: req.email,
            displayName: req.display_name,
          },
        });
      } catch (notifyErr) {
        console.warn("Falha ao enviar e-mail de decisão:", notifyErr);
      }

      await logAdminEvent({
        entityType: "admin",
        entityId: req.user_id,
        entityName: req.display_name ?? req.email ?? req.user_id.slice(0, 8),
        action: decision === "approve" ? "admin_request_approved" : "admin_request_rejected",
        details: { targetUserId: req.user_id },
      });

      toast.success(decision === "approve" ? "Pedido aprovado e usuário promovido." : "Pedido rejeitado.");
      fetchPending();
      fetchUsers();
    } catch (e: unknown) {
      toast.error("Erro: " + (e as Error).message);
    } finally {
      setDecidingId(null);
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

      <Tabs defaultValue={pending.length > 0 ? "pending" : "all"} className="space-y-4">
        <TabsList>
          <TabsTrigger value="pending" className="gap-2">
            <ClipboardList className="h-4 w-4" />
            Pedidos pendentes
            {pending.length > 0 && (
              <Badge className="ml-1 bg-primary/20 text-primary border-primary/30">{pending.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="all" className="gap-2">
            <Shield className="h-4 w-4" />
            Todos os usuários
          </TabsTrigger>
        </TabsList>

        {/* ─── Pedidos pendentes ─────────────────────────────── */}
        <TabsContent value="pending">
          <Card className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display text-lg font-bold text-foreground">PEDIDOS DE ACESSO ADMIN</h3>
                <p className="text-xs text-muted-foreground">
                  Usuários que solicitaram acesso administrativo durante o cadastro.
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={fetchPending} disabled={loadingPending}>
                {loadingPending ? <Loader2 className="h-3 w-3 animate-spin" /> : "Atualizar"}
              </Button>
            </div>

            {loadingPending ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : pending.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <ClipboardList className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>Nenhum pedido pendente no momento.</p>
              </div>
            ) : (
              <div className="rounded-md border border-border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>E-mail</TableHead>
                      <TableHead>Solicitado em</TableHead>
                      <TableHead className="text-right">Decisão</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pending.map((req) => (
                      <TableRow key={req.user_id}>
                        <TableCell className="font-medium text-foreground">
                          {req.display_name ?? "—"}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground truncate max-w-[200px]">
                          {req.email ?? "—"}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {new Date(req.created_at).toLocaleString("pt-BR")}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => decidePending(req, "reject")}
                              disabled={decidingId === req.user_id}
                            >
                              {decidingId === req.user_id ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <>
                                  <X className="h-3 w-3 mr-1" /> Rejeitar
                                </>
                              )}
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => decidePending(req, "approve")}
                              disabled={decidingId === req.user_id}
                            >
                              {decidingId === req.user_id ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <>
                                  <Check className="h-3 w-3 mr-1" /> Aprovar
                                </>
                              )}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </Card>
        </TabsContent>

        {/* ─── Todos os usuários ─────────────────────────────── */}
        <TabsContent value="all">
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
        </TabsContent>
      </Tabs>
    </div>
  );
}
