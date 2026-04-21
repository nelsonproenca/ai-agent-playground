import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useWatchtowerAuth } from "@/watchtower/contexts/WatchtowerAuthContext";
import { cameraService, paymentService } from "@/watchtower/services";
import { WatchtowerCameraCard } from "./WatchtowerCameraCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Camera, ChevronLeft, ChevronRight } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

const PAGE_SIZE_OPTIONS = [2, 4, 8] as const;
type PageSize = typeof PAGE_SIZE_OPTIONS[number];

// Responsive grid classes tuned per page size to avoid awkward empty columns.
const GRID_CLASSES: Record<PageSize, string> = {
  2: "grid grid-cols-1 sm:grid-cols-2 gap-6",
  4: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-6",
  8: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6",
};

export function WatchtowerCameraGrid() {
  const { user } = useWatchtowerAuth();
  const [pageSize, setPageSize] = useState<PageSize>(4);
  const [page, setPage] = useState(0);

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

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil((cameras?.length ?? 0) / pageSize)),
    [cameras, pageSize],
  );

  const currentPage = Math.min(page, totalPages - 1);

  const visibleCameras = useMemo(() => {
    if (!cameras) return [];
    const start = currentPage * pageSize;
    return cameras.slice(start, start + pageSize);
  }, [cameras, currentPage, pageSize]);

  const handlePageSizeChange = (value: string) => {
    setPageSize(Number(value) as PageSize);
    setPage(0);
  };

  if (isLoading) {
    return (
      <div className={GRID_CLASSES[pageSize]}>
        {Array.from({ length: pageSize }).map((_, i) => (
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

  if (!cameras?.length) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-secondary mb-4">
          <Camera className="h-8 w-8 text-muted-foreground" />
        </div>
        <h2 className="text-lg font-semibold text-foreground mb-1">
          Nenhuma câmera encontrada
        </h2>
        <p className="text-sm text-muted-foreground">
          As câmeras serão exibidas aqui quando disponíveis.
        </p>
      </div>
    );
  }

  const hasActiveAccess = accessStatus?.userAccessStatus === "Active";

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <p className="text-xs tracking-[0.15em] text-muted-foreground">
          {cameras.length} {cameras.length === 1 ? "CÂMERA" : "CÂMERAS"} • PÁGINA {currentPage + 1}/{totalPages}
        </p>
        <div className="flex items-center gap-2">
          <label htmlFor="cameras-per-page" className="text-xs tracking-[0.15em] text-muted-foreground">
            POR PÁGINA
          </label>
          <Select value={String(pageSize)} onValueChange={handlePageSizeChange}>
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

      <div className={GRID_CLASSES[pageSize]}>
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
            onClick={() => setPage((p) => Math.max(0, p - 1))}
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
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={currentPage >= totalPages - 1}
            aria-label="Próxima página"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
