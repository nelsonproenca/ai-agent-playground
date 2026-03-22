import { ReactNode } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { WatchtowerAppSidebar } from "./WatchtowerAppSidebar";
import { Input } from "@/components/ui/input";
import { Search, User } from "lucide-react";

export function WatchtowerDashboardLayout({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <WatchtowerAppSidebar />
        <div className="flex-1 flex flex-col">
          <header className="h-16 flex items-center justify-end gap-3 border-b border-border px-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar câmera..." className="pl-9 w-56 h-9 bg-secondary border-border text-sm" />
            </div>
            <button className="h-9 w-9 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
              <User className="h-4 w-4" />
            </button>
          </header>
          <main className="flex-1 p-8 overflow-auto">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
