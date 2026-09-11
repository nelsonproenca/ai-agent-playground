import { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiClient } from "@/watchtower/services/apiClient";
import { paymentService } from "@/watchtower/services/paymentService";
import type { AdminPlanDto } from "@/watchtower/types/api";
import {
  Clock,
  Tv,
  Calendar,
  Crown,
  AlertTriangle,
  Copy,
  Check,
  Upload,
  FileText,
  Loader2,
  CheckCircle2,
  ChevronLeft,
} from "lucide-react";

const PIX_KEY = "cbb2211c-e521-4d35-8f0a-46a08472cc9b";

const TIER_ORDER = ["Acesso24h", "Bronze", "Silver", "Gold"];
const TIER_ICONS: Record<string, typeof Clock> = {
  Acesso24h: Clock,
  Bronze: Tv,
  Silver: Calendar,
  Gold: Crown,
};

type Step = "select" | "confirm" | "upload" | "success";

interface PlanModalProps {
  open: boolean;
  onClose: () => void;
  cameraId?: string;
  cameraName?: string;
  preSelectedPlan?: AdminPlanDto;
}

function formatPrice(price: number): string {
  return `R$ ${price.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function StepIndicator({ current }: { current: 0 | 1 | 2 }) {
  const labels = ["PLANO", "COMPROVANTE", "CONFIRMAÇÃO"];
  return (
    <div className="flex items-center justify-center gap-0 mb-6">
      {labels.map((label, i) => (
        <div key={i} className="flex items-center">
          <div className="flex flex-col items-center gap-1">
            <div
              className={`h-5 w-5 rounded-full flex items-center justify-center font-mono text-[10px] transition-colors ${
                i === current
                  ? "bg-primary text-primary-foreground"
                  : i < current
                    ? "bg-primary/40 text-primary-foreground"
                    : "bg-muted text-muted-foreground"
              }`}
            >
              {i < current ? <Check className="h-2.5 w-2.5" /> : i + 1}
            </div>
            <span
              className={`font-mono text-[9px] tracking-wider ${
                i === current ? "text-primary" : "text-muted-foreground/60"
              }`}
            >
              {label}
            </span>
          </div>
          {i < labels.length - 1 && (
            <div
              className={`h-px w-8 mx-1 mb-4 transition-colors ${
                i < current ? "bg-primary/40" : "bg-border"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}

export function WatchtowerPlanModal({
  open,
  onClose,
  cameraName,
  preSelectedPlan,
}: PlanModalProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [plans, setPlans] = useState<AdminPlanDto[]>([]);
  const [plansLoading, setPlansLoading] = useState(false);
  const [step, setStep] = useState<Step>("select");
  const [selectedPlan, setSelectedPlan] = useState<AdminPlanDto | null>(null);
  const [nome, setNome] = useState("");
  const [cpf, setCpf] = useState("");
  const [comprovante, setComprovante] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [copied, setCopied] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Sync pre-selected plan and initial step
  useEffect(() => {
    if (!open) return;
    if (preSelectedPlan) {
      setSelectedPlan(preSelectedPlan);
      setStep("confirm");
    } else {
      setStep("select");
      setSelectedPlan(null);
      setPlansLoading(true);
      apiClient
        .get<AdminPlanDto[]>("/api/plans", false)
        .then((data) =>
          setPlans([...data].sort((a, b) => TIER_ORDER.indexOf(a.planTier) - TIER_ORDER.indexOf(b.planTier))),
        )
        .catch(() => {})
        .finally(() => setPlansLoading(false));
    }
  }, [open, preSelectedPlan]);

  // Image preview URL lifecycle
  useEffect(() => {
    if (!comprovante || !comprovante.type.startsWith("image/")) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(comprovante);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [comprovante]);

  const validateAndSetFile = (file: File | undefined) => {
    if (!file) return;
    if (!["image/jpeg", "image/png", "application/pdf"].includes(file.type)) {
      toast({ title: "Arquivo inválido", description: "Use JPEG, PNG ou PDF.", variant: "destructive" });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Arquivo muito grande", description: "Máximo 5MB.", variant: "destructive" });
      return;
    }
    setComprovante(file);
  };

  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "").slice(0, 11);
    const f = raw
      .replace(/^(\d{3})(\d)/, "$1.$2")
      .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
      .replace(/^(\d{3})\.(\d{3})\.(\d{3})(\d)/, "$1.$2.$3-$4");
    setCpf(f);
  };

  const handleCopyPix = async () => {
    await navigator.clipboard.writeText(PIX_KEY).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = async () => {
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
      setStep("success");
    } catch (e: unknown) {
      toast({ title: "Erro ao registrar pagamento", description: (e as Error).message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
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

  const stepIndex = step === "confirm" ? 0 : step === "upload" ? 1 : 2;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-xl bg-card border-border">
        {/* ── Step 0: Select plan (when no preSelectedPlan) ──────────── */}
        {step === "select" && (
          <>
            <DialogHeader>
              <DialogTitle className="font-mono text-sm font-bold tracking-wider">
                {cameraName ? `PLANOS — ${cameraName.toUpperCase()}` : "ESCOLHA SEU PLANO"}
              </DialogTitle>
              <DialogDescription className="text-muted-foreground text-xs">
                Selecione o plano ideal para monitoramento.
              </DialogDescription>
            </DialogHeader>

            {plansLoading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="h-7 w-7 animate-spin text-primary" />
              </div>
            ) : plans.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-8">
                Nenhum plano disponível no momento.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                {plans.map((plan) => {
                  const highlight = plan.planTier === "Silver";
                  const Icon = TIER_ICONS[plan.planTier] ?? Tv;
                  return (
                    <div
                      key={plan.id}
                      className={`relative rounded-sm border p-4 cursor-pointer transition-colors hover:border-primary/50 ${
                        highlight ? "border-primary bg-primary/5" : "border-border bg-secondary/30"
                      }`}
                      onClick={() => {
                        setSelectedPlan(plan);
                        setStep("confirm");
                      }}
                    >
                      {highlight && (
                        <Badge className="absolute -top-2.5 left-4 font-mono text-[10px] tracking-wider">
                          POPULAR
                        </Badge>
                      )}
                      <div className="flex items-center gap-3 mb-2">
                        <div
                          className={`flex h-9 w-9 items-center justify-center rounded-sm ${
                            highlight ? "bg-primary" : "bg-secondary"
                          }`}
                        >
                          <Icon
                            className={`h-4 w-4 ${highlight ? "text-primary-foreground" : "text-muted-foreground"}`}
                          />
                        </div>
                        <div>
                          <p className="font-mono text-xs font-bold tracking-wider text-foreground">
                            {plan.name.toUpperCase()}
                          </p>
                          <p className="font-mono text-sm font-bold text-foreground">
                            {formatPrice(plan.priceBrl)}
                            {plan.durationDays > 1 && (
                              <span className="text-[10px] font-normal text-muted-foreground">/mês</span>
                            )}
                          </p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant={highlight ? "default" : "outline"}
                        className="w-full font-mono text-[10px] tracking-widest"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedPlan(plan);
                          setStep("confirm");
                        }}
                      >
                        [PIX]
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="flex items-start gap-2 mt-2 p-3 rounded-sm bg-destructive/10 border border-destructive/20">
              <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
              <p className="text-xs text-muted-foreground">
                <strong className="text-destructive">Taxa de Ativação:</strong> Taxa única de R$ 150,00
                na primeira configuração de câmeras.
              </p>
            </div>
          </>
        )}

        {/* ── Steps 1–3: PIX flow ─────────────────────────────────────── */}
        {step !== "select" && selectedPlan && (
          <>
            {step !== "success" && (
              <div className="flex items-center gap-2 mb-1">
                <button
                  onClick={() => setStep(step === "upload" ? "confirm" : preSelectedPlan ? "confirm" : "select")}
                  className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded"
                  aria-label="Voltar"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="font-mono text-xs text-muted-foreground">
                  {selectedPlan.name.toUpperCase()} — {formatPrice(selectedPlan.priceBrl)}
                  {selectedPlan.durationDays > 1 ? "/mês" : ""}
                </span>
              </div>
            )}

            <StepIndicator current={stepIndex as 0 | 1 | 2} />

            {/* Step 1: Confirm plan + PIX key */}
            {step === "confirm" && (
              <div className="space-y-4">
                <DialogHeader>
                  <DialogTitle className="font-mono text-sm font-bold tracking-wider">
                    CONFIRMAR PLANO
                  </DialogTitle>
                </DialogHeader>

                {/* Plan summary */}
                <div className="border border-border rounded-sm p-4 bg-muted/20 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-foreground">
                      {selectedPlan.name.toUpperCase()}
                    </span>
                    {selectedPlan.planTier === "Silver" && (
                      <span className="font-mono text-[10px] text-primary border border-primary/30 px-2 py-0.5 rounded-sm">
                        POPULAR
                      </span>
                    )}
                  </div>
                  <div className="font-mono text-2xl font-bold">
                    {formatPrice(selectedPlan.priceBrl)}
                    {selectedPlan.durationDays > 1 && (
                      <span className="text-sm font-normal text-muted-foreground">/mês</span>
                    )}
                  </div>
                  <div className="font-mono text-xs text-muted-foreground space-y-0.5">
                    <div>
                      <span className="text-primary/60">// </span>Ao Vivo:{" "}
                      <span className="text-primary">✓</span>
                    </div>
                    {selectedPlan.recordingDaysLimit && (
                      <div>
                        <span className="text-primary/60">// </span>Gravações:{" "}
                        <span className="text-foreground">{selectedPlan.recordingDaysLimit} dias</span>
                      </div>
                    )}
                    {selectedPlan.canDownload && (
                      <div>
                        <span className="text-primary/60">// </span>Download:{" "}
                        <span className="text-primary">✓</span>
                      </div>
                    )}
                    <div>
                      <span className="text-primary/60">// </span>Duração:{" "}
                      <span className="text-foreground">
                        {selectedPlan.durationDays === 1 ? "1 dia" : "30 dias"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* PIX key */}
                <div className="space-y-1.5">
                  <p className="font-mono text-xs text-muted-foreground tracking-wider">Chave PIX</p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 font-mono text-xs bg-muted px-3 py-2 rounded-sm border border-border text-foreground select-all break-all">
                      {PIX_KEY}
                    </code>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCopyPix}
                      className="shrink-0 font-mono text-xs gap-1.5"
                    >
                      {copied ? (
                        <Check className="h-3.5 w-3.5 text-primary" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                      {copied ? "Copiado" : "Copiar"}
                    </Button>
                  </div>
                </div>

                <p className="font-mono text-xs text-muted-foreground">
                  <span className="text-primary/60">// </span>
                  Faça o pagamento e volte aqui com o comprovante
                </p>

                <Button
                  onClick={() => setStep("upload")}
                  className="w-full font-mono text-xs tracking-widest"
                >
                  Já paguei, enviar comprovante →
                </Button>
              </div>
            )}

            {/* Step 2: Upload comprovante */}
            {step === "upload" && (
              <div className="space-y-4">
                <DialogHeader>
                  <DialogTitle className="font-mono text-sm font-bold tracking-wider">
                    ENVIAR COMPROVANTE
                  </DialogTitle>
                </DialogHeader>

                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label className="font-mono text-xs tracking-wider">Nome completo *</Label>
                    <Input
                      value={nome}
                      onChange={(e) => setNome(e.target.value)}
                      placeholder="João da Silva"
                      className="font-mono text-sm"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="font-mono text-xs tracking-wider">CPF *</Label>
                    <Input
                      value={cpf}
                      onChange={handleCpfChange}
                      placeholder="000.000.000-00"
                      className="font-mono text-sm"
                      inputMode="numeric"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="font-mono text-xs tracking-wider">
                      Comprovante (JPEG · PNG · PDF · máx 5MB) *
                    </Label>

                    {/* Drag & drop zone */}
                    <div
                      onDragOver={(e) => {
                        e.preventDefault();
                        setIsDragging(true);
                      }}
                      onDragLeave={() => setIsDragging(false)}
                      onDrop={(e) => {
                        e.preventDefault();
                        setIsDragging(false);
                        validateAndSetFile(e.dataTransfer.files?.[0]);
                      }}
                      onClick={() => fileInputRef.current?.click()}
                      className={`border-2 border-dashed rounded-sm p-5 text-center cursor-pointer transition-colors ${
                        isDragging
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/40 hover:bg-muted/10"
                      }`}
                    >
                      {comprovante ? (
                        <div className="space-y-2">
                          {previewUrl ? (
                            <img
                              src={previewUrl}
                              alt="Preview"
                              className="max-h-20 mx-auto rounded-sm object-contain"
                            />
                          ) : (
                            <FileText className="h-8 w-8 mx-auto text-primary" />
                          )}
                          <p className="font-mono text-xs text-foreground truncate">{comprovante.name}</p>
                          <p className="font-mono text-[10px] text-muted-foreground">
                            {(comprovante.size / 1024).toFixed(0)} KB ·{" "}
                            <span className="text-primary underline">trocar arquivo</span>
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <Upload className="h-7 w-7 mx-auto text-muted-foreground/40" />
                          <p className="text-sm text-muted-foreground">
                            Arraste aqui ou{" "}
                            <span className="text-primary">clique para selecionar</span>
                          </p>
                          <p className="font-mono text-[10px] text-muted-foreground/60">
                            JPEG · PNG · PDF · máx 5MB
                          </p>
                        </div>
                      )}
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,application/pdf"
                      className="hidden"
                      onChange={(e) => validateAndSetFile(e.target.files?.[0])}
                    />
                  </div>
                </div>

                <Button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="w-full font-mono text-xs tracking-widest"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
                      Enviando…
                    </>
                  ) : (
                    "Enviar para análise →"
                  )}
                </Button>
              </div>
            )}

            {/* Step 3: Success */}
            {step === "success" && (
              <div className="text-center py-4 space-y-5">
                <div className="mx-auto h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <CheckCircle2 className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h3 className="font-mono text-sm font-bold tracking-wider text-foreground">
                    COMPROVANTE RECEBIDO!
                  </h3>
                  <p className="text-sm text-muted-foreground mt-2 max-w-xs mx-auto leading-relaxed">
                    Em até 24h seu acesso será liberado pelo administrador.
                  </p>
                </div>
                <Button onClick={handleClose} className="font-mono text-xs tracking-widest px-8">
                  Fechar
                </Button>
              </div>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
