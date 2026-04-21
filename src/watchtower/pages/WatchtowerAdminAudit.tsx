import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useIsAdmin } from "@/watchtower/hooks/useIsAdmin";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, Star, History, ArrowRight, Camera, Package, Pencil, Trash2, Plus } from "lucide-react";
import { toast } from "@/hooks/use-toast";

type AuditRow = {
  id: string;
  entity_type: string;
  entity_id: string | null;
  entity_name: string | null;
  action: string;
  details: Record<string, unknown> | null;
  // Legacy plan-specific fields (still populated for plan events)
  plan_id: string | null;
  plan_name: string | null;
  previous_highlighted_plan_id: string | null;
  previous_highlighted_plan_name: string | null;
  changed_by: string;
  changed_by_email: string | null;
  changed_at: string;
};

const formatDate = (iso: string) =>
  new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

const ENTITY_META: Record<string, { label: string; Icon: typeof Camera }> = {
  plan: { label: "PLANO", Icon: Package },
  camera: { label: "CÂMERA", Icon: Camera },
};

const ACTION_META: Record<
  string,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline"; className?: string; Icon?: typeof Star }
> = {
  highlighted: { label: "DESTACADO", variant: "default", className: "bg-highlight text-highlight-foreground hover:bg-highlight", Icon: Star },
  unhighlighted: { label: "DESTAQUE REMOVIDO", variant: "secondary" },
  created: { label: "CRIADO", variant: "outline", className: "border-primary/40 text-primary", Icon: Plus },
  updated: { label: "ATUALIZADO", variant: "outline", Icon: Pencil },
  deleted: { label: "EXCLUÍDO", variant: "destructive", Icon: Trash2 },
};

export default function WatchtowerAdminAudit() {
  const { isAdmin, loading: roleLoading } = useIsAdmin();
  const [rows, setRows] = useState<AuditRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAdmin) return;
    (async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("admin_audit_log")
          .select("*")
          .order("changed_at", { ascending: false })
          .limit(200);
        if (error) throw error;
        setRows((data ?? []) as unknown as AuditRow[]);
      } catch (e: unknown) {
        toast({ title: "Erro ao carregar auditoria", description: (e as Error).message, variant: "destructive" });
      } finally {
        setLoading(false);
      }
    })();
  }, [isAdmin]);

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
          HISTÓRICO DE ALTERAÇÕES (PLANOS, CÂMERAS E DEMAIS RECURSOS) — ÚLTIMOS 200 EVENTOS
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
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  <Loader2 className="h-5 w-5 animate-spin inline" />
                </TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  Nenhum evento registrado ainda.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => {
                const meta = ENTITY_META[row.entity_type] ?? { label: row.entity_type.toUpperCase(), Icon: History };
                const action = ACTION_META[row.action] ?? { label: row.action.toUpperCase(), variant: "outline" as const };
                const ActionIcon = action.Icon;
                const EntityIcon = meta.Icon;
                const showSwap = row.entity_type === "plan" && row.action === "highlighted" && row.previous_highlighted_plan_name;
                const targetName = row.entity_name ?? row.plan_name ?? "—";
                return (
                  <TableRow key={row.id}>
                    <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                      {formatDate(row.changed_at)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="gap-1 font-mono text-[10px]">
                        <EntityIcon className="h-3 w-3" />
                        {meta.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={action.variant} className={`gap-1 ${action.className ?? ""}`}>
                        {ActionIcon ? <ActionIcon className="h-3 w-3" /> : null}
                        {action.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm">
                        {showSwap ? (
                          <>
                            <span className="text-muted-foreground line-through truncate max-w-[140px]">
                              {row.previous_highlighted_plan_name}
                            </span>
                            <ArrowRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          </>
                        ) : null}
                        <span className="font-medium text-foreground truncate max-w-[200px]">{targetName}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      <span className="font-mono text-xs text-muted-foreground truncate max-w-[240px] block">
                        {row.changed_by_email ?? row.changed_by}
                      </span>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
