import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Camera, Shield, Monitor, UserPlus, ChevronLeft, CheckCircle2, Loader2, Lock } from "lucide-react";
import { useState, useEffect } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import cctvBackground from "@/assets/watchtower/cctv-background.jpg";
import { Link } from "react-router-dom";
import { apiClient } from "@/watchtower/services/apiClient";
import type { AdminPlanDto } from "@/watchtower/types/api";

function formatPrice(priceBrl: number): string {
  return `R$ ${priceBrl.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function getPlanFeaturesList(plan: AdminPlanDto): string[] {
  const list: string[] = ["Visualização ao vivo em tempo real"];
  if (plan.features === "WithRecordings" || plan.features === "WithDownloads") {
    list.push(`Gravações por ${plan.recordingDaysLimit ?? 0} dias`);
  }
  if (plan.features === "WithDownloads") {
    list.push("Download de gravações");
  }
  if (plan.durationDays === 1) {
    list.push("Acesso por 24 horas");
  }
  return list;
}

const stats = [
  { icon: Monitor, label: "STREAMING HLS EM TEMPO REAL" },
  { icon: Lock, label: "CONEXÕES CRIPTOGRAFADAS TLS" },
  { icon: Shield, label: "SUPORTE 24/7" },
];

const steps = [
  { num: "01", icon: UserPlus, title: "CADASTRE-SE", subtitle: "Crie sua Conta", desc: "Crie seu perfil e configure seu painel de monitoramento em poucos minutos." },
  { num: "02", icon: Camera, title: "CONECTE CÂMERAS", subtitle: "Adicione seus Dispositivos", desc: "Conecte suas câmeras facilmente usando a cloud de qualquer web browser." },
  { num: "03", icon: Monitor, title: "MONITORE", subtitle: "Acompanhe em Tempo Real", desc: "Acesse sua feed ao vivo e acesse gravações de qualquer lugar, a hora que quiser." },
];

export default function WatchtowerLanding() {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [plans, setPlans] = useState<AdminPlanDto[]>([]);
  const [plansLoading, setPlansLoading] = useState(true);
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 500], [0, 150]);

  useEffect(() => {
    const unsubscribe = scrollY.on("change", (v) => setScrolled(v > 50));
    return unsubscribe;
  }, [scrollY]);

  useEffect(() => {
    apiClient.get<AdminPlanDto[]>("/api/plans", false)
      .then(setPlans)
      .catch(() => {})
      .finally(() => setPlansLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navbar */}
      <motion.nav className={`fixed top-0 left-0 right-0 z-50 border-b transition-all duration-300 ${scrolled ? "border-border/80 bg-background/95 backdrop-blur-xl shadow-lg shadow-background/50" : "border-border/30 bg-background/60 backdrop-blur-md"}`}>
        <div className={`max-w-7xl mx-auto px-6 flex items-center justify-between transition-all duration-300 ${scrolled ? "h-12" : "h-16"}`}>
          <div className="flex items-center gap-4">
            <Link to="/" className="text-xs tracking-[0.2em] text-muted-foreground hover:text-foreground transition-colors">
              <ChevronLeft className="h-4 w-4 inline mr-1" />SITE
            </Link>
            <Link to="/watchtower" className="flex items-center gap-2">
              <img
                src="/watchtower-favicon.png"
                alt="Watchtower Monitoramentos"
                width={32}
                height={32}
                className={`object-contain transition-all duration-300 ${scrolled ? "h-7 w-7" : "h-8 w-8"}`}
                loading="lazy"
              />
              <span className={`font-display font-bold text-primary tracking-wider transition-all duration-300 ${scrolled ? "text-base" : "text-lg"}`}>WATCHTOWER MONITORAMENTOS</span>
            </Link>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#inicio" className="text-xs tracking-[0.2em] text-muted-foreground hover:text-foreground transition-colors">INÍCIO</a>
            <a href="#funcionalidades" className="text-xs tracking-[0.2em] text-muted-foreground hover:text-foreground transition-colors">FUNCIONALIDADES</a>
            <a href="#planos" className="text-xs tracking-[0.2em] text-muted-foreground hover:text-foreground transition-colors">PLANOS</a>
            
            <a href="#faq" className="text-xs tracking-[0.2em] text-muted-foreground hover:text-foreground transition-colors">FAQ</a>
            <Button size="sm" className="gradient-primary text-primary-foreground text-xs tracking-wider font-semibold" onClick={() => navigate("/watchtower/auth")}>ENTRAR</Button>
          </div>
        </div>
      </motion.nav>

      {/* Hero */}
      <section id="inicio" className="relative pt-32 pb-20 px-6 overflow-hidden">
        <motion.div style={{ y }} className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-15" style={{ backgroundImage: `url(${cctvBackground})` }} />
          <div className="absolute inset-0 bg-gradient-to-b from-background via-background/80 to-background" />
        </motion.div>
        <div className="max-w-7xl mx-auto relative z-10 text-center flex flex-col items-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="mb-8 relative"
          >
            <motion.div
              className="absolute inset-0 bg-primary/30 blur-3xl rounded-full -z-10"
              animate={{ scale: [1, 1.25, 1], opacity: [0.5, 0.9, 0.5] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.img
              src="/watchtower-favicon.png"
              alt="Watchtower Monitoramentos"
              width={112}
              height={112}
              className="h-24 w-24 md:h-28 md:w-28 object-contain"
              animate={{
                filter: [
                  "drop-shadow(0 0 15px hsl(var(--primary) / 0.3))",
                  "drop-shadow(0 0 30px hsl(var(--primary) / 0.6))",
                  "drop-shadow(0 0 15px hsl(var(--primary) / 0.3))",
                ],
              }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            />
          </motion.div>
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.15 }} className="font-display text-4xl md:text-6xl font-light leading-tight max-w-4xl tracking-tight">
            VIGILÂNCIA <span className="text-primary font-semibold">INTELIGENTE</span> PARA{" "}<span className="text-primary font-semibold">SUA SEGURANÇA</span>
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }} className="mt-6 text-muted-foreground max-w-2xl text-base md:text-lg font-light leading-relaxed">
            Monitore suas câmeras em tempo real, acesse gravações e gerencie tudo em um único painel profissional.
          </motion.p>
        </div>
      </section>

      {/* Stats bar */}
      <div className="border-y border-border/50 py-6 px-6">
        <div className="max-w-7xl mx-auto flex flex-wrap justify-around gap-6">
          {stats.map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: i * 0.1 }} className="flex items-center gap-3">
              <s.icon className="h-5 w-5 text-primary shrink-0" />
              <span className="text-xs tracking-[0.15em] text-muted-foreground font-medium">{s.label}</span>
            </motion.div>
          ))}
        </div>
      </div>

      {/* How it works */}
      <section id="funcionalidades" className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.p initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }} className="text-xs tracking-[0.2em] text-primary font-medium text-center mb-3">COMO FUNCIONA</motion.p>
          <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.1 }} className="font-display text-3xl md:text-4xl font-bold text-center mb-16">Monitoramento em 3 Passos</motion.h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {steps.map((step, i) => (
              <motion.div key={step.num} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: i * 0.2 }} whileHover={{ y: -5 }} className="border border-border rounded-lg p-8 hover:border-primary/30 transition-colors">
                <span className="font-display text-5xl font-bold text-primary/20">{step.num}</span>
                <div className="mt-4 mb-2"><step.icon className="h-6 w-6 text-primary" /></div>
                <p className="text-xs tracking-[0.15em] text-primary font-medium mb-1">{step.title}</p>
                <h3 className="text-lg font-semibold text-foreground mb-2">{step.subtitle}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="planos" className="py-24 px-6 bg-secondary/30">
        <div className="max-w-7xl mx-auto">
          <motion.p initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }} className="text-xs tracking-[0.2em] text-primary font-medium text-center mb-3">PLANOS E PREÇOS</motion.p>
          <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.1 }} className="font-display text-3xl md:text-4xl font-bold text-center mb-4">Escolha o Plano Ideal</motion.h2>
          <motion.p initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.2 }} className="text-sm text-muted-foreground text-center mb-16">Monitore suas câmeras com o nível de acesso que você precisa</motion.p>
          {plansLoading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
            </div>
          ) : plans.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-16">Nenhum plano disponível no momento.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {plans.map((plan, i) => {
                const highlight = plan.planTier === "Silver";
                const price = formatPrice(plan.priceBrl);
                const suffix = plan.durationDays === 1 ? "" : "/mês";
                const period = plan.durationDays === 1 ? "Acesso por 24 horas" : "Plano Mensal";
                const features = getPlanFeaturesList(plan);
                return (
                  <motion.div key={plan.id} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: i * 0.1 }} whileHover={{ y: -8, scale: 1.02 }} className={`rounded-lg border p-6 flex flex-col ${highlight ? "border-primary bg-primary/5 shadow-glow relative" : "border-border bg-card"}`}>
                    {highlight && <span className="absolute -top-3 right-4 bg-primary text-primary-foreground text-[10px] tracking-wider font-semibold px-3 py-1 rounded-sm">MAIS POPULAR</span>}
                    <h3 className="font-display text-sm font-semibold tracking-wider mt-2">{plan.name}</h3>
                    <p className="text-xs text-muted-foreground mt-1 mb-4">{period}</p>
                    <div className="mb-6"><span className="font-display text-3xl font-bold">{price}</span><span className="text-xs text-muted-foreground">{suffix}</span></div>
                    <ul className="space-y-2 mb-8 flex-1">
                      {features.map((f) => (<li key={f} className="text-xs text-muted-foreground flex items-start gap-2"><span className="text-primary mt-0.5">•</span>{f}</li>))}
                    </ul>
                    <Button variant={highlight ? "default" : "outline"} className={`w-full text-xs tracking-wider font-semibold ${highlight ? "gradient-primary text-primary-foreground" : "border-border"}`} onClick={() => navigate("/watchtower/auth")}>Contratar</Button>
                  </motion.div>
                );
              })}
            </div>
          )}
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.4 }} className="max-w-4xl mx-auto mt-12">
            <div className="border border-primary/30 rounded-lg bg-primary/5 p-6 flex items-start gap-4">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <svg className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              </div>
              <div className="flex-1">
                <h3 className="font-display text-sm font-bold tracking-wider text-foreground mb-2">TAXA DE ATIVAÇÃO</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">Taxa única de <span className="text-primary font-semibold">R$ 150,00</span> para ativação de novas câmeras. Cobrada apenas na primeira configuração do serviço.</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
            <p className="text-xs tracking-[0.2em] text-primary font-medium mb-4">COMECE AGORA</p>
            <h2 className="font-display text-4xl font-bold leading-tight mb-6">Proteja o Que<br />Mais Importa</h2>
            <p className="text-sm text-muted-foreground leading-relaxed mb-8">Cadastre-se gratuitamente e comece a monitorar suas câmeras em minutos.</p>
            <ul className="space-y-3">
              {["Configuração em menos de 5 minutos", "Suporte técnico 24/7 incluído", "Sem taxa de cartão exigido"].map((text, i) => (
                <motion.li key={i} initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.2 + i * 0.1 }} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4 text-primary" />{text}
                </motion.li>
              ))}
            </ul>
          </motion.div>
          <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="border border-border rounded-lg p-8 bg-card">
            <h3 className="font-display text-xl font-bold mb-6">ENTRAR</h3>
            <p className="text-xs text-muted-foreground mb-6">Acesse seu painel de monitoramento</p>
            <Button className="w-full gradient-primary text-primary-foreground font-semibold text-xs tracking-wider" onClick={() => navigate("/watchtower/auth")}>ENTRAR →</Button>
            <Button variant="outline" className="w-full mt-3 border-border text-xs tracking-wider" onClick={() => navigate("/watchtower/auth?mode=signup")}>CRIAR CONTA ✎</Button>
          </motion.div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-24 px-6 bg-secondary/30">
        <div className="max-w-3xl mx-auto">
          <motion.p initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }} className="text-xs tracking-[0.2em] text-primary font-medium text-center mb-3">PERGUNTAS FREQUENTES</motion.p>
          <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.1 }} className="font-display text-3xl md:text-4xl font-bold text-center mb-12">Tire Suas Dúvidas</motion.h2>
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.2 }}>
            <Accordion type="single" collapsible className="space-y-4">
              <AccordionItem value="item-1" className="border border-border rounded-lg px-6 bg-card"><AccordionTrigger className="text-sm font-semibold text-foreground hover:no-underline py-4">Preciso de equipamento especial para usar a Watchtower Monitoramentos?</AccordionTrigger><AccordionContent className="text-sm text-muted-foreground leading-relaxed">Não! A Watchtower Monitoramentos funciona com qualquer câmera IP compatível com RTSP ou HLS.</AccordionContent></AccordionItem>
              <AccordionItem value="item-2" className="border border-border rounded-lg px-6 bg-card"><AccordionTrigger className="text-sm font-semibold text-foreground hover:no-underline py-4">Quanto tempo de gravação fica disponível?</AccordionTrigger><AccordionContent className="text-sm text-muted-foreground leading-relaxed">Depende do plano contratado. Bronze: ao vivo. Prata: 7 dias. Ouro: 30 dias com download.</AccordionContent></AccordionItem>
              <AccordionItem value="item-3" className="border border-border rounded-lg px-6 bg-card"><AccordionTrigger className="text-sm font-semibold text-foreground hover:no-underline py-4">É seguro acessar minhas câmeras pela internet?</AccordionTrigger><AccordionContent className="text-sm text-muted-foreground leading-relaxed">Sim! Utilizamos criptografia TLS/SSL para todas as conexões.</AccordionContent></AccordionItem>
              <AccordionItem value="item-4" className="border border-border rounded-lg px-6 bg-card"><AccordionTrigger className="text-sm font-semibold text-foreground hover:no-underline py-4">Posso cancelar a qualquer momento?</AccordionTrigger><AccordionContent className="text-sm text-muted-foreground leading-relaxed">Sim! Não há contratos de fidelidade. Cancele quando quiser.</AccordionContent></AccordionItem>
              <AccordionItem value="item-5" className="border border-border rounded-lg px-6 bg-card"><AccordionTrigger className="text-sm font-semibold text-foreground hover:no-underline py-4">Como funciona o suporte técnico?</AccordionTrigger><AccordionContent className="text-sm text-muted-foreground leading-relaxed">Suporte via chat e e-mail 24/7 para todos os clientes. Planos Ouro têm prioridade.</AccordionContent></AccordionItem>
            </Accordion>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between gap-8">
          <div>
            <div className="flex items-center gap-2">
              <img src="/watchtower-favicon.png" alt="Watchtower Monitoramentos" width={32} height={32} className="h-8 w-8 object-contain" loading="lazy" />
              <span className="font-display text-base font-bold text-primary tracking-wider">WATCHTOWER MONITORAMENTOS</span>
            </div>
            <p className="text-xs text-muted-foreground mt-3 max-w-xs">Vigilância inteligente de câmeras</p>
          </div>
          <div className="flex gap-12 md:gap-16">
            <div>
              <p className="text-xs tracking-wider font-semibold text-foreground mb-3">PRODUTO</p>
              <ul className="space-y-2 text-xs text-muted-foreground">
                <li><a href="#funcionalidades" className="hover:text-foreground transition-colors">Funcionalidades</a></li>
                <li><a href="#planos" className="hover:text-foreground transition-colors">Planos</a></li>
                <li><a href="#faq" className="hover:text-foreground transition-colors">FAQ</a></li>
              </ul>
            </div>
            <div>
              <p className="text-xs tracking-wider font-semibold text-foreground mb-3">EMPRESA</p>
              <ul className="space-y-2 text-xs text-muted-foreground">
                <li><Link to="/watchtower/about" className="hover:text-foreground transition-colors">Sobre</Link></li>
                <li><Link to="/watchtower/contact" className="hover:text-foreground transition-colors">Contato</Link></li>
                <li><Link to="/watchtower/blog" className="hover:text-foreground transition-colors">Blog</Link></li>
              </ul>
            </div>
            <div>
              <p className="text-xs tracking-wider font-semibold text-foreground mb-3">PORTAL</p>
              <ul className="space-y-2 text-xs text-muted-foreground">
                <li><Link to="/" className="hover:text-foreground transition-colors">Site Principal</Link></li>
              </ul>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-8 pt-6 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} Watchtower Monitoramentos. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
