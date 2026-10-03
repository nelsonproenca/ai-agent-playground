import { useState, useRef } from "react";
import { TAMANHO_MAXIMO_BYTES, uploadImagem, type PastaUpload } from "@/features/uploads/api";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera, Loader2, X } from "lucide-react";
import { toast } from "sonner";

interface ImageUploadProps {
  currentUrl: string | null;
  onUploaded: (url: string) => void;
  folder: PastaUpload;
  label?: string;
  size?: "sm" | "md";
}

const ImageUpload = ({ currentUrl, onUploaded, folder, label = "Foto", size = "md" }: ImageUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const sizeClass = size === "sm" ? "h-10 w-10" : "h-16 w-16";

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!["image/png", "image/jpeg", "image/webp", "image/gif"].includes(file.type)) {
      toast.error("Envie uma imagem PNG, JPEG, WebP ou GIF.");
      return;
    }

    if (file.size > TAMANHO_MAXIMO_BYTES) {
      toast.error("Imagem deve ter no máximo 2MB.");
      return;
    }

    setUploading(true);
    try {
      const { url } = await uploadImagem(folder, file);
      onUploaded(url);
      toast.success("Imagem enviada!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao enviar imagem.");
    } finally {
      setUploading(false);
      // Permite escolher o mesmo arquivo de novo depois de um erro.
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="flex items-center gap-3">
      <Avatar className={sizeClass}>
        <AvatarImage src={currentUrl ?? undefined} />
        <AvatarFallback className="bg-secondary text-muted-foreground text-xs">
          <Camera className="h-4 w-4" />
        </AvatarFallback>
      </Avatar>
      <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/webp,image/gif" className="hidden" onChange={handleUpload} />
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="font-mono text-xs gap-1"
        disabled={uploading}
        onClick={() => inputRef.current?.click()}
      >
        {uploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Camera className="h-3 w-3" />}
        {label}
      </Button>
    </div>
  );
};

export default ImageUpload;
