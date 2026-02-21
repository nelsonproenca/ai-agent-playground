import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  ArrowLeft, Users, Clock, DollarSign, Search,
  Phone, Mail, ExternalLink, Loader2, CalendarDays,
  CheckCircle2, AlertCircle, Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

const statusConfig: Record<string, { label: string; color: string }> = {
  pendente: { label: "Pendente", color: "bg-amber-500/20 text-amber-400 border-amber-500/30" },
  confirmado: { label: "Confirmado", color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" },
  concluido: { label: "Concluído", color: "bg-sky-500/20 text-sky-400 border-sky-500/30" },
  cancelado: { label: "Cancelado", color: "bg-red-500/20 text-red-400 border-red-500/30" },
};

const formatDate = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }) +
    ", " + d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
};

const formatCurrency = (v: number | null) =>
  v != null ? v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) : "—";

const cleanPhone = (p: string | null) => p?.replace(/\D/g, "") ?? "";

const DashboardAgendamentos = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [filterIndicador, setFilterIndicador] = useState("all");
  const [filterOrigem, setFilterOrigem] = useState("all");

  const { data: agendamentos = [], isLoading } = useQuery({
    queryKey: ["agendamentos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("agendamentos")
        .select("*")
        .order("data_reuniao", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("agendamentos").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agendamentos"] });
      toast.success("Status atualizado!");
    },
    onError: () => toast.error("Erro ao atualizar status"),
  });

  const toggleComissao = useMutation({
    mutationFn: async ({ id, paid }: { id: string; paid: boolean }) => {
      const { error } = await supabase.from("agendamentos").update({ comissao_paga: paid }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agendamentos"] });
      toast.success("Comissão atualizada!");
    },
    onError: () => toast.error("Erro ao atualizar comissão"),
  });

  const indicadores = useMemo(
    () => [...new Set(agendamentos.map((a) => a.indicado_por).filter(Boolean))] as string[],
    [agendamentos]
  );

  const origens = useMemo(
    () => [...new Set(agendamentos.map((a) => a.origem).filter(Boolean))] as string[],
    [agendamentos]
  );

  const filtered = useMemo(() => {
    return agendamentos.filter((a) => {
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        a.cliente_nome?.toLowerCase().includes(q) ||
        a.cliente_email?.toLowerCase().includes(q);
      const matchIndicador = filterIndicador === "all" || a.indicado_por === filterIndicador;
      const matchOrigem = filterOrigem === "all" || a.origem === filterOrigem;
      return matchSearch && matchIndicador && matchOrigem;
    });
  }, [agendamentos, search, filterIndicador, filterOrigem]);

  const totalLeads = agendamentos.length;
  const pendentes = agendamentos.filter((a) => a.status === "pendente").length;
  const pipeline = agendamentos.reduce((s, a) => s + (a.valor_projeto ?? 0), 0);

  return (
    <div className="min-h-screen bg-background grid-pattern">
      {/* Header */}
      <header className="border-b border-border">
        <div className="container max-w-7xl py-4 px-4 flex items-center justify-between">
          <h1 className="font-mono font-bold text-foreground text-lg">
            Dashboard <span className="text-primary">Agendamentos</span>
          </h1>
          <Button asChild variant="outline" size="sm" className="font-mono gap-2">
            <Link to="/admin">
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Link>
          </Button>
        </div>
      </header>

      <main className="container max-w-7xl py-6 px-4 space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <KpiCard icon={Users} label="Total de Leads" value={totalLeads} loading={isLoading} />
          <KpiCard icon={Clock} label="Reuniões Pendentes" value={pendentes} loading={isLoading} accent />
          <KpiCard icon={DollarSign} label="Valor em Pipeline" value={formatCurrency(pipeline)} loading={isLoading} />
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou e-mail..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 font-mono text-sm"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground hidden sm:block" />
            <Select value={filterIndicador} onValueChange={setFilterIndicador}>
              <SelectTrigger className="w-[180px] font-mono text-xs">
                <SelectValue placeholder="Colaborador" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos Colaboradores</SelectItem>
                {indicadores.map((i) => (
                  <SelectItem key={i} value={i}>{i}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterOrigem} onValueChange={setFilterOrigem}>
              <SelectTrigger className="w-[160px] font-mono text-xs">
                <SelectValue placeholder="Origem" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas Origens</SelectItem>
                {origens.map((o) => (
                  <SelectItem key={o} value={o}>{o}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Table */}
        <Card className="border border-border bg-card overflow-hidden">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <Loader2 className="h-7 w-7 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground font-mono">Carregando agendamentos…</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 gap-2">
                <AlertCircle className="h-6 w-6 text-muted-foreground" />
                <p className="text-sm text-muted-foreground font-mono">Nenhum agendamento encontrado.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-secondary/50">
                      <TableHead className="font-mono text-xs font-bold whitespace-nowrap">Data/Hora</TableHead>
                      <TableHead className="font-mono text-xs font-bold">Cliente</TableHead>
                      <TableHead className="font-mono text-xs font-bold">WhatsApp</TableHead>
                      <TableHead className="font-mono text-xs font-bold">Origem</TableHead>
                      <TableHead className="font-mono text-xs font-bold">Colaborador</TableHead>
                      <TableHead className="font-mono text-xs font-bold">Status</TableHead>
                      <TableHead className="font-mono text-xs font-bold text-right">Financeiro</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((a) => {
                      const st = statusConfig[a.status ?? "pendente"] ?? statusConfig.pendente;
                      return (
                        <TableRow key={a.id} className="hover:bg-muted/30 transition-colors">
                          {/* Date */}
                          <TableCell className="font-mono text-xs whitespace-nowrap">
                            {formatDate(a.data_reuniao)}
                          </TableCell>

                          {/* Client */}
                          <TableCell>
                            <div className="space-y-0.5">
                              <p className="font-medium text-sm">{a.cliente_nome ?? "—"}</p>
                              {a.cliente_email && (
                                <a
                                  href={`mailto:${a.cliente_email}`}
                                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                                >
                                  <Mail className="h-3 w-3" />
                                  {a.cliente_email}
                                </a>
                              )}
                            </div>
                          </TableCell>

                          {/* WhatsApp */}
                          <TableCell>
                            {a.cliente_whatsapp ? (
                              <a
                                href={`https://wa.me/${cleanPhone(a.cliente_whatsapp)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors"
                              >
                                <Phone className="h-3.5 w-3.5" />
                                WhatsApp
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            ) : (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                          </TableCell>

                          {/* Origem */}
                          <TableCell>
                            <Badge variant="outline" className="font-mono text-[10px]">
                              {a.origem ?? "—"}
                            </Badge>
                          </TableCell>

                          {/* Colaborador */}
                          <TableCell>
                            <Badge
                              variant="secondary"
                              className="font-mono text-[10px]"
                            >
                              {a.indicado_por ?? "—"}
                            </Badge>
                          </TableCell>

                          {/* Status */}
                          <TableCell>
                            <Select
                              value={a.status ?? "pendente"}
                              onValueChange={(v) => updateStatus.mutate({ id: a.id, status: v })}
                            >
                              <SelectTrigger className={`h-7 w-[120px] text-[11px] font-semibold border ${st.color}`}>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {Object.entries(statusConfig).map(([key, cfg]) => (
                                  <SelectItem key={key} value={key} className="text-xs">
                                    {cfg.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>

                          {/* Financial */}
                          <TableCell className="text-right">
                            <div className="flex flex-col items-end gap-1">
                              <span className="font-mono text-sm font-semibold text-primary">
                                {formatCurrency(a.valor_projeto)}
                              </span>
                              <div className="flex items-center gap-1.5">
                                <Checkbox
                                  checked={a.comissao_paga ?? false}
                                  onCheckedChange={(checked) =>
                                    toggleComissao.mutate({ id: a.id, paid: !!checked })
                                  }
                                  className="h-3.5 w-3.5"
                                />
                                <span className="text-[10px] text-muted-foreground">
                                  {a.comissao_paga ? "Paga" : "Pendente"}
                                </span>
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

const KpiCard = ({
  icon: Icon,
  label,
  value,
  loading,
  accent,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  loading: boolean;
  accent?: boolean;
}) => (
  <Card
    className={`border bg-card ${accent ? "border-amber-500/40" : "border-border"}`}
  >
    <CardContent className="p-5 flex items-center gap-4">
      <div
        className={`w-11 h-11 rounded-lg flex items-center justify-center shrink-0 ${accent ? "bg-amber-500/10" : "bg-primary/10"}`}
      >
        <Icon className={`h-5 w-5 ${accent ? "text-amber-400" : "text-primary"}`} />
      </div>
      <div>
        <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider">{label}</p>
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin mt-1 text-muted-foreground" />
        ) : (
          <p className="text-xl font-bold font-mono mt-0.5 text-foreground">
            {value}
          </p>
        )}
      </div>
    </CardContent>
  </Card>
);

export default DashboardAgendamentos;
