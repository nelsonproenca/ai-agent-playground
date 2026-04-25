import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiClient } from "@/watchtower/services/apiClient";
import { paymentService } from "@/watchtower/services/paymentService";
import type { AdminPlanDto } from "@/watchtower/types/api";
import { Clock, Tv, Calendar, Crown, AlertTriangle, ArrowLeft, Copy, Check, Upload, MessageCircle, Loader2 } from "lucide-react";

interface PlanModalProps {
  open: boolean;
  onClose: () => void;
  cameraId: string;
  cameraName: string;
}

const PIX_KEY = "cbb2211c-e521-4d35-8f0a-46a08472cc9b";
const WHATSAPP_NUMBER = "5511945598960";

const TIER_ICONS: Record<string, typeof Clock> = {
  Acesso24h: Clock,
  Bronze: Tv,
  Silver: Calendar,
  Gold: Crown,
};

type Step = "select" | "pix" | "confirmed";

export function WatchtowerPlanModal({ open, onClose, cameraName }: PlanModalProps) {
  const { toast } = useToast();
  const [plans, setPlans] = useState<AdminPlanDto[]>([]);
  const [plansLoading, setPlansLoading] = useState(true);
  const [step, setStep] = useState<Step>("select");
  const [selectedPlan, setSelectedPlan] = useState<AdminPlanDto | null>(null);
  const [nome, setNome] = useState("");
  const [cpf, setCpf] = useState("");
  const [comprovante, setComprovante] = useState<File | null>(null);
  const [copied, setCopied] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setPlansLoading(true);
    apiClient.get<AdminPlanDto[]>("/api/plans", false)
      .then(setPlans)
      .catch(() => {})
      .finally(() => setPlansLoading(false));
  }, [open]);

  const handleSelectPlan = (plan: AdminPlanDto) => {
    setSelectedPlan(plan);
    setStep("pix");
  };

  const handleCopyPix = async () => {
    await navigator.clipboard.writeText(PIX_KEY);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleConfirmPayment = async () => {
    if (!selectedPlan) return;
    if (!nome.trim()) {
      toast({ title: "Nome completo é obrigatório", variant: "destructive" });
      return;
    }
    const cpfDigits = cpf.replace(/\D/g, "");
    if (cpfDigits.length !== 11) {
      toast({ title: "CPF inválido", description: "Informe os 11 dígitos do CPF.", variant: "destructive" });
      return;
    }
    if (!comprovante) {
      toast({ title: "Comprovante obrigatório", description: "Anexe o comprovante de pagamento.", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      await paymentService.submitComprovante({
        planId: selectedPlan.id,
        nome: nome.trim(),
        cpf: cpfDigits,
        comprovante,
      });
      setStep("confirmed");
    } catch (e: unknown) {
      toast({ title: "Erro ao registrar pagamento", description: (e as Error).message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleWhatsApp = () => {
    if (!selectedPlan) return;
    const msg = encodeURIComponent(
      `Olá, acabei de pagar o ${selectedPlan.name} para monitoramento da câmera ${cameraName}. Segue comprovante.`
    );
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${msg}`, "_blank");
  };

  const handleClose = () => {
    setStep("select");
    setSelectedPlan(null);
    setNome("");
    setCpf("");
    setComprovante(null);
    setCopied(false);
    onClose();
  };

  const formatPrice = (priceBrl: number) =>
    `R$ ${priceBrl.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl bg-card border-border">
        {step === "select" && (
          <>
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-foreground">Planos para {cameraName}</DialogTitle>
              <DialogDescription className="text-muted-foreground">Escolha o plano ideal para monitorar esta câmera.</DialogDescription>
            </DialogHeader>
            {plansLoading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="h-7 w-7 animate-spin text-primary" />
              </div>
            ) : plans.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-8">Nenhum plano disponível no momento.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                {plans.map((plan) => {
                  const highlight = plan.planTier === "Silver";
                  const Icon = TIER_ICONS[plan.planTier] ?? Tv;
                  const suffix = plan.durationDays === 1 ? "" : "/mês";
                  return (
                    <div key={plan.id} className={`relative rounded-lg border p-4 transition-all hover:border-primary/50 ${highlight ? "border-primary bg-primary/5 shadow-glow" : "border-border bg-secondary/50"}`}>
                      {highlight && <Badge className="absolute -top-2.5 left-4 bg-primary text-primary-foreground text-xs">Popular</Badge>}
                      <div className="flex items-center gap-3 mb-3">
                        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${highlight ? "gradient-primary" : "bg-secondary"}`}>
                          <Icon className={`h-5 w-5 ${highlight ? "text-primary-foreground" : "text-muted-foreground"}`} />
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground text-sm">{plan.name}</h3>
                          <p className="text-foreground font-bold">{formatPrice(plan.priceBrl)}<span className="text-muted-foreground text-xs font-normal">{suffix}</span></p>
                        </div>
                      </div>
                      {plan.description && <p className="text-xs text-muted-foreground mb-4">{plan.description}</p>}
                      <Button onClick={() => handleSelectPlan(plan)} variant={highlight ? "default" : "outline"} className={`w-full text-sm ${highlight ? "gradient-primary text-primary-foreground" : ""}`} size="sm">Contratar</Button>
                    </div>
                  );
                })}
              </div>
            )}
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
                  <DialogDescription className="text-muted-foreground text-sm">
                    {selectedPlan.name} — {formatPrice(selectedPlan.priceBrl)}{selectedPlan.durationDays !== 1 ? "/mês" : ""}
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>
            <div className="mt-4 space-y-4">
              <div className="text-center p-4 rounded-lg bg-primary/5 border border-primary/20">
                <p className="text-sm text-muted-foreground mb-1">Valor a pagar</p>
                <p className="text-3xl font-bold text-foreground">{formatPrice(selectedPlan.priceBrl)}</p>
              </div>
              <div className="p-4 rounded-lg border border-border bg-secondary/30">
                <p className="text-xs text-muted-foreground mb-2 font-medium">Chave Pix</p>
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
                <li>Cole a chave acima e envie o valor de <strong className="text-foreground">{formatPrice(selectedPlan.priceBrl)}</strong>.</li>
                <li>Preencha seus dados abaixo e anexe o comprovante.</li>
              </ol>
              <div className="space-y-3 border rounded-lg p-4 bg-secondary/20">
                <div className="space-y-1">
                  <Label htmlFor="nome">Nome completo *</Label>
                  <Input id="nome" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="João da Silva" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="cpf">CPF *</Label>
                  <Input id="cpf" value={cpf} onChange={(e) => setCpf(e.target.value)} placeholder="000.000.000-00" maxLength={14} />
                </div>
                <div className="space-y-1">
                  <Label>Comprovante (JPEG, PNG ou PDF, max 5MB) *</Label>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} className="gap-2">
                      <Upload className="h-4 w-4" />
                      {comprovante ? comprovante.name : "Selecionar arquivo"}
                    </Button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,application/pdf"
                      className="hidden"
                      onChange={(e) => setComprovante(e.target.files?.[0] ?? null)}
                    />
                  </div>
                </div>
              </div>
              <Button onClick={handleConfirmPayment} disabled={submitting} className="w-full gradient-primary text-primary-foreground">
                {submitting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Enviando…</> : "Enviar comprovante"}
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
              <h3 className="text-lg font-bold text-foreground">Comprovante enviado!</h3>
              <p className="text-sm text-muted-foreground mt-2 max-w-sm mx-auto">Seu acesso será liberado após a confirmação do pagamento pelo administrador.</p>
            </div>
            <Button variant="outline" onClick={handleWhatsApp} className="gap-2 border-green-600/30 text-green-500 hover:bg-green-500/10 hover:text-green-400">
              <MessageCircle className="h-4 w-4" />Enviar comprovante via WhatsApp também
            </Button>
            <div><Button variant="ghost" onClick={handleClose} className="text-sm text-muted-foreground">Fechar</Button></div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
