import { useEffect, useRef } from "react";
import Hls from "hls.js";
import { useToast } from "@/hooks/use-toast";

interface HLSPlayerProps {
  streamKey: string;
  serverUrl?: string;
}

export function WatchtowerHLSPlayer({ streamKey, serverUrl = "https://seu-servidor-mediamtx.com" }: HLSPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { toast } = useToast();
  const url = `${serverUrl}/${streamKey}/index.m3u8`;

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let hls: Hls | null = null;

    if (Hls.isSupported()) {
      hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
      });
      hls.loadSource(url);
      hls.attachMedia(video);
      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) {
          toast({
            title: "Erro no stream",
            description: `Falha ao conectar com a câmera. Tentando reconectar...`,
            variant: "destructive",
          });
          if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
            hls?.startLoad();
          } else {
            hls?.destroy();
          }
        }
      });
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = url;
    }

    return () => {
      hls?.destroy();
    };
  }, [url, toast]);

  return (
    <video
      ref={videoRef}
      className="w-full h-full object-cover rounded-t-lg"
      autoPlay
      muted
      playsInline
    />
  );
}
