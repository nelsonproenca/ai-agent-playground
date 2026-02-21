import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { QRCodeCanvas } from "qrcode.react";
import { ArrowLeft, Copy, Download, QrCode, Check, CloudUpload, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";

type Colaborador = Tables<"colaboradores">;

const GeradorConvites = () => {
  const [colabs, setColabs] = useState<Colaborador[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedUrl, setSavedUrl] = useState<string | null>(null);
  const qrRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("colaboradores")
        .select("*")
        .order("nome");
      if (data) setColabs(data);
      setLoading(false);
    };
    fetch();
  }, []);

  const selected = colabs.find((c) => c.id === selectedId);

  const refParam = selected
    ? encodeURIComponent(selected.nome)
    : "";
  const generatedLink = selected
    ? `https://ig.me/m/nelsonhaproenca?ref=${refParam}`
    : "";

  const getHiResBlob = useCallback((): Promise<Blob | null> => {
    return new Promise((resolve) => {
      if (!qrRef.current) return resolve(null);
      const canvas = qrRef.current.querySelector("canvas");
      if (!canvas) return resolve(null);
      const hiRes = document.createElement("canvas");
      const size = 1024;
      hiRes.width = size;
      hiRes.height = size;
      const ctx = hiRes.getContext("2d");
      if (!ctx) return resolve(null);
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(canvas, 0, 0, size, size);
      hiRes.toBlob((blob) => resolve(blob), "image/png");
    });
  }, []);

  // Auto-save to Supabase when QR renders
  useEffect(() => {
    if (!selected) return;
    setSavedUrl(null);

    // Small delay to let canvas render
    const timer = setTimeout(async () => {
      setSaving(true);
      const blob = await getHiResBlob();
      if (!blob) {
        setSaving(false);
        return;
      }

      const fileName = `convites/convite-${selected.nome.toLowerCase().replace(/\s+/g, "-")}.png`;
      const { error } = await supabase.storage
        .from("uploads")
        .upload(fileName, blob, { contentType: "image/png", upsert: true });

      if (error) {
        toast.error("Erro ao salvar QR Code no storage.");
      } else {
        const { data: urlData } = supabase.storage.from("uploads").getPublicUrl(fileName);
        setSavedUrl(urlData.publicUrl);
        toast.success("QR Code salvo no storage!");
      }
      setSaving(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [selected, generatedLink, getHiResBlob]);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(generatedLink);
    setCopied(true);
    toast.success("Link copiado!");
    setTimeout(() => setCopied(false), 2000);
  }, [generatedLink]);

  const handleDownload = useCallback(async () => {
    if (!selected) return;
    const blob = await getHiResBlob();
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.download = `convite-${selected.nome.toLowerCase().replace(/\s+/g, "-")}.png`;
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("QR Code baixado!");
  }, [selected, getHiResBlob]);

  return (
    <div className="min-h-screen bg-background grid-pattern">
      <header className="border-b border-border">
        <div className="container max-w-6xl py-6 flex items-center justify-between">
          <h1 className="font-mono font-bold text-foreground text-lg flex items-center gap-2">
            <QrCode className="h-5 w-5 text-primary" />
            Gerador de <span className="text-primary">Convites</span>
          </h1>
          <Button asChild variant="outline" size="sm" className="font-mono gap-2">
            <Link to="/admin">
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Link>
          </Button>
        </div>
      </header>

      <main className="container max-w-lg py-12 px-4 space-y-6">
        {/* Select colaborador */}
        <Card className="border-border bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="font-mono text-base text-foreground">
              Selecione o Colaborador
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Select
              value={selectedId ?? ""}
              onValueChange={(v) => setSelectedId(v)}
              disabled={loading}
            >
              <SelectTrigger className="font-mono bg-secondary border-border text-foreground">
                <SelectValue placeholder={loading ? "Carregando..." : "Escolha um colaborador"} />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border">
                {colabs.map((c) => (
                  <SelectItem key={c.id} value={c.id} className="font-mono">
                    <span className="flex items-center gap-2">
                      <Avatar className="h-5 w-5">
                        <AvatarImage src={c.foto_url ?? undefined} />
                        <AvatarFallback className="text-[8px] bg-secondary">
                          {c.nome.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      {c.nome}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* QR Code + Card */}
        {selected && (
          <Card className="border-border bg-card">
            <CardContent className="pt-6 flex flex-col items-center gap-6">
              {/* QR Code */}
              <div
                ref={qrRef}
                className="p-4 bg-white rounded-xl shadow-sm"
              >
                <QRCodeCanvas
                  value={generatedLink}
                  size={220}
                  level="H"
                  includeMargin={false}
                />
              </div>

              {/* Info card */}
              <div className="w-full space-y-3 text-center">
                <div className="flex items-center justify-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={selected.foto_url ?? undefined} />
                    <AvatarFallback className="bg-secondary text-muted-foreground text-xs">
                      {selected.nome.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-left">
                    <p className="font-mono font-bold text-foreground text-sm">
                      {selected.nome}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {selected.cargo ?? "Sem cargo definido"}
                    </p>
                  </div>
                </div>

                {/* Link */}
                <div className="bg-secondary rounded-lg p-3 flex items-center gap-2">
                  <code className="text-[10px] text-muted-foreground flex-1 break-all text-left font-mono">
                    {generatedLink}
                  </code>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="shrink-0 h-8 w-8"
                    onClick={handleCopy}
                  >
                    {copied ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>

                {/* Download */}
                <Button
                  onClick={handleDownload}
                  className="font-mono gap-2 w-full"
                  variant="outline"
                >
                  <Download className="h-4 w-4" />
                  Baixar QR Code (PNG)
                </Button>

                {/* Storage status */}
                <div className="flex items-center justify-center gap-2 text-xs font-mono">
                  {saving ? (
                    <>
                      <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                      <span className="text-muted-foreground">Salvando no storage...</span>
                    </>
                  ) : savedUrl ? (
                    <>
                      <CloudUpload className="h-3 w-3 text-primary" />
                      <span className="text-muted-foreground">Salvo no Supabase Storage</span>
                    </>
                  ) : null}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

export default GeradorConvites;
