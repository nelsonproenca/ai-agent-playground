import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ChevronLeft, Mail, Phone, MapPin } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { contactService } from "@/watchtower/services";

const contactInfo = [
  { icon: Mail, label: "EMAIL", value: "contato@vigiliacam.com.br" },
  { icon: Phone, label: "TELEFONE", value: "(11) 9999-9999" },
  { icon: MapPin, label: "ENDEREÇO", value: "São Paulo, SP — Brasil" },
];

export default function WatchtowerContact() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSending(true);
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    const name = (formData.get("name") as string).trim();
    const email = (formData.get("email") as string).trim();
    const message = (formData.get("message") as string).trim();

    try {
      await contactService.submit({ name, email, message });
      toast({ title: "Mensagem enviada!", description: "Retornaremos em até 24 horas." });
      form.reset();
    } catch {
      toast({ title: "Erro ao enviar", description: "Tente novamente mais tarde.", variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

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
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-xs tracking-[0.2em] text-primary font-medium mb-3">CONTATO</motion.p>
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="font-display text-4xl md:text-5xl font-bold leading-tight mb-6">Fale <span className="text-primary">Conosco</span></motion.h1>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="text-sm text-muted-foreground leading-relaxed max-w-2xl mb-16">Tem alguma dúvida ou precisa de ajuda? Nossa equipe está pronta para atendê-lo.</motion.p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <motion.form onSubmit={handleSubmit} initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }} className="border border-border rounded-lg p-8 bg-card space-y-4">
              <div><label className="text-xs tracking-wider font-semibold text-foreground mb-1.5 block">NOME</label><Input required name="name" placeholder="Seu nome completo" className="bg-secondary border-border" /></div>
              <div><label className="text-xs tracking-wider font-semibold text-foreground mb-1.5 block">EMAIL</label><Input required name="email" type="email" placeholder="seu@email.com" className="bg-secondary border-border" /></div>
              <div><label className="text-xs tracking-wider font-semibold text-foreground mb-1.5 block">MENSAGEM</label><Textarea required name="message" placeholder="Como podemos ajudar?" className="bg-secondary border-border min-h-[120px]" /></div>
              <Button type="submit" disabled={sending} className="w-full gradient-primary text-primary-foreground font-semibold text-xs tracking-wider">{sending ? "ENVIANDO..." : "ENVIAR MENSAGEM"}</Button>
            </motion.form>
            <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }} className="space-y-6">
              {contactInfo.map((c) => (
                <div key={c.label} className="border border-border rounded-lg p-6 hover:border-primary/30 transition-colors">
                  <div className="flex items-center gap-3 mb-2"><c.icon className="h-5 w-5 text-primary" /><span className="text-xs tracking-[0.15em] text-primary font-medium">{c.label}</span></div>
                  <p className="text-sm text-muted-foreground">{c.value}</p>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
}
