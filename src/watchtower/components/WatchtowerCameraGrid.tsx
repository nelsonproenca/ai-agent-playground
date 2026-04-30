import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useWatchtowerAuth } from "@/watchtower/contexts/WatchtowerAuthContext";
import { useIsAdmin } from "@/watchtower/hooks/useIsAdmin";
import { cameraService, paymentService } from "@/watchtower/services";
import { WatchtowerCameraCard } from "./WatchtowerCameraCard";
import { WatchtowerEmptyCameraCard } from "./WatchtowerEmptyCameraCard";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, ChevronRight, ChevronDown, ChevronUp } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

const PAGE_SIZE_OPTIONS = [2, 4, 8] as const;
type PageSize = typeof PAGE_SIZE_OPTIONS[number];

// Mínimo de slots visíveis no grid para clientes — completamos com placeholders
// quando faltam câmeras. Para admin, sempre exibimos pelo menos 1 slot de cadastro.
const MIN_VISIBLE_SLOTS_USER = 4;

// Responsive grid classes tuned per page size to avoid awkward empty columns.
const GRID_CLASSES: Record<PageSize, string> = {
  2: "grid grid-cols-1 sm:grid-cols-2 gap-6",
  4: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-6",
  8: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6",
};

export function WatchtowerCameraGrid() {
  const { user } = useWatchtowerAuth();
  const { isAdmin } = useIsAdmin();
  const [pageSize, setPageSize] = useState<PageSize>(4);
  const [page, setPage] = useState(0);
  const [addOpen, setAddOpen] = useState(true);
  const [activesOpen, setActivesOpen] = useState(true);

  const { data: cameras, isLoading: camerasLoading } = useQuery({
    queryKey: ["watchtower-cameras"],
    queryFn: () => cameraService.getAll(),
    enabled: !!user,
  });

  const { data: accessStatus, isLoading: statusLoading } = useQuery({
    queryKey: ["watchtower-payment-status", user?.id],
    queryFn: () => paymentService.getStatus(),
    enabled: !!user,
  });

  const isLoading = camerasLoading || statusLoading;

  // Sanitiza pageSize: garante valor positivo presente nas opções aceitas.
  const safePageSize: PageSize = (PAGE_SIZE_OPTIONS as readonly number[]).includes(pageSize)
    ? pageSize
    : 4;

  // Garante contagem não-negativa mesmo se a API retornar payload inesperado.
  const cameraCount = Math.max(0, cameras?.length ?? 0);

  // Para admin: sempre exibimos exatamente 1 slot de cadastro no topo.
  // Para usuário: completamos até MIN_VISIBLE_SLOTS_USER se houver poucas câmeras.
  const placeholderCount = isAdmin
    ? 1
    : Math.max(0, MIN_VISIBLE_SLOTS_USER - cameraCount);

  // Paginação aplicada apenas às câmeras ativas — o slot admin fica fixo no topo
  // e os placeholders do usuário ficam fixos no fim, sem entrar na paginação.
  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(Math.max(1, cameraCount) / safePageSize)),
    [cameraCount, safePageSize],
  );

  // Clamp de página: nunca negativa, nunca além do total.
  const currentPage = Math.min(Math.max(0, page), Math.max(0, totalPages - 1));

  const visibleCameras = useMemo(() => {
    if (!cameras || cameraCount === 0) return [];
    const start = Math.max(0, currentPage * safePageSize);
    const end = Math.min(cameraCount, start + safePageSize);
    return cameras.slice(start, end);
  }, [cameras, cameraCount, currentPage, safePageSize]);

  const handlePageSizeChange = (value: string) => {
    const parsed = Number(value);
    const next: PageSize = (PAGE_SIZE_OPTIONS as readonly number[]).includes(parsed)
      ? (parsed as PageSize)
      : 4;
    setPageSize(next);
    setPage(0);
  };

  if (isLoading) {
    return (
      <div className={GRID_CLASSES[safePageSize]}>
        {Array.from({ length: safePageSize }).map((_, i) => (
          <div key={i} className="rounded-lg border border-border bg-card overflow-hidden">
            <Skeleton className="aspect-video w-full" />
            <div className="p-4 space-y-3">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
              <Skeleton className="h-8 w-full" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Admin sempre tem acesso a todas as câmeras (não depende de plano).
  const hasActiveAccess = isAdmin || accessStatus?.userAccessStatus === "Active";

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <p className="text-xs tracking-[0.15em] text-muted-foreground">
          {cameraCount} {cameraCount === 1 ? "CÂMERA ATIVA" : "CÂMERAS ATIVAS"}
          {!isAdmin && placeholderCount > 0 && ` • ${placeholderCount} ${placeholderCount === 1 ? "SLOT DISPONÍVEL" : "SLOTS DISPONÍVEIS"}`}
          {cameraCount > safePageSize && ` • PÁGINA ${currentPage + 1}/${totalPages}`}
        </p>
        <div className="flex items-center gap-2">
          <label htmlFor="cameras-per-page" className="text-xs tracking-[0.15em] text-muted-foreground">
            POR PÁGINA
          </label>
          <Select value={String(safePageSize)} onValueChange={handlePageSizeChange}>
            <SelectTrigger id="cameras-per-page" className="h-9 w-20 bg-secondary border-border text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAGE_SIZE_OPTIONS.map((opt) => (
                <SelectItem key={opt} value={String(opt)}>
                  {opt}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* SEÇÃO ADMIN: slot de cadastro colapsável */}
      {isAdmin && (
        <section className="space-y-3">
          <button
            onClick={() => setAddOpen((o) => !o)}
            className="flex items-center gap-3 w-full group"
          >
            <span className="text-[10px] font-bold tracking-[0.25em] text-primary">
              ADICIONAR CÂMERA
            </span>
            <div className="h-px flex-1 bg-border" />
            {addOpen
              ? <ChevronUp className="h-3.5 w-3.5 text-primary shrink-0" />
              : <ChevronDown className="h-3.5 w-3.5 text-primary shrink-0" />}
          </button>
          {addOpen && (
            <div className={GRID_CLASSES[safePageSize]}>
              <WatchtowerEmptyCameraCard index={0} isAdmin />
            </div>
          )}
        </section>
      )}

      {/* SEÇÃO: câmeras ativas colapsável */}
      <section className="space-y-3">
        <button
          onClick={() => setActivesOpen((o) => !o)}
          className="flex items-center gap-3 w-full group"
        >
          <span className="text-[10px] font-bold tracking-[0.25em] text-muted-foreground">
            CÂMERAS ATIVAS {cameraCount > 0 && `(${cameraCount})`}
          </span>
          <div className="h-px flex-1 bg-border" />
          {activesOpen
            ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />}
        </button>

        {activesOpen && (
          cameraCount === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center border border-dashed border-border rounded-lg">
              Nenhuma câmera ativa no momento.
            </p>
          ) : (
            <>
              <div className={GRID_CLASSES[safePageSize]}>
                {visibleCameras.map((camera) => (
                  <WatchtowerCameraCard
                    key={camera.id}
                    camera={camera}
                    hasAccess={hasActiveAccess}
                  />
                ))}
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(0, Math.min(p, totalPages - 1) - 1))}
                    disabled={currentPage === 0}
                    aria-label="Página anterior"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm text-muted-foreground px-2">
                    {currentPage + 1} / {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(Math.max(0, totalPages - 1), Math.max(0, p) + 1))}
                    disabled={currentPage >= totalPages - 1}
                    aria-label="Próxima página"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </>
          )
        )}
      </section>

      {/* SEÇÃO USUÁRIO: slots disponíveis para contratar plano */}
      {!isAdmin && placeholderCount > 0 && (
        <section className="space-y-3">
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-bold tracking-[0.25em] text-muted-foreground">
              SLOTS DISPONÍVEIS ({placeholderCount})
            </span>
            <div className="h-px flex-1 bg-border" />
          </div>
          <div className={GRID_CLASSES[safePageSize]}>
            {Array.from({ length: placeholderCount }, (_, i) => (
              <WatchtowerEmptyCameraCard
                key={`placeholder-${i + 1}`}
                index={cameraCount + i + 1}
                isAdmin={false}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
