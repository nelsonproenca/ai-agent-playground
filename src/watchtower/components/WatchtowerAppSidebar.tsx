import { LayoutGrid, FileText, Headphones, Settings, LogOut, Activity, Shield, Layers, CameraIcon, CreditCard, History, Radio } from "lucide-react";
import { WatchtowerNavLink } from "./WatchtowerNavLink";
import { useLocation, Link } from "react-router-dom";
import { useWatchtowerAuth } from "@/watchtower/contexts/WatchtowerAuthContext";
import { useIsAdmin } from "@/watchtower/hooks/useIsAdmin";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarFooter, SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar";

// Itens disponíveis para todos (admins e clientes).
const commonItems = [
  { title: "Minhas Câmeras", url: "/watchtower/dashboard", icon: LayoutGrid, end: true },
  { title: "Configurações", url: "/watchtower/dashboard/settings", icon: Settings, end: false },
];

// Itens exclusivos para clientes (não-admin).
const clientItems = [
  { title: "Faturas", url: "/watchtower/dashboard/billing", icon: FileText, end: false },
  { title: "Suporte", url: "/watchtower/dashboard/support", icon: Headphones, end: false },
];

// Itens exclusivos para admins.
const adminItems = [
  { title: "Câmeras", url: "/watchtower/dashboard/admin/cameras", icon: CameraIcon },
  { title: "Pagamentos", url: "/watchtower/dashboard/admin/payments", icon: CreditCard },
  { title: "Planos", url: "/watchtower/dashboard/admin/plans", icon: Layers },
  { title: "Admins", url: "/watchtower/dashboard/admin/users", icon: Shield },
  { title: "Health Check", url: "/watchtower/dashboard/health", icon: Activity },
  { title: "Auditoria", url: "/watchtower/dashboard/admin/audit", icon: History },
  { title: "Bridges", url: "/watchtower/dashboard/admin/bridges", icon: Radio },
];

export function WatchtowerAppSidebar() {
  const location = useLocation();
  const { signOut } = useWatchtowerAuth();
  const { isAdmin } = useIsAdmin();
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  // Quando o usuário é admin, ocultar links exclusivos de clientes (Faturas/Suporte).
  const menuItems = isAdmin ? commonItems : [...commonItems.slice(0, 1), ...clientItems, ...commonItems.slice(1)];

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="pt-6 pb-2">
        <Link to="/watchtower" className="flex items-center gap-3 px-2">
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
          {!collapsed && <SidebarGroupLabel>MENU</SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => {
                const isActive = location.pathname === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.title}
                      className={isActive ? "bg-primary/10 text-primary border border-primary/20" : ""}
                    >
                      <WatchtowerNavLink to={item.url} end={item.end}>
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
            {!collapsed && <SidebarGroupLabel>ADMIN</SidebarGroupLabel>}
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
