import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useIsAdmin } from "@/watchtower/hooks/useIsAdmin";
import { adminService } from "@/watchtower/services/adminService";
import type { AdminCameraDto } from "@/watchtower/types/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Download, Loader2, RefreshCw, Radio } from "lucide-react";

interface BridgeGroup {
  ownerUserId: string;
  cameras: AdminCameraDto[];
}

export default function WatchtowerAdminBridges() {
  const { isAdmin, loading: roleLoading } = useIsAdmin();
  const navigate = useNavigate();

  const [groups, setGroups] = useState<BridgeGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  useEffect(() => {
    if (!roleLoading && !isAdmin) navigate("/watchtower/dashboard", { replace: true });
  }, [isAdmin, roleLoading, navigate]);

  const loadData = async () => {
    setLoading(true);
    try {
      const cameras = await adminService.getCameras();
      const bridgeCams = cameras.filter(
        (c) => c.protocol === "Bridge" && c.bridgeSourceUrl,
      );

      const map = new Map<string, AdminCameraDto[]>();
      for (const cam of bridgeCams) {
        const key = cam.ownerUserId ?? "__unassigned__";
        const list = map.get(key) ?? [];
        list.push(cam);
        map.set(key, list);
      }

      setGroups(
        Array.from(map.entries()).map(([ownerUserId, cams]) => ({
          ownerUserId,
          cameras: cams,
        })),
      );
    } catch (e: unknown) {
      toast.error("Erro ao carregar câmeras: " + (e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) loadData();
  }, [isAdmin]);

  const handleDownload = async (userId: string) => {
    setDownloadingId(userId);
    try {
      await adminService.downloadBridgeConfig(userId === "__unassigned__" ? null : userId);
      toast.success("Pacote baixado com sucesso.");
    } catch (e: unknown) {
      toast.error("Erro ao gerar pacote: " + (e as Error).message);
    } finally {
      setDownloadingId(null);
    }
  };

  if (roleLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Bridge Config</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Gere e baixe o pacote de configuração do bridge local para cada cliente.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={loadData} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Atualizar
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : groups.length === 0 ? (
        <Card className="p-10 text-center">
          <Radio className="h-10 w-10 mx-auto mb-3 text-muted-foreground/40" />
          <p className="text-muted-foreground">Nenhuma câmera com protocolo Bridge encontrada.</p>
          <p className="text-xs text-muted-foreground/60 mt-1">
            Cadastre câmeras com protocolo Bridge no painel de Câmeras.
          </p>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuário (ID)</TableHead>
                <TableHead>Câmeras</TableHead>
                <TableHead>Fontes configuradas</TableHead>
                <TableHead className="text-right">Ação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {groups.map(({ ownerUserId, cameras }) => (
                <TableRow key={ownerUserId}>
                  <TableCell className="font-mono text-xs">
                    {ownerUserId === "__unassigned__" ? (
                      <span className="text-muted-foreground italic">Sem dono</span>
                    ) : (
                      <span title={ownerUserId}>
                        {ownerUserId.slice(0, 8)}…{ownerUserId.slice(-4)}
                      </span>
                    )}
                  </TableCell>

                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {cameras.map((c) => (
                        <Badge key={c.id} variant="secondary" className="text-xs">
                          {c.name}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>

                  <TableCell className="text-xs text-muted-foreground max-w-xs">
                    <div className="space-y-0.5">
                      {cameras.map((c) => (
                        <div key={c.id} className="truncate" title={c.bridgeSourceUrl ?? ""}>
                          <span className="font-medium text-foreground">{c.slug}:</span>{" "}
                          {c.bridgeSourceUrl}
                        </div>
                      ))}
                    </div>
                  </TableCell>

                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDownload(ownerUserId)}
                      disabled={downloadingId === ownerUserId}
                    >
                      {downloadingId === ownerUserId ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Download className="h-4 w-4 mr-2" />
                      )}
                      Baixar Config
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      <Card className="p-4 bg-muted/40">
        <p className="text-xs text-muted-foreground">
          <strong>Como funciona:</strong> O pacote ZIP contém o arquivo{" "}
          <code className="bg-muted px-1 rounded">go2rtc.yaml</code> com as fontes de câmera do
          cliente, além dos scripts <code className="bg-muted px-1 rounded">start.sh</code> (Linux)
          e <code className="bg-muted px-1 rounded">start.bat</code> (Windows) que iniciam o bridge
          e enviam o stream ao servidor. Instale o go2rtc e o ffmpeg no computador do cliente e
          execute o script correspondente ao sistema operacional.
        </p>
      </Card>
    </div>
  );
}
