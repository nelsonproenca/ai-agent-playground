import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Paperclip, Loader2, FileText, Link as LinkIcon, Download } from "lucide-react";
import { toast } from "sonner";
import {
  createArtefatoLink, getArtefatoUrl, listArtefatos, listEtapas, uploadArtefatoArquivo,
  type Artefato, type Etapa,
} from "@/features/portfolio/api";

const GestaoArtefatos = ({ projetoId }: { projetoId: string }) => {
  const [artefatos, setArtefatos] = useState<Artefato[]>([]);
  const [etapas, setEtapas] = useState<Etapa[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [nome, setNome] = useState("");
  const [etapaId, setEtapaId] = useState<string>("none");
  const [file, setFile] = useState<File | null>(null);
  const [linkUrl, setLinkUrl] = useState("");

  const fetchData = async () => {
    setLoading(true);
    try {
      const [a, e] = await Promise.all([listArtefatos(projetoId), listEtapas(projetoId)]);
      setArtefatos(a);
      setEtapas(e);
    } catch {
      toast.error("Erro ao carregar artefatos.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [projetoId]);

  const resetForm = () => {
    setNome(""); setEtapaId("none"); setFile(null); setLinkUrl("");
  };

  const handleUploadArquivo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !nome.trim()) return;

    setSaving(true);
    try {
      await uploadArtefatoArquivo({
        projetoId,
        etapaId: etapaId === "none" ? null : etapaId,
        nome: nome.trim(),
        file,
      });
      toast.success("Arquivo enviado!");
      resetForm();
      fetchData();
    } catch {
      toast.error("Erro ao enviar arquivo.");
    } finally {
      setSaving(false);
    }
  };

  const handleAddLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkUrl.trim() || !nome.trim()) return;

    setSaving(true);
    try {
      await createArtefatoLink({
        projetoId,
        etapaId: etapaId === "none" ? null : etapaId,
        nome: nome.trim(),
        linkUrl: linkUrl.trim(),
      });
      toast.success("Link adicionado!");
      resetForm();
      fetchData();
    } catch {
      toast.error("Erro ao adicionar link.");
    } finally {
      setSaving(false);
    }
  };

  const handleOpen = async (artefato: Artefato) => {
    try {
      const url = await getArtefatoUrl(artefato);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch {
      toast.error("Erro ao gerar link de acesso.");
    }
  };

  const etapaNome = (id: string | null) => etapas.find((e) => e.id === id)?.nome ?? null;

  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <CardTitle className="font-mono text-foreground flex items-center gap-2 text-base">
          <Paperclip className="h-4 w-4 text-primary" />
          Artefatos
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs defaultValue="arquivo">
          <TabsList>
            <TabsTrigger value="arquivo">Arquivo</TabsTrigger>
            <TabsTrigger value="link">Link</TabsTrigger>
          </TabsList>

          <div className="mt-3 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                placeholder="Nome do artefato *"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="font-mono bg-secondary border-border text-foreground"
              />
              <Select value={etapaId} onValueChange={setEtapaId}>
                <SelectTrigger className="font-mono bg-secondary border-border text-foreground">
                  <SelectValue placeholder="Etapa (opcional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sem etapa</SelectItem>
                  {etapas.map((et) => (
                    <SelectItem key={et.id} value={et.id}>{et.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <TabsContent value="arquivo" className="mt-0">
              <form onSubmit={handleUploadArquivo} className="flex gap-2">
                <Input
                  type="file"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  className="font-mono bg-secondary border-border text-foreground"
                />
                <Button type="submit" size="sm" className="font-mono gap-1 shrink-0" disabled={saving || !file}>
                  {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                  Enviar
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="link" className="mt-0">
              <form onSubmit={handleAddLink} className="flex gap-2">
                <Input
                  placeholder="https://..."
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  className="font-mono bg-secondary border-border text-foreground"
                />
                <Button type="submit" size="sm" className="font-mono gap-1 shrink-0" disabled={saving}>
                  {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                  Adicionar
                </Button>
              </form>
            </TabsContent>
          </div>
        </Tabs>

        {loading ? (
          <p className="text-sm text-muted-foreground font-mono text-center py-4">Carregando...</p>
        ) : artefatos.length === 0 ? (
          <p className="text-sm text-muted-foreground font-mono text-center py-4">Nenhum artefato cadastrado.</p>
        ) : (
          <div className="space-y-2">
            {artefatos.map((a) => (
              <div key={a.id} className="flex items-center justify-between gap-2 bg-secondary/50 rounded-lg p-3">
                <div className="flex items-center gap-2 min-w-0">
                  {a.tipo === "link" ? (
                    <LinkIcon className="h-4 w-4 text-primary shrink-0" />
                  ) : (
                    <FileText className="h-4 w-4 text-primary shrink-0" />
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{a.nome}</p>
                    {etapaNome(a.etapa_id) && (
                      <p className="text-xs text-muted-foreground font-mono">{etapaNome(a.etapa_id)}</p>
                    )}
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="font-mono gap-1 shrink-0" onClick={() => handleOpen(a)}>
                  <Download className="h-3 w-3" />
                  Abrir
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default GestaoArtefatos;
