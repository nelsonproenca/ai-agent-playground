import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";

// Rota padrão para onde clientes são redirecionados ao tentar acessar área admin.
const USER_HOME_ROUTE = "/watchtower/dashboard";
import { AuthProvider } from "@/hooks/useAuth";
import { WatchtowerAuthProvider, useWatchtowerAuth } from "@/watchtower/contexts/WatchtowerAuthContext";
import { WatchtowerDashboardLayout } from "@/watchtower/components/WatchtowerDashboardLayout";
import { useIsAdmin } from "@/watchtower/hooks/useIsAdmin";
import { useAccessStatus } from "@/watchtower/hooks/useAccessStatus";
import { WatchtowerWhatsAppButton } from "@/watchtower/components/WatchtowerWhatsAppButton";
import Index from "./pages/Index";
import LoginPage from "./pages/LoginPage";
import Colabs from "./pages/Colabs";
import Clientes from "./pages/Clientes";
import Playground from "./pages/Playground";
import Admin from "./pages/Admin";
import LeadsPage from "./pages/LeadsPage";
import ColabsPage from "./pages/ColabsPage";
import ClientesPage from "./pages/ClientesPage";
import GeradorConvites from "./pages/GeradorConvites";
import Contato from "./pages/Contato";
import SuccessBooking from "./pages/SuccessBooking";
import LandingPage from "./pages/LandingPage";
import DashboardAgendamentos from "./pages/DashboardAgendamentos";
import LojaPage from "./pages/LojaPage";
import ProdutosPage from "./pages/ProdutosPage";
import NotFound from "./pages/NotFound";

// Watchtower pages
import WatchtowerLanding from "./watchtower/pages/WatchtowerLanding";
import WatchtowerAuth from "./watchtower/pages/WatchtowerAuth";
import WatchtowerDashboard from "./watchtower/pages/WatchtowerDashboard";
import WatchtowerLive from "./watchtower/pages/WatchtowerLive";
import WatchtowerBilling from "./watchtower/pages/WatchtowerBilling";
import WatchtowerSupport from "./watchtower/pages/WatchtowerSupport";
import WatchtowerSettings from "./watchtower/pages/WatchtowerSettings";
import WatchtowerAbout from "./watchtower/pages/WatchtowerAbout";
import WatchtowerContact from "./watchtower/pages/WatchtowerContact";
import WatchtowerBlog from "./watchtower/pages/WatchtowerBlog";
import WatchtowerHealthCheck from "./watchtower/pages/WatchtowerHealthCheck";
import WatchtowerAdminUsers from "./watchtower/pages/WatchtowerAdminUsers";
import WatchtowerAdminPlans from "./watchtower/pages/WatchtowerAdminPlans";
import WatchtowerAdminCameras from "./watchtower/pages/WatchtowerAdminCameras";
import WatchtowerAdminPayments from "./watchtower/pages/WatchtowerAdminPayments";
import WatchtowerAdminAudit from "./watchtower/pages/WatchtowerAdminAudit";
import WatchtowerAdminBridges from "./watchtower/pages/WatchtowerAdminBridges";
import WatchtowerResetPassword from "./watchtower/pages/WatchtowerResetPassword";
import WatchtowerWaiting from "./watchtower/pages/WatchtowerWaiting";

const queryClient = new QueryClient();

function WatchtowerProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useWatchtowerAuth();
  const { isWaiting, loading: statusLoading } = useAccessStatus();
  if (loading || statusLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  if (!user) return <Navigate to="/watchtower/auth" replace />;
  // Acesso ainda não liberado (15min) ou pedido admin pendente → tela de espera
  if (isWaiting) return <Navigate to="/watchtower/waiting" replace />;
  return <WatchtowerDashboardLayout>{children}</WatchtowerDashboardLayout>;
}

/**
 * Restringe rotas /watchtower/dashboard/admin/* a usuários com role 'admin'.
 * Cliente autenticado: redirecionado para /watchtower/dashboard (área padrão).
 * Não autenticado: redirecionado para /watchtower/auth.
 * Em janela de espera (15min OU pedido admin pendente): redirecionado para /watchtower/waiting.
 */
