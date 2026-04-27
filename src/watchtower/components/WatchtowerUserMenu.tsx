import { User, LogOut, Mail, Hash, Layers, Camera as CameraIcon, Shield } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { useWatchtowerAuth } from "@/watchtower/contexts/WatchtowerAuthContext";
import { useIsAdmin } from "@/watchtower/hooks/useIsAdmin";
import { cameraService } from "@/watchtower/services/cameraService";
import { paymentService } from "@/watchtower/services/paymentService";

export function WatchtowerUserMenu() {
  const { user, signOut } = useWatchtowerAuth();
  const { isAdmin } = useIsAdmin();

  const { data: cameras } = useQuery({
    queryKey: ["watchtower-cameras"],
    queryFn: () => cameraService.getAll(),
    enabled: !!user,
    staleTime: 60_000,
  });

  const { data: paymentStatus } = useQuery({
    queryKey: ["watchtower-payment-status", user?.id],
    queryFn: () => paymentService.getStatus(),
    enabled: !!user,
    staleTime: 60_000,
  });

  const displayName = (user?.user_metadata?.display_name as string | undefined) ?? null;
  const email = user?.email ?? null;
  const userCode = user ? user.id.slice(0, 8).toUpperCase() : "—";
  const cameraCount = cameras?.length ?? 0;

  const planName = isAdmin
    ? "Admin (acesso total)"
    : paymentStatus?.userAccessStatus === "Active"
      ? "Acesso ativo"
      : paymentStatus?.userAccessStatus === "PendingSetup"
        ? "Aguardando aprovação"
        : null;

  const initials = (displayName || email || "U").slice(0, 2).toUpperCase();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          aria-label="Perfil do usuário"
          className="h-9 w-9 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors"
        >
          <User className="h-4 w-4" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0 bg-popover border-border">
        <div className="p-4 flex items-center gap-3 border-b border-border">
          <div className="h-12 w-12 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center font-display text-base font-bold text-primary tracking-wider">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-display text-sm font-bold text-foreground tracking-wider truncate">
              {displayName || email?.split("@")[0]?.toUpperCase() || "USUÁRIO"}
            </p>
            <p className="text-[10px] tracking-[0.15em] text-muted-foreground mt-0.5">
              {isAdmin ? "ADMINISTRADOR" : "CLIENTE"}
            </p>
          </div>
          {isAdmin && (
            <Badge variant="outline" className="border-primary/40 text-primary text-[10px] tracking-wider shrink-0">
              <Shield className="h-3 w-3 mr-1" /> ADMIN
            </Badge>
          )}
        </div>

        <div className="p-4 space-y-3 text-xs">
          <InfoRow icon={Mail} label="EMAIL" value={email ?? "—"} />
          <InfoRow icon={Hash} label="CÓDIGO" value={userCode} mono />
          <InfoRow icon={Layers} label="PLANO" value={planName ?? "Sem plano ativo"} />
          <InfoRow icon={CameraIcon} label="CÂMERAS VINCULADAS" value={String(cameraCount)} />
        </div>

        <Separator />

        <div className="p-2">
          <Button
            variant="ghost"
            className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={() => signOut()}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sair
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
  mono,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-[10px] tracking-[0.15em] text-muted-foreground">{label}</p>
        <p className={`text-foreground truncate ${mono ? "font-mono" : ""}`} title={value}>
          {value}
        </p>
      </div>
    </div>
  );
}
