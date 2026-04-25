import { Navigate } from "react-router-dom";
import { useIsAdmin } from "@/watchtower/hooks/useIsAdmin";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, History } from "lucide-react";

export default function WatchtowerAdminAudit() {
  const { isAdmin, loading: roleLoading } = useIsAdmin();

  if (roleLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (!isAdmin) return <Navigate to="/watchtower/dashboard" replace />;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-3xl font-bold text-foreground tracking-wider flex items-center gap-3">
          <History className="h-7 w-7 text-highlight" />
          AUDITORIA ADMINISTRATIVA
        </h2>
        <p className="text-xs tracking-[0.15em] text-muted-foreground mt-2">
          HISTÓRICO DE ALTERAÇÕES — OS LOGS SÃO REGISTRADOS NO SERVIDOR
        </p>
      </div>

      <div className="rounded-lg border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data / Hora</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Ação</TableHead>
              <TableHead>Alvo</TableHead>
              <TableHead>Administrador</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                Nenhum evento disponível via interface. Consulte os logs do servidor.
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
