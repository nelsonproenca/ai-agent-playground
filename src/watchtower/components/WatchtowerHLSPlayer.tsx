import { useEffect, useRef, useState } from "react";
import Hls from "hls.js";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HLSPlayerProps {
  streamUrl: string;
}

type PlayerState = "loading" | "playing" | "error";

interface PlayerError {
  type: string;
  detail: string;
  url: string;
}

export function WatchtowerHLSPlayer({ streamUrl }: HLSPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [state, setState] = useState<PlayerState>("loading");
  const [error, setError] = useState<PlayerError | null>(null);

  const initPlayer = () => {
    const video = videoRef.current;
    if (!video) return;

    setState("loading");
    setError(null);
    hlsRef.current?.destroy();

    // Diagnóstico: URL que o player está tentando carregar
    console.info("[WatchtowerHLSPlayer] Carregando stream:", streamUrl);

    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        // Limita retentativas para falhar mais rápido e mostrar o erro ao usuário
        manifestLoadingMaxRetry: 2,
        levelLoadingMaxRetry: 2,
        fragLoadingMaxRetry: 2,
      });

      hlsRef.current = hls;
      hls.loadSource(streamUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setState("playing");
        video.play().catch(() => {
          // autoPlay bloqueado pelo browser — tenta muted (já está) e tenta de novo
          video.muted = true;
          video.play().catch(() => setState("error"));
        });
      });

      hls.on(Hls.Events.ERROR, (_event, data) => {
        console.warn("[WatchtowerHLSPlayer] Erro hls.js:", data);
        if (data.fatal) {
          setError({
            type: data.type,
            detail: data.details,
            url: (data.url as string | undefined) ?? streamUrl,
          });
          setState("error");
          hls.destroy();
        }
      });
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      // Safari: suporte nativo a HLS
      video.src = streamUrl;
      video.addEventListener("canplay", () => setState("playing"), { once: true });
      video.addEventListener("error", () => {
        setState("error");
        setError({ type: "native", detail: "Erro no player nativo do Safari", url: streamUrl });
      }, { once: true });
      video.play().catch(() => { /* bloqueio de autoplay — usuário precisará interagir */ });
    } else {
      setState("error");
      setError({ type: "unsupported", detail: "Seu browser não suporta HLS", url: streamUrl });
    }
  };

  useEffect(() => {
    initPlayer();
    return () => {
      hlsRef.current?.destroy();
      hlsRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [streamUrl]);

  return (
    <div className="absolute inset-0 bg-black">
      {/* Vídeo sempre montado — ocultado em erro para preservar o elemento no DOM */}
      <video
        ref={videoRef}
        className="w-full h-full object-cover"
        autoPlay
        muted
        playsInline
      />

      {/* Overlay de erro — sobre o vídeo */}
      {state === "error" && error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 gap-4 px-4">
          <AlertTriangle className="h-8 w-8 text-destructive" />
          <div className="text-center space-y-1">
            <p className="text-xs font-bold text-destructive tracking-wider">
              FALHA AO CARREGAR STREAM
            </p>
            <p className="text-[10px] text-white/50 font-mono break-all max-w-xs">
              {error.detail}
            </p>
            {/* URL para facilitar diagnóstico de CORS / URL errada */}
            <p className="text-[9px] text-white/30 font-mono break-all max-w-xs mt-1">
              {error.url}
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="text-[10px] tracking-wider border-white/20 text-white hover:bg-white/10"
            onClick={initPlayer}
          >
            <RefreshCw className="h-3 w-3 mr-1.5" />
            TENTAR NOVAMENTE
          </Button>
        </div>
      )}
    </div>
  );
}
