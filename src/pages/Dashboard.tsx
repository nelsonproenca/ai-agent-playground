import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Terminal, Lock, Inbox, Users, Building2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import GestaoLeads from "@/components/dashboard/GestaoLeads";
import GestaoColabs from "@/components/dashboard/GestaoColabs";
import GestaoClientes from "@/components/dashboard/GestaoClientes";

type TabKey = "leads" | "colabs" | "clientes";

const TAB_CONFIG: { key: TabKey; label: string; icon: React.ElementType }[] = [
  { key: "leads", label: "Leads", icon: Inbox },
  { key: "colabs", label: "Colaboradores", icon: Users },
  { key: "clientes", label: "Clientes", icon: Building2 },
];

const Dashboard = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [colabsCount, setColabsCount] = useState(0);
  const [clientesCount, setClientesCount] = useState(0);
  const [leadsCount, setLeadsCount] = useState(0);

  const activeTab = (searchParams.get("tab") as TabKey) || "leads";
  const setActiveTab = (tab: TabKey) => setSearchParams({ tab });

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === "nelson2024") {
      setAuthenticated(true);
      setPasswordError("");
    } else {
      setPasswordError("Senha incorreta.");
    }
  };

  useEffect(() => {
    if (!authenticated) return;

    const fetchCounts = async () => {
      const { count: lCount } = await supabase.from("leads_ia").select("*", { count: "exact", head: true });
      const { count: cCount } = await supabase.from("colaboradores").select("*", { count: "exact", head: true });
      const { count: clCount } = await supabase.from("clientes").select("*", { count: "exact", head: true });
      setLeadsCount(lCount ?? 0);
      setColabsCount(cCount ?? 0);
      setClientesCount(clCount ?? 0);
    };

    fetchCounts();
  }, [authenticated]);

  if (!authenticated) {
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
  }

  return (
    <div className="min-h-screen bg-background grid-pattern">
      {/* Header */}
      <header className="border-b border-border sticky top-0 z-40 bg-background/80 backdrop-blur-sm">
        <div className="container max-w-7xl py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Terminal className="h-5 w-5 text-primary" />
            <span className="font-mono font-bold text-foreground">
              nelson<span className="text-primary">.admin</span>
            </span>
          </div>
          <Button asChild variant="ghost" size="sm" className="font-mono text-xs text-muted-foreground gap-1">
            <Link to="/admin">← Voltar</Link>
          </Button>
        </div>
        {/* Tabs */}
        <div className="container max-w-7xl pb-0">
          <div className="flex gap-1 border-b border-border -mb-px">
            {TAB_CONFIG.map(({ key, label, icon: Icon }) => {
              const count = key === "leads" ? leadsCount : key === "colabs" ? colabsCount : clientesCount;
              return (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  className={`flex items-center gap-2 px-4 py-2.5 font-mono text-xs transition-colors border-b-2 ${
                    activeTab === key
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 min-w-[1.25rem] justify-center">
                    {count}
                  </Badge>
                </button>
              );
            })}
          </div>
        </div>
      </header>

      <main className="container max-w-7xl py-8 px-4 space-y-6">
        {activeTab === "leads" && <GestaoLeads />}
        {activeTab === "colabs" && <GestaoColabs />}
        {activeTab === "clientes" && <GestaoClientes />}
      </main>
    </div>
  );
};

export default Dashboard;
