import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Copy, Upload, FileCheck, Loader2, CheckCircle2, AlertCircle } from "lucide-react";

interface Produto {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
}

interface PixPaymentDialogProps {
  produto: Produto | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PIX_KEY = "nelsonproenca@gmail.com";
const N8N_WEBHOOK = "https://n8n.nelsonproenca.pt/webhook/pix-validation";

type PaymentStatus = "idle" | "sending" | "analyzing";

const PixPaymentDialog = ({ produto, open, onOpenChange }: PixPaymentDialogProps) => {
  const [nomePagador, setNomePagador] = useState("");
  const [documento, setDocumento] = useState("");
  const [email, setEmail] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<PaymentStatus>("idle");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetForm = () => {
    setNomePagador("");
    setDocumento("");
    setEmail("");
    setFile(null);
    setStatus("idle");
  };

  const handleOpenChange = (val: boolean) => {
    if (!val) resetForm();
    onOpenChange(val);
  };

  const copyPixKey = () => {
    navigator.clipboard.writeText(PIX_KEY);
    toast({ title: "Chave Pix copiada!", description: PIX_KEY });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    const validTypes = ["image/png", "image/jpeg", "image/webp", "application/pdf"];
    if (!validTypes.includes(selected.type)) {
      toast({ title: "Formato inválido", description: "Envie uma imagem (PNG, JPG, WebP) ou PDF.", variant: "destructive" });
      return;
    }
    if (selected.size > 10 * 1024 * 1024) {
      toast({ title: "Arquivo muito grande", description: "O limite é 10 MB.", variant: "destructive" });
      return;
    }
    setFile(selected);
  };

  const fileToBase64 = (f: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve((reader.result as string).split(",")[1]);
      reader.onerror = reject;
      reader.readAsDataURL(f);
    });

