import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { AuthProvider } from "@/hooks/useAuth";
import Index from "./pages/Index";
import LoginPage from "./pages/LoginPage";
import Colabs from "./pages/Colabs";
import Clientes from "./pages/Clientes";
import Playground from "./pages/Playground";
import Admin from "./pages/Admin";
import LeadsPage from "./pages/LeadsPage";
import ColabsPage from "./pages/ColabsPage";
import ClientesPage from "./pages/ClientesPage";
import ProjetosPage from "./pages/ProjetosPage";
import ProjetoDetalhePage from "./pages/ProjetoDetalhePage";
import PortalPage from "./pages/PortalPage";
import PortalProjetoDetalhePage from "./pages/PortalProjetoDetalhePage";
import PortalEntrarPage from "./pages/PortalEntrarPage";
import PortfolioPage from "./pages/PortfolioPage";
import { ClientAuthProvider } from "@/features/portfolio/useClientAuth";
import GeradorConvites from "./pages/GeradorConvites";
import Contato from "./pages/Contato";
import SuccessBooking from "./pages/SuccessBooking";
import LandingPage from "./pages/LandingPage";
import DashboardAgendamentos from "./pages/DashboardAgendamentos";
import Claw3D from "./pages/Claw3D";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Main site routes */}
            <Route path="/" element={<Index />} />
            <Route path="/colabs" element={<Colabs />} />
            <Route path="/clientes" element={<Clientes />} />
            <Route path="/projetos" element={<PortfolioPage />} />
            <Route path="/playground" element={<Playground />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/admin/leads" element={<LeadsPage />} />
            <Route path="/admin/colaboradores" element={<ColabsPage />} />
            <Route path="/admin/clientes" element={<ClientesPage />} />
            <Route path="/admin/projetos" element={<ProjetosPage />} />
            <Route path="/admin/projetos/:id" element={<ProjetoDetalhePage />} />
            <Route path="/portal" element={<ClientAuthProvider><PortalPage /></ClientAuthProvider>} />
            <Route path="/portal/entrar" element={<ClientAuthProvider><PortalEntrarPage /></ClientAuthProvider>} />
            <Route path="/portal/:id" element={<ClientAuthProvider><PortalProjetoDetalhePage /></ClientAuthProvider>} />
            <Route path="/convites" element={<GeradorConvites />} />
            <Route path="/contato" element={<Contato />} />
            <Route path="/booking-success" element={<SuccessBooking />} />
            <Route path="/landing" element={<LandingPage />} />
            <Route path="/admin/agendamentos" element={<DashboardAgendamentos />} />
            <Route path="/claw3d" element={<Claw3D />} />

            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
