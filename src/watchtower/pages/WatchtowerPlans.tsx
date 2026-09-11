import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Loader2 } from "lucide-react";
import { WatchtowerPlanModal } from "@/watchtower/components/WatchtowerPlanModal";
import { useWatchtowerAuth } from "@/watchtower/contexts/WatchtowerAuthContext";
import { apiClient } from "@/watchtower/services/apiClient";
import type { AdminPlanDto, PlanTier } from "@/watchtower/types/api";

const TIER_ORDER: PlanTier[] = ["Acesso24h", "Bronze", "Silver", "Gold"];

function formatPrice(price: number): string {
  return `R$ ${price.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function WatchtowerPlans() {
  const navigate = useNavigate();
  const { user } = useWatchtowerAuth();

  const [plans, setPlans] = useState<AdminPlanDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<AdminPlanDto | null>(null);

  useEffect(() => {
    apiClient
      .get<AdminPlanDto[]>("/api/plans", false)
      .then((data) =>
        setPlans(
          [...data].sort((a, b) => TIER_ORDER.indexOf(a.planTier) - TIER_ORDER.indexOf(b.planTier)),
        ),
      )
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handlePlanAction = (plan: AdminPlanDto) => {
    if (!user) {
      navigate("/watchtower/auth");
      return;
    }
    setSelectedPlan(plan);
    setModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ── Navbar ──────────────────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-primary/20 bg-background/95 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              to="/watchtower"
              className="font-mono text-xs tracking-widest text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronLeft className="h-3 w-3 inline mr-1" />
              INÍCIO
            </Link>
            <Link to="/watchtower" className="flex items-center gap-2">
              <img
                src="/watchtower-favicon.png"
                alt="Watchtower"
                width={28}
                height={28}
                className="h-7 w-7 object-contain"
                loading="lazy"
              />
              <span className="font-mono text-sm font-bold text-primary tracking-wider">WATCHTOWER</span>
            </Link>
          </div>

          <div className="flex items-center gap-4">
            {user ? (
              <Button
                size="sm"
                variant="outline"
                className="font-mono text-xs tracking-widest"
                onClick={() => navigate("/watchtower/dashboard")}
              >
                [PAINEL]
              </Button>
            ) : (
              <Button
                size="sm"
                className="font-mono text-xs tracking-widest"
                onClick={() => navigate("/watchtower/auth")}
              >
                [ENTRAR]
              </Button>
            )}
          </div>
        </div>
      </nav>

      {/* ── Page content ────────────────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-6 pt-28 pb-24">
        <div className="text-center mb-14">
          <p className="font-mono text-xs tracking-widest text-primary mb-3">// PLANOS E PREÇOS</p>
          <h1 className="font-mono text-3xl md:text-4xl font-bold tracking-wider mb-4">
            COMPARATIVO DE PLANOS
          </h1>
          <p className="font-mono text-xs text-muted-foreground">
            <span className="text-primary/50">{"/* "}</span>
            pagamento via PIX · acesso liberado em até 24h
            <span className="text-primary/50">{" */"}</span>
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
          </div>
        ) : plans.length === 0 ? (
          <p className="font-mono text-center text-sm text-muted-foreground py-16">
            // nenhum plano disponível no momento
          </p>
        ) : (
          <>
            <div className="overflow-x-auto border border-border rounded-sm">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-border">
                    <th className="py-4 px-5 text-left w-40 bg-muted/30" />
                    {plans.map((plan) => {
                      const isPopular = plan.planTier === "Silver";
                      return (
                        <th
                          key={plan.id}
                          className={`py-4 px-5 text-center font-mono text-xs tracking-widest ${
                            isPopular ? "bg-primary/5" : "bg-muted/30"
                          }`}
                        >
                          <span className={isPopular ? "text-primary" : "text-muted-foreground"}>
                            {plan.name.toUpperCase()}
                          </span>
                          {isPopular && (
                            <span className="block font-mono text-[10px] font-normal text-primary mt-1.5 tracking-wider">
                              ★ POPULAR
                            </span>
                          )}
                        </th>
                      );
                    })}
                  </tr>
                </thead>

                <tbody className="font-mono text-xs divide-y divide-border/60">
                  {/* Preço */}
                  <tr>
                    <td className="py-3 px-5 text-muted-foreground bg-muted/10">Preço</td>
                    {plans.map((plan) => {
                      const isPopular = plan.planTier === "Silver";
                      return (
                        <td
                          key={plan.id}
                          className={`py-3 px-5 text-center font-semibold ${
                            isPopular ? "bg-primary/5 text-primary" : "text-foreground"
                          }`}
                        >
                          {formatPrice(plan.priceBrl)}
                          {plan.durationDays > 1 && (
                            <span className="font-normal text-muted-foreground">/mês</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>

                  {/* Duração */}
                  <tr>
                    <td className="py-3 px-5 text-muted-foreground bg-muted/10">Duração</td>
                    {plans.map((plan) => (
                      <td
                        key={plan.id}
                        className={`py-3 px-5 text-center text-foreground ${
                          plan.planTier === "Silver" ? "bg-primary/5" : ""
                        }`}
                      >
                        {plan.durationDays === 1 ? "1 dia" : "30 dias"}
                      </td>
                    ))}
                  </tr>

                  {/* Ao Vivo */}
                  <tr>
                    <td className="py-3 px-5 text-muted-foreground bg-muted/10">Ao Vivo</td>
                    {plans.map((plan) => (
                      <td
                        key={plan.id}
                        className={`py-3 px-5 text-center text-primary ${
                          plan.planTier === "Silver" ? "bg-primary/5" : ""
                        }`}
                      >
                        ✓
                      </td>
                    ))}
                  </tr>

                  {/* Gravações */}
                  <tr>
                    <td className="py-3 px-5 text-muted-foreground bg-muted/10">Gravações</td>
                    {plans.map((plan) => (
                      <td
                        key={plan.id}
                        className={`py-3 px-5 text-center ${
                          plan.planTier === "Silver" ? "bg-primary/5" : ""
                        } ${plan.recordingDaysLimit ? "text-primary" : "text-muted-foreground/40"}`}
                      >
                        {plan.recordingDaysLimit ? `${plan.recordingDaysLimit} dias` : "✗"}
                      </td>
                    ))}
                  </tr>

                  {/* Download */}
                  <tr>
                    <td className="py-3 px-5 text-muted-foreground bg-muted/10">Download</td>
                    {plans.map((plan) => (
                      <td
                        key={plan.id}
                        className={`py-3 px-5 text-center ${
                          plan.planTier === "Silver" ? "bg-primary/5" : ""
                        } ${plan.canDownload ? "text-primary" : "text-muted-foreground/40"}`}
                      >
                        {plan.canDownload ? "✓" : "✗"}
                      </td>
                    ))}
                  </tr>

                  {/* CTA row */}
                  <tr className="border-t border-border">
                    <td className="py-4 px-5 bg-muted/10" />
                    {plans.map((plan) => {
                      const isPopular = plan.planTier === "Silver";
                      return (
                        <td
                          key={plan.id}
                          className={`py-4 px-5 text-center ${isPopular ? "bg-primary/5" : ""}`}
                        >
                          <Button
                            size="sm"
                            variant={isPopular ? "default" : "outline"}
                            className="font-mono text-xs tracking-widest w-full"
                            onClick={() => handlePlanAction(plan)}
                          >
                            [PIX]
                          </Button>
                        </td>
                      );
                    })}
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="mt-6 border border-border/60 rounded-sm p-4 bg-muted/20">
              <p className="font-mono text-xs text-muted-foreground">
                <span className="text-primary/70">// </span>
                Taxa única de ativação:{" "}
                <span className="text-foreground font-semibold">R$ 150,00</span> — cobrada apenas na
                configuração inicial das câmeras.
              </p>
            </div>

            {!user && (
              <p className="font-mono text-xs text-center text-muted-foreground mt-6">
                <span className="text-primary/60">// </span>
                É necessário{" "}
                <button
                  onClick={() => navigate("/watchtower/auth")}
                  className="text-primary hover:underline"
                >
                  criar uma conta
                </button>{" "}
                para realizar a compra.
              </p>
            )}
          </>
        )}
      </div>

      {/* Modal */}
      <WatchtowerPlanModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelectedPlan(null);
        }}
        preSelectedPlan={selectedPlan ?? undefined}
      />
    </div>
  );
}