  const handleSubmit = async () => {
    if (!produto || !file) return;

    if (!nomePagador.trim() || !documento.trim() || !email.trim()) {
      toast({ title: "Preencha todos os campos", description: "Nome, documento e e-mail são obrigatórios.", variant: "destructive" });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      toast({ title: "E-mail inválido", description: "Informe um e-mail válido.", variant: "destructive" });
      return;
    }

    setStatus("sending");

    try {
      const base64 = await fileToBase64(file);

      const payload = {
        comprovante: base64,
        nomeArquivo: file.name,
        tipoArquivo: file.type,
        nomePagador: nomePagador.trim(),
        documento: documento.trim(),
        email: email.trim(),
        produtoId: produto.id,
        produtoNome: produto.name,
        valor: produto.price,
      };

      const res = await fetch(N8N_WEBHOOK, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Erro ao enviar comprovante");

      setStatus("analyzing");

      toast({
        title: "Comprovante enviado!",
        description: "Estamos validando seu pagamento. Você receberá a confirmação em instantes.",
      });
    } catch (err: any) {
      setStatus("idle");
      toast({
        title: "Erro ao enviar",
        description: err.message || "Tente novamente em alguns instantes.",
        variant: "destructive",
      });
    }
  };

  if (!produto) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-mono text-lg">Pagamento via Pix</DialogTitle>
          <DialogDescription>Realize o Pix e envie o comprovante para validação.</DialogDescription>
        </DialogHeader>

        {/* Product Info */}
        <div className="rounded-lg border border-border bg-muted/40 p-4 space-y-2">
          <div className="flex items-start gap-3">
            {produto.image_url && (
              <img src={produto.image_url} alt={produto.name} className="w-16 h-16 rounded-md object-cover border border-border" />
            )}
            <div className="flex-1 min-w-0">
              <h3 className="font-mono font-bold text-foreground text-sm">{produto.name}</h3>
              {produto.description && (
                <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{produto.description}</p>
              )}
            </div>
          </div>
          <div className="flex items-baseline justify-between pt-1 border-t border-border">
            <span className="text-xs text-muted-foreground font-mono">Valor</span>
            <span className="text-lg font-extrabold text-primary font-mono">
              R$ {produto.price.toFixed(2).replace(".", ",")}
            </span>
          </div>
        </div>

        {/* Pix Key */}
        <div className="space-y-2">
          <Label className="text-xs font-mono text-muted-foreground">Chave Pix (E-mail)</Label>
          <div className="flex items-center gap-2">
            <div className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm font-mono text-foreground select-all">
              {PIX_KEY}
            </div>
            <Button variant="outline" size="icon" className="shrink-0" onClick={copyPixKey} type="button">
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {status === "analyzing" ? (
          /* Analysis State */
          <div className="flex flex-col items-center gap-4 py-8 text-center">
            <div className="relative">
              <Loader2 className="h-10 w-10 text-primary animate-spin" />
              <CheckCircle2 className="h-5 w-5 text-primary absolute -bottom-1 -right-1" />
            </div>
            <div>
              <Badge variant="secondary" className="font-mono text-xs mb-2">
                <Loader2 className="h-3 w-3 animate-spin mr-1" />
                Pagamento em Análise
              </Badge>
              <p className="text-sm text-muted-foreground">
                Estamos validando seu comprovante. Você receberá a confirmação por e-mail em instantes.
              </p>
            </div>
          </div>
        ) : (
          /* Form */
          <div className="space-y-4">
            {/* Payer Name */}
            <div className="space-y-1.5">
              <Label htmlFor="pix-nome" className="text-xs font-mono">Nome completo do pagador *</Label>
              <Input
                id="pix-nome"
                placeholder="Seu nome completo"
                value={nomePagador}
                onChange={(e) => setNomePagador(e.target.value)}
                disabled={status === "sending"}
                maxLength={120}
              />
            </div>

            {/* Document */}
            <div className="space-y-1.5">
              <Label htmlFor="pix-doc" className="text-xs font-mono">CPF / CNPJ *</Label>
              <Input
                id="pix-doc"
                placeholder="000.000.000-00"
                value={documento}
                onChange={(e) => {
                  const digits = e.target.value.replace(/\D/g, "").slice(0, 14);
                  let masked = digits;
                  if (digits.length <= 11) {
                    masked = digits
                      .replace(/(\d{3})(\d)/, "$1.$2")
                      .replace(/(\d{3})(\d)/, "$1.$2")
                      .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
                  } else {
                    masked = digits
                      .replace(/(\d{2})(\d)/, "$1.$2")
                      .replace(/(\d{3})(\d)/, "$1.$2")
                      .replace(/(\d{3})(\d)/, "$1/$2")
                      .replace(/(\d{4})(\d{1,2})$/, "$1-$2");
                  }
                  setDocumento(masked);
                }}
                disabled={status === "sending"}
                maxLength={18}
              />
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <Label htmlFor="pix-email" className="text-xs font-mono">E-mail *</Label>
              <Input
                id="pix-email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={status === "sending"}
                maxLength={255}
              />
            </div>

            {/* File Upload */}
            <div className="space-y-1.5">
              <Label className="text-xs font-mono">Comprovante de pagamento *</Label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,application/pdf"
                className="hidden"
                onChange={handleFileChange}
                disabled={status === "sending"}
              />
              <div
                className="rounded-lg border-2 border-dashed border-border hover:border-primary/50 transition-colors cursor-pointer flex flex-col items-center justify-center gap-2 py-6 px-4 bg-muted/20"
                onClick={() => fileInputRef.current?.click()}
              >
                {file ? (
                  <>
                    <FileCheck className="h-6 w-6 text-primary" />
                    <span className="text-xs font-mono text-foreground truncate max-w-[200px]">{file.name}</span>
                    <span className="text-[10px] text-muted-foreground">Clique para trocar</span>
                  </>
                ) : (
                  <>
                    <Upload className="h-6 w-6 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Clique para enviar (PDF ou Imagem)</span>
                  </>
                )}
              </div>
            </div>

            {/* Submit */}
            <Button
              className="w-full font-mono gap-2"
              onClick={handleSubmit}
              disabled={!file || !nomePagador.trim() || !documento.trim() || !email.trim() || status === "sending"}
            >
              {status === "sending" ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Enviando...
                </>
              ) : (
                "Enviar Comprovante"
              )}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default PixPaymentDialog;
