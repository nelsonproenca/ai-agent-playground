import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ShoppingBag, Shield, Zap, RotateCcw, Star, ChevronRight, Timer, ArrowUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { supabase } from "@/integrations/supabase/client";
import { redirectToCheckout, resolveShopifyImageUrls } from "@/lib/shopify";

interface Produto {
  id: string;
  name: string;
  description: string | null;
  descriptionhtml: string | null;
  price: number;
  image_url: string | null;
  shopify_id: string | null;
  shopify_variant_id: string | null;
  producttype: string | null;
  active: boolean;
}

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.5 } }),
};

function useCountdown() {
  const [time, setTime] = useState({ h: 2, m: 47, s: 33 });
  useEffect(() => {
    const interval = setInterval(() => {
      setTime((prev) => {
        let { h, m, s } = prev;
        if (s > 0) s--;
        else if (m > 0) { m--; s = 59; }
        else if (h > 0) { h--; m = 59; s = 59; }
        else { h = 2; m = 47; s = 33; }
        return { h, m, s };
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);
  return time;
}

const LojaPage = () => {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [imageMap, setImageMap] = useState<Record<string, string>>({});
  const produtosRef = useRef<HTMLDivElement>(null);
  const countdown = useCountdown();

  useEffect(() => {
    supabase
      .from("produtos_dtc")
      .select("*")
      .eq("active", true)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        if (data) {
          const items = data as Produto[];
          setProdutos(items);

          // Collect GIDs to resolve
          const gids = items
            .map((p) => p.image_url)
            .filter((url): url is string => !!url && url.startsWith("gid://"));

          if (gids.length > 0) {
            resolveShopifyImageUrls(gids).then(setImageMap);
          }
        }
      });
  }, []);

  const scrollToProdutos = () => {
    produtosRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const testimonials = [
    { name: "Ana R.", text: "Produto incrível! Superou minhas expectativas. Entrega rápida e embalagem impecável.", rating: 5 },
    { name: "Carlos M.", text: "Melhor custo-benefício que encontrei. Já indiquei para todos os amigos.", rating: 5 },
    { name: "Juliana S.", text: "Atendimento nota 10, produto de qualidade premium. Comprarei novamente!", rating: 5 },
  ];

  const faqs = [
    { q: "Como funciona a garantia de 7 dias?", a: "Você tem 7 dias corridos após o recebimento para solicitar a devolução completa, sem perguntas." },
    { q: "Quais formas de pagamento são aceitas?", a: "Aceitamos cartão de crédito, PIX, boleto bancário e carteiras digitais via Shopify Checkout." },
    { q: "Qual o prazo de entrega?", a: "O prazo varia de 3 a 10 dias úteis dependendo da sua região. Enviamos para todo o Brasil." },
    { q: "Posso trocar o produto?", a: "Sim! Oferecemos troca gratuita em até 30 dias para todos os produtos." },
    { q: "O pagamento é seguro?", a: "Absolutamente. Usamos checkout Shopify com certificado SSL e criptografia de ponta." },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Urgency Banner */}
      <div className="bg-primary text-primary-foreground py-2 px-4 text-center text-sm font-mono flex items-center justify-center gap-2 sticky top-0 z-50">
        <Timer className="h-4 w-4 animate-pulse" />
        <span>🔥 Oferta por tempo limitado!</span>
        <span className="font-bold tabular-nums">
          {String(countdown.h).padStart(2, "0")}:{String(countdown.m).padStart(2, "0")}:{String(countdown.s).padStart(2, "0")}
        </span>
      </div>

      {/* Header */}
      <header className="border-b border-border bg-background/95 backdrop-blur sticky top-[36px] z-40">
        <div className="container max-w-6xl py-4 flex items-center justify-between">
          <Link to="/" className="font-mono font-bold text-foreground text-lg tracking-tight">
            NP<span className="text-primary">Store</span>
          </Link>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="font-mono gap-2" onClick={scrollToProdutos}>
              <ShoppingBag className="h-4 w-4" />
              <span className="hidden sm:inline">Produtos</span>
            </Button>
            <Button asChild variant="outline" size="sm" className="font-mono">
              <Link to="/login">Entrar</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="py-20 md:py-32 px-4">
        <div className="container max-w-4xl text-center">
          <motion.div initial="hidden" animate="visible" custom={0} variants={fadeUp}>
            <Badge variant="secondary" className="mb-6 font-mono text-xs">
              ✨ Lançamento Exclusivo
            </Badge>
          </motion.div>
          <motion.h1
            className="text-4xl md:text-6xl font-extrabold text-foreground leading-tight mb-6"
            initial="hidden" animate="visible" custom={1} variants={fadeUp}
          >
            Transforme sua rotina com{" "}
            <span className="text-gradient-primary">produtos premium</span>
          </motion.h1>
          <motion.p
            className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8"
            initial="hidden" animate="visible" custom={2} variants={fadeUp}
          >
            Cansado de produtos que não entregam o que prometem? Descubra nossa seleção curada com garantia de satisfação ou seu dinheiro de volta.
          </motion.p>
          <motion.div initial="hidden" animate="visible" custom={3} variants={fadeUp}>
            <Button size="lg" className="font-mono gap-2 text-base glow-primary" onClick={scrollToProdutos}>
              Comprar Agora <ChevronRight className="h-5 w-5" />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-16 px-4 border-t border-border bg-muted/30">
        <div className="container max-w-5xl">
          <motion.h2
            className="text-2xl font-extrabold text-foreground text-center mb-10 font-mono"
            initial="hidden" whileInView="visible" viewport={{ once: true }} custom={0} variants={fadeUp}
          >
            O que nossos clientes dizem
          </motion.h2>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <motion.div
                key={t.name}
                className="rounded-xl border border-border bg-card p-6 space-y-3"
                initial="hidden" whileInView="visible" viewport={{ once: true }} custom={i} variants={fadeUp}
              >
                <div className="flex gap-0.5">
                  {Array.from({ length: t.rating }).map((_, j) => (
                    <Star key={j} className="h-4 w-4 fill-primary text-primary" />
                  ))}
                </div>
                <p className="text-sm text-muted-foreground">"{t.text}"</p>
                <p className="text-sm font-mono font-semibold text-foreground">{t.name}</p>
              </motion.div>
            ))}
          </div>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-8 opacity-50">
            {["Compra Segura", "SSL Certificado", "Shopify Checkout", "Garantia 7 dias"].map((label) => (
              <span key={label} className="text-xs font-mono text-muted-foreground uppercase tracking-widest">
                {label}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Products Grid */}
      <section ref={produtosRef} className="py-16 px-4" id="produtos">
        <div className="container max-w-5xl">
          <motion.h2
            className="text-2xl font-extrabold text-foreground text-center mb-10 font-mono"
            initial="hidden" whileInView="visible" viewport={{ once: true }} custom={0} variants={fadeUp}
          >
            Nossos <span className="text-primary">Produtos</span>
          </motion.h2>
          {produtos.length === 0 ? (
            <p className="text-center text-muted-foreground font-mono text-sm">
              Nenhum produto disponível no momento. Cadastre produtos no painel admin.
            </p>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {produtos.map((p, i) => (
                <motion.div
                  key={p.id}
                  className="group rounded-xl border border-border bg-card overflow-hidden hover:border-primary/50 transition-all hover:shadow-lg hover:shadow-primary/5"
                  initial="hidden" whileInView="visible" viewport={{ once: true }} custom={i} variants={fadeUp}
                >
                  <div className="relative aspect-square bg-muted">
                    {p.image_url ? (
                      <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ShoppingBag className="h-12 w-12 text-muted-foreground/30" />
                      </div>
                    )}
                    {p.producttype && (
                      <Badge variant="secondary" className="absolute top-3 left-3 font-mono text-[10px]">
                        {p.producttype}
                      </Badge>
                    )}
                  </div>
                  <div className="p-4 space-y-3">
                    <h3 className="font-mono font-bold text-foreground text-sm line-clamp-2">{p.name}</h3>
                    {p.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2">{p.description}</p>
                    )}
                    <div className="flex items-baseline gap-2">
                      <span className="text-lg font-extrabold text-primary font-mono">
                        R$ {p.price.toFixed(2).replace(".", ",")}
                      </span>
                    </div>
                    <Button
                      className="w-full font-mono gap-2 text-xs"
                      size="sm"
                      onClick={() => {
                        if (p.shopify_variant_id) {
                          redirectToCheckout(p.shopify_variant_id);
                        }
                      }}
                      disabled={!p.shopify_variant_id}
                    >
                      <ShoppingBag className="h-3.5 w-3.5" />
                      Comprar Agora
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Benefits */}
      <section className="py-16 px-4 border-t border-border bg-muted/30">
        <div className="container max-w-4xl">
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: Zap, title: "Acesso Imediato", desc: "Confirmação instantânea do pedido e rastreamento em tempo real." },
              { icon: Shield, title: "Pagamento Seguro", desc: "Checkout criptografado via Shopify com proteção total dos dados." },
              { icon: RotateCcw, title: "Garantia de 7 Dias", desc: "Não ficou satisfeito? Devolvemos 100% do valor, sem burocracia." },
            ].map((b, i) => (
              <motion.div
                key={b.title}
                className="text-center space-y-3"
                initial="hidden" whileInView="visible" viewport={{ once: true }} custom={i} variants={fadeUp}
              >
                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mx-auto">
                  <b.icon className="h-7 w-7 text-primary" />
                </div>
                <h3 className="font-mono font-bold text-foreground">{b.title}</h3>
                <p className="text-sm text-muted-foreground">{b.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 px-4">
        <div className="container max-w-2xl">
          <motion.h2
            className="text-2xl font-extrabold text-foreground text-center mb-10 font-mono"
            initial="hidden" whileInView="visible" viewport={{ once: true }} custom={0} variants={fadeUp}
          >
            Perguntas Frequentes
          </motion.h2>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} custom={1} variants={fadeUp}>
            <Accordion type="single" collapsible className="space-y-2">
              {faqs.map((faq, i) => (
                <AccordionItem key={i} value={`faq-${i}`} className="border border-border rounded-lg px-4">
                  <AccordionTrigger className="font-mono text-sm text-foreground">{faq.q}</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground text-sm">{faq.a}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </motion.div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="py-16 px-4 border-t border-border bg-muted/30">
        <div className="container max-w-2xl text-center space-y-4">
          <h2 className="text-2xl font-extrabold text-foreground font-mono">
            Não perca essa <span className="text-primary">oportunidade</span>
          </h2>
          <p className="text-muted-foreground text-sm">
            Estoque limitado. Garanta o seu antes que acabe!
          </p>
          <Button size="lg" className="font-mono gap-2 glow-primary" onClick={scrollToProdutos}>
            <ArrowUp className="h-4 w-4" /> Ver Produtos
          </Button>
        </div>
      </section>

      <footer className="border-t border-border py-8 text-center">
        <p className="text-sm text-muted-foreground font-mono">
          &copy; {new Date().getFullYear()} NPStore — Todos os direitos reservados
        </p>
      </footer>
    </div>
  );
};

export default LojaPage;
