import { useEffect, useState } from "react";
import { User, LogOut, Mail, Hash, Layers, Camera as CameraIcon, Shield } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useWatchtowerAuth } from "@/watchtower/contexts/WatchtowerAuthContext";
import { useIsAdmin } from "@/watchtower/hooks/useIsAdmin";
import { supabase } from "@/integrations/supabase/client";

interface UserInfo {
  displayName: string | null;
  email: string | null;
  userCode: string;
  planName: string | null;
  cameraCount: number;
}

export function WatchtowerUserMenu() {
  const { user, signOut } = useWatchtowerAuth();
  const { isAdmin } = useIsAdmin();
  const [info, setInfo] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      setInfo(null);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const [{ data: profile }, { data: subs }, { count: cameraCount }] = await Promise.all([
          supabase.from("profiles").select("display_name, email").eq("user_id", user.id).maybeSingle(),
          supabase
            .from("subscriptions")
            .select("plan_type, expires_at")
            .eq("user_id", user.id)
            .gt("expires_at", new Date().toISOString())
            .order("expires_at", { ascending: false })
            .limit(1),
          isAdmin
            ? supabase.from("cameras").select("*", { count: "exact", head: true })
            : supabase.from("cameras").select("*", { count: "exact", head: true }).eq("owner_user_id", user.id),
        ]);

        if (cancelled) return;
        const planName = isAdmin ? "Admin (acesso total)" : subs?.[0]?.plan_type ?? null;
        setInfo({
          displayName: profile?.display_name ?? null,
          email: profile?.email ?? user.email ?? null,
          userCode: user.id.slice(0, 8).toUpperCase(),
          planName,
          cameraCount: cameraCount ?? 0,
        });
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, isAdmin]);

  const initials = (info?.displayName || info?.email || "U").slice(0, 2).toUpperCase();

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
              {info?.displayName || "USUÁRIO"}
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
          <InfoRow icon={Mail} label="EMAIL" value={info?.email ?? "—"} loading={loading} />
          <InfoRow icon={Hash} label="CÓDIGO" value={info?.userCode ?? "—"} loading={loading} mono />
          <InfoRow icon={Layers} label="PLANO" value={info?.planName ?? "Sem plano ativo"} loading={loading} />
          <InfoRow
            icon={CameraIcon}
            label="CÂMERAS VINCULADAS"
            value={loading ? "…" : String(info?.cameraCount ?? 0)}
            loading={loading}
          />
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
  loading,
  mono,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  loading?: boolean;
  mono?: boolean;
}) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-[10px] tracking-[0.15em] text-muted-foreground">{label}</p>
        <p
          className={`text-foreground truncate ${mono ? "font-mono" : ""}`}
          title={value}
        >
          {loading ? "…" : value}
        </p>
      </div>
    </div>
  );
}
