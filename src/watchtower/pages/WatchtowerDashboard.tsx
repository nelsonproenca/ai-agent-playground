import { WatchtowerCameraGrid } from "@/watchtower/components/WatchtowerCameraGrid";

const WatchtowerDashboard = () => {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-display text-3xl font-bold text-foreground tracking-wider">MINHAS CÂMERAS</h2>
        <p className="text-xs tracking-[0.15em] text-muted-foreground mt-2">MONITORAMENTO EM TEMPO REAL</p>
      </div>
      <WatchtowerCameraGrid />
    </div>
  );
};

export default WatchtowerDashboard;
