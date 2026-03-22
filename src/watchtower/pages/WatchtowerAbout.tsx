import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Shield, Eye, Users, ChevronLeft } from "lucide-react";
import { motion } from "framer-motion";

const values = [
  { icon: Shield, title: "SEGURANÇA", desc: "Proteção e confiabilidade são a base de tudo o que fazemos." },
  { icon: Eye, title: "TRANSPARÊNCIA", desc: "Comunicação clara e honesta. Sem taxas ocultas." },
  { icon: Users, title: "COMPROMISSO", desc: "Suporte dedicado 24/7 para garantir que seu monitoramento nunca pare." },
];

export default function WatchtowerAbout() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/80 bg-background/95 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <button onClick={() => navigate("/watchtower")} className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"><ChevronLeft className="h-4 w-4" />VOLTAR</button>
          <span className="font-display text-lg font-bold text-primary tracking-wider">Vigília Cam</span>
          <div className="w-16" />
        </div>
      </nav>
      <main className="pt-28 pb-24 px-6">
        <div className="max-w-4xl mx-auto">
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-xs tracking-[0.2em] text-primary font-medium mb-3">SOBRE NÓS</motion.p>
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="font-display text-4xl md:text-5xl font-bold leading-tight mb-6">Monitoramento Inteligente<br /><span className="text-primary">Para Quem Valoriza Segurança</span></motion.h1>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="text-sm text-muted-foreground leading-relaxed max-w-2xl mb-16">A Vigília Cam nasceu da necessidade de oferecer monitoramento acessível e profissional para residências, comércios e condomínios.</motion.p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
            {values.map((v, i) => (
              <motion.div key={v.title} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + i * 0.1 }} className="border border-border rounded-lg p-8 hover:border-primary/30 transition-colors">
                <v.icon className="h-6 w-6 text-primary mb-4" />
                <h3 className="text-xs tracking-[0.15em] text-primary font-medium mb-2">{v.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{v.desc}</p>
              </motion.div>
            ))}
          </div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="border border-border rounded-lg p-8 bg-card text-center">
            <h2 className="font-display text-2xl font-bold mb-3">Pronto Para Começar?</h2>
            <p className="text-sm text-muted-foreground mb-6">Cadastre-se e proteja o que mais importa.</p>
            <Button className="gradient-primary text-primary-foreground font-semibold text-xs tracking-wider px-6" onClick={() => navigate("/watchtower/auth")}>CRIAR CONTA</Button>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
