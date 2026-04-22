import { useState, useEffect } from "react";
import { healthCheckService } from "@/watchtower/services/healthCheckService";
import type { HealthConfigDto, HealthLogDto } from "@/watchtower/types/api";
import { useBackendStatus } from "@/watchtower/hooks/useBackendStatus";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  Activity,
  Wifi,
  WifiOff,
  RefreshCw,
  Settings,
  Bell,
  Clock,
  Server,
  Loader2,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function WatchtowerHealthCheck() {
  const [logs, setLogs] = useState<HealthLogDto[]>([]);
  const [config, setConfig] = useState<HealthConfigDto | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const { toast } = useToast();
  const backend = useBackendStatus(60_000);

  const [formWebhook, setFormWebhook] = useState("");
  const [formInterval, setFormInterval] = useState(5);
  const [formFailures, setFormFailures] = useState(3);

  const fetchData = async () => {
    try {
      const [logsData, configData] = await Promise.all([
        healthCheckService.getLogs({ limit: 200 }).catch(() => [] as HealthLogDto[]),
        healthCheckService.getConfig().catch(() => null),
      ]);
      setLogs(logsData);
      if (configData) {
        setConfig(configData);
        setFormWebhook(configData.n8nWebhookUrl ?? "");
        setFormInterval(configData.checkIntervalMinutes);
        setFormFailures(configData.notifyAfterFailures);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchData();
  }, []);

  const runHealthCheck = async () => {
    setChecking(true);
    try {
      await healthCheckService.run();
      toast({ title: "Health check executado", description: "Resultados atualizados." });
      await fetchData();
    } catch {
      toast({ title: "Erro", description: "Falha ao executar health check.", variant: "destructive" });
    } finally {
      setChecking(false);
    }
  };

  const saveConfig = async () => {
    try {
      await healthCheckService.updateConfig({
        n8nWebhookUrl: formWebhook || null,
        checkIntervalMinutes: formInterval,
        notifyAfterFailures: formFailures,
      });
      toast({ title: "Configurações salvas" });
      setShowSettings(false);
      fetchData();
    } catch {
      toast({ title: "Erro ao salvar", variant: "destructive" });
    }
  };

  // Build latest-per-camera map
  const latestByCamera = logs.reduce<Record<string, HealthLogDto>>((acc, log) => {
    if (!acc[log.cameraId]) acc[log.cameraId] = log;
    return acc;
  }, {});

  const cameraIds = Object.keys(latestByCamera);
  const onlineCount = cameraIds.filter((id) => latestByCamera[id].status === "Online").length;
  const offlineCount = cameraIds.filter((id) => latestByCamera[id].status === "Offline").length;
  const unknownCount = cameraIds.filter((id) => latestByCamera[id].status === "Unknown").length;

  const getConsecutiveFailures = (cameraId: string): number => {
    let count = 0;
    for (const log of logs.filter((l) => l.cameraId === cameraId)) {
      if (log.status === "Offline") count++;
      else break;
    }
    return count;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-3xl font-bold text-foreground tracking-wider">HEALTH CHECK</h2>
          <p className="text-xs tracking-[0.15em] text-muted-foreground mt-2">MONITORAMENTO DE STATUS DAS CÂMERAS E BACKEND</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowSettings(!showSettings)} className="text-xs tracking-wider">
            <Settings className="h-4 w-4 mr-1" />CONFIGURAR
          </Button>
          <Button size="sm" onClick={runHealthCheck} disabled={checking} className="text-xs tracking-wider">
            <RefreshCw className={`h-4 w-4 mr-1 ${checking ? "animate-spin" : ""}`} />
            {checking ? "VERIFICANDO..." : "VERIFICAR AGORA"}
          </Button>
        </div>
      </div>

      {/* Backend status card */}
      <Card
        className={`p-5 border-2 bg-card transition-colors ${
          backend.status === "online"
            ? "border-green-500/40"
            : backend.status === "offline"
              ? "border-destructive/50"
              : "border-border"
        }`}
      >
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-start gap-4 min-w-0 flex-1">
            <div
              className={`shrink-0 p-3 rounded-lg ${
                backend.status === "online"
                  ? "bg-green-500/10 text-green-500"
                  : backend.status === "offline"
                    ? "bg-destructive/10 text-destructive"
                    : "bg-muted text-muted-foreground"
              }`}
            >
              {backend.status === "checking" ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                <Server className="h-6 w-6" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-display text-sm font-semibold tracking-wider text-foreground">
                  BACKEND EXTERNO
                </h3>
                <Badge
                  variant="outline"
                  className={`text-[10px] tracking-wider font-semibold ${
                    backend.status === "online"
                      ? "border-green-500/30 text-green-500"
                      : backend.status === "offline"
                        ? "border-destructive/30 text-destructive"
                        : "border-border text-muted-foreground"
                  }`}
                >
                  {backend.status === "online"
                    ? "ONLINE"
                    : backend.status === "offline"
                      ? "OFFLINE"
                      : "VERIFICANDO..."}
                </Badge>
              </div>
              <p className="text-[11px] text-muted-foreground mt-1 truncate font-mono" title={backend.baseUrl}>
                {backend.baseUrl || "(VITE_API_URL não configurada)"}
              </p>
              <div className="flex items-center gap-4 flex-wrap mt-2 text-[11px]">
                {backend.responseTimeMs != null && (
                  <span className="text-muted-foreground">
                    Latência: <span className="text-foreground font-semibold">{backend.responseTimeMs}ms</span>
                  </span>
                )}
                {backend.lastCheckedAt && (
                  <span className="text-muted-foreground">
                    Última verificação:{" "}
                    <span className="text-foreground">
                      {formatDistanceToNow(backend.lastCheckedAt, { addSuffix: true, locale: ptBR })}
                    </span>
                  </span>
                )}
              </div>
              {backend.status === "offline" && backend.errorMessage && (
                <div className="mt-3 p-2 rounded bg-destructive/10 border border-destructive/20">
                  <p className="text-[11px] text-destructive font-mono break-all">
                    ⚠️ {backend.errorMessage}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    Telas dependentes (cameras, pagamentos, usuários) não funcionarão até o backend voltar.
                  </p>
                </div>
              )}
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => void backend.check()}
            disabled={backend.status === "checking"}
            className="text-xs tracking-wider shrink-0"
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${backend.status === "checking" ? "animate-spin" : ""}`} />
            TESTAR
          </Button>
        </div>
      </Card>

      {/* Settings panel */}
      {showSettings && (
        <Card className="p-6 border-border bg-card">
          <h3 className="font-display text-sm font-semibold tracking-wider mb-4 flex items-center gap-2">
            <Bell className="h-4 w-4" /> CONFIGURAÇÕES DE ALERTA
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Label className="text-xs tracking-wider text-muted-foreground">Webhook n8n (URL)</Label>
              <Input value={formWebhook} onChange={(e) => setFormWebhook(e.target.value)} placeholder="https://n8n.example.com/webhook/..." />
            </div>
            <div>
              <Label className="text-xs tracking-wider text-muted-foreground">Intervalo de verificação (minutos)</Label>
              <Input type="number" min={1} max={60} value={formInterval} onChange={(e) => setFormInterval(parseInt(e.target.value) || 5)} />
            </div>
            <div>
              <Label className="text-xs tracking-wider text-muted-foreground">Notificar após N falhas consecutivas</Label>
              <Input type="number" min={1} max={10} value={formFailures} onChange={(e) => setFormFailures(parseInt(e.target.value) || 3)} />
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <Button size="sm" onClick={saveConfig} className="text-xs tracking-wider">SALVAR</Button>
            <Button size="sm" variant="outline" onClick={() => setShowSettings(false)} className="text-xs tracking-wider">CANCELAR</Button>
          </div>
        </Card>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 border-border bg-card">
          <div className="flex items-center gap-3">
            <Activity className="h-8 w-8 text-primary" />
            <div><p className="text-2xl font-bold text-foreground">{cameraIds.length}</p><p className="text-[10px] tracking-wider text-muted-foreground">TOTAL CÂMERAS</p></div>
          </div>
        </Card>
        <Card className="p-4 border-border bg-card">
          <div className="flex items-center gap-3">
            <Wifi className="h-8 w-8 text-green-500" />
            <div><p className="text-2xl font-bold text-green-500">{onlineCount}</p><p className="text-[10px] tracking-wider text-muted-foreground">ONLINE</p></div>
          </div>
        </Card>
        <Card className="p-4 border-border bg-card">
          <div className="flex items-center gap-3">
            <WifiOff className="h-8 w-8 text-destructive" />
            <div><p className="text-2xl font-bold text-destructive">{offlineCount}</p><p className="text-[10px] tracking-wider text-muted-foreground">OFFLINE</p></div>
          </div>
        </Card>
        <Card className="p-4 border-border bg-card">
          <div className="flex items-center gap-3">
            <Clock className="h-8 w-8 text-muted-foreground" />
            <div><p className="text-2xl font-bold text-muted-foreground">{unknownCount}</p><p className="text-[10px] tracking-wider text-muted-foreground">DESCONHECIDO</p></div>
          </div>
        </Card>
      </div>

      {/* Camera status grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {cameraIds.map((cameraId) => {
          const log = latestByCamera[cameraId];
          const isOnline = log.status === "Online";
          const isOffline = log.status === "Offline";
          const failures = getConsecutiveFailures(cameraId);

          return (
            <Card key={cameraId} className="p-4 border-border bg-card">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-display text-xs font-semibold tracking-wider text-foreground truncate">
                  {log.cameraName.toUpperCase()}
                </h4>
                <Badge variant="outline" className={`text-[10px] tracking-wider font-semibold ${isOnline ? "border-green-500/30 text-green-500" : isOffline ? "border-destructive/30 text-destructive" : "border-border text-muted-foreground"}`}>
                  {log.status.toUpperCase()}
                </Badge>
              </div>
              <div className="space-y-1.5">
                {log.responseTimeMs != null && (
                  <p className="text-[10px] text-muted-foreground">Tempo de resposta: <span className="text-foreground">{log.responseTimeMs}ms</span></p>
                )}
                {isOffline && log.errorMessage && (
                  <p className="text-[10px] text-destructive truncate" title={log.errorMessage}>Erro: {log.errorMessage}</p>
                )}
                {isOffline && failures > 1 && (
                  <p className="text-[10px] text-destructive font-semibold">⚠️ {failures} falhas consecutivas</p>
                )}
                <p className="text-[10px] text-muted-foreground">
                  Última verificação: {formatDistanceToNow(new Date(log.checkedAt), { addSuffix: true, locale: ptBR })}
                </p>
              </div>
            </Card>
          );
        })}
        {cameraIds.length === 0 && (
          <div className="col-span-3 text-center text-muted-foreground py-10">
            Nenhum dado de health check disponível. Clique em "VERIFICAR AGORA".
          </div>
        )}
      </div>

      {/* Recent history */}
      <Card className="border-border bg-card overflow-hidden">
        <div className="p-4 border-b border-border">
          <h3 className="font-display text-sm font-semibold tracking-wider text-foreground">HISTÓRICO RECENTE</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left p-3 tracking-wider text-muted-foreground font-semibold">CÂMERA</th>
                <th className="text-left p-3 tracking-wider text-muted-foreground font-semibold">STATUS</th>
                <th className="text-left p-3 tracking-wider text-muted-foreground font-semibold">TEMPO</th>
                <th className="text-left p-3 tracking-wider text-muted-foreground font-semibold">ERRO</th>
                <th className="text-left p-3 tracking-wider text-muted-foreground font-semibold">DATA</th>
              </tr>
            </thead>
            <tbody>
              {logs.slice(0, 50).map((log) => (
                <tr key={log.id} className="border-b border-border/50 hover:bg-secondary/20">
                  <td className="p-3 text-foreground font-medium">{log.cameraName}</td>
                  <td className="p-3">
                    <Badge variant="outline" className={`text-[9px] ${log.status === "Online" ? "border-green-500/30 text-green-500" : "border-destructive/30 text-destructive"}`}>
                      {log.status.toUpperCase()}
                    </Badge>
                  </td>
                  <td className="p-3 text-muted-foreground">{log.responseTimeMs ?? "-"}ms</td>
                  <td className="p-3 text-destructive truncate max-w-[200px]">{log.errorMessage ?? "-"}</td>
                  <td className="p-3 text-muted-foreground">{format(new Date(log.checkedAt), "dd/MM HH:mm:ss", { locale: ptBR })}</td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr><td colSpan={5} className="p-6 text-center text-muted-foreground">Nenhum log encontrado. Clique em "VERIFICAR AGORA" para iniciar.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
