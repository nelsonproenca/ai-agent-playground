import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useWatchtowerAuth } from "@/watchtower/contexts/WatchtowerAuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Clock, Tv, Calendar, Crown, AlertTriangle, ArrowLeft, Copy, Check, Upload, MessageCircle } from "lucide-react";

interface PlanModalProps {
  open: boolean;
  onClose: () => void;
  cameraId: string;
  cameraName: string;
}

const PIX_KEY = "cbb2211c-e521-4d35-8f0a-46a08472cc9b";
const WHATSAPP_NUMBER = "5511945598960";

const plans = [
  { id: "24h", sku: "PLAN_24H", name: "Acesso Pontual (24h)", price: "R$ 9,90", priceRaw: "9,90", period: "", description: "Liberação imediata para visualização por 24 horas.", icon: Clock, highlight: false },
  { id: "bronze", sku: "PLAN_BRONZE", name: "Plano Bronze", price: "R$ 29,90", priceRaw: "29,90", period: "/mês", description: "Foco em tempo real. Apenas visualização ao vivo.", icon: Tv, highlight: false },
  { id: "prata", sku: "PLAN_PRATA", name: "Plano Prata", price: "R$ 59,90", priceRaw: "59,90", period: "/mês", description: "Inclui histórico de gravações de 7 dias.", icon: Calendar, highlight: true },
  { id: "ouro", sku: "PLAN_OURO", name: "Plano Ouro", price: "R$ 99,90", priceRaw: "99,90", period: "/mês", description: "Histórico completo de 30 dias + Downloads.", icon: Crown, highlight: false },
];

type SelectedPlan = typeof plans[number] | null;
type Step = "select" | "pix" | "confirmed";

