import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera, Loader2, X } from "lucide-react";
import { toast } from "sonner";

interface ImageUploadProps {
  currentUrl: string | null;
  onUploaded: (url: string) => void;
  folder: string;
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

    if (!file.type.startsWith("image/")) {
      toast.error("Selecione um arquivo de imagem.");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Imagem deve ter no máximo 2MB.");
      return;
    }

    setUploading(true);
    const ext = file.name.split(".").pop();
    const fileName = `${folder}/${crypto.randomUUID()}.${ext}`;

    const { error } = await supabase.storage.from("uploads").upload(fileName, file);

    if (error) {
      toast.error("Erro ao enviar imagem.");
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage.from("uploads").getPublicUrl(fileName);
    onUploaded(urlData.publicUrl);
    toast.success("Imagem enviada!");
    setUploading(false);
  };

  return (
    <div className="flex items-center gap-3">
      <Avatar className={sizeClass}>
        <AvatarImage src={currentUrl ?? undefined} />
        <AvatarFallback className="bg-secondary text-muted-foreground text-xs">
          <Camera className="h-4 w-4" />
        </AvatarFallback>
      </Avatar>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
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
