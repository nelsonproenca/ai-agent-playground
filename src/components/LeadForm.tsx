import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Send, Loader2 } from "lucide-react";

interface LeadFormProps {
  onSuccess: () => void;
}

const LeadForm = ({ onSuccess }: LeadFormProps) => {
  const [nome, setNome] = useState("");
  const [contato, setContato] = useState("");
  const [canal, setCanal] = useState("");
  const [desafio, setDesafio] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim() || !contato.trim() || !desafio.trim()) {
      setError("Preencha todos os campos obrigatórios.");
      return;
    }

    setLoading(true);
    setError("");

    const payload = {
      nome: nome.trim().slice(0, 100),
      contato: contato.trim().slice(0, 255),
      canal: canal || null,
      desafio_tecnico: desafio.trim().slice(0, 2000),
      origem: "Site_Institucional",
    };

    const { error: dbError } = await supabase.from("leads_ia").insert(payload);

    setLoading(false);

    if (dbError) {
      setError("Erro ao enviar. Tente novamente.");
      return;
    }

    onSuccess();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="nome" className="text-sm font-mono tracking-wide text-muted-foreground">
          {">"} Nome *
        </Label>
        <Input
          id="nome"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          placeholder="Seu nome completo"
          maxLength={100}
          className="bg-secondary border-border focus:border-primary focus:ring-primary/20 transition-all"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="contato" className="text-sm font-mono tracking-wide text-muted-foreground">
          {">"} Contato (email ou telefone) *
        </Label>
        <Input
          id="contato"
          value={contato}
          onChange={(e) => setContato(e.target.value)}
          placeholder="email@exemplo.com ou (11) 99999-9999"
          maxLength={255}
          className="bg-secondary border-border focus:border-primary focus:ring-primary/20 transition-all"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="canal" className="text-sm font-mono tracking-wide text-muted-foreground">
          {">"} Como nos encontrou?
        </Label>
        <Select value={canal} onValueChange={setCanal}>
          <SelectTrigger className="bg-secondary border-border focus:border-primary">
            <SelectValue placeholder="Selecione um canal" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="instagram">Instagram</SelectItem>
            <SelectItem value="linkedin">LinkedIn</SelectItem>
            <SelectItem value="google">Google</SelectItem>
            <SelectItem value="indicacao">Indicação</SelectItem>
            <SelectItem value="outro">Outro</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="desafio" className="text-sm font-mono tracking-wide text-muted-foreground">
          {">"} Descreva seu desafio técnico *
        </Label>
        <Textarea
          id="desafio"
          value={desafio}
          onChange={(e) => setDesafio(e.target.value)}
          placeholder="Ex: Preciso de uma API escalável em .NET para processar 10k requisições/min..."
          maxLength={2000}
          rows={5}
          className="bg-secondary border-border focus:border-primary focus:ring-primary/20 transition-all resize-none"
        />
        <span className="text-xs text-muted-foreground font-mono">{desafio.length}/2000</span>
      </div>

      {error && (
        <p className="text-destructive text-sm font-mono">{error}</p>
      )}

      <Button
        type="submit"
        disabled={loading}
        className="w-full glow-primary font-semibold text-base py-6 transition-all hover:glow-primary-strong"
      >
        {loading ? (
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        ) : (
          <Send className="mr-2 h-5 w-5" />
        )}
        {loading ? "Processando..." : "Enviar Desafio"}
      </Button>
    </form>
  );
};

export default LeadForm;
