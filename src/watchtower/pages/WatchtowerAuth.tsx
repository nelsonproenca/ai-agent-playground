import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, ChevronLeft } from "lucide-react";
import cctvBg from "@/assets/watchtower/cctv-background.jpg";

export default function WatchtowerAuth() {
  const [searchParams] = useSearchParams();
  const [isLogin, setIsLogin] = useState(searchParams.get("mode") !== "signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate("/watchtower/dashboard");
      } else {
        const { error } = await supabase.auth.signUp({ email, password, options: { data: { display_name: displayName }, emailRedirectTo: window.location.origin } });
        if (error) throw error;
        toast({ title: "Conta criada!", description: "Verifique seu e-mail para confirmar o cadastro." });
      }
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <img src={cctvBg} alt="Surveillance cameras" className="absolute inset-0 w-full h-full object-cover opacity-40" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/30 to-background/80" />
        <div className="relative z-10 flex flex-col justify-center px-16">
          <h1 className="font-display text-5xl font-bold text-primary tracking-wider">VIGÍLIA CAM</h1>
          <div className="w-16 h-0.5 bg-primary mt-6 mb-4" />
          <p className="text-xs tracking-[0.25em] text-muted-foreground font-medium">MONITORAMENTO INTELIGENTE DE CÂMERAS</p>
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center p-8 bg-background relative">
        <button onClick={() => navigate("/watchtower")} className="absolute top-6 left-6 flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors">
          <ChevronLeft className="h-4 w-4" />VOLTAR
        </button>
        <div className="w-full max-w-sm">
          <div className="lg:hidden mb-10 text-center">
            <h1 className="font-display text-3xl font-bold text-primary tracking-wider">VIGÍLIA CAM</h1>
            <p className="text-[10px] tracking-[0.25em] text-muted-foreground mt-2">MONITORAMENTO INTELIGENTE DE CÂMERAS</p>
          </div>
          <h2 className="font-display text-2xl font-bold text-foreground mb-1">{isLogin ? "ENTRAR" : "CRIAR CONTA"}</h2>
          <p className="text-xs text-muted-foreground mb-8">{isLogin ? "Acesse seu painel de monitoramento" : "Cadastre-se para começar"}</p>
          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="wt-name" className="text-xs tracking-wider text-muted-foreground">NOME</Label>
                <Input id="wt-name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Seu nome" className="bg-secondary border-border text-foreground h-11" />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="wt-email" className="text-xs tracking-wider text-muted-foreground">E-MAIL</Label>
              <Input id="wt-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seu@email.com" required className="bg-secondary border-border text-foreground h-11" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="wt-password" className="text-xs tracking-wider text-muted-foreground">SENHA</Label>
                {isLogin && <button type="button" className="text-[10px] text-primary hover:underline">Esqueci a senha</button>}
              </div>
              <div className="relative">
                <Input id="wt-password" type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required minLength={6} className="bg-secondary border-border text-foreground pr-10 h-11" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <Button type="submit" className="w-full gradient-primary text-primary-foreground h-11 font-semibold text-xs tracking-wider" disabled={loading}>
              {loading ? "Carregando..." : isLogin ? "ENTRAR →" : "CADASTRAR"}
            </Button>
          </form>
          <div className="mt-6 text-center">
            <button onClick={() => setIsLogin(!isLogin)} className="text-xs text-muted-foreground hover:text-primary transition-colors border border-border rounded-md w-full py-2.5 tracking-wider">
              {isLogin ? "CRIAR CONTA ✎" : "JÁ TENHO CONTA → ENTRAR"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
