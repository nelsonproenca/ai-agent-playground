import { useNavigate, Link } from "react-router-dom";
import { ChevronLeft, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

const posts = [
  { date: "15 MAR 2026", tag: "SEGURANÇA", title: "5 Dicas Para Melhorar a Segurança do Seu Condomínio", excerpt: "Descubra como otimizar o monitoramento e prevenir incidentes com estratégias simples e eficazes." },
  { date: "08 MAR 2026", tag: "TECNOLOGIA", title: "Como Funciona o Streaming em Tempo Real de Câmeras", excerpt: "Entenda a tecnologia por trás da transmissão ao vivo e como garantimos qualidade e estabilidade." },
  { date: "01 MAR 2026", tag: "NOVIDADES", title: "Watchtower Monitoramentos Lança Plano Ouro com Download de Gravações", excerpt: "Agora você pode baixar gravações diretamente do painel." },
  { date: "22 FEV 2026", tag: "DICAS", title: "Posicionamento Ideal de Câmeras: Guia Completo", excerpt: "Aprenda onde instalar suas câmeras para máxima cobertura e eficiência." },
];

export default function WatchtowerBlog() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/80 bg-background/95 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <button onClick={() => navigate("/watchtower")} className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"><ChevronLeft className="h-4 w-4" />VOLTAR</button>
          <Link to="/watchtower" className="flex items-center gap-2">
            <img src="/watchtower-favicon.png" alt="Watchtower Monitoramentos" width={28} height={28} className="h-7 w-7 object-contain" loading="lazy" />
            <span className="font-display text-base font-bold text-primary tracking-wider">WATCHTOWER MONITORAMENTOS</span>
          </Link>
          <div className="w-16" />
        </div>
      </nav>
      <main className="pt-28 pb-24 px-6">
        <div className="max-w-4xl mx-auto">
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-xs tracking-[0.2em] text-primary font-medium mb-3">BLOG</motion.p>
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="font-display text-4xl md:text-5xl font-bold leading-tight mb-6">Notícias e <span className="text-primary">Dicas</span></motion.h1>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="text-sm text-muted-foreground leading-relaxed max-w-2xl mb-16">Fique por dentro das novidades sobre segurança, tecnologia e monitoramento.</motion.p>
          <div className="space-y-4">
            {posts.map((post, i) => (
              <motion.article key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + i * 0.1 }} className="border border-border rounded-lg p-6 bg-card hover:border-primary/30 transition-colors group cursor-pointer">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-[10px] tracking-wider text-muted-foreground">{post.date}</span>
                  <span className="text-[10px] tracking-wider text-primary font-medium bg-primary/10 px-2 py-0.5 rounded">{post.tag}</span>
                </div>
                <div className="flex items-start justify-between gap-4">
                  <div><h2 className="font-display text-xl font-bold mb-2 group-hover:text-primary transition-colors">{post.title}</h2><p className="text-sm text-muted-foreground leading-relaxed">{post.excerpt}</p></div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0 mt-1" />
                </div>
              </motion.article>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
