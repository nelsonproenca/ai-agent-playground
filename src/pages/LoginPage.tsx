import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";

const Dashboard = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const { login: authLogin } = useAuth();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === "nelson2024") {
      authLogin();
      navigate("/admin");
    } else {
      setPasswordError("Senha incorreta.");
    }
  };

  return (
    <div className="min-h-screen bg-background grid-pattern flex items-center justify-center p-4">
      <Card className="w-full max-w-sm border-border bg-card">
        <CardHeader className="text-center space-y-3">
          <div className="mx-auto inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 glow-primary">
            <Lock className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="font-mono text-foreground">Área Restrita</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <Input
              type="password"
              placeholder="Senha de acesso"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="font-mono bg-secondary border-border text-foreground"
            />
            {passwordError && (
              <p className="text-sm text-destructive font-mono">{passwordError}</p>
            )}
            <Button type="submit" className="w-full font-mono">
              Acessar
            </Button>
            <Button asChild variant="ghost" className="w-full font-mono text-muted-foreground">
              <Link to="/">← Voltar para Home</Link>
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
