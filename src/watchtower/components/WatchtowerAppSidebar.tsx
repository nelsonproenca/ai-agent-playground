import { LayoutGrid, FileText, Headphones, Settings, LogOut, Activity, Shield, Layers, CameraIcon, CreditCard, History } from "lucide-react";
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
  { title: "Câmeras", url: "/watchtower/dashboard/admin/cameras", icon: CameraIcon },
  { title: "Pagamentos", url: "/watchtower/dashboard/admin/payments", icon: CreditCard },
  { title: "Planos", url: "/watchtower/dashboard/admin/plans", icon: Layers },
  { title: "Admins", url: "/watchtower/dashboard/admin/users", icon: Shield },
  { title: "Auditoria", url: "/watchtower/dashboard/admin/audit", icon: History },
  { title: "Health Check", url: "/watchtower/dashboard/health", icon: Activity },
];

export function WatchtowerAppSidebar() {
  const location = useLocation();
  const { signOut } = useWatchtowerAuth();
  const { isAdmin } = useIsAdmin();
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="pt-6 pb-4">
        <Link to="/watchtower/dashboard" className="flex items-center gap-3 px-2">
          {!collapsed ? (
            <span className="font-display text-base font-bold tracking-[0.2em] text-primary truncate">
              VIGÍLIA CAM
            </span>
          ) : (
            <img
              src="/watchtower-favicon.png"
              alt="Vigília Cam"
              width={28}
              height={28}
              className="h-7 w-7 object-contain shrink-0"
              loading="lazy"
            />
          )}
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          {!collapsed && <SidebarGroupLabel>Menu</SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu>
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
            {!collapsed && <SidebarGroupLabel>Admin</SidebarGroupLabel>}
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
