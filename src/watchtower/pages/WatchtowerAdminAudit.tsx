import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useIsAdmin } from "@/watchtower/hooks/useIsAdmin";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, Star, History, ArrowRight } from "lucide-react";
import { toast } from "@/hooks/use-toast";

type AuditRow = {
  id: string;
  plan_id: string;
  plan_name: string;
  previous_highlighted_plan_id: string | null;
  previous_highlighted_plan_name: string | null;
  action: "highlighted" | "unhighlighted";
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
          .from("plan_highlight_audit")
          .select("*")
          .order("changed_at", { ascending: false })
          .limit(200);
        if (error) throw error;
        setRows((data ?? []) as AuditRow[]);
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
          AUDITORIA DE DESTAQUES
        </h2>
        <p className="text-xs tracking-[0.15em] text-muted-foreground mt-2">
          HISTÓRICO DE ALTERAÇÕES DE PLANOS EM DESTAQUE — ÚLTIMOS 200 EVENTOS
        </p>
      </div>

      <div className="rounded-lg border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data / Hora</TableHead>
              <TableHead>Ação</TableHead>
              <TableHead>Alteração</TableHead>
              <TableHead>Administrador</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                  <Loader2 className="h-5 w-5 animate-spin inline" />
                </TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                  Nenhuma alteração de destaque registrada ainda.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                    {formatDate(row.changed_at)}
                  </TableCell>
                  <TableCell>
                    {row.action === "highlighted" ? (
                      <Badge className="bg-highlight text-highlight-foreground hover:bg-highlight gap-1">
                        <Star className="h-3 w-3 fill-current" />
                        DESTACADO
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="gap-1">
                        DESTAQUE REMOVIDO
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-sm">
                      {row.previous_highlighted_plan_name ? (
                        <>
                          <span className="text-muted-foreground line-through truncate max-w-[140px]">
                            {row.previous_highlighted_plan_name}
                          </span>
                          <ArrowRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        </>
                      ) : null}
                      <span className="font-medium text-highlight truncate max-w-[180px]">{row.plan_name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">
                    <span className="font-mono text-xs text-muted-foreground truncate max-w-[240px] block">
                      {row.changed_by_email ?? row.changed_by}
                    </span>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
