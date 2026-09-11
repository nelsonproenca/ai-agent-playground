import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WatchtowerCameraGrid } from "@/watchtower/components/WatchtowerCameraGrid";
import { WatchtowerTimeline } from "@/watchtower/components/WatchtowerTimeline";

const TAB_KEY = "wt-dashboard-tab";

const WatchtowerDashboard = () => {
  const [tab, setTab] = useState<string>(() => localStorage.getItem(TAB_KEY) ?? "live");

  const handleTabChange = (value: string) => {
    setTab(value);
    localStorage.setItem(TAB_KEY, value);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-3xl font-bold text-foreground tracking-wider">MINHAS CÂMERAS</h2>
        <p className="text-xs tracking-[0.15em] text-muted-foreground mt-2">MONITORAMENTO EM TEMPO REAL</p>
      </div>

      <Tabs value={tab} onValueChange={handleTabChange}>
        <TabsList className="border-b border-border bg-transparent h-10 w-full justify-start rounded-none p-0 gap-0">
          <TabsTrigger
            value="live"
            className="rounded-none h-10 px-6 font-mono text-xs tracking-widest border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none text-muted-foreground hover:text-foreground transition-colors"
          >
            AO VIVO
          </TabsTrigger>
          <TabsTrigger
            value="recordings"
            className="rounded-none h-10 px-6 font-mono text-xs tracking-widest border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none text-muted-foreground hover:text-foreground transition-colors"
          >
            GRAVAÇÕES
          </TabsTrigger>
        </TabsList>

        <TabsContent value="live" className="mt-6">
          <WatchtowerCameraGrid />
        </TabsContent>

        <TabsContent value="recordings" className="mt-6">
          <WatchtowerTimeline />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default WatchtowerDashboard;
