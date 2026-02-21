import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
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
import GeradorConvites from "./pages/GeradorConvites";
import Contato from "./pages/Contato";
import SuccessBooking from "./pages/SuccessBooking";
import LandingPage from "./pages/LandingPage";
import DashboardAgendamentos from "./pages/DashboardAgendamentos";
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
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
