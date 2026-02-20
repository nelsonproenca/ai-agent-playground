import { useState } from "react";
import { motion } from "framer-motion";
import {
  Server, Database, Cloud, Brain, Linkedin, Instagram,
  MessageCircle, Shield, Zap, Code2, Search, BarChart3,
  Settings, Bot, Workflow, Globe, Lock, Layers,
  CheckCircle, Send, Loader2, X, Phone, Mail,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const PILLARS = [
  {
    icon: Code2,
    title: ".NET",
    subtitle: "Backend & Performance",
    color: "#6366f1",
    services: [
      { icon: Settings, name: "Modernização de Legado", desc: "Migração estratégica de sistemas .NET Framework para .NET 8+." },
      { icon: Layers, name: "Arquitetura de Microserviços", desc: "Desenho de sistemas distribuídos utilizando padrões SOA." },
      { icon: Shield, name: "APIs de Alta Disponibilidade", desc: "Desenvolvimento de APIs REST/GraphQL seguras (OAuth2/JWT)." },
    ],
  },
  {
    icon: Database,
    title: "SQL Server & Dados",
    subtitle: "Persistência e Inteligência",
    color: "#0ea5e9",
    services: [
      { icon: Zap, name: "Tuning & Otimização", desc: "Diagnóstico e resolução de gargalos em SQL Server 2022." },
      { icon: Search, name: "Estratégia NoSQL & Search", desc: "Implementação de MongoDB e Elastic Search para buscas complexas." },
      { icon: BarChart3, name: "Modelagem Corporativa", desc: "Estruturação de bancos de dados focados em integridade e escala." },
    ],
  },
  {
    icon: Cloud,
    title: "Azure & Cloud",
    subtitle: "Escalabilidade e Segurança",
    color: "#3b82f6",
    services: [
      { icon: Globe, name: "Cloud-Native Migration", desc: "Planejamento e execução de migração para Azure App Services/Functions." },
      { icon: Lock, name: "Segurança & Governança", desc: "Implementação de Key Vaults, monitoramento e Application Insights." },
      { icon: Server, name: "Estratégia Multi-Cloud", desc: "Consultoria para arquiteturas em Azure, AWS, GCP ou OCI." },
    ],
  },
  {
    icon: Brain,
    title: "IA & Automação",
    subtitle: "Vanguarda e Eficiência",
    color: "#8b5cf6",
    services: [
      { icon: Bot, name: "Agentes de IA (n8n)", desc: "Automação de fluxos inteligentes integrados ao Instagram e WhatsApp." },
      { icon: MessageCircle, name: "Integração de LLMs", desc: "Implementação de Gemini/OpenAI para análise de dados e suporte." },
      { icon: Workflow, name: "Automação de Pipelines", desc: "Integração de sistemas heterogêneos (CRM/ERP) via n8n." },
    ],
  },
];

const STACK = [".NET 8+", "SQL Server", "Azure", "n8n", "MongoDB", "Elastic Search", "SOA", "React"];

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.5 } }),
};

