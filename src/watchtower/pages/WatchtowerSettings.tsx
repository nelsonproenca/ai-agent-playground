import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useWatchtowerAuth } from "@/watchtower/contexts/WatchtowerAuthContext";

export default function WatchtowerSettings() {
  const { user } = useWatchtowerAuth();

  return (
    <div className="space-y-6 max-w-4xl">
      <div><h1 className="text-3xl font-bold text-foreground mb-2">Configurações</h1><p className="text-muted-foreground">Gerencie suas preferências e informações da conta</p></div>
      <Card className="bg-card border-border"><CardHeader><CardTitle>Informações do Perfil</CardTitle><CardDescription>Atualize suas informações pessoais</CardDescription></CardHeader><CardContent className="space-y-4"><div className="space-y-2"><Label htmlFor="wt-s-email">Email</Label><Input id="wt-s-email" type="email" value={user?.email || ""} disabled className="bg-muted" /></div><div className="space-y-2"><Label htmlFor="wt-s-name">Nome</Label><Input id="wt-s-name" placeholder="Seu nome completo" /></div><Button className="bg-primary hover:bg-primary/90">Salvar Alterações</Button></CardContent></Card>
      <Card className="bg-card border-border"><CardHeader><CardTitle>Notificações</CardTitle><CardDescription>Configure como você deseja receber notificações</CardDescription></CardHeader><CardContent className="space-y-4"><div className="flex items-center justify-between"><div className="space-y-0.5"><Label>Alertas de Movimento</Label><p className="text-sm text-muted-foreground">Receba alertas quando movimento for detectado</p></div><Switch /></div><div className="flex items-center justify-between"><div className="space-y-0.5"><Label>Relatórios Semanais</Label><p className="text-sm text-muted-foreground">Receba um resumo semanal por email</p></div><Switch /></div><div className="flex items-center justify-between"><div className="space-y-0.5"><Label>Avisos de Manutenção</Label><p className="text-sm text-muted-foreground">Notificações sobre manutenção programada</p></div><Switch defaultChecked /></div></CardContent></Card>
      <Card className="bg-card border-border"><CardHeader><CardTitle>Segurança</CardTitle><CardDescription>Gerencie a segurança da sua conta</CardDescription></CardHeader><CardContent className="space-y-4"><div className="space-y-2"><Label htmlFor="wt-cp">Senha Atual</Label><Input id="wt-cp" type="password" /></div><div className="space-y-2"><Label htmlFor="wt-np">Nova Senha</Label><Input id="wt-np" type="password" /></div><div className="space-y-2"><Label htmlFor="wt-cnp">Confirmar Nova Senha</Label><Input id="wt-cnp" type="password" /></div><Button className="bg-primary hover:bg-primary/90">Alterar Senha</Button></CardContent></Card>
    </div>
  );
}
