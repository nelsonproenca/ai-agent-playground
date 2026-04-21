import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useWatchtowerAuth } from "@/watchtower/contexts/WatchtowerAuthContext";
import { userService } from "@/watchtower/services";

export default function WatchtowerSettings() {
  const { user } = useWatchtowerAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [displayName, setDisplayName] = useState("");

  const { data: notifPrefs, isLoading: notifLoading } = useQuery({
    queryKey: ["watchtower-notifications"],
    queryFn: () => userService.getNotifications(),
    enabled: !!user,
  });

  const updateProfileMutation = useMutation({
    mutationFn: () => userService.updateProfile(displayName),
    onSuccess: () => toast({ title: "Perfil atualizado!" }),
    onError: () => toast({ title: "Erro ao salvar", variant: "destructive" }),
  });

  const updateNotifMutation = useMutation({
    mutationFn: (prefs: typeof notifPrefs) =>
      userService.updateNotifications(prefs!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["watchtower-notifications"] });
      toast({ title: "Preferências salvas!" });
    },
    onError: () => toast({ title: "Erro ao salvar", variant: "destructive" }),
  });

  function handleNotifChange(
    field: keyof NonNullable<typeof notifPrefs>,
    value: boolean,
  ) {
    if (!notifPrefs) return;
    updateNotifMutation.mutate({ ...notifPrefs, [field]: value });
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="font-display text-3xl font-bold text-foreground tracking-wider">CONFIGURAÇÕES</h2>
        <p className="text-xs tracking-[0.15em] text-muted-foreground mt-2">GERENCIE SUAS PREFERÊNCIAS E INFORMAÇÕES DA CONTA</p>
      </div>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="font-display text-lg tracking-wider">INFORMAÇÕES DO PERFIL</CardTitle>
          <CardDescription>Atualize suas informações pessoais</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="wt-s-email">Email</Label>
            <Input
              id="wt-s-email"
              type="email"
              value={user?.email ?? ""}
              disabled
              className="bg-muted"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="wt-s-name">Nome</Label>
            <Input
              id="wt-s-name"
              placeholder="Seu nome completo"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
          </div>
          <Button
            className="bg-primary hover:bg-primary/90"
            disabled={!displayName.trim() || updateProfileMutation.isPending}
            onClick={() => updateProfileMutation.mutate()}
          >
            {updateProfileMutation.isPending ? "Salvando..." : "Salvar Alterações"}
          </Button>
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="font-display text-lg tracking-wider">NOTIFICAÇÕES</CardTitle>
          <CardDescription>Configure como você deseja receber notificações</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Alertas de Movimento</Label>
              <p className="text-sm text-muted-foreground">
                Receba alertas quando movimento for detectado
              </p>
            </div>
            <Switch
              disabled={notifLoading || updateNotifMutation.isPending}
              checked={notifPrefs?.movementAlerts ?? true}
              onCheckedChange={(v) => handleNotifChange("movementAlerts", v)}
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Relatórios Semanais</Label>
              <p className="text-sm text-muted-foreground">
                Receba um resumo semanal por email
              </p>
            </div>
            <Switch
              disabled={notifLoading || updateNotifMutation.isPending}
              checked={notifPrefs?.weeklyEmailReports ?? false}
              onCheckedChange={(v) => handleNotifChange("weeklyEmailReports", v)}
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Avisos de Manutenção</Label>
              <p className="text-sm text-muted-foreground">
                Notificações sobre manutenção programada
              </p>
            </div>
            <Switch
              disabled={notifLoading || updateNotifMutation.isPending}
              checked={notifPrefs?.maintenanceNotices ?? true}
              onCheckedChange={(v) => handleNotifChange("maintenanceNotices", v)}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="font-display text-lg tracking-wider">SEGURANÇA</CardTitle>
          <CardDescription>Gerencie a segurança da sua conta</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="wt-cp">Senha Atual</Label>
            <Input id="wt-cp" type="password" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="wt-np">Nova Senha</Label>
            <Input id="wt-np" type="password" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="wt-cnp">Confirmar Nova Senha</Label>
            <Input id="wt-cnp" type="password" />
          </div>
          <Button className="bg-primary hover:bg-primary/90">Alterar Senha</Button>
        </CardContent>
      </Card>
    </div>
  );
}