const DiagnosticForm = ({ onClose }: { onClose: () => void }) => {
  const [nome, setNome] = useState("");
  const [contato, setContato] = useState("");
  const [empresa, setEmpresa] = useState("");
  const [desafio, setDesafio] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim() || !contato.trim() || !desafio.trim()) {
      setError("Preencha os campos obrigatórios.");
      return;
    }
    setLoading(true);
    setError("");
    const { error: dbError } = await supabase.from("leads_ia").insert({
      nome: nome.trim().slice(0, 100),
      empresa: empresa.trim().slice(0, 200) || null,
      contato: contato.trim().slice(0, 255),
      desafio_tecnico: desafio.trim().slice(0, 2000),
      origem: "Landing_Page",
    });
    setLoading(false);
    if (dbError) { setError("Erro ao enviar. Tente novamente."); return; }
    setSent(true);
  };

  if (sent) {
    return (
      <div className="text-center py-10 space-y-4">
        <CheckCircle className="mx-auto" size={56} style={{ color: "#22c55e" }} />
        <h3 className="text-xl font-bold text-gray-900">Solicitação Enviada!</h3>
        <p className="text-gray-600 text-sm">Entrarei em contato em até 24h úteis.</p>
        <button onClick={onClose} className="mt-4 text-sm font-medium" style={{ color: "#6366f1" }}>Fechar</button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Nome *</label>
        <input value={nome} onChange={e => setNome(e.target.value)} maxLength={100} placeholder="Seu nome completo"
          className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-gray-50 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition" />
      </div>
      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Empresa</label>
        <input value={empresa} onChange={e => setEmpresa(e.target.value)} maxLength={200} placeholder="Nome da empresa"
          className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-gray-50 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition" />
      </div>
      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Contato (e-mail ou telefone) *</label>
        <input value={contato} onChange={e => setContato(e.target.value)} maxLength={255} placeholder="email@exemplo.com"
          className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-gray-50 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition" />
      </div>
      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Desafio Técnico *</label>
        <textarea value={desafio} onChange={e => setDesafio(e.target.value)} maxLength={2000} rows={4} placeholder="Descreva brevemente seu cenário..."
          className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-gray-50 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition resize-none" />
      </div>
      {error && <p className="text-red-500 text-xs font-medium">{error}</p>}
      <button type="submit" disabled={loading}
        className="w-full py-3 rounded-lg text-white font-semibold text-sm flex items-center justify-center gap-2 transition-all hover:shadow-lg disabled:opacity-60"
        style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}>
        {loading ? <Loader2 size={18} className="animate-spin" /> : <Send size={16} />}
        {loading ? "Enviando..." : "Solicitar Diagnóstico"}
      </button>
    </form>
  );
};

