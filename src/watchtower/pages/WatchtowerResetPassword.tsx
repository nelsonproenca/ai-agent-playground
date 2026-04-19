import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, ChevronLeft } from "lucide-react";
import { evaluatePassword, PasswordStrengthMeter } from "@/watchtower/components/WatchtowerPasswordStrength";

export default function WatchtowerResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [validSession, setValidSession] = useState<boolean | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    let mounted = true;
    const init = async () => {
      const url = new URL(window.location.href);
      const code = url.searchParams.get("code");
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (mounted) setValidSession(!error);
        url.searchParams.delete("code");
        window.history.replaceState({}, "", url.pathname + url.search);
        return;
      }
      const { data: { session } } = await supabase.auth.getSession();
      if (mounted) setValidSession(!!session);
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN" || session) {
        setValidSession(true);
      }
    });

    init();
    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast({ title: "Senhas não conferem", description: "As duas senhas devem ser idênticas.", variant: "destructive" });
      return;
    }
    if (evaluatePassword(password).score < 2) {
      toast({
        title: "Senha muito fraca",
        description: "Use ao menos 10 caracteres com letras maiúsculas, números ou símbolos.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast({ title: "Senha redefinida!", description: "Sua nova senha foi salva. Você já está logado." });
      navigate("/watchtower/dashboard");
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-background">
      <div className="flex-1 flex items-center justify-center p-8 relative">
        <button
          onClick={() => navigate("/watchtower/auth")}
          className="absolute top-6 left-6 flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          VOLTAR
        </button>

        <div className="w-full max-w-sm">
          <div className="mb-10 text-center">
            <h1 className="font-display text-3xl font-bold text-primary tracking-wider">WATCHTOWER</h1>
            <p className="text-[10px] tracking-[0.25em] text-muted-foreground mt-2">REDEFINIÇÃO DE SENHA</p>
          </div>

          <h2 className="font-display text-2xl font-bold text-foreground mb-1">NOVA SENHA</h2>
          <p className="text-xs text-muted-foreground mb-8">Defina uma nova senha para acessar sua conta.</p>

          {validSession === false ? (
            <div className="space-y-4">
              <p className="text-xs text-destructive">Link inválido ou expirado. Solicite um novo e-mail de recuperação.</p>
              <Button onClick={() => navigate("/watchtower/auth")} className="w-full h-11 font-semibold text-xs tracking-wider">
                VOLTAR PARA LOGIN
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="password" className="text-xs tracking-wider text-muted-foreground">NOVA SENHA</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={6}
                    className="bg-secondary border-border text-foreground pr-10 h-11"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <PasswordStrengthMeter password={password} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm" className="text-xs tracking-wider text-muted-foreground">CONFIRMAR SENHA</Label>
                <Input
                  id="confirm"
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  className="bg-secondary border-border text-foreground h-11"
                />
              </div>

              <Button
                type="submit"
                className="w-full h-11 font-semibold text-xs tracking-wider"
                disabled={loading || validSession === null || evaluatePassword(password).score < 2}
              >
                {loading ? "Salvando..." : "REDEFINIR SENHA →"}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