function WatchtowerAdminRoute({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useWatchtowerAuth();
  const { isAdmin, loading: roleLoading } = useIsAdmin();
  const { isWaiting, loading: statusLoading } = useAccessStatus();
  const location = useLocation();
  const navigate = useNavigate();

  // Toast padronizado quando usuário NÃO admin tenta acessar área admin.
  useEffect(() => {
    if (authLoading || roleLoading || statusLoading) return;
    if (!user || isAdmin || isWaiting) return;

    const attemptedRoute = location.pathname;
    toast.error("Acesso restrito — área administrativa", {
      id: `admin-denied:${attemptedRoute}`,
      duration: 7000,
      description: (
        <span className="block">
          A rota{" "}
          <code className="px-1.5 py-0.5 rounded bg-muted text-foreground font-mono text-xs">
            {attemptedRoute}
          </code>{" "}
          é exclusiva para administradores. Redirecionando você para{" "}
          <code className="px-1.5 py-0.5 rounded bg-muted text-foreground font-mono text-xs">
            {USER_HOME_ROUTE}
          </code>
          .
        </span>
      ),
      action: {
        label: "Ir para meu painel",
        onClick: () => navigate(USER_HOME_ROUTE),
      },
    });
  }, [authLoading, roleLoading, statusLoading, user, isAdmin, isWaiting, location.pathname, navigate]);

  if (authLoading || roleLoading || statusLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  if (!user) return <Navigate to="/watchtower/auth" replace state={{ from: location.pathname }} />;
  if (isWaiting) return <Navigate to="/watchtower/waiting" replace />;
  if (!isAdmin) return <Navigate to={USER_HOME_ROUTE} replace />;
  return <WatchtowerDashboardLayout>{children}</WatchtowerDashboardLayout>;
}

function WatchtowerPublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useWatchtowerAuth();
  const { isWaiting, loading: statusLoading } = useAccessStatus();
  if (loading || statusLoading) return null;
  // Se logado e em espera → manda pra tela de espera (não pra dashboard)
  if (user && isWaiting) return <Navigate to="/watchtower/waiting" replace />;
  if (user) return <Navigate to="/watchtower/dashboard" replace />;
  return <>{children}</>;
}

function WatchtowerThemeWrapper({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation();
  const isWatchtower = pathname.startsWith("/watchtower");
  // Oculta o botão flutuante em telas de autenticação para não competir com o formulário
  const hideWhatsApp =
    pathname === "/watchtower/auth" ||
    pathname === "/watchtower/reset-password" ||
    pathname.startsWith("/watchtower/dashboard/admin") ||
    pathname === "/watchtower/dashboard/health";
  return (
    <div className={isWatchtower ? "watchtower-theme min-h-screen" : ""}>
      {children}
      {isWatchtower && !hideWhatsApp && <WatchtowerWhatsAppButton />}
    </div>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <WatchtowerAuthProvider>
            <WatchtowerThemeWrapper>
              <Routes>
                {/* Main site routes */}
                <Route path="/" element={<Index />} />
                <Route path="/colabs" element={<Colabs />} />
                <Route path="/clientes" element={<Clientes />} />
                <Route path="/playground" element={<Playground />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/admin" element={<Admin />} />
                <Route path="/admin/leads" element={<LeadsPage />} />
                <Route path="/admin/colaboradores" element={<ColabsPage />} />
                <Route path="/admin/clientes" element={<ClientesPage />} />
                <Route path="/convites" element={<GeradorConvites />} />
                <Route path="/contato" element={<Contato />} />
                <Route path="/booking-success" element={<SuccessBooking />} />
                <Route path="/landing" element={<LandingPage />} />
                <Route path="/admin/agendamentos" element={<DashboardAgendamentos />} />
                <Route path="/admin/produtos" element={<ProdutosPage />} />
                <Route path="/loja" element={<LojaPage />} />

                {/* Watchtower Hub routes */}
                <Route path="/watchtower" element={<WatchtowerPublicRoute><WatchtowerLanding /></WatchtowerPublicRoute>} />
                <Route path="/watchtower/auth" element={<WatchtowerPublicRoute><WatchtowerAuth /></WatchtowerPublicRoute>} />
                <Route path="/watchtower/dashboard" element={<WatchtowerProtectedRoute><WatchtowerDashboard /></WatchtowerProtectedRoute>} />
                <Route path="/watchtower/dashboard/live" element={<WatchtowerProtectedRoute><WatchtowerLive /></WatchtowerProtectedRoute>} />
                <Route path="/watchtower/dashboard/billing" element={<WatchtowerProtectedRoute><WatchtowerBilling /></WatchtowerProtectedRoute>} />
                <Route path="/watchtower/dashboard/support" element={<WatchtowerProtectedRoute><WatchtowerSupport /></WatchtowerProtectedRoute>} />
                <Route path="/watchtower/dashboard/settings" element={<WatchtowerProtectedRoute><WatchtowerSettings /></WatchtowerProtectedRoute>} />
                <Route path="/watchtower/dashboard/health" element={<WatchtowerProtectedRoute><WatchtowerHealthCheck /></WatchtowerProtectedRoute>} />
                <Route path="/watchtower/dashboard/admin/users" element={<WatchtowerAdminRoute><WatchtowerAdminUsers /></WatchtowerAdminRoute>} />
                <Route path="/watchtower/dashboard/admin/plans" element={<WatchtowerAdminRoute><WatchtowerAdminPlans /></WatchtowerAdminRoute>} />
                <Route path="/watchtower/dashboard/admin/cameras" element={<WatchtowerAdminRoute><WatchtowerAdminCameras /></WatchtowerAdminRoute>} />
                <Route path="/watchtower/dashboard/admin/payments" element={<WatchtowerAdminRoute><WatchtowerAdminPayments /></WatchtowerAdminRoute>} />
                <Route path="/watchtower/dashboard/admin/audit" element={<WatchtowerAdminRoute><WatchtowerAdminAudit /></WatchtowerAdminRoute>} />
                <Route path="/watchtower/dashboard/admin/bridges" element={<WatchtowerAdminRoute><WatchtowerAdminBridges /></WatchtowerAdminRoute>} />
                <Route path="/watchtower/reset-password" element={<WatchtowerResetPassword />} />
                <Route path="/watchtower/waiting" element={<WatchtowerWaiting />} />
                <Route path="/watchtower/about" element={<WatchtowerAbout />} />
                <Route path="/watchtower/contact" element={<WatchtowerContact />} />
                <Route path="/watchtower/blog" element={<WatchtowerBlog />} />

                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </WatchtowerThemeWrapper>
          </WatchtowerAuthProvider>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
