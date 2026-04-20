import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useIsAdmin } from "@/watchtower/hooks/useIsAdmin";
import { adminService } from "@/watchtower/services/adminService";
import type { AdminPaymentDto } from "@/watchtower/types/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Check, X, ExternalLink, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function WatchtowerAdminPayments() {
  const { isAdmin, loading: adminLoading } = useIsAdmin();
  const [rows, setRows] = useState<AdminPaymentDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  // Approve dialog
  const [approveTarget, setApproveTarget] = useState<AdminPaymentDto | null>(null);
  const [expiresAt, setExpiresAt] = useState("");

  const fetchPayments = async () => {
    setLoading(true);
    try {
      setRows(await adminService.getPayments());
    } catch (e: unknown) {
      toast.error("Erro ao carregar pagamentos: " + (e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) fetchPayments();
  }, [isAdmin]);

  if (adminLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }
  if (!isAdmin) return <Navigate to="/watchtower/dashboard" replace />;

  const openApprove = (row: AdminPaymentDto) => {
    // Default expiration: 30 days from now
    const defaultExpiry = new Date();
    defaultExpiry.setDate(defaultExpiry.getDate() + 30);
    setExpiresAt(defaultExpiry.toISOString().slice(0, 16));
    setApproveTarget(row);
  };

  const confirmApprove = async () => {
    if (!approveTarget || !expiresAt) return;
    setBusyId(approveTarget.id);
    try {
      await adminService.approvePayment(approveTarget.id, {
        accessExpiresAt: new Date(expiresAt).toISOString(),
      });
      toast.success("Pagamento aprovado e acesso ativado");
      setApproveTarget(null);
      fetchPayments();
    } catch (e: unknown) {
      toast.error("Erro ao aprovar: " + (e as Error).message);
    } finally {
      setBusyId(null);
    }
  };

  const reject = async (id: string) => {
    setBusyId(id);
    try {
      await adminService.rejectPayment(id);
      toast.success("Pagamento rejeitado");
      fetchPayments();
    } catch (e: unknown) {
      toast.error("Erro ao rejeitar: " + (e as Error).message);
    } finally {
      setBusyId(null);
    }
  };

  const filtered = rows.filter((r) => {
    const q = search.toLowerCase().trim();
    if (!q) return true;
    return (
      r.nome.toLowerCase().includes(q) ||
      r.cpf.includes(q) ||
      (r.planName ?? "").toLowerCase().includes(q) ||
      r.userId.toLowerCase().includes(q)
    );
  });

  const statusBadge = (status: string) => {
    if (status === "Pending") return <Badge variant="secondary">Pendente</Badge>;
    if (status === "Approved") return <Badge className="bg-primary/15 text-primary border-primary/20">Aprovado</Badge>;
    return <Badge variant="destructive">Rejeitado</Badge>;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl tracking-wider">Pagamentos</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Aprove ou rejeite solicitações de assinatura enviadas via PIX.
        </p>
      </div>

      <Input
        placeholder="Buscar por nome, CPF, plano ou ID..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-md"
      />

      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Pagador</TableHead>
              <TableHead>Plano</TableHead>
              <TableHead>Comprovante</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10">
                  <Loader2 className="h-5 w-5 animate-spin inline text-primary" />
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                  Nenhum pagamento encontrado.
                </TableCell>
              </TableRow>
            ) : filtered.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                  {new Date(r.createdAt).toLocaleString("pt-BR")}
                </TableCell>
                <TableCell>
                  <div className="font-medium">{r.nome}</div>
                  <div className="text-xs text-muted-foreground">CPF: {r.cpf}</div>
                  <div className="text-xs text-muted-foreground font-mono">{r.userId.slice(0, 8)}…</div>
                </TableCell>
                <TableCell>
                  <div className="font-medium">{r.planName ?? "—"}</div>
                  {r.priceBrl != null && <div className="text-xs text-muted-foreground">R$ {r.priceBrl.toFixed(2)}</div>}
                </TableCell>
                <TableCell>
                  {r.comprovanteUrl ? (
                    <a href={r.comprovanteUrl} target="_blank" rel="noopener noreferrer"
                      className="text-primary hover:underline inline-flex items-center gap-1 text-sm">
                      Ver <ExternalLink className="h-3 w-3" />
                    </a>
                  ) : (
                    <span className="text-muted-foreground text-sm">—</span>
                  )}
                </TableCell>
                <TableCell>{statusBadge(r.status)}</TableCell>
                <TableCell className="text-right">
                  {r.status === "Pending" ? (
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="outline" disabled={busyId === r.id} onClick={() => reject(r.id)}>
                        <X className="h-4 w-4" /> Rejeitar
                      </Button>
                      <Button size="sm" disabled={busyId === r.id} onClick={() => openApprove(r)}>
                        {busyId === r.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                        Aprovar
                      </Button>
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={!!approveTarget} onOpenChange={(o) => !o && setApproveTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Aprovar pagamento</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-sm text-muted-foreground">
              Pagador: <strong className="text-foreground">{approveTarget?.nome}</strong>
            </p>
            <p className="text-sm text-muted-foreground">
              Plano: <strong className="text-foreground">{approveTarget?.planName ?? "—"}</strong>
            </p>
            <div className="space-y-2">
              <Label>Data de expiração do acesso *</Label>
              <Input
                type="datetime-local"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApproveTarget(null)}>Cancelar</Button>
            <Button onClick={confirmApprove} disabled={!expiresAt || !!busyId}>
              {busyId ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirmar aprovação"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
