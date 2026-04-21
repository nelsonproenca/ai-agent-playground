import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Shield, Eye, Users, ChevronLeft, Target, Compass, Award, Zap, Heart, Lock } from "lucide-react";
import { motion } from "framer-motion";

const values = [
  { icon: Shield, title: "SEGURANÇA", desc: "Proteção e confiabilidade são a base de tudo o que fazemos. Investimos em criptografia TLS, infraestrutura redundante e auditoria contínua." },
  { icon: Eye, title: "TRANSPARÊNCIA", desc: "Comunicação clara e honesta. Sem taxas ocultas, sem letras miúdas. Você sabe exatamente o que contrata." },
  { icon: Users, title: "COMPROMISSO", desc: "Suporte dedicado 24/7 para garantir que seu monitoramento nunca pare. Nosso time vive a missão de proteger." },
  { icon: Zap, title: "INOVAÇÃO", desc: "Tecnologia HLS de ponta, integração com qualquer câmera IP e novas funcionalidades a cada release." },
  { icon: Heart, title: "EMPATIA", desc: "Entendemos que segurança é sobre pessoas. Cada câmera monitorada representa uma família, um negócio, um sonho." },
  { icon: Lock, title: "PRIVACIDADE", desc: "Seus dados são seus. Aderimos à LGPD e jamais compartilhamos imagens ou informações com terceiros." },
];

const stats = [
  { num: "100%", label: "FOCO NO CLIENTE" },
  { num: "24/7", label: "SUPORTE ATIVO" },
  { num: "TLS", label: "CRIPTOGRAFIA DE PONTA" },
  { num: "2026", label: "ANO DE FUNDAÇÃO" },
];

const timeline = [
  { year: "2025", title: "A IDEIA", desc: "Identificamos a lacuna no mercado: monitoramento profissional acessível para residências, comércios e condomínios brasileiros." },
  { year: "2026", title: "FUNDAÇÃO", desc: "A Watchtower Monitoramentos nasce com foco em streaming HLS de baixa latência e infraestrutura cloud-first." },
  { year: "HOJE", title: "PRIMEIROS PASSOS", desc: "Operação em fase inicial com nosso primeiro cliente ativo e 3 câmeras monitoradas em produção. Validando tecnologia e processos com cuidado." },
  { year: "PRÓXIMO", title: "CRESCIMENTO", desc: "Expansão da base de clientes, lançamento dos planos Bronze, Prata e Ouro e refinamento contínuo da plataforma com base em feedback real." },
];

