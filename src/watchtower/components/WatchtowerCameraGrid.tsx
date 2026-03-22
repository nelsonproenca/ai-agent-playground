import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useWatchtowerAuth } from "@/watchtower/contexts/WatchtowerAuthContext";
import { WatchtowerCameraCard } from "./WatchtowerCameraCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Camera } from "lucide-react";

export function WatchtowerCameraGrid() {
  const { user } = useWatchtowerAuth();

  const { data: cameras, isLoading: camerasLoading } = useQuery({
    queryKey: ["watchtower-cameras"],
    queryFn: async () => {
      const { data, error } = await (supabase as any).from("cameras").select("*");
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: subscriptions, isLoading: subsLoading } = useQuery({
    queryKey: ["watchtower-subscriptions", user?.id],
    queryFn: async () => {
      const { data, error } = await (supabase as any).from("subscriptions").select("*").eq("user_id", user!.id);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const isLoading = camerasLoading || subsLoading;

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-lg border border-border bg-card overflow-hidden">
            <Skeleton className="aspect-video w-full" />
            <div className="p-4 space-y-3"><Skeleton className="h-4 w-3/4" /><Skeleton className="h-3 w-1/2" /><Skeleton className="h-8 w-full" /></div>
          </div>
        ))}
      </div>
    );
  }

  if (!cameras?.length) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-secondary mb-4"><Camera className="h-8 w-8 text-muted-foreground" /></div>
        <h2 className="text-lg font-semibold text-foreground mb-1">Nenhuma câmera encontrada</h2>
        <p className="text-sm text-muted-foreground">As câmeras serão exibidas aqui quando disponíveis.</p>
      </div>
    );
  }

  const getSubscription = (cameraId: string) => subscriptions?.find((s: any) => s.camera_id === cameraId) ?? null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      {cameras.map((camera: any) => (
        <WatchtowerCameraCard key={camera.id} camera={camera} subscription={getSubscription(camera.id)} />
      ))}
    </div>
  );
}
