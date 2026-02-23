import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Globe, Monitor, Users, ShieldCheck, RefreshCw, Link2,
  Lock, BarChart3, Database, Workflow, LayoutDashboard,
  Cloud, Server, DollarSign, Bot, Cpu, BrainCircuit,
  Layers, Mail, Linkedin, ArrowRight, Phone, Loader2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

type ColabWithQr = {
  id: string;
  nome: string;
  cargo: string | null;
  foto_url: string | null;
  qr_url: string;
};

const PILLARS = [
  {
    icon: Monitor,
    title: "Presença Digital & UX",
    services: [
      { icon: Globe, name: "Aplicações Web de Alta Performance", desc: "Sites e sistemas rápidos, modernos e adaptados para qualquer dispositivo." },
      { icon: Layers, name: "Sistemas Internos Escaláveis", desc: "Plataformas de gestão sob medida para o seu fluxo de trabalho." },
      { icon: Users, name: "Otimização de Experiência", desc: "Foco em usabilidade para converter visitantes em clientes reais." },
    ],
  },
  {
    icon: RefreshCw,
    title: "Evolução & Modernização",
    services: [
      { icon: ShieldCheck, name: "Atualização Tecnológica", desc: "Modernização de sistemas antigos para competitividade e segurança." },
      { icon: Link2, name: "Integração de Sistemas", desc: "Conexão entre softwares para que trabalhem em total harmonia." },
      { icon: Lock, name: "Segurança de Dados Corporativos", desc: "Camadas modernas de proteção para informações críticas." },
    ],
  },
  {
    icon: BarChart3,
    title: "Inteligência de Dados",
    services: [
      { icon: Workflow, name: "Automação de Fluxos de Dados", desc: "Organização automática de informações, eliminando erros manuais." },
      { icon: LayoutDashboard, name: "Painéis de Decisão", desc: "Relatórios visuais inteligentes sobre a saúde do negócio em tempo real." },
      { icon: Database, name: "Arquitetura de Alta Escala", desc: "Bases de dados preparadas para suportar o crescimento da empresa." },
    ],
  },
  {
    icon: Cloud,
    title: "Estratégia em Nuvem",
    services: [
      { icon: Server, name: "Migração Segura para a Nuvem", desc: "Transferência de infraestrutura reduzindo gastos com hardware." },
      { icon: ShieldCheck, name: "Continuidade de Negócio", desc: "Sistemas 24h com backup e recuperação imediata." },
      { icon: DollarSign, name: "Otimização de Custos", desc: "Consultoria para eliminar desperdícios de recursos técnicos." },
    ],
  },
  {
    icon: BrainCircuit,
    title: "IA & Automação",
    services: [
      { icon: Bot, name: "Agentes de Atendimento Inteligente", desc: "Contato automatizado via redes sociais de forma humana e eficiente." },
      { icon: Cpu, name: "Automação de Tarefas Repetitivas", desc: "Robôs de software que executam processos manuais, reduzindo custos." },
      { icon: BarChart3, name: "Análise de Dados com IA", desc: "Inteligência avançada para prever tendências e otimizar suporte." },
    ],
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.06, duration: 0.4 } }),
};

const NAVY = "#0f2b46";
const NAVY_LIGHT = "#1a3a5c";
const GRAPHITE = "#2d3748";
const GRAPHITE_LIGHT = "#4a5568";
const ACCENT = "#1e3a5f";