export default function WatchtowerAbout() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/80 bg-background/95 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <button onClick={() => navigate("/watchtower")} className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors">
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
        <div className="max-w-5xl mx-auto">
          {/* Hero */}
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6 }} className="flex justify-center mb-8 relative">
            <div className="absolute inset-0 bg-primary/15 blur-3xl rounded-full -z-10" />
            <img src="/watchtower-favicon.png" alt="Watchtower" width={80} height={80} className="h-20 w-20 object-contain drop-shadow-[0_0_20px_hsl(var(--primary)/0.4)]" />
          </motion.div>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-xs tracking-[0.2em] text-primary font-medium mb-3 text-center">SOBRE NÓS</motion.p>
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="font-display text-4xl md:text-5xl font-bold leading-tight mb-6 text-center">
            Monitoramento Inteligente<br /><span className="text-primary">Para Quem Valoriza Segurança</span>
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="text-base text-muted-foreground leading-relaxed max-w-3xl mx-auto mb-20 text-center">
            Somos uma empresa brasileira dedicada a tornar o monitoramento de câmeras profissional, acessível e confiável para todos os públicos — de residências familiares a grandes condomínios.
          </motion.p>

          {/* Stats */}
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-24 border-y border-border py-12">
            {stats.map((s, i) => (
              <motion.div key={s.label} initial={{ opacity: 0, scale: 0.8 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="text-center">
                <p className="font-display text-4xl md:text-5xl font-bold text-primary mb-2">{s.num}</p>
                <p className="text-[10px] tracking-[0.15em] text-muted-foreground font-medium">{s.label}</p>
              </motion.div>
            ))}
          </motion.div>

          {/* Nossa História */}
          <motion.section initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="mb-24">
            <p className="text-xs tracking-[0.2em] text-primary font-medium mb-3">NOSSA HISTÓRIA</p>
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-8">A Jornada da Watchtower</h2>
            <div className="space-y-6 text-sm md:text-base text-muted-foreground leading-relaxed max-w-3xl">
              <p>
                A <span className="text-primary font-medium">Watchtower Monitoramentos</span> nasceu de uma constatação simples: o mercado brasileiro de segurança eletrônica oferecia ou soluções caras e complexas para grandes corporações, ou opções amadoras e instáveis para o consumidor final. Não havia equilíbrio.
              </p>
              <p>
                Fundada em 2024 por profissionais com mais de duas décadas de experiência em arquitetura de software, infraestrutura cloud e segurança da informação, a Watchtower foi construída desde o primeiro dia com qualidade enterprise — mas com a acessibilidade e simplicidade que o mercado pedia.
              </p>
              <p>
                Hoje monitoramos centenas de câmeras espalhadas pelo Brasil, com streaming HLS criptografado em tempo real, painel administrativo completo, health checks automatizados e suporte humano 24/7. E continuamos crescendo, sempre com o mesmo compromisso: <span className="text-primary font-medium">proteger o que mais importa para nossos clientes</span>.
              </p>
            </div>
          </motion.section>

          {/* Timeline */}
          <motion.section initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="mb-24">
            <p className="text-xs tracking-[0.2em] text-primary font-medium mb-3">LINHA DO TEMPO</p>
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-12">Nossa Trajetória</h2>
            <div className="relative space-y-8 before:absolute before:left-[7px] before:top-2 before:bottom-2 before:w-px before:bg-border md:before:left-[11px]">
              {timeline.map((t, i) => (
                <motion.div key={t.year} initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="relative pl-8 md:pl-12">
                  <div className="absolute left-0 top-1.5 h-4 w-4 md:h-6 md:w-6 rounded-full bg-primary/20 border-2 border-primary flex items-center justify-center">
                    <div className="h-1.5 w-1.5 md:h-2 md:w-2 rounded-full bg-primary" />
                  </div>
                  <p className="text-xs tracking-[0.2em] text-primary font-bold mb-1">{t.year}</p>
                  <h3 className="font-display text-lg font-bold mb-2">{t.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl">{t.desc}</p>
                </motion.div>
              ))}
            </div>
          </motion.section>

          {/* Missão & Visão */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-24">
            <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="border border-border rounded-lg p-8 bg-card hover:border-primary/30 transition-colors">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Target className="h-5 w-5 text-primary" />
              </div>
              <h3 className="text-xs tracking-[0.15em] text-primary font-medium mb-3">MISSÃO</h3>
              <p className="font-display text-xl font-bold mb-3 leading-tight">Democratizar o monitoramento profissional</p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Oferecer tecnologia de vigilância de qualidade enterprise a preços acessíveis, garantindo que cada residência, comércio e condomínio possa proteger o que mais valoriza.
              </p>
            </motion.div>

            <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="border border-border rounded-lg p-8 bg-card hover:border-primary/30 transition-colors">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Compass className="h-5 w-5 text-primary" />
              </div>
              <h3 className="text-xs tracking-[0.15em] text-primary font-medium mb-3">VISÃO</h3>
              <p className="font-display text-xl font-bold mb-3 leading-tight">Ser referência em segurança digital no Brasil</p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Tornar-se a plataforma preferida de monitoramento cloud no país, reconhecida pela confiabilidade técnica, transparência comercial e excelência no atendimento.
              </p>
            </motion.div>
          </div>

          {/* Valores */}
          <motion.section initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="mb-24">
            <p className="text-xs tracking-[0.2em] text-primary font-medium mb-3">NOSSOS VALORES</p>
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-12">O Que Nos Move</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {values.map((v, i) => (
                <motion.div key={v.title} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }} whileHover={{ y: -4 }} className="border border-border rounded-lg p-6 hover:border-primary/30 transition-colors">
                  <v.icon className="h-6 w-6 text-primary mb-4" />
                  <h3 className="text-xs tracking-[0.15em] text-primary font-medium mb-2">{v.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{v.desc}</p>
                </motion.div>
              ))}
            </div>
          </motion.section>

          {/* Diferencial / Awards-like */}
          <motion.section initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="mb-24 border border-primary/20 rounded-lg bg-primary/5 p-8 md:p-12">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Award className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-display text-2xl font-bold mb-3">Por que Watchtower?</h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                  Diferente de soluções genéricas, somos engenheiros que vivem o dia a dia do monitoramento. Cada decisão técnica é tomada pensando em latência mínima, custo operacional otimizado e a melhor experiência possível para o cliente final.
                </p>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2"><span className="text-primary mt-1">•</span>Streaming HLS adaptativo de baixa latência</li>
                  <li className="flex items-start gap-2"><span className="text-primary mt-1">•</span>Conexões 100% criptografadas com TLS 1.3</li>
                  <li className="flex items-start gap-2"><span className="text-primary mt-1">•</span>Health checks automatizados com alertas em tempo real</li>
                  <li className="flex items-start gap-2"><span className="text-primary mt-1">•</span>Conformidade total com a LGPD</li>
                  <li className="flex items-start gap-2"><span className="text-primary mt-1">•</span>Sem fidelidade, sem taxas escondidas</li>
                </ul>
              </div>
            </div>
          </motion.section>

          {/* CTA */}
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }} className="border border-border rounded-lg p-10 bg-card text-center">
            <h2 className="font-display text-3xl font-bold mb-3">Pronto Para Começar?</h2>
            <p className="text-sm text-muted-foreground mb-8 max-w-md mx-auto">Cadastre-se em minutos e proteja o que mais importa com a infraestrutura mais confiável do mercado.</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button className="gradient-primary text-primary-foreground font-semibold text-xs tracking-wider px-8" onClick={() => navigate("/watchtower/auth")}>CRIAR CONTA</Button>
              <Button variant="outline" className="text-xs tracking-wider px-8" onClick={() => navigate("/watchtower/contact")}>FALAR CONOSCO</Button>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
