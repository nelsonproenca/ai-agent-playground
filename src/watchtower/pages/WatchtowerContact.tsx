import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  ChevronLeft,
  Mail,
  MessageCircle,
  MapPin,
  Clock,
  CheckCircle2,
  Tag,
  Wrench,
  Settings,
  CreditCard,
  Handshake,
  Briefcase,
  Newspaper,
  HelpCircle,
  type LucideIcon,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { contactService } from "@/watchtower/services";

const SUBJECT_OPTIONS: { value: string; label: string; icon: LucideIcon }[] = [
  { value: "duvidas-planos", label: "Dúvidas sobre planos e preços", icon: Tag },
  { value: "suporte-tecnico", label: "Suporte técnico / câmera offline", icon: Wrench },
  { value: "instalacao", label: "Instalação e configuração", icon: Settings },
  { value: "pagamento-faturamento", label: "Pagamento e faturamento", icon: CreditCard },
  { value: "parcerias", label: "Parcerias comerciais", icon: Handshake },
  { value: "trabalhe-conosco", label: "Trabalhe conosco", icon: Briefcase },
  { value: "imprensa", label: "Imprensa e mídia", icon: Newspaper },
  { value: "outros", label: "Outros assuntos", icon: HelpCircle },
];

const WHATSAPP_NUMBER = "5511945598960";
const MESSAGE_MAX = 1000;

const contactSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, { message: "Informe pelo menos 2 caracteres" })
    .max(100, { message: "Nome deve ter no máximo 100 caracteres" }),
  email: z
    .string()
    .trim()
    .email({ message: "E-mail inválido" })
    .max(255, { message: "E-mail deve ter no máximo 255 caracteres" }),
  subject: z
    .string()
    .trim()
    .min(1, { message: "Selecione um assunto" })
    .refine((v) => SUBJECT_OPTIONS.some((o) => o.value === v), { message: "Assunto inválido" }),
  phone: z
    .string()
    .trim()
    .max(20, { message: "Telefone deve ter no máximo 20 caracteres" })
    .refine(
      (v) => {
        if (!v) return true;
        const digits = v.replace(/\D/g, "");
        return digits.length === 10 || digits.length === 11;
      },
      { message: "Telefone inválido. Use (11) 99999-9999" },
    )
    .optional()
    .or(z.literal("")),
  message: z
    .string()
    .trim()
    .min(10, { message: "Mensagem deve ter pelo menos 10 caracteres" })
    .max(MESSAGE_MAX, { message: `Mensagem deve ter no máximo ${MESSAGE_MAX} caracteres` }),
  // honeypot — deve permanecer vazio
  website: z.string().max(0, { message: "Spam detectado" }).optional(),
});

type FormErrors = Partial<Record<"name" | "email" | "phone" | "subject" | "message", string>>;

/**
 * Aplica máscara brasileira de telefone:
 *  - 10 dígitos: (11) 9999-9999
 *  - 11 dígitos: (11) 99999-9999
 */