const LandingPage = () => {
  const [formOpen, setFormOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" style={{
          background: "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(99,102,241,0.08) 0%, transparent 70%), radial-gradient(ellipse 60% 50% at 80% 100%, rgba(139,92,246,0.06) 0%, transparent 70%)",
        }} />
        <div className="relative max-w-6xl mx-auto px-5 pt-16 pb-20 md:pt-28 md:pb-28 text-center">
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}
            className="text-xs font-semibold uppercase tracking-[0.2em] mb-6" style={{ color: "#6366f1" }}>
            Nelson Proença Informática
          </motion.p>
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.6 }}
            className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold leading-[1.1] tracking-tight max-w-4xl mx-auto">
            Arquitetura de Software &{" "}
            <span className="bg-clip-text text-transparent" style={{ backgroundImage: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}>
              Inteligência que Escalam
            </span>{" "}
            seu Negócio
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.5 }}
            className="mt-6 text-base md:text-lg text-gray-500 max-w-2xl mx-auto leading-relaxed">
            Engenharia de alta performance, modernização de sistemas e automação inteligente para empresas que não podem parar.
          </motion.p>
        </div>
      </section>

      {/* Stack Bar */}
      <section className="border-y border-gray-100 bg-gray-50/60">
        <div className="max-w-6xl mx-auto px-5 py-5 flex flex-wrap items-center justify-center gap-x-8 gap-y-2">
          {STACK.map(s => (
            <span key={s} className="text-xs font-mono font-medium tracking-wide text-gray-400 uppercase">{s}</span>
          ))}
        </div>
      </section>

      {/* Pillars Grid */}
      <section className="max-w-6xl mx-auto px-5 py-20 md:py-28">
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
          className="text-center mb-16">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Serviços</h2>
          <p className="text-gray-400 text-sm mt-3 max-w-lg mx-auto">Competências verticais que garantem entregas de ponta a ponta.</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {PILLARS.map((pillar, pi) => (
            <motion.div key={pillar.title} custom={pi} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
              className="rounded-2xl border border-gray-100 bg-white p-6 md:p-8 hover:shadow-lg hover:border-gray-200 transition-all group">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${pillar.color}12` }}>
                  <pillar.icon size={20} style={{ color: pillar.color }} />
                </div>
                <div>
                  <h3 className="font-bold text-base text-gray-900">{pillar.title}</h3>
                  <p className="text-xs text-gray-400 font-medium">{pillar.subtitle}</p>
                </div>
              </div>
              <div className="space-y-4">
                {pillar.services.map(s => (
                  <div key={s.name} className="flex gap-3">
                    <div className="mt-0.5 flex-shrink-0">
                      <s.icon size={16} className="text-gray-300" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{s.name}</p>
                      <p className="text-xs text-gray-400 leading-relaxed mt-0.5">{s.desc}</p>
                    </div>
                  </div>
                ))}
                <p className="text-xs font-medium mt-3 pt-3 border-t border-gray-100" style={{ color: pillar.color }}>
                  + outros serviços especializados →
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Contato Section */}
      <section className="border-t border-gray-100" style={{
        background: "linear-gradient(180deg, rgba(99,102,241,0.04) 0%, rgba(139,92,246,0.02) 100%)",
      }}>
        <div className="max-w-2xl mx-auto px-5 py-20 text-center">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Entre em Contato</h2>
          <p className="text-gray-400 text-sm mt-3 max-w-md mx-auto">
            Fale comigo por qualquer um desses canais.
          </p>
          <div className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-4">
            <a href="https://www.instagram.com/nelsonhaproenca/" target="_blank" rel="noopener noreferrer"
              className="flex flex-col items-center gap-2 p-4 rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-md transition-all">
              <Instagram size={22} style={{ color: "#E1306C" }} />
              <span className="text-xs font-semibold text-gray-700">Instagram</span>
              <span className="text-[10px] text-gray-400">@nelsonhaproenca</span>
            </a>
            <a href="https://wa.me/5511945598960" target="_blank" rel="noopener noreferrer"
              className="flex flex-col items-center gap-2 p-4 rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-md transition-all">
              <MessageCircle size={22} style={{ color: "#25D366" }} />
              <span className="text-xs font-semibold text-gray-700">WhatsApp</span>
              <span className="text-[10px] text-gray-400">+55 11 94559-8960</span>
            </a>
            <a href="tel:+5511945598960"
              className="flex flex-col items-center gap-2 p-4 rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-md transition-all">
              <Phone size={22} style={{ color: "#6366f1" }} />
              <span className="text-xs font-semibold text-gray-700">Telefone</span>
              <span className="text-[10px] text-gray-400">+55 11 94559-8960</span>
            </a>
            <a href="mailto:proenca.nelson.79@gmail.com"
              className="flex flex-col items-center gap-2 p-4 rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-md transition-all">
              <Mail size={22} style={{ color: "#0ea5e9" }} />
              <span className="text-xs font-semibold text-gray-700">E-mail</span>
              <span className="text-[10px] text-gray-400">proenca.nelson.79@gmail.com</span>
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 bg-gray-50/60">
        <div className="max-w-6xl mx-auto px-5 py-8 text-center">
          <p className="text-xs text-gray-400">
            &copy; {new Date().getFullYear()} <span className="font-semibold text-gray-500">Nelson Proença Informática</span>
          </p>
        </div>
      </footer>

      {/* Form Modal */}
      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setFormOpen(false)}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.25 }}
            onClick={e => e.stopPropagation()}
            className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 md:p-8">
            <button onClick={() => setFormOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition">
              <X size={20} />
            </button>
            <h3 className="text-lg font-bold text-gray-900 mb-1">Diagnóstico Técnico</h3>
            <p className="text-xs text-gray-400 mb-6">Preencha e entrarei em contato em até 24h.</p>
            <DiagnosticForm onClose={() => setFormOpen(false)} />
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default LandingPage;