export function WatchtowerPlanModal({ open, onClose, cameraId, cameraName }: PlanModalProps) {
  const { user } = useWatchtowerAuth();
  const { toast } = useToast();
  const [step, setStep] = useState<Step>("select");
  const [selectedPlan, setSelectedPlan] = useState<SelectedPlan>(null);
  const [copied, setCopied] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSelectPlan = (plan: typeof plans[number]) => {
    setSelectedPlan(plan);
    setStep("pix");
  };

  const handleCopyPix = async () => {
    await navigator.clipboard.writeText(PIX_KEY);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleConfirmPayment = async () => {
    if (!user || !selectedPlan) return;
    setSubmitting(true);
    const { error } = await (supabase as any).from("pending_payments").insert({
      user_id: user.id,
      camera_id: cameraId,
      plan_sku: selectedPlan.sku,
      plan_name: selectedPlan.name,
    });
    setSubmitting(false);
    if (error) {
      toast({ title: "Erro ao registrar pagamento", description: error.message, variant: "destructive" });
      return;
    }
    setStep("confirmed");
  };

  const handleWhatsApp = () => {
    if (!selectedPlan || !user) return;
    const msg = encodeURIComponent(
      `Olá, acabei de pagar o ${selectedPlan.name} para a câmera ${cameraName} (${cameraId}) sob o e-mail ${user.email}. Segue comprovante.`
    );
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${msg}`, "_blank");
  };

  const handleClose = () => {
    setStep("select");
    setSelectedPlan(null);
    setCopied(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl bg-card border-border">
        {step === "select" && (
          <>
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-foreground">Planos para {cameraName}</DialogTitle>
              <DialogDescription className="text-muted-foreground">Escolha o plano ideal para monitorar esta câmera.</DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              {plans.map((plan) => (
                <div key={plan.id} className={`relative rounded-lg border p-4 transition-all hover:border-primary/50 ${plan.highlight ? "border-primary bg-primary/5 shadow-glow" : "border-border bg-secondary/50"}`}>
                  {plan.highlight && <Badge className="absolute -top-2.5 left-4 bg-primary text-primary-foreground text-xs">Popular</Badge>}
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${plan.highlight ? "gradient-primary" : "bg-secondary"}`}>
                      <plan.icon className={`h-5 w-5 ${plan.highlight ? "text-primary-foreground" : "text-muted-foreground"}`} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground text-sm">{plan.name}</h3>
                      <p className="text-foreground font-bold">{plan.price}<span className="text-muted-foreground text-xs font-normal">{plan.period}</span></p>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mb-4">{plan.description}</p>
                  <Button onClick={() => handleSelectPlan(plan)} variant={plan.highlight ? "default" : "outline"} className={`w-full text-sm ${plan.highlight ? "gradient-primary text-primary-foreground" : ""}`} size="sm">Contratar</Button>
                </div>
              ))}
            </div>
            <div className="flex items-start gap-2 mt-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
              <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
              <p className="text-xs text-muted-foreground"><strong className="text-destructive">Taxa de Ativação:</strong> Para novas câmeras, uma taxa única de ativação pode ser aplicada no primeiro acesso.</p>
            </div>
          </>
        )}

        {step === "pix" && selectedPlan && (
          <>
            <DialogHeader>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" onClick={() => setStep("select")} className="h-8 w-8"><ArrowLeft className="h-4 w-4" /></Button>
                <div>
                  <DialogTitle className="text-lg font-bold text-foreground">Pagamento via Pix</DialogTitle>
                  <DialogDescription className="text-muted-foreground text-sm">{selectedPlan.name} — {selectedPlan.price}{selectedPlan.period}</DialogDescription>
                </div>
              </div>
            </DialogHeader>
            <div className="mt-4 space-y-4">
              <div className="text-center p-4 rounded-lg bg-primary/5 border border-primary/20">
                <p className="text-sm text-muted-foreground mb-1">Valor a pagar</p>
                <p className="text-3xl font-bold text-foreground">{selectedPlan.price}</p>
              </div>
              <div className="p-4 rounded-lg border border-border bg-secondary/30">
                <p className="text-xs text-muted-foreground mb-2 font-medium">Chave Pix (E-mail)</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-sm bg-background rounded px-3 py-2 border border-border text-foreground select-all">{PIX_KEY}</code>
                  <Button variant="outline" size="sm" onClick={handleCopyPix} className="shrink-0">
                    {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                    {copied ? "Copiado" : "Copiar"}
                  </Button>
                </div>
              </div>
              <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
                <li>Abra o app do seu banco e acesse a área Pix.</li>
                <li>Cole a chave acima e envie o valor de <strong className="text-foreground">{selectedPlan.price}</strong>.</li>
                <li>Clique em "Já realizei o pagamento" abaixo.</li>
              </ol>
              <Button onClick={handleConfirmPayment} disabled={submitting} className="w-full gradient-primary text-primary-foreground">
                {submitting ? "Registrando…" : "Já realizei o pagamento"}
              </Button>
              <Button variant="outline" onClick={handleWhatsApp} className="w-full gap-2 text-sm border-green-600/30 text-green-500 hover:bg-green-500/10 hover:text-green-400">
                <MessageCircle className="h-4 w-4" />Enviar comprovante via WhatsApp
              </Button>
            </div>
          </>
        )}

        {step === "confirmed" && selectedPlan && (
          <div className="text-center py-6 space-y-4">
            <div className="mx-auto h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center"><Check className="h-8 w-8 text-primary" /></div>
            <div>
              <h3 className="text-lg font-bold text-foreground">Pagamento registrado!</h3>
              <p className="text-sm text-muted-foreground mt-2 max-w-sm mx-auto">Seu acesso será liberado em até <strong className="text-foreground">15 minutos</strong> após a confirmação do pagamento.</p>
            </div>
            <Button variant="outline" onClick={handleWhatsApp} className="gap-2 border-green-600/30 text-green-500 hover:bg-green-500/10 hover:text-green-400">
              <MessageCircle className="h-4 w-4" />Enviar comprovante via WhatsApp
            </Button>
            <div><Button variant="ghost" onClick={handleClose} className="text-sm text-muted-foreground">Fechar</Button></div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
