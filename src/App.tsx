import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import Colabs from "./pages/Colabs";
import Clientes from "./pages/Clientes";
import Playground from "./pages/Playground";
import Admin from "./pages/Admin";
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
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/colabs" element={<Colabs />} />
          <Route path="/clientes" element={<Clientes />} />
          <Route path="/playground" element={<Playground />} />
          <Route path="/login" element={<Dashboard />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/convites" element={<GeradorConvites />} />
          <Route path="/contato" element={<Contato />} />
          <Route path="/booking-success" element={<SuccessBooking />} />
          <Route path="/landing" element={<LandingPage />} />
          <Route path="/agendamentos" element={<DashboardAgendamentos />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
