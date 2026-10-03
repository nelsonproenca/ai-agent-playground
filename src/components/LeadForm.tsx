import { useState } from "react";
import { criarLead } from "@/features/crm/api";
import { PortalApiError } from "@/features/portal-shared/apiClient";
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
  const [empresa, setEmpresa] = useState("");
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

    try {
      await criarLead({
        nome: nome.trim().slice(0, 100),
        empresa: empresa.trim().slice(0, 200) || null,
        contato: contato.trim().slice(0, 255),
        canal: canal || null,
        desafioTecnico: desafio.trim().slice(0, 2000),
      });
    } catch (err) {
      setLoading(false);
      setError(err instanceof PortalApiError && err.status === 429
        ? err.message
        : "Erro ao enviar. Tente novamente.");
      return;
    }

    setLoading(false);
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
        <Label htmlFor="empresa" className="text-sm font-mono tracking-wide text-muted-foreground">
          {">"} Nome da Empresa
        </Label>
        <Input
          id="empresa"
          value={empresa}
          onChange={(e) => setEmpresa(e.target.value)}
          placeholder="Ex: Acme Corp"
          maxLength={200}
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

      <p className="text-center text-[11px] font-mono text-muted-foreground/60 tracking-wide">
        Processado via n8n Orchestrator
      </p>
    </form>
  );
};

export default LeadForm;
