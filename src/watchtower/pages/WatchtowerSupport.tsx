import { HelpCircle, Mail, MessageSquare } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function WatchtowerSupport() {
  return (
    <div className="space-y-6">
      <div><h2 className="text-2xl font-bold text-foreground">Suporte</h2><p className="text-sm text-muted-foreground mt-1">Precisa de ajuda? Entre em contato conosco.</p></div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl">
        <Card className="border-border bg-card"><CardHeader><CardTitle className="flex items-center gap-2 text-foreground text-base"><Mail className="h-5 w-5 text-primary" />E-mail</CardTitle></CardHeader><CardContent><p className="text-sm text-muted-foreground mb-4">Envie um e-mail e responderemos em até 24h.</p><Button variant="outline" size="sm" asChild><a href="mailto:suporte@cammonitor.com">Enviar E-mail</a></Button></CardContent></Card>
        <Card className="border-border bg-card"><CardHeader><CardTitle className="flex items-center gap-2 text-foreground text-base"><MessageSquare className="h-5 w-5 text-primary" />WhatsApp</CardTitle></CardHeader><CardContent><p className="text-sm text-muted-foreground mb-4">Fale conosco pelo WhatsApp para suporte rápido.</p><Button variant="outline" size="sm" asChild><a href="https://wa.me/5511945598960" target="_blank" rel="noopener noreferrer">Abrir WhatsApp</a></Button></CardContent></Card>
      </div>
    </div>
  );
}
