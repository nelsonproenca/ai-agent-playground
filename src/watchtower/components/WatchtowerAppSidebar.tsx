import { LayoutGrid, Video, FileText, Headphones, Settings, LogOut, Home } from "lucide-react";
import { WatchtowerNavLink } from "./WatchtowerNavLink";
import { useLocation } from "react-router-dom";
import { useWatchtowerAuth } from "@/watchtower/contexts/WatchtowerAuthContext";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarFooter,
} from "@/components/ui/sidebar";
import { Link } from "react-router-dom";

const menuItems = [
  { title: "Câmeras", url: "/watchtower/dashboard", icon: LayoutGrid },
  { title: "Ao Vivo", url: "/watchtower/dashboard/live", icon: Video },
  { title: "Faturas", url: "/watchtower/dashboard/billing", icon: FileText },
  { title: "Suporte", url: "/watchtower/dashboard/support", icon: Headphones },
  { title: "Configurações", url: "/watchtower/dashboard/settings", icon: Settings },
];

export function WatchtowerAppSidebar() {
  const location = useLocation();
  const { signOut } = useWatchtowerAuth();

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarContent className="pt-6">
        <div className="flex justify-center mb-8 px-2">
          <span className="font-display text-lg font-bold text-primary tracking-wider">VC</span>
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
