import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { FolderKanban, Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";
import { createProjeto, listProjetos, type Projeto } from "@/features/portfolio/api";

type Cliente = Tables<"clientes">;

const statusLabel: Record<string, string> = {
  em_andamento: "Em andamento",
  concluido: "Concluído",
};

const visibilidadeLabel: Record<string, string> = {
  publico: "Público",
  privado: "Privado",
};

const GestaoProjetos = () => {
  const [projetos, setProjetos] = useState<Projeto[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [clienteId, setClienteId] = useState("");
  const [nome, setNome] = useState("");
  const [categoria, setCategoria] = useState("");
  const [statusPublico, setStatusPublico] = useState("em_andamento");
  const [visibilidade, setVisibilidade] = useState("privado");
  const [imagemCapaUrl, setImagemCapaUrl] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const fetchProjetos = async () => {
    setLoading(true);
    try {
      setProjetos(await listProjetos());
    } catch {
      toast.error("Erro ao carregar projetos.");
    } finally {
      setLoading(false);
    }
  };

  const fetchClientes = async () => {
    const { data } = await supabase
      .from("clientes")
      .select("*")
      .order("nome", { ascending: true });
    if (data) setClientes(data);
  };

  useEffect(() => {
    fetchProjetos();
    fetchClientes();
  }, []);

  const resetForm = () => {
    setClienteId(""); setNome(""); setCategoria("");
    setStatusPublico("em_andamento"); setVisibilidade("privado");
    setImagemCapaUrl(""); setLinkUrl(""); setErrors({});
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!clienteId) errs.clienteId = "Selecione um cliente.";
    if (!nome.trim()) errs.nome = "Nome é obrigatório.";
    if (linkUrl.trim() && !/^https?:\/\/.+/.test(linkUrl.trim())) {
      errs.linkUrl = "URL deve começar com http:// ou https://";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSaving(true);
    try {
      await createProjeto({
        cliente_id: clienteId,
        nome: nome.trim(),
        categoria: categoria.trim() || null,
        status_publico: statusPublico,
        visibilidade,
        imagem_capa_url: imagemCapaUrl.trim() || null,
        link_url: linkUrl.trim() || null,
      });
      toast.success("Projeto criado!");
      resetForm();
      fetchProjetos();
    } catch {
      toast.error("Erro ao criar projeto.");
    } finally {
      setSaving(false);
    }
  };

  const clienteNome = (id: string) => clientes.find((c) => c.id === id)?.nome ?? "—";

  return (
    <div className="space-y-6">
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="font-mono text-foreground flex items-center gap-2 text-base">
            <Plus className="h-4 w-4 text-primary" />
            Novo Projeto
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Select value={clienteId} onValueChange={setClienteId}>
                <SelectTrigger className="font-mono bg-secondary border-border text-foreground">
                  <SelectValue placeholder="Cliente *" />
                </SelectTrigger>
                <SelectContent>
                  {clientes.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.clienteId && <p className="text-xs text-destructive font-mono">{errors.clienteId}</p>}
            </div>
            <div className="space-y-1">
              <Input placeholder="Nome do projeto *" value={nome} onChange={(e) => setNome(e.target.value)}
                className="font-mono bg-secondary border-border text-foreground" />
              {errors.nome && <p className="text-xs text-destructive font-mono">{errors.nome}</p>}
            </div>
            <Input placeholder="Categoria" value={categoria} onChange={(e) => setCategoria(e.target.value)}
              className="font-mono bg-secondary border-border text-foreground" />
            <Select value={statusPublico} onValueChange={setStatusPublico}>
              <SelectTrigger className="font-mono bg-secondary border-border text-foreground">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="em_andamento">Em andamento</SelectItem>
                <SelectItem value="concluido">Concluído</SelectItem>
              </SelectContent>
            </Select>
            <Select value={visibilidade} onValueChange={setVisibilidade}>
              <SelectTrigger className="font-mono bg-secondary border-border text-foreground">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="privado">Privado</SelectItem>
                <SelectItem value="publico">Público</SelectItem>
              </SelectContent>
            </Select>
            <Input placeholder="URL da imagem de capa" value={imagemCapaUrl} onChange={(e) => setImagemCapaUrl(e.target.value)}
              className="font-mono bg-secondary border-border text-foreground" />
            <div className="space-y-1 sm:col-span-2">
              <Input placeholder="Link (https://...)" value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)}
                className="font-mono bg-secondary border-border text-foreground" />
              {errors.linkUrl && <p className="text-xs text-destructive font-mono">{errors.linkUrl}</p>}
            </div>
            <div className="sm:col-span-2">
              <Button type="submit" className="font-mono w-full sm:w-auto" disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Criar Projeto
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="border-border bg-card overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="font-mono text-foreground flex items-center gap-2 text-base">
            <FolderKanban className="h-4 w-4 text-primary" />
            Projetos
            <Badge variant="outline" className="font-mono text-xs border-primary/30 text-primary ml-auto">
              {projetos.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="font-mono text-xs text-muted-foreground">Nome</TableHead>
                <TableHead className="font-mono text-xs text-muted-foreground">Cliente</TableHead>
                <TableHead className="font-mono text-xs text-muted-foreground">Categoria</TableHead>
                <TableHead className="font-mono text-xs text-muted-foreground">Status</TableHead>
                <TableHead className="font-mono text-xs text-muted-foreground">Visibilidade</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground font-mono py-12">
                    Carregando...
                  </TableCell>
                </TableRow>
              ) : projetos.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground font-mono py-12">
                    Nenhum projeto cadastrado.
                  </TableCell>
                </TableRow>
              ) : (
                projetos.map((p) => (
                  <TableRow key={p.id} className="border-border">
                    <TableCell className="font-medium text-foreground">{p.nome}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{clienteNome(p.cliente_id)}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{p.categoria ?? "—"}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{statusLabel[p.status_publico] ?? p.status_publico}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{visibilidadeLabel[p.visibilidade] ?? p.visibilidade}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default GestaoProjetos;
