import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useIsAdmin } from "@/watchtower/hooks/useIsAdmin";
import { useWatchtowerAuth } from "@/watchtower/contexts/WatchtowerAuthContext";
import { Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Shield, ShieldOff, Search, Loader2 } from "lucide-react";

interface UserRow {
  user_id: string;
  display_name: string | null;
  email: string | null;
  is_admin: boolean;
  created_at: string;
}

export default function WatchtowerAdminUsers() {
  const { isAdmin, loading: roleLoading } = useIsAdmin();
  const { user: currentUser } = useWatchtowerAuth();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    const { data, error } = await supabase.rpc("list_users_with_admin_status");
    if (error) {
      toast.error("Erro ao carregar usuários: " + error.message);
    } else {
      setUsers((data as UserRow[]) || []);
    }
    setLoading(false);
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

  const togglePromotion = async (u: UserRow) => {
    if (u.user_id === currentUser?.id && u.is_admin) {
      toast.error("Você não pode remover seus próprios privilégios de admin.");
      return;
    }
    setUpdatingId(u.user_id);
    if (u.is_admin) {
      const { error } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", u.user_id)
        .eq("role", "admin");
      if (error) toast.error("Erro: " + error.message);
      else toast.success(`${u.display_name || "Usuário"} rebaixado.`);
    } else {
      const { error } = await supabase
        .from("user_roles")
        .insert({ user_id: u.user_id, role: "admin" });
      if (error) toast.error("Erro: " + error.message);
      else toast.success(`${u.display_name || "Usuário"} promovido a admin.`);
    }
    setUpdatingId(null);
    fetchUsers();
  };

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    return (
      (u.display_name || "").toLowerCase().includes(q) ||
      (u.email || "").toLowerCase().includes(q) ||
      u.user_id.toLowerCase().includes(q)
    );
  });

  const adminCount = users.filter((u) => u.is_admin).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="font-display text-3xl tracking-wider">Administradores</h1>
        <p className="text-muted-foreground text-sm">
          Gerencie quais usuários têm acesso administrativo. Total: {users.length} usuário(s) — {adminCount} admin(s).
        </p>
      </div>

      <Card className="p-6 space-y-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, e-mail ou ID..."
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
                  <TableHead>Usuário</TableHead>
                  <TableHead>E-mail</TableHead>
                  <TableHead>ID</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      Nenhum usuário encontrado.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((u) => (
                    <TableRow key={u.user_id}>
                      <TableCell className="font-medium">
                        {u.display_name || "Sem nome"}
                        {u.user_id === currentUser?.id && (
                          <span className="ml-2 text-xs text-muted-foreground">(você)</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{u.email || "—"}</TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {u.user_id.slice(0, 8)}...
                      </TableCell>
                      <TableCell>
                        {u.is_admin ? (
                          <Badge className="bg-primary/15 text-primary border-primary/30">Admin</Badge>
                        ) : (
                          <Badge variant="outline">Usuário</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant={u.is_admin ? "outline" : "default"}
                          onClick={() => togglePromotion(u)}
                          disabled={updatingId === u.user_id || (u.user_id === currentUser?.id && u.is_admin)}
                        >
                          {updatingId === u.user_id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : u.is_admin ? (
                            <>
                              <ShieldOff className="h-4 w-4 mr-1" /> Rebaixar
                            </>
                          ) : (
                            <>
                              <Shield className="h-4 w-4 mr-1" /> Promover
                            </>
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