const LandingPage = () => {
  const navigate = useNavigate();
  const [modalOpen, setModalOpen] = useState(true);
  const [colabsWithQr, setColabsWithQr] = useState<ColabWithQr[]>([]);
  const [loadingColabs, setLoadingColabs] = useState(true);
  const [selectedColab, setSelectedColab] = useState<ColabWithQr | null>(null);

  const fetchColabsWithQr = useCallback(async () => {
    setLoadingColabs(true);
    // Fetch all saved QR files
    const { data: files } = await supabase.storage.from("uploads").list("convites", {
      sortBy: { column: "created_at", order: "desc" },
    });
    if (!files || files.length === 0) {
      setColabsWithQr([]);
      setLoadingColabs(false);
      return;
    }

    const pngFiles = files.filter((f) => f.name.endsWith(".png"));

    // Fetch collaborators
    const { data: colabs } = await supabase.from("colaboradores").select("*").order("nome");
    if (!colabs) {
      setColabsWithQr([]);
      setLoadingColabs(false);
      return;
    }

    // Match collaborators with existing QR files
    const matched: ColabWithQr[] = [];
    for (const colab of colabs) {
      const safeName = colab.nome.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/\s+/g, "-");
      const expectedName = `convite-${safeName}.png`;
      const found = pngFiles.find((f) => f.name === expectedName);
      if (found) {
        const { data: urlData } = supabase.storage.from("uploads").getPublicUrl(`convites/${found.name}`);
        matched.push({
          id: colab.id,
          nome: colab.nome,
          cargo: colab.cargo,
          foto_url: colab.foto_url,
          qr_url: urlData.publicUrl,
        });
      }
    }
    setColabsWithQr(matched);
    setLoadingColabs(false);
  }, []);

  useEffect(() => {
    fetchColabsWithQr();
  }, [fetchColabsWithQr]);

  const handleSelectColab = (colab: ColabWithQr) => {
    setSelectedColab(colab);
    setModalOpen(false);
  };

  const handleGoToCreate = () => {
    navigate("/convites");
  };

  return (
    <div className="min-h-screen bg-white font-sans flyer-a4" style={{ color: GRAPHITE }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700;800&family=Source+Sans+3:wght@300;400;500;600;700&display=swap');
        .flyer-a4 { font-family: 'Source Sans 3', system-ui, sans-serif; }
        .flyer-a4 .font-display { font-family: 'Playfair Display', Georgia, serif; }
        @media print {
          @page { size: A4 portrait; margin: 0; }
          * { break-inside: avoid; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .flyer-a4 { 
            width: 210mm; min-height: 297mm; max-height: 297mm; 
            overflow: hidden; padding: 20px !important;
            font-size: 7.5px !important;
            display: flex !important; flex-direction: column !important;
          }
          .flyer-a4 > div { 
            flex: 1 !important; display: flex !important; flex-direction: column !important; 
            justify-content: space-between !important;
          }
          .flyer-a4 .print-header { padding: 12px 0 8px !important; }
          .flyer-a4 .print-header h1 { font-size: 16px !important; line-height: 1.1 !important; }
          .flyer-a4 .print-header p { font-size: 8px !important; }
          .flyer-a4 .print-grid { gap: 6px !important; margin-top: 6px !important; }
          .flyer-a4 .print-card { padding: 6px 8px !important; break-inside: avoid; }
          .flyer-a4 .print-grid .grid { display: grid !important; }
          .flyer-a4 .print-grid .md\\:grid-cols-3 { grid-template-columns: repeat(3, 1fr) !important; }
          .flyer-a4 .print-grid .md\\:grid-cols-2 { grid-template-columns: repeat(2, 1fr) !important; }
          .flyer-a4 .print-grid .md\\:max-w-\\[66\\.666\\%\\] { max-width: 66.666% !important; }
          .flyer-a4 .print-grid .md\\:mx-auto { margin-left: auto !important; margin-right: auto !important; }
          .flyer-a4 .print-card h3 { font-size: 8.5px !important; margin-bottom: 3px !important; }
          .flyer-a4 .print-card p { font-size: 6.5px !important; line-height: 1.2 !important; }
          .flyer-a4 .print-card .svc-name { font-size: 7px !important; }
          .flyer-a4 .print-card svg { width: 10px !important; height: 10px !important; }
          .flyer-a4 .print-card .pillar-icon svg { width: 14px !important; height: 14px !important; }
          .flyer-a4 .print-cta { padding: 8px !important; margin-top: 6px !important; }
          .flyer-a4 .print-cta h2 { font-size: 10px !important; }
          .flyer-a4 .print-cta p { font-size: 7px !important; }
          .flyer-a4 .print-cta .flex-col { flex-direction: row !important; }
          .flyer-a4 .print-cta .md\\:text-left { text-align: left !important; }
          .flyer-a4 .print-cta .justify-center.md\\:justify-start { justify-content: flex-start !important; }
          .flyer-a4 .print-footer { padding: 6px 0 0 !important; margin-top: 4px !important; }
          .flyer-a4 .print-footer p { font-size: 6.5px !important; }
          .flyer-a4 .print-divider { margin: 4px 0 !important; }
          .no-print { display: none !important; }
        }
      `}</style>

      {/* Collaborator Selection Modal */}
      <Dialog open={modalOpen && !selectedColab} onOpenChange={setModalOpen}>
        <DialogContent hideClose className="sm:max-w-md max-w-[95vw] max-h-[85vh] overflow-y-auto">
          {!loadingColabs && colabsWithQr.length > 0 && (
            <DialogHeader>
              <DialogTitle className="text-center text-lg font-semibold">
                Selecione o Colaborador
              </DialogTitle>
              <DialogDescription className="text-center text-sm">
                Escolha quem será associado a este flyer para impressão
              </DialogDescription>
            </DialogHeader>
          )}

          {loadingColabs ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : colabsWithQr.length === 0 ? (
            <div className="flex flex-col items-center gap-4 py-8 text-center">
              <p className="text-sm text-muted-foreground">
                Nenhum colaborador possui QR Code gerado ainda.
              </p>
              <Button onClick={handleGoToCreate} className="gap-2">
                Criar QR Codes
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-2 py-2">
              {colabsWithQr.map((colab) => (
                <button
                  key={colab.id}
                  onClick={() => handleSelectColab(colab)}
                  className="flex items-center gap-3 w-full rounded-lg border border-border p-3 hover:bg-accent/10 hover:border-primary/40 transition-all text-left"
                >
                  <Avatar className="h-10 w-10 shrink-0">
                    <AvatarImage src={colab.foto_url ?? undefined} />
                    <AvatarFallback className="text-xs bg-secondary">
                      {colab.nome.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="font-medium text-sm text-foreground truncate">{colab.nome}</p>
                    <p className="text-xs text-muted-foreground truncate">{colab.cargo ?? "Sem cargo"}</p>
                  </div>
                </button>
              ))}
            </div>
          )}

          <div className="pt-2 border-t">
            <Button variant="outline" className="w-full gap-2" onClick={() => navigate("/admin")}>
              <ArrowRight className="h-4 w-4 rotate-180" />
              Voltar à Área Restrita
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Safe margin wrapper */}
      <div className="max-w-[210mm] mx-auto px-5 py-6 md:px-8 md:py-8" style={{ padding: "20px" }}>

        {/* Header */}
        <header className="print-header text-center pb-6 border-b-2" style={{ borderColor: NAVY }}>
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div className="flex items-center justify-center gap-2 mb-3">
              <div className="w-2 h-2 rounded-full" style={{ background: NAVY }} />
              <span className="text-[10px] font-semibold uppercase tracking-[0.25em]" style={{ color: NAVY_LIGHT }}>
                Consultoria Tecnológica
              </span>
              <div className="w-2 h-2 rounded-full" style={{ background: NAVY }} />
            </div>
            <h1 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold leading-tight tracking-tight" style={{ color: NAVY }}>
              Nelson Proença Info
            </h1>
            <p className="font-display text-sm md:text-base font-medium mt-1" style={{ color: NAVY_LIGHT }}>
              Engenharia de Software & Consultoria Tecnológica
            </p>
            <div className="w-16 h-[2px] mx-auto mt-4" style={{ background: `linear-gradient(90deg, transparent, ${NAVY}, transparent)` }} />
            <p className="mt-3 text-xs md:text-sm max-w-xl mx-auto leading-relaxed" style={{ color: GRAPHITE_LIGHT }}>
              Arquitetura estratégica e inovação tecnológica para acelerar o crescimento do seu negócio
            </p>
          </motion.div>
        </header>

        {/* Pillar Grid */}
        <div className="print-grid mt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5">
            {PILLARS.slice(0, 3).map((pillar, pi) => (
              <PillarCard key={pillar.title} pillar={pillar} index={pi} />
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5 mt-4 md:mt-5 md:max-w-[66.666%] md:mx-auto">
            {PILLARS.slice(3).map((pillar, pi) => (
              <PillarCard key={pillar.title} pillar={pillar} index={pi + 3} />
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
          className="print-cta mt-6 rounded-lg p-5 md:p-6 text-center border-2" style={{ background: "#f8fafc", borderColor: NAVY }}>
          <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8 print-cta-inner">
            {selectedColab && (
              <div className="flex-shrink-0">
                <div className="w-20 h-20 md:w-24 md:h-24 rounded-lg border flex items-center justify-center overflow-hidden" style={{ borderColor: NAVY }}>
                  <img
                    src={`${selectedColab.qr_url}?t=${Date.now()}`}
                    alt={`QR Code - ${selectedColab.nome}`}
                    className="w-full h-full object-contain"
                  />
                </div>
                <p className="text-[9px] mt-1.5 font-medium" style={{ color: GRAPHITE_LIGHT }}>
                  Ref: {selectedColab.nome}
                </p>
              </div>
            )}
            <div className="text-center md:text-left">
              <h2 className="font-display text-lg md:text-xl font-bold" style={{ color: NAVY }}>Diagnóstico Técnico Gratuito</h2>
              <p className="text-xs mt-1 max-w-sm leading-relaxed" style={{ color: GRAPHITE_LIGHT }}>
                Escaneie para agendar uma sessão estratégica e descobrir como otimizar sua operação com tecnologia de ponta.
              </p>
              <div className="flex items-center gap-1.5 justify-center md:justify-start mt-2">
                <ArrowRight size={12} style={{ color: NAVY_LIGHT }} />
                <span className="text-[10px] font-medium uppercase tracking-wider" style={{ color: NAVY_LIGHT }}>Vagas limitadas por mês</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Footer */}
        <footer className="print-footer mt-5 pt-4 border-t" style={{ borderColor: "#e2e8f0" }}>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-center sm:text-left">
              <p className="text-[11px] font-semibold" style={{ color: NAVY }}>
                Nelson Proença
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <a href="https://www.linkedin.com/in/nelson-proenca/" target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 group">
                <Linkedin size={14} style={{ color: NAVY }} />
                <span className="text-[9px] font-medium" style={{ color: GRAPHITE_LIGHT }}>/nelson-proenca</span>
              </a>
              <a href="mailto:proenca.nelson.79@gmail.com"
                className="flex items-center gap-1.5 group">
                <Mail size={14} style={{ color: NAVY }} />
                <span className="text-[9px] font-medium" style={{ color: GRAPHITE_LIGHT }}>proenca.nelson.79@gmail.com</span>
              </a>
              <a href="https://wa.me/5511945598960" target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 group">
                <Phone size={14} style={{ color: NAVY }} />
                <span className="text-[9px] font-medium" style={{ color: GRAPHITE_LIGHT }}>+55 11 94559-8960</span>
              </a>
              <a href="https://www.nelson-proenca-info.com.br" target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 group">
                <Globe size={14} style={{ color: NAVY }} />
                <span className="text-[9px] font-medium" style={{ color: GRAPHITE_LIGHT }}>www.nelson-proenca-info.com.br</span>
              </a>
            </div>
          </div>
        </footer>

        {/* Print button - hidden on print */}
        <div className="no-print mt-6 flex justify-center gap-3">
          <Button
            variant="outline"
            onClick={() => navigate("/admin")}
            className="gap-2 text-sm font-semibold text-white"
            style={{ borderColor: NAVY, background: NAVY }}
          >
            <ArrowRight size={16} className="rotate-180" />
            Voltar
          </Button>
          {selectedColab && (
            <Button
              onClick={() => window.print()}
              className="gap-2 text-sm font-semibold text-white"
              style={{ background: NAVY }}
            >
              Imprimir Flyer
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

const PillarCard = ({ pillar, index }: { pillar: typeof PILLARS[0]; index: number }) => (
  <motion.div custom={index} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
    className="print-card rounded-lg border p-4 md:p-5" style={{ borderColor: "#cbd5e1" }}>
    <div className="flex items-center gap-2.5 mb-3">
      <div className="pillar-icon w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0"
        style={{ background: `${ACCENT}0d` }}>
        <pillar.icon size={16} style={{ color: NAVY }} strokeWidth={1.8} />
      </div>
      <h3 className="font-display text-sm font-bold" style={{ color: NAVY }}>{pillar.title}</h3>
    </div>
    <div className="space-y-2.5">
      {pillar.services.map(s => (
        <div key={s.name} className="flex gap-2">
          <s.icon size={13} className="mt-0.5 flex-shrink-0" style={{ color: NAVY_LIGHT }} strokeWidth={1.8} />
          <div>
            <p className="svc-name text-[11px] font-semibold leading-tight" style={{ color: GRAPHITE }}>{s.name}</p>
            <p className="text-[10px] leading-snug mt-0.5" style={{ color: GRAPHITE_LIGHT }}>{s.desc}</p>
          </div>
        </div>
      ))}
      <p className="text-[9px] italic pt-1" style={{ color: NAVY_LIGHT }}>…e outras soluções sob medida para o seu negócio.</p>
    </div>
  </motion.div>
);

export default LandingPage;
