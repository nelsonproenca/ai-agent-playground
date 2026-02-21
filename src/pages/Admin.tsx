import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowLeft, Inbox, Users, Building2, QrCode, FileText, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import GestaoLeads from "@/components/dashboard/GestaoLeads";
import GestaoColabs from "@/components/dashboard/GestaoColabs";
import GestaoClientes from "@/components/dashboard/GestaoClientes";

type TabKey = "leads" | "colabs" | "clientes" | null;

const quickLinks = [
  { to: "/agendamentos", icon: CalendarDays, label: "Agendamentos", desc: "Dashboard de reuniões e pipeline" },
  { to: "/convites", icon: QrCode, label: "Gerador de Convites", desc: "QR Codes e links" },
  { to: "/landing", icon: FileText, label: "Flyer para Impressão", desc: "Landing page com QR personalizado" },
];

const TAB_CONFIG: { key: TabKey & string; label: string; icon: React.ElementType }[] = [
  { key: "leads", label: "Leads", icon: Inbox },
  { key: "colabs", label: "Colaboradores", icon: Users },
  { key: "clientes", label: "Clientes", icon: Building2 },
];

const Admin = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = (searchParams.get("tab") as TabKey) || null;

  const setActiveTab = (tab: TabKey & string) => {
    setSearchParams({ tab });
  };

  return (
    <div className="min-h-screen bg-background grid-pattern">
      <header className="border-b border-border">
        <div className="container max-w-6xl py-6 flex items-center justify-between">
          <h1 className="font-mono font-bold text-foreground text-lg">
            Gerenciamento <span className="text-primary">do Site</span>
          </h1>
          <Button asChild variant="outline" size="sm" className="font-mono gap-2">
            <Link to="/">
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Link>
          </Button>
        </div>
      </header>

      {/* Tab navigation */}
      <div className="container max-w-6xl">
        <div className="flex gap-1 border-b border-border">
          {TAB_CONFIG.map(({ key, label, icon: Icon }) => (
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
            </button>
          ))}
        </div>
      </div>

      <main className="container max-w-6xl py-8 px-4 space-y-6">
        {activeTab === "leads" && <GestaoLeads />}
        {activeTab === "colabs" && <GestaoColabs />}
        {activeTab === "clientes" && <GestaoClientes />}

        {!activeTab && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-8">
            {quickLinks.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="group rounded-xl border border-border bg-card p-6 hover:border-primary/50 transition-all hover:shadow-lg hover:shadow-primary/5"
              >
                <div className="flex flex-col items-center text-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <item.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-mono font-bold text-foreground">{item.label}</h3>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Admin;
