import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Camera, Monitor, UserPlus, ChevronLeft, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { apiClient } from "@/watchtower/services/apiClient";
import type { AdminPlanDto, PlanTier } from "@/watchtower/types/api";

const TIER_ORDER: PlanTier[] = ["Acesso24h", "Bronze", "Silver", "Gold"];

function formatPrice(price: number): string {
  return `R$ ${price.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

const steps = [
  { num: "01", icon: UserPlus, title: "CADASTRE-SE", desc: "Crie seu perfil e configure seu painel de monitoramento em poucos minutos." },
  { num: "02", icon: Camera, title: "CONECTE CÂMERAS", desc: "Conecte suas câmeras facilmente usando a cloud de qualquer web browser." },
  { num: "03", icon: Monitor, title: "MONITORE", desc: "Acesse sua feed ao vivo e gravações de qualquer lugar, a qualquer hora." },
];

const faqs = [
  { q: "Preciso de equipamento especial para usar a Watchtower Monitoramentos?", a: "Não! A Watchtower Monitoramentos funciona com qualquer câmera IP compatível com RTSP ou HLS." },
  { q: "Quanto tempo de gravação fica disponível?", a: "Depende do plano contratado. Bronze: ao vivo. Prata: 7 dias. Ouro: 30 dias com download." },
  { q: "É seguro acessar minhas câmeras pela internet?", a: "Sim! Utilizamos criptografia TLS/SSL para todas as conexões." },
  { q: "Posso cancelar a qualquer momento?", a: "Sim! Não há contratos de fidelidade. Cancele quando quiser." },
  { q: "Como funciona o suporte técnico?", a: "Suporte via chat e e-mail 24/7 para todos os clientes. Planos Ouro têm prioridade." },
];

export default function WatchtowerLanding() {
  const navigate = useNavigate();
  const [plans, setPlans] = useState<AdminPlanDto[]>([]);
  const [plansLoading, setPlansLoading] = useState(true);

  useEffect(() => {
    apiClient
      .get<AdminPlanDto[]>("/api/plans", false)
      .then((data) =>
        setPlans([...data].sort((a, b) => TIER_ORDER.indexOf(a.planTier) - TIER_ORDER.indexOf(b.planTier))),
      )
      .catch(() => {})
      .finally(() => setPlansLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ── Navbar ──────────────────────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-primary/20 bg-background/95 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              to="/"
              className="font-mono text-xs tracking-widest text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronLeft className="h-3 w-3 inline mr-1" />
              SITE
            </Link>
            <Link to="/watchtower" className="flex items-center gap-2">
              <img
                src="/watchtower-favicon.png"
                alt="Watchtower"
                width={28}
                height={28}
                className="h-7 w-7 object-contain"
                loading="lazy"
              />
              <span className="font-mono text-sm font-bold text-primary tracking-wider">WATCHTOWER</span>
            </Link>
          </div>

          <div className="hidden md:flex items-center gap-8">
            {[
              { label: "INÍCIO", href: "#inicio" },
              { label: "ARQUITETURA", href: "#funcionalidades" },
              { label: "PLANOS", href: "#planos" },
              { label: "FAQ", href: "#faq" },
            ].map((l) => (
              <a
                key={l.label}
                href={l.href}
                className="font-mono text-xs tracking-widest text-muted-foreground hover:text-foreground transition-colors"
              >
                {l.label}
              </a>
            ))}
            <Button
              size="sm"
              className="font-mono text-xs tracking-widest"
              onClick={() => navigate("/watchtower/auth")}
            >
              [ENTRAR]
            </Button>
          </div>
        </div>
      </nav>

      {/* ── Hero ────────────────────────────────────────────────────────────── */}
      <section id="inicio" className="relative pt-32 pb-24 px-6 overflow-hidden min-h-[600px] flex items-center">
        {/* Grid pattern background */}
        <div
          className="absolute inset-0 -z-10"
          style={{
            backgroundImage: `
              linear-gradient(hsl(var(--border) / 0.45) 1px, transparent 1px),
              linear-gradient(90deg, hsl(var(--border) / 0.45) 1px, transparent 1px)
            `,
            backgroundSize: "40px 40px",
          }}
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-background/40 via-background/75 to-background" />

        <div className="max-w-7xl mx-auto w-full flex flex-col items-center text-center">
          {/* Static logo with subtle glow */}
          <img
            src="/watchtower-favicon.png"
            alt="Watchtower"
            width={80}
            height={80}
            className="h-20 w-20 object-contain mb-10"
            style={{ filter: "drop-shadow(0 0 18px hsl(var(--primary) / 0.35))" }}
            loading="eager"
          />

          {/* Terminal headline */}
          <div className="font-mono font-bold leading-tight mb-8 text-left">
            <div className="text-4xl md:text-6xl">
              <span className="text-primary">&gt;_</span>
              <span className="ml-3">VIGILÂNCIA INTELIGENTE</span>
            </div>
            <div className="text-4xl md:text-6xl mt-1">
              <span className="invisible">&gt;_</span>
              <span className="ml-3">EM TEMPO REAL</span>
              <span className="text-primary animate-pulse ml-1">|</span>
            </div>
          </div>

          {/* Comment subtitle */}
          <p className="font-mono text-sm text-muted-foreground mb-10 tracking-wide">
            <span className="text-primary/50">{"/* "}</span>
            monitoramento 24/7 · streaming HLS · acesso seguro
            <span className="text-primary/50">{" */"}</span>
          </p>

          {/* CTAs */}
          <div className="flex items-center gap-4 flex-wrap justify-center">
            <Button
              size="lg"
              className="font-mono text-xs tracking-widest px-10"
              onClick={() => navigate("/watchtower/auth")}
            >
              [ENTRAR]
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="font-mono text-xs tracking-widest px-10"
              onClick={() => document.getElementById("planos")?.scrollIntoView({ behavior: "smooth" })}
            >
              [VER PLANOS]
            </Button>
          </div>
        </div>
      </section>

      {/* ── Stats bar ───────────────────────────────────────────────────────── */}
      <div className="border-y border-border/50 py-5 px-6 bg-muted/20">
        <div className="max-w-7xl mx-auto">
          <p className="font-mono text-xs text-center text-muted-foreground tracking-wide">
            <span className="text-primary/60">// </span>
            <span className="text-foreground font-medium">99.9%</span> uptime garantido
            <span className="text-primary/40 mx-3">·</span>
            <span className="text-foreground font-medium">256-bit</span> criptografia TLS
            <span className="text-primary/40 mx-3">·</span>
            <span className="text-foreground font-medium">24/7</span> suporte técnico
            <span className="text-primary/40 mx-3">·</span>
            <span className="text-foreground font-medium">HLS</span> streaming em tempo real
          </p>
        </div>
      </div>

      {/* ── ARQUITETURA ─────────────────────────────────────────────────────── */}
      <section id="funcionalidades" className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <p className="font-mono text-xs tracking-widest text-primary text-center mb-3">// COMO FUNCIONA</p>
          <h2 className="font-mono text-2xl md:text-3xl font-bold text-center mb-4 tracking-wider">ARQUITETURA</h2>
          <p className="font-mono text-xs text-muted-foreground text-center mb-16">
            <span className="text-primary/50">{"/* "}</span>
            sistema de monitoramento em 3 etapas
            <span className="text-primary/50">{" */"}</span>
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {steps.map((step) => (
              <div
                key={step.num}
                className="border border-border rounded-sm p-8 bg-card hover:border-primary/40 transition-colors"
              >
                <span className="font-mono text-5xl font-bold text-primary/20">{step.num}</span>
                <div className="mt-4 mb-3">
                  <step.icon className="h-5 w-5 text-primary" />
                </div>
                <p className="font-mono text-xs tracking-widest text-primary font-semibold mb-3">{step.title}</p>
                <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Planos — tabela comparativa ─────────────────────────────────────── */}
      <section id="planos" className="py-24 px-6 bg-secondary/20">
        <div className="max-w-5xl mx-auto">
          <p className="font-mono text-xs tracking-widest text-primary text-center mb-3">// PLANOS E PREÇOS</p>
          <h2 className="font-mono text-2xl md:text-3xl font-bold text-center mb-16 tracking-wider">
            COMPARATIVO DE PLANOS
          </h2>

          {plansLoading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
            </div>
          ) : plans.length === 0 ? (
            <p className="font-mono text-center text-sm text-muted-foreground py-16">
              // nenhum plano disponível no momento
            </p>
          ) : (
            <>
              <div className="overflow-x-auto border border-border rounded-sm">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="py-4 px-5 text-left w-40 bg-muted/30" />
                      {plans.map((plan) => {
                        const isPopular = plan.planTier === "Silver";
                        return (
                          <th
                            key={plan.id}
                            className={`py-4 px-5 text-center font-mono text-xs tracking-widest ${
                              isPopular ? "bg-primary/5" : "bg-muted/30"
                            }`}
                          >
                            <span className={isPopular ? "text-primary" : "text-muted-foreground"}>
                              {plan.name.toUpperCase()}
                            </span>
                            {isPopular && (
                              <span className="block font-mono text-[10px] font-normal text-primary mt-1.5 tracking-wider">
                                ★ POPULAR
                              </span>
                            )}
                          </th>
                        );
                      })}
                    </tr>
                  </thead>

                  <tbody className="font-mono text-xs divide-y divide-border/60">
                    {/* Preço */}
                    <tr>
                      <td className="py-3 px-5 text-muted-foreground bg-muted/10">Preço</td>
                      {plans.map((plan) => {
                        const isPopular = plan.planTier === "Silver";
                        return (
                          <td
                            key={plan.id}
                            className={`py-3 px-5 text-center font-semibold ${
                              isPopular ? "bg-primary/5 text-primary" : "text-foreground"
                            }`}
                          >
                            {formatPrice(plan.priceBrl)}
                            {plan.durationDays > 1 && (
                              <span className="font-normal text-muted-foreground">/mês</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>

                    {/* Duração */}
                    <tr>
                      <td className="py-3 px-5 text-muted-foreground bg-muted/10">Duração</td>
                      {plans.map((plan) => (
                        <td
                          key={plan.id}
                          className={`py-3 px-5 text-center text-foreground ${
                            plan.planTier === "Silver" ? "bg-primary/5" : ""
                          }`}
                        >
                          {plan.durationDays === 1 ? "1 dia" : "30 dias"}
                        </td>
                      ))}
                    </tr>

                    {/* Ao Vivo */}
                    <tr>
                      <td className="py-3 px-5 text-muted-foreground bg-muted/10">Ao Vivo</td>
                      {plans.map((plan) => (
                        <td
                          key={plan.id}
                          className={`py-3 px-5 text-center text-primary ${
                            plan.planTier === "Silver" ? "bg-primary/5" : ""
                          }`}
                        >
                          ✓
                        </td>
                      ))}
                    </tr>

                    {/* Gravações */}
                    <tr>
                      <td className="py-3 px-5 text-muted-foreground bg-muted/10">Gravações</td>
                      {plans.map((plan) => (
                        <td
                          key={plan.id}
                          className={`py-3 px-5 text-center ${
                            plan.planTier === "Silver" ? "bg-primary/5" : ""
                          } ${plan.recordingDaysLimit ? "text-primary" : "text-muted-foreground/40"}`}
                        >
                          {plan.recordingDaysLimit ? `${plan.recordingDaysLimit} dias` : "✗"}
                        </td>
                      ))}
                    </tr>

                    {/* Download */}
                    <tr>
                      <td className="py-3 px-5 text-muted-foreground bg-muted/10">Download</td>
                      {plans.map((plan) => (
                        <td
                          key={plan.id}
                          className={`py-3 px-5 text-center ${
                            plan.planTier === "Silver" ? "bg-primary/5" : ""
                          } ${plan.canDownload ? "text-primary" : "text-muted-foreground/40"}`}
                        >
                          {plan.canDownload ? "✓" : "✗"}
                        </td>
                      ))}
                    </tr>

                    {/* CTA row */}
                    <tr className="border-t border-border">
                      <td className="py-4 px-5 bg-muted/10" />
                      {plans.map((plan) => {
                        const isPopular = plan.planTier === "Silver";
                        return (
                          <td
                            key={plan.id}
                            className={`py-4 px-5 text-center ${isPopular ? "bg-primary/5" : ""}`}
                          >
                            <Button
                              size="sm"
                              variant={isPopular ? "default" : "outline"}
                              className="font-mono text-xs tracking-widest w-full"
                              onClick={() => navigate("/watchtower/auth")}
                            >
                              [PIX]
                            </Button>
                          </td>
                        );
                      })}
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Taxa de ativação */}
              <div className="mt-6 border border-border/60 rounded-sm p-4 bg-muted/20">
                <p className="font-mono text-xs text-muted-foreground">
                  <span className="text-primary/70">// </span>
                  Taxa única de ativação:{" "}
                  <span className="text-foreground font-semibold">R$ 150,00</span> — cobrada apenas na configuração
                  inicial das câmeras.
                </p>
              </div>
            </>
          )}
        </div>
      </section>

      {/* ── FAQ ─────────────────────────────────────────────────────────────── */}
      <section id="faq" className="py-24 px-6">
        <div className="max-w-3xl mx-auto">
          <p className="font-mono text-xs tracking-widest text-primary text-center mb-3">// PERGUNTAS FREQUENTES</p>
          <h2 className="font-mono text-2xl md:text-3xl font-bold text-center mb-12 tracking-wider">FAQ</h2>

          <Accordion type="single" collapsible className="space-y-3">
            {faqs.map((faq, i) => (
              <AccordionItem
                key={i}
                value={`item-${i}`}
                className="border border-border rounded-sm px-6 bg-card"
              >
                <AccordionTrigger className="font-mono text-xs tracking-wide text-foreground hover:no-underline py-4 text-left">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground leading-relaxed">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────────────── */}
      <footer className="border-t border-border py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between gap-8">
          <div>
            <div className="flex items-center gap-2">
              <img
                src="/watchtower-favicon.png"
                alt="Watchtower"
                width={28}
                height={28}
                className="h-7 w-7 object-contain"
                loading="lazy"
              />
              <span className="font-mono text-sm font-bold text-primary tracking-wider">WATCHTOWER MONITORAMENTOS</span>
            </div>
            <p className="font-mono text-xs text-muted-foreground mt-3 max-w-xs">
              <span className="text-primary/50">// </span>vigilância inteligente de câmeras
            </p>
          </div>

          <div className="flex gap-12 md:gap-16">
            <div>
              <p className="font-mono text-xs tracking-widest font-semibold text-foreground mb-3">PRODUTO</p>
              <ul className="space-y-2 font-mono text-xs text-muted-foreground">
                <li>
                  <a href="#funcionalidades" className="hover:text-foreground transition-colors">
                    Arquitetura
                  </a>
                </li>
                <li>
                  <a href="#planos" className="hover:text-foreground transition-colors">
                    Planos
                  </a>
                </li>
                <li>
                  <a href="#faq" className="hover:text-foreground transition-colors">
                    FAQ
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <p className="font-mono text-xs tracking-widest font-semibold text-foreground mb-3">EMPRESA</p>
              <ul className="space-y-2 font-mono text-xs text-muted-foreground">
                <li>
                  <Link to="/watchtower/about" className="hover:text-foreground transition-colors">
                    Sobre
                  </Link>
                </li>
                <li>
                  <Link to="/watchtower/contact" className="hover:text-foreground transition-colors">
                    Contato
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <p className="font-mono text-xs tracking-widest font-semibold text-foreground mb-3">PORTAL</p>
              <ul className="space-y-2 font-mono text-xs text-muted-foreground">
                <li>
                  <Link to="/" className="hover:text-foreground transition-colors">
                    Site Principal
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto mt-8 pt-6 border-t border-border flex items-center justify-between">
          <p className="font-mono text-xs text-muted-foreground">
            © {new Date().getFullYear()} Watchtower Monitoramentos. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}
