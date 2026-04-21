import { LayoutGrid, Video, FileText, Headphones, Settings, LogOut, Home, Activity, Shield, Layers, CameraIcon, CreditCard, History } from "lucide-react";
import { WatchtowerNavLink } from "./WatchtowerNavLink";
import { useLocation, Link } from "react-router-dom";
import { useWatchtowerAuth } from "@/watchtower/contexts/WatchtowerAuthContext";
import { useIsAdmin } from "@/watchtower/hooks/useIsAdmin";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarFooter, SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar";

const baseItems = [
  { title: "Câmeras", url: "/watchtower/dashboard", icon: LayoutGrid },
  { title: "Faturas", url: "/watchtower/dashboard/billing", icon: FileText },
  { title: "Suporte", url: "/watchtower/dashboard/support", icon: Headphones },
  { title: "Configurações", url: "/watchtower/dashboard/settings", icon: Settings },
];

const adminItems = [
  { title: "Admin: Câmeras", url: "/watchtower/dashboard/admin/cameras", icon: CameraIcon },
  { title: "Admin: Planos", url: "/watchtower/dashboard/admin/plans", icon: Layers },
  { title: "Admin: Pagamentos", url: "/watchtower/dashboard/admin/payments", icon: CreditCard },
  { title: "Admin: Usuários", url: "/watchtower/dashboard/admin/users", icon: Shield },
  { title: "Admin: Auditoria", url: "/watchtower/dashboard/admin/audit", icon: History },
  { title: "Admin: Health Check", url: "/watchtower/dashboard/health", icon: Activity },
];

export function WatchtowerAppSidebar() {
  const location = useLocation();
  const { signOut } = useWatchtowerAuth();
  const { isAdmin } = useIsAdmin();
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="pt-6 pb-2">
        <Link to="/" className="flex items-center gap-3 px-2">
          <img
            src="/watchtower-favicon.png"
            alt="Watchtower"
            width={32}
            height={32}
            className="h-8 w-8 object-contain shrink-0"
            loading="lazy"
          />
          {!collapsed && (
            <div className="flex flex-col overflow-hidden">
              <span className="font-display text-sm font-bold tracking-wider text-foreground truncate">WATCHTOWER</span>
              <span className="text-[10px] tracking-[0.15em] text-muted-foreground truncate">MONITORAMENTO</span>
            </div>
          )}
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          {!collapsed && <SidebarGroupLabel>Navegação</SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Voltar ao Site">
                  <Link to="/">
                    <Home className="h-4 w-4 shrink-0" />
                    <span>Voltar ao Site</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              {baseItems.map((item) => {
                const isActive = location.pathname === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.title}
                      className={isActive ? "bg-primary/10 text-primary border border-primary/20" : ""}
                    >
                      <WatchtowerNavLink to={item.url} end={item.url === "/watchtower/dashboard"}>
                        <item.icon className="h-4 w-4 shrink-0" />
                        <span>{item.title}</span>
                      </WatchtowerNavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {isAdmin && (
          <SidebarGroup>
            {!collapsed && <SidebarGroupLabel>Administração</SidebarGroupLabel>}
            <SidebarGroupContent>
              <SidebarMenu>
                {adminItems.map((item) => {
                  const isActive = location.pathname === item.url;
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        tooltip={item.title}
                        className={isActive ? "bg-primary/10 text-primary border border-primary/20" : ""}
                      >
                        <WatchtowerNavLink to={item.url}>
                          <item.icon className="h-4 w-4 shrink-0" />
                          <span>{item.title}</span>
                        </WatchtowerNavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="pb-6">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={signOut}
              tooltip="Sair"
              className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            >
              <LogOut className="h-4 w-4 shrink-0" />
              <span>Sair</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
