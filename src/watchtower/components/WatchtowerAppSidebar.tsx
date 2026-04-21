import { LayoutGrid, Video, FileText, Headphones, Settings, LogOut, Home, Activity, Shield, Layers, CameraIcon, CreditCard } from "lucide-react";
import { WatchtowerNavLink } from "./WatchtowerNavLink";
import { useLocation } from "react-router-dom";
import { useWatchtowerAuth } from "@/watchtower/contexts/WatchtowerAuthContext";
import { useIsAdmin } from "@/watchtower/hooks/useIsAdmin";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarFooter,
} from "@/components/ui/sidebar";
import { Link } from "react-router-dom";

const baseItems = [
  { title: "Câmeras", url: "/watchtower/dashboard", icon: LayoutGrid },
  { title: "Ao Vivo", url: "/watchtower/dashboard/live", icon: Video },
  { title: "Faturas", url: "/watchtower/dashboard/billing", icon: FileText },
  { title: "Suporte", url: "/watchtower/dashboard/support", icon: Headphones },
  { title: "Configurações", url: "/watchtower/dashboard/settings", icon: Settings },
  { title: "Health Check", url: "/watchtower/dashboard/health", icon: Activity },
];

const adminItems = [
  { title: "Admin: Câmeras", url: "/watchtower/dashboard/admin/cameras", icon: CameraIcon },
  { title: "Admin: Planos", url: "/watchtower/dashboard/admin/plans", icon: Layers },
  { title: "Admin: Pagamentos", url: "/watchtower/dashboard/admin/payments", icon: CreditCard },
  { title: "Admin: Usuários", url: "/watchtower/dashboard/admin/users", icon: Shield },
];

export function WatchtowerAppSidebar() {
  const location = useLocation();
  const { signOut } = useWatchtowerAuth();
  const { isAdmin } = useIsAdmin();

  const menuItems = isAdmin ? [...baseItems, ...adminItems] : baseItems;

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarContent className="pt-6">
        <div className="flex justify-center mb-8 px-2">
          <img
            src="/watchtower-favicon.png"
            alt="Watchtower Monitoramentos"
            width={32}
            height={32}
            className="h-8 w-8 object-contain"
            loading="lazy"
          />
        </div>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Voltar ao Site" className="flex items-center justify-center h-12 w-12 mx-auto rounded-lg text-muted-foreground hover:text-foreground hover:bg-sidebar-accent transition-colors">
                  <Link to="/"><Home className="h-5 w-5" /></Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              {menuItems.map((item) => {
                const isActive = location.pathname === item.url || (item.url === "/watchtower/dashboard" && location.pathname === "/watchtower/dashboard");
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={isActive} tooltip={item.title} className={`flex items-center justify-center h-12 w-12 mx-auto rounded-lg transition-colors ${isActive ? "bg-primary/10 text-primary border border-primary/20" : "text-muted-foreground hover:text-foreground hover:bg-sidebar-accent"}`}>
                      <WatchtowerNavLink to={item.url} end={item.url === "/watchtower/dashboard"}>
                        <item.icon className="h-5 w-5" />
                      </WatchtowerNavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="pb-6">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={signOut} tooltip="Sair" className="flex items-center justify-center h-12 w-12 mx-auto rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors">
              <LogOut className="h-5 w-5" />
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
