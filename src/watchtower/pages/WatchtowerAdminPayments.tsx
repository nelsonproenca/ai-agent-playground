import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useIsAdmin } from "@/watchtower/hooks/useIsAdmin";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Check, X, ExternalLink, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface PendingPaymentRow {
  id: string;
  user_id: string;
  user_email: string | null;
  user_display_name: string | null;
  camera_id: string;
  camera_name: string | null;
  plan_name: string;
  plan_sku: string;
  receipt_url: string | null;
  status: string;
  created_at: string;
  approved_at: string | null;
}

export default function WatchtowerAdminPayments() {
  const { isAdmin, loading: adminLoading } = useIsAdmin();
  const [rows, setRows] = useState<PendingPaymentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const fetchPayments = async () => {
    setLoading(true);
    const { data, error } = await supabase.rpc("list_pending_payments_admin");
    if (error) toast.error("Erro ao carregar pagamentos: " + error.message);
    else setRows((data as PendingPaymentRow[]) ?? []);
    setLoading(false);
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

  const approve = async (id: string) => {
    setBusyId(id);
    const { error } = await supabase.rpc("approve_pending_payment", { _payment_id: id });
    if (error) toast.error("Erro ao aprovar: " + error.message);
    else toast.success("Pagamento aprovado e assinatura criada");
    setBusyId(null);
    fetchPayments();
  };

  const reject = async (id: string) => {
    setBusyId(id);
    const { error } = await supabase.rpc("reject_pending_payment", { _payment_id: id });
    if (error) toast.error("Erro ao rejeitar: " + error.message);
    else toast.success("Pagamento rejeitado");
    setBusyId(null);
    fetchPayments();
  };

  const filtered = rows.filter((r) => {
    const q = search.toLowerCase().trim();
    if (!q) return true;
    return (
      r.user_email?.toLowerCase().includes(q) ||
      r.user_display_name?.toLowerCase().includes(q) ||
      r.camera_name?.toLowerCase().includes(q) ||
      r.plan_name.toLowerCase().includes(q) ||
      r.plan_sku.toLowerCase().includes(q)
    );
  });

  const statusBadge = (status: string) => {
    if (status === "pending") return <Badge variant="secondary">Pendente</Badge>;
    if (status === "approved") return <Badge className="bg-primary/15 text-primary border-primary/20">Aprovado</Badge>;
    return <Badge variant="destructive">Rejeitado</Badge>;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl tracking-wider">Pagamentos Pendentes</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Aprove ou rejeite solicitações de assinatura enviadas via PIX.
        </p>
      </div>

      <Input
        placeholder="Buscar por usuário, câmera ou plano..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-md"
      />

      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Usuário</TableHead>
              <TableHead>Câmera</TableHead>
              <TableHead>Plano</TableHead>
              <TableHead>Comprovante</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-10">
                  <Loader2 className="h-5 w-5 animate-spin inline text-primary" />
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                  Nenhum pagamento encontrado.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                    {new Date(r.created_at).toLocaleString("pt-BR")}
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{r.user_display_name ?? "—"}</div>
                    <div className="text-xs text-muted-foreground">{r.user_email ?? "—"}</div>
                  </TableCell>
                  <TableCell>{r.camera_name ?? "—"}</TableCell>
                  <TableCell>
                    <div className="font-medium">{r.plan_name}</div>
                    <div className="text-xs text-muted-foreground uppercase">{r.plan_sku}</div>
                  </TableCell>
                  <TableCell>
                    {r.receipt_url ? (
                      <a
                        href={r.receipt_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline inline-flex items-center gap-1 text-sm"
                      >
                        Ver <ExternalLink className="h-3 w-3" />
                      </a>
                    ) : (
                      <span className="text-muted-foreground text-sm">—</span>
                    )}
                  </TableCell>
                  <TableCell>{statusBadge(r.status)}</TableCell>
                  <TableCell className="text-right">
                    {r.status === "pending" ? (
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="outline" disabled={busyId === r.id} onClick={() => reject(r.id)}>
                          <X className="h-4 w-4" /> Rejeitar
                        </Button>
                        <Button size="sm" disabled={busyId === r.id} onClick={() => approve(r.id)}>
                          {busyId === r.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                          Aprovar
                        </Button>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        {r.approved_at ? new Date(r.approved_at).toLocaleString("pt-BR") : "—"}
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
