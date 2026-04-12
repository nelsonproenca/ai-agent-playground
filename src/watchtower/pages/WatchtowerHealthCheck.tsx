import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Activity, Wifi, WifiOff, RefreshCw, Settings, Bell, Clock } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Camera {
  id: string;
  display_name: string;
  internal_stream_key: string;
  location: string | null;
}

interface HealthLog {
  id: string;
  camera_id: string;
  status: string;
  response_time_ms: number | null;
  error_message: string | null;
  checked_at: string;
}

interface HealthConfig {
  id: string;
  admin_email: string | null;
  admin_phone: string | null;
  admin_whatsapp: string | null;
  check_interval_minutes: number;
  notify_after_failures: number;
}

export default function WatchtowerHealthCheck() {
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [latestLogs, setLatestLogs] = useState<Record<string, HealthLog>>({});
  const [historyLogs, setHistoryLogs] = useState<HealthLog[]>([]);
  const [config, setConfig] = useState<HealthConfig | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const { toast } = useToast();

  const [formEmail, setFormEmail] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formWhatsapp, setFormWhatsapp] = useState("");
  const [formFailures, setFormFailures] = useState(2);

  const fetchData = async () => {
    const [camRes, logRes, configRes] = await Promise.all([
      (supabase as any).from("cameras").select("*"),
      (supabase as any)
        .from("camera_health_logs")
        .select("*")
        .order("checked_at", { ascending: false })
        .limit(200),
      (supabase as any).from("camera_health_config").select("*").limit(1),
    ]);

    if (camRes.data) setCameras(camRes.data);
    if (logRes.data) {
      setHistoryLogs(logRes.data);
      const latest: Record<string, HealthLog> = {};
      for (const log of logRes.data) {
        if (!latest[log.camera_id]) {
          latest[log.camera_id] = log;
        }
      }
      setLatestLogs(latest);
    }
    if (configRes.data?.[0]) {
      const c = configRes.data[0];
      setConfig(c);
      setFormEmail(c.admin_email ?? "");
      setFormPhone(c.admin_phone ?? "");
      setFormWhatsapp(c.admin_whatsapp ?? "");
      setFormFailures(c.notify_after_failures);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();

    const channel = supabase
      .channel("health-logs")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "camera_health_logs" },
        () => fetchData()
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const runHealthCheck = async () => {
    setChecking(true);
    try {
      const { error } = await supabase.functions.invoke("camera-health-check");
      if (error) throw error;
      toast({ title: "Health check executado", description: "Resultados atualizados." });
      await fetchData();
    } catch (e) {
      toast({ title: "Erro", description: "Falha ao executar health check.", variant: "destructive" });
    } finally {
      setChecking(false);
    }
  };

  const saveConfig = async () => {
    if (!config) return;
    const { error } = await (supabase as any)
      .from("camera_health_config")
      .update({
        admin_email: formEmail || null,
        admin_phone: formPhone || null,
        admin_whatsapp: formWhatsapp || null,
        notify_after_failures: formFailures,
      })
      .eq("id", config.id);

    if (error) {
      toast({ title: "Erro ao salvar", variant: "destructive" });
    } else {
      toast({ title: "Configurações salvas" });
      setShowSettings(false);
      fetchData();
    }
  };

  const onlineCount = cameras.filter((c) => latestLogs[c.id]?.status === "online").length;
  const offlineCount = cameras.filter((c) => latestLogs[c.id]?.status === "offline").length;
  const unknownCount = cameras.filter((c) => !latestLogs[c.id]).length;

  const getConsecutiveFailures = (cameraId: string): number => {
    const logs = historyLogs.filter((l) => l.camera_id === cameraId);
    let count = 0;
    for (const log of logs) {
      if (log.status === "offline") count++;
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
          <p className="text-xs tracking-[0.15em] text-muted-foreground mt-2">MONITORAMENTO DE STATUS DAS CÂMERAS</p>
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

      {/* Settings panel */}
      {showSettings && (
        <Card className="p-6 border-border bg-card">
          <h3 className="font-display text-sm font-semibold tracking-wider mb-4 flex items-center gap-2">
            <Bell className="h-4 w-4" /> CONFIGURAÇÕES DE ALERTA
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs tracking-wider text-muted-foreground">E-mail do Admin</Label>
              <Input value={formEmail} onChange={(e) => setFormEmail(e.target.value)} placeholder="admin@email.com" />
            </div>
            <div>
              <Label className="text-xs tracking-wider text-muted-foreground">Telefone (SMS)</Label>
              <Input value={formPhone} onChange={(e) => setFormPhone(e.target.value)} placeholder="+5511999999999" />
            </div>
            <div>
              <Label className="text-xs tracking-wider text-muted-foreground">WhatsApp</Label>
              <Input value={formWhatsapp} onChange={(e) => setFormWhatsapp(e.target.value)} placeholder="5511999999999" />
            </div>
            <div>
              <Label className="text-xs tracking-wider text-muted-foreground">Notificar após N falhas consecutivas</Label>
              <Input type="number" min={1} max={10} value={formFailures} onChange={(e) => setFormFailures(parseInt(e.target.value) || 2)} />
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <Button size="sm" onClick={saveConfig} className="text-xs tracking-wider">SALVAR</Button>
            <Button size="sm" variant="outline" onClick={() => setShowSettings(false)} className="text-xs tracking-wider">CANCELAR</Button>
          </div>
          <p className="text-[10px] text-muted-foreground mt-3">SMS e WhatsApp automáticos requerem configuração do Twilio.</p>
        </Card>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 border-border bg-card">
          <div className="flex items-center gap-3">
            <Activity className="h-8 w-8 text-primary" />
            <div><p className="text-2xl font-bold text-foreground">{cameras.length}</p><p className="text-[10px] tracking-wider text-muted-foreground">TOTAL CÂMERAS</p></div>
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
            <div><p className="text-2xl font-bold text-muted-foreground">{unknownCount}</p><p className="text-[10px] tracking-wider text-muted-foreground">SEM DADOS</p></div>
          </div>
        </Card>
      </div>

      {/* Camera status grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {cameras.map((camera) => {
          const log = latestLogs[camera.id];
          const isOnline = log?.status === "online";
          const isOffline = log?.status === "offline";
          const failures = getConsecutiveFailures(camera.id);

          return (
            <Card key={camera.id} className="p-4 border-border bg-card">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-display text-xs font-semibold tracking-wider text-foreground truncate">{camera.display_name.toUpperCase()}</h4>
                {log ? (
                  <Badge variant="outline" className={`text-[10px] tracking-wider font-semibold ${isOnline ? "border-green-500/30 text-green-500" : "border-destructive/30 text-destructive"}`}>
                    {isOnline ? "ONLINE" : "OFFLINE"}
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-[10px] tracking-wider font-semibold border-border text-muted-foreground">SEM DADOS</Badge>
                )}
              </div>
              {log && (
                <div className="space-y-1.5">
                  {log.response_time_ms != null && (
                    <p className="text-[10px] text-muted-foreground">Tempo de resposta: <span className="text-foreground">{log.response_time_ms}ms</span></p>
                  )}
                  {isOffline && log.error_message && (
                    <p className="text-[10px] text-destructive truncate" title={log.error_message}>Erro: {log.error_message}</p>
                  )}
                  {isOffline && failures > 1 && (
                    <p className="text-[10px] text-destructive font-semibold">⚠️ {failures} falhas consecutivas</p>
                  )}
                  <p className="text-[10px] text-muted-foreground">
                    Última verificação: {formatDistanceToNow(new Date(log.checked_at), { addSuffix: true, locale: ptBR })}
                  </p>
                </div>
              )}
            </Card>
          );
        })}
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
              {historyLogs.slice(0, 50).map((log) => {
                const cam = cameras.find((c) => c.id === log.camera_id);
                return (
                  <tr key={log.id} className="border-b border-border/50 hover:bg-secondary/20">
                    <td className="p-3 text-foreground font-medium">{cam?.display_name ?? "?"}</td>
                    <td className="p-3">
                      <Badge variant="outline" className={`text-[9px] ${log.status === "online" ? "border-green-500/30 text-green-500" : "border-destructive/30 text-destructive"}`}>
                        {log.status.toUpperCase()}
                      </Badge>
                    </td>
                    <td className="p-3 text-muted-foreground">{log.response_time_ms ?? "-"}ms</td>
                    <td className="p-3 text-destructive truncate max-w-[200px]">{log.error_message ?? "-"}</td>
                    <td className="p-3 text-muted-foreground">{format(new Date(log.checked_at), "dd/MM HH:mm:ss", { locale: ptBR })}</td>
                  </tr>
                );
              })}
              {historyLogs.length === 0 && (
                <tr><td colSpan={5} className="p-6 text-center text-muted-foreground">Nenhum log encontrado. Clique em "VERIFICAR AGORA" para iniciar.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
