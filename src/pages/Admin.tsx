import { Link } from "react-router-dom";
import { ArrowLeft, Shield, Users, Building2, QrCode, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

const adminLinks = [
  { to: "/dashboard", icon: Shield, label: "Área Restrita", desc: "Leads e análises IA" },
  { to: "/colabs", icon: Users, label: "Colaboradores", desc: "Equipe e departamentos" },
  { to: "/clientes", icon: Building2, label: "Clientes", desc: "Empresas e contatos" },
  { to: "/convites", icon: QrCode, label: "Gerador de Convites", desc: "QR Codes e links" },
  { to: "/landing", icon: FileText, label: "Flyer para Impressão", desc: "Landing page com QR personalizado" },
];

const Admin = () => {
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
