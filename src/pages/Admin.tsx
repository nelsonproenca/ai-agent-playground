import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Inbox, Users, Building2, QrCode, FileText, CalendarDays, ShoppingBag, LogOut, FolderKanban, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import ChangePasswordDialog from "@/components/admin/ChangePasswordDialog";

const adminLinks = [
  { to: "/admin/leads", icon: Inbox, label: "Leads", desc: "Leads e análises IA" },
  { to: "/admin/agendamentos", icon: CalendarDays, label: "Agendamentos", desc: "Dashboard de reuniões e pipeline" },
  { to: "/admin/colaboradores", icon: Users, label: "Colaboradores", desc: "Equipe e departamentos" },
  { to: "/admin/clientes", icon: Building2, label: "Clientes", desc: "Empresas e contatos" },
  { to: "/admin/projetos", icon: FolderKanban, label: "Projetos", desc: "Portfólio e portal do cliente" },
  { to: "/convites", icon: QrCode, label: "Gerador de Convites", desc: "QR Codes e links" },
  { to: "/admin/produtos", icon: ShoppingBag, label: "Produtos DTC", desc: "Loja e inventário" },
  { to: "/landing", icon: FileText, label: "Flyer para Impressão", desc: "Landing page com QR personalizado" },
];

const Admin = () => {
  const navigate = useNavigate();
  const { authenticated, logout } = useAuth();
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);

  useEffect(() => {
    if (!authenticated) navigate("/login", { replace: true });
  }, [authenticated, navigate]);

  if (!authenticated) return null;

  return (
    <div className="min-h-screen bg-background grid-pattern">
      <header className="border-b border-border">
        <div className="container max-w-6xl py-6 flex items-center justify-between">
          <h1 className="font-mono font-bold text-foreground text-lg">
            Gerenciamento <span className="text-primary">do Site</span>
          </h1>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="font-mono gap-2 text-muted-foreground" onClick={() => setChangePasswordOpen(true)}>
              <KeyRound className="h-4 w-4" />
              Trocar senha
            </Button>
            <Button variant="ghost" size="sm" className="font-mono gap-2 text-muted-foreground" onClick={() => { logout(); navigate("/login"); }}>
              <LogOut className="h-4 w-4" />
              Sair
            </Button>
          </div>
        </div>
      </header>

      <ChangePasswordDialog open={changePasswordOpen} onOpenChange={setChangePasswordOpen} />

      <main className="container max-w-4xl py-16 px-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {adminLinks.map((item) => (
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
      </main>
    </div>
  );
};

export default Admin;