function formatPhoneBR(value: string): string {
  const d = value.replace(/\D/g, "").slice(0, 11);
  if (d.length === 0) return "";
  if (d.length <= 2) return `(${d}`;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

export default function WatchtowerContact() {
  const navigate = useNavigate();
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [messageLength, setMessageLength] = useState(0);
  const [subject, setSubject] = useState("");
  const [phone, setPhone] = useState("");

  const openWhatsApp = () => {
    const msg = encodeURIComponent("Olá! Vim pelo site da Watchtower Monitoramentos e gostaria de mais informações.");
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${msg}`, "_blank", "noopener,noreferrer");
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrors({});

    const form = e.currentTarget;
    const formData = new FormData(form);
    const raw = {
      name: (formData.get("name") as string) ?? "",
      email: (formData.get("email") as string) ?? "",
      phone: phone,
      subject: subject,
      message: (formData.get("message") as string) ?? "",
      website: (formData.get("website") as string) ?? "",
    };

    const parsed = contactSchema.safeParse(raw);
    if (!parsed.success) {
      const fieldErrors: FormErrors = {};
      parsed.error.issues.forEach((issue) => {
        const field = issue.path[0] as keyof FormErrors;
        if (field && !fieldErrors[field]) fieldErrors[field] = issue.message;
      });
      setErrors(fieldErrors);
      // honeypot acionado: silenciar como sucesso falso
      if (raw.website && raw.website.length > 0) {
        setSuccess(true);
        form.reset();
        setMessageLength(0);
        setSubject("");
        setPhone("");
      } else {
        toast.error("Verifique os campos do formulário.");
      }
      return;
    }

    setSending(true);
    try {
      const subjectLabel = SUBJECT_OPTIONS.find((o) => o.value === parsed.data.subject)?.label ?? parsed.data.subject;
      await contactService.submit({
        name: parsed.data.name,
        email: parsed.data.email,
        phone: parsed.data.phone || undefined,
        subject: subjectLabel,
        message: parsed.data.message,
      });
      toast.success("Mensagem enviada!", { description: "Retornaremos em até 24 horas." });
      form.reset();
      setMessageLength(0);
      setSubject("");
      setPhone("");
      setSuccess(true);
    } catch {
      toast.error("Erro ao enviar", { description: "Tente novamente mais tarde." });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/80 bg-background/95 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <button
            onClick={() => navigate("/watchtower")}
            className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />VOLTAR
          </button>
          <Link to="/watchtower" className="flex items-center gap-2">
            <img src="/watchtower-favicon.png" alt="Watchtower Monitoramentos" width={28} height={28} className="h-7 w-7 object-contain" loading="lazy" />
            <span className="font-display text-base font-bold text-primary tracking-wider">WATCHTOWER MONITORAMENTOS</span>
          </Link>
          <div className="w-16" />
        </div>
      </nav>

      <main className="pt-28 pb-24 px-6">
        <div className="max-w-4xl mx-auto">
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-xs tracking-[0.2em] text-primary font-medium mb-3">
            CONTATO
          </motion.p>
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="font-display text-4xl md:text-5xl font-bold leading-tight mb-6">
            Fale <span className="text-primary">Conosco</span>
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="text-sm text-muted-foreground leading-relaxed max-w-2xl mb-16">
            Tem alguma dúvida ou precisa de ajuda? Nossa equipe está pronta para atendê-lo, com atendimento 24/7.
          </motion.p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Form / Success */}
            <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
              <AnimatePresence mode="wait">
                {success ? (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="border border-primary/30 rounded-lg p-10 bg-primary/5 text-center min-h-[420px] flex flex-col items-center justify-center"
                  >
                    <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                      <CheckCircle2 className="h-7 w-7 text-primary" />
                    </div>
                    <h3 className="font-display text-xl font-bold mb-2">Mensagem enviada!</h3>
                    <p className="text-sm text-muted-foreground mb-6 max-w-xs">
                      Recebemos sua mensagem e retornaremos em até <span className="text-primary font-medium">24 horas</span>.
                    </p>
                    <Button variant="outline" className="text-xs tracking-wider" onClick={() => setSuccess(false)}>
                      ENVIAR OUTRA MENSAGEM
                    </Button>
                  </motion.div>
                ) : (
                  <motion.form
                    key="form"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onSubmit={handleSubmit}
                    noValidate
                    className="border border-border rounded-lg p-8 bg-card space-y-4"
                  >
                    {/* Honeypot — invisível para usuários, captura bots */}
                    <div className="absolute -left-[9999px] w-px h-px overflow-hidden" aria-hidden="true">
                      <label htmlFor="contact-website">Website</label>
                      <input id="contact-website" type="text" name="website" tabIndex={-1} autoComplete="off" />
                    </div>

                    <div>
                      <label htmlFor="contact-name" className="text-xs tracking-wider font-semibold text-foreground mb-1.5 block">
                        NOME
                      </label>
                      <Input
                        id="contact-name"
                        name="name"
                        placeholder="Seu nome completo"
                        maxLength={100}
                        aria-invalid={!!errors.name}
                        aria-describedby={errors.name ? "contact-name-error" : undefined}
                        className="bg-secondary border-border"
                      />
                      {errors.name && (
                        <p id="contact-name-error" className="text-xs text-destructive mt-1.5">{errors.name}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="contact-email" className="text-xs tracking-wider font-semibold text-foreground mb-1.5 block">
                        EMAIL
                      </label>
                      <Input
                        id="contact-email"
                        name="email"
                        type="email"
                        placeholder="seu@email.com"
                        maxLength={255}
                        aria-invalid={!!errors.email}
                        aria-describedby={errors.email ? "contact-email-error" : undefined}
                        className="bg-secondary border-border"
                      />
                      {errors.email && (
                        <p id="contact-email-error" className="text-xs text-destructive mt-1.5">{errors.email}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="contact-phone" className="text-xs tracking-wider font-semibold text-foreground mb-1.5 block">
                        TELEFONE / WHATSAPP <span className="text-muted-foreground font-normal normal-case tracking-normal">(opcional)</span>
                      </label>
                      <Input
                        id="contact-phone"
                        name="phone"
                        type="tel"
                        inputMode="tel"
                        autoComplete="tel"
                        placeholder="(11) 99999-9999"
                        value={phone}
                        onChange={(e) => setPhone(formatPhoneBR(e.target.value))}
                        maxLength={20}
                        aria-invalid={!!errors.phone}
                        aria-describedby={errors.phone ? "contact-phone-error" : undefined}
                        className="bg-secondary border-border"
                      />
                      {errors.phone && (
                        <p id="contact-phone-error" className="text-xs text-destructive mt-1.5">{errors.phone}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="contact-subject" className="text-xs tracking-wider font-semibold text-foreground mb-1.5 block">
                        ASSUNTO
                      </label>
                      <Select value={subject} onValueChange={setSubject}>
                        <SelectTrigger
                          id="contact-subject"
                          aria-invalid={!!errors.subject}
                          aria-describedby={errors.subject ? "contact-subject-error" : undefined}
                          className="bg-secondary border-border"
                        >
                          <SelectValue placeholder="Selecione o assunto da mensagem" />
                        </SelectTrigger>
                        <SelectContent>
                          {SUBJECT_OPTIONS.map((opt) => {
                            const Icon = opt.icon;
                            return (
                              <SelectItem key={opt.value} value={opt.value}>
                                <span className="flex items-center gap-2">
                                  <Icon className="h-4 w-4 text-primary shrink-0" />
                                  <span>{opt.label}</span>
                                </span>
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                      {errors.subject && (
                        <p id="contact-subject-error" className="text-xs text-destructive mt-1.5">{errors.subject}</p>
                      )}
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label htmlFor="contact-message" className="text-xs tracking-wider font-semibold text-foreground">
                          MENSAGEM
                        </label>
                        <span className={`text-[10px] tabular-nums ${messageLength > MESSAGE_MAX * 0.9 ? "text-primary" : "text-muted-foreground"}`}>
                          {messageLength}/{MESSAGE_MAX}
                        </span>
                      </div>
                      <Textarea
                        id="contact-message"
                        name="message"
                        placeholder="Como podemos ajudar?"
                        maxLength={MESSAGE_MAX}
                        onChange={(e) => setMessageLength(e.currentTarget.value.length)}
                        aria-invalid={!!errors.message}
                        aria-describedby={errors.message ? "contact-message-error" : undefined}
                        className="bg-secondary border-border min-h-[120px]"
                      />
                      {errors.message && (
                        <p id="contact-message-error" className="text-xs text-destructive mt-1.5">{errors.message}</p>
                      )}
                    </div>

                    <Button type="submit" disabled={sending} className="w-full gradient-primary text-primary-foreground font-semibold text-xs tracking-wider">
                      {sending ? "ENVIANDO..." : "ENVIAR MENSAGEM"}
                    </Button>
                  </motion.form>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Info cards */}
            <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }} className="space-y-4">
              <a
                href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent("Olá! Vim pelo site da Watchtower Monitoramentos e gostaria de mais informações.")}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => { e.preventDefault(); openWhatsApp(); }}
                className="block border border-border rounded-lg p-6 hover:border-primary/40 hover:bg-primary/5 transition-colors group"
              >
                <div className="flex items-center gap-3 mb-2">
                  <MessageCircle className="h-5 w-5 text-primary" />
                  <span className="text-xs tracking-[0.15em] text-primary font-medium">WHATSAPP</span>
                </div>
                <p className="text-sm text-foreground group-hover:text-primary transition-colors">+55 11 94559-8960</p>
                <p className="text-xs text-muted-foreground mt-1">Resposta rápida via mensagem</p>
              </a>

              <a
                href="mailto:nelsonhaproenca@gmail.com"
                className="block border border-border rounded-lg p-6 hover:border-primary/40 hover:bg-primary/5 transition-colors group"
              >
                <div className="flex items-center gap-3 mb-2">
                  <Mail className="h-5 w-5 text-primary" />
                  <span className="text-xs tracking-[0.15em] text-primary font-medium">EMAIL</span>
                </div>
                <p className="text-sm text-foreground group-hover:text-primary transition-colors break-all">
                  nelsonhaproenca@gmail.com
                </p>
              </a>

              <div className="border border-border rounded-lg p-6">
                <div className="flex items-center gap-3 mb-2">
                  <Clock className="h-5 w-5 text-primary" />
                  <span className="text-xs tracking-[0.15em] text-primary font-medium">ATENDIMENTO</span>
                </div>
                <p className="text-sm text-foreground">24 horas por dia, 7 dias por semana</p>
                <p className="text-xs text-muted-foreground mt-1">Suporte ininterrupto para seu monitoramento</p>
              </div>

              <div className="border border-border rounded-lg p-6">
                <div className="flex items-center gap-3 mb-2">
                  <MapPin className="h-5 w-5 text-primary" />
                  <span className="text-xs tracking-[0.15em] text-primary font-medium">LOCALIZAÇÃO</span>
                </div>
                <p className="text-sm text-foreground">São Paulo, SP — Brasil</p>
                <p className="text-xs text-muted-foreground mt-1">Atendimento 100% remoto em todo o país</p>
              </div>
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
}
