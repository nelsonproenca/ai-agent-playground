import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, ChevronLeft } from "lucide-react";
import cctvBg from "@/assets/watchtower/cctv-background.jpg";
import watchtowerLogo from "@/assets/watchtower/watchtower-logo-gold.png";
import { evaluatePassword, PasswordStrengthMeter } from "@/watchtower/components/WatchtowerPasswordStrength";

export default function WatchtowerAuth() {
  const [searchParams] = useSearchParams();
  const [isLogin, setIsLogin] = useState(searchParams.get("mode") !== "signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Se um link de recovery cair em /watchtower/auth, redireciona para a página de reset
  useEffect(() => {
    const url = new URL(window.location.href);
    const hasCode = url.searchParams.has("code");
    const hash = window.location.hash || "";
    const isRecoveryHash = hash.includes("type=recovery");
    if (hasCode || isRecoveryHash) {
      navigate(`/watchtower/reset-password${url.search}${hash}`, { replace: true });
    }
  }, [navigate]);

  const handleForgotPassword = async () => {
    const traceId = `pwd-reset-${Date.now()}`;
    console.group(`🔐 [${traceId}] Forgot Password Flow`);
    console.log("📧 Step 1/4: Validando e-mail informado...", { email });

    if (!email) {
      console.warn(`⚠️ [${traceId}] Falha na validação: e-mail vazio`);
      console.groupEnd();
      toast({
        title: "Informe seu e-mail",
        description: "Digite seu e-mail no campo acima para receber o link de recuperação.",
        variant: "destructive",
      });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.warn(`⚠️ [${traceId}] Falha na validação: formato de e-mail inválido`, { email });
      console.groupEnd();
      toast({
        title: "E-mail inválido",
        description: `O formato do e-mail "${email}" não é válido. Use o formato nome@dominio.com.`,
        variant: "destructive",
      });
      return;
    }

    const redirectTo = `${window.location.origin}/watchtower/reset-password`;
    console.log("✅ Step 2/4: E-mail validado. Preparando requisição...", {
      email,
      redirectTo,
      origin: window.location.origin,
      supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
    });

    setResetLoading(true);
    const startedAt = performance.now();

    try {
      console.log(`🚀 [${traceId}] Step 3/4: Chamando supabase.auth.resetPasswordForEmail...`);
      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo,
      });
      const duration = Math.round(performance.now() - startedAt);

      console.log(`📨 [${traceId}] Resposta recebida em ${duration}ms`, { data, error });

      if (error) {
        console.error(`❌ [${traceId}] Step 3/4 FALHOU - Erro retornado pelo Supabase:`, {
          name: error.name,
          message: error.message,
          status: (error as any).status,
          code: (error as any).code,
          full: error,
        });

        let friendlyTitle = "Erro ao enviar e-mail";
        let friendlyDescription = error.message;
        const status = (error as any).status;
        const code = (error as any).code;

        if (status === 429 || /rate.?limit|too many/i.test(error.message)) {
          friendlyTitle = "Muitas tentativas";
          friendlyDescription = "Aguarde alguns minutos antes de tentar novamente. O Supabase limita pedidos de recuperação para evitar spam.";
        } else if (status === 422 || /invalid.*email/i.test(error.message)) {
          friendlyTitle = "E-mail inválido";
          friendlyDescription = "O Supabase rejeitou este e-mail. Verifique se está correto.";
        } else if (/network|fetch|failed to fetch/i.test(error.message)) {
          friendlyTitle = "Falha de conexão";
          friendlyDescription = "Não foi possível contactar o servidor. Verifique sua internet.";
        } else if (status === 500 || /smtp|email.*provider/i.test(error.message)) {
          friendlyTitle = "Falha no servidor de e-mail";
          friendlyDescription = "O Supabase não conseguiu enviar o e-mail. Pode ser problema de SMTP/configuração de domínio.";
        }

        toast({
          title: `${friendlyTitle} [${code || status || "ERR"}]`,
          description: `${friendlyDescription} (Trace: ${traceId})`,
          variant: "destructive",
        });
        console.groupEnd();
        return;
      }

      console.log(`✅ [${traceId}] Step 4/4: Requisição aceita pelo Supabase em ${duration}ms`);
      console.info(
        `ℹ️ [${traceId}] Importante: o Supabase SEMPRE responde com sucesso por segurança (não revela se o e-mail existe). ` +
        `Se o e-mail não chegar, verifique: (1) caixa de spam, (2) configuração SMTP no Supabase, (3) rate limit (~3 emails/hora no SMTP padrão), (4) Edge Function logs do auth-email-hook.`
      );
      console.groupEnd();

      toast({
        title: "E-mail enviado!",
        description: `Se "${email}" estiver cadastrado, o link chegará em instantes. Verifique também a caixa de spam.`,
      });
    } catch (error: any) {
      const duration = Math.round(performance.now() - startedAt);
      console.error(`💥 [${traceId}] Exceção inesperada após ${duration}ms:`, {
        name: error?.name,
        message: error?.message,
        stack: error?.stack,
        full: error,
      });
      console.groupEnd();
      toast({
        title: "Erro inesperado",
        description: `${error?.message || "Erro desconhecido"} (Trace: ${traceId})`,
        variant: "destructive",
      });
    } finally {
      setResetLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLogin && evaluatePassword(password).score < 2) {
      toast({
        title: "Senha muito fraca",
        description: "Use ao menos 10 caracteres com letras maiúsculas, números ou símbolos.",
        variant: "destructive",
      });
      return;
    }
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
          <img src={watchtowerLogo} alt="Watchtower Monitoramentos" width={320} height={320} className="w-72 h-auto object-contain -ml-4" />
          <div className="w-16 h-0.5 bg-primary mt-6 mb-4" />
          <p className="text-xs tracking-[0.25em] text-muted-foreground font-medium">VIGILÂNCIA INTELIGENTE DE CÂMERAS</p>
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center p-8 bg-background relative">
        <button onClick={() => navigate("/watchtower")} className="absolute top-6 left-6 flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors">
          <ChevronLeft className="h-4 w-4" />VOLTAR
        </button>
        <div className="w-full max-w-sm">
          <div className="lg:hidden mb-10 text-center flex flex-col items-center">
            <img src={watchtowerLogo} alt="Watchtower Monitoramentos" width={220} height={220} className="w-48 h-auto object-contain" />
            <p className="text-[10px] tracking-[0.25em] text-muted-foreground mt-2">VIGILÂNCIA INTELIGENTE DE CÂMERAS</p>
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
                {isLogin && (
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    disabled={resetLoading}
                    className="text-[10px] text-primary hover:underline disabled:opacity-50"
                  >
                    {resetLoading ? "Enviando..." : "Esqueci a senha"}
                  </button>
                )}
              </div>
              <div className="relative">
                <Input id="wt-password" type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required minLength={6} className="bg-secondary border-border text-foreground pr-10 h-11" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {!isLogin && <PasswordStrengthMeter password={password} />}
            </div>
            <Button
              type="submit"
              className="w-full gradient-primary text-primary-foreground h-11 font-semibold text-xs tracking-wider"
              disabled={loading || (!isLogin && evaluatePassword(password).score < 2)}
            >
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
