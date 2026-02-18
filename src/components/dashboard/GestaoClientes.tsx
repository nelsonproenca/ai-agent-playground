import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Building2, Plus, Loader2, UserPlus, Contact, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";
import ImageUpload from "./ImageUpload";

type Cliente = Tables<"clientes">;
type Contato = Tables<"contatos_clientes">;

// Phone mask helper
const maskPhone = (value: string) => {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 2) return digits;
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
};

const GestaoClientes = () => {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Client form
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [empresa, setEmpresa] = useState("");
  const [segmento, setSegmento] = useState("");
  const [siteUrl, setSiteUrl] = useState("");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Contact form
  const [selectedClienteId, setSelectedClienteId] = useState<string | null>(null);
  const [contatos, setContatos] = useState<Contato[]>([]);
  const [loadingContatos, setLoadingContatos] = useState(false);
  const [contatoNome, setContatoNome] = useState("");
  const [contatoEmail, setContatoEmail] = useState("");
  const [contatoTelefone, setContatoTelefone] = useState("");
  const [savingContato, setSavingContato] = useState(false);
  const [contatoErrors, setContatoErrors] = useState<Record<string, string>>({});

  const fetchClientes = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("clientes")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setClientes(data);
    setLoading(false);
  };

  const fetchContatos = async (clienteId: string) => {
    setLoadingContatos(true);
    const { data } = await supabase
      .from("contatos_clientes")
      .select("*")
      .eq("cliente_id", clienteId)
      .order("created_at", { ascending: false });
    if (data) setContatos(data);
    setLoadingContatos(false);
  };

  useEffect(() => {
    fetchClientes();
  }, []);

  useEffect(() => {
    if (selectedClienteId) {
      fetchContatos(selectedClienteId);
    } else {
      setContatos([]);
    }
  }, [selectedClienteId]);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!nome.trim()) errs.nome = "Nome é obrigatório.";
    if (!email.trim()) {
      errs.email = "E-mail é obrigatório.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errs.email = "E-mail inválido.";
    }
    if (siteUrl.trim() && !/^https?:\/\/.+/.test(siteUrl.trim())) {
      errs.siteUrl = "URL deve começar com http:// ou https://";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmitCliente = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSaving(true);
    const { error } = await supabase.from("clientes").insert({
      nome: nome.trim(),
      email: email.trim(),
      empresa: empresa.trim() || null,
      segmento: segmento.trim() || null,
      site_url: siteUrl.trim() || null,
      logo_url: logoUrl,
    });

    if (error) {
      toast.error("Erro ao cadastrar cliente.");
    } else {
      toast.success("Cliente cadastrado com sucesso!");
      setNome("");
      setEmail("");
      setEmpresa("");
      setSegmento("");
      setSiteUrl("");
      setLogoUrl(null);
      setErrors({});
      fetchClientes();
    }
    setSaving(false);
  };

  const handleUpdateLogo = async (clienteId: string, url: string) => {
    const { error } = await supabase.from("clientes").update({ logo_url: url }).eq("id", clienteId);
    if (error) {
      toast.error("Erro ao atualizar logo.");
    } else {
      toast.success("Logo atualizado!");
      fetchClientes();
    }
  };

  const validateContato = () => {
    const errs: Record<string, string> = {};
    if (!contatoNome.trim()) errs.contatoNome = "Nome é obrigatório.";
    if (contatoEmail.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contatoEmail.trim())) {
      errs.contatoEmail = "E-mail inválido.";
    }
    if (contatoTelefone.trim() && contatoTelefone.replace(/\D/g, "").length < 10) {
      errs.contatoTelefone = "Telefone incompleto.";
    }
    setContatoErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleAddContato = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClienteId || !validateContato()) return;

    setSavingContato(true);
    const { error } = await supabase.from("contatos_clientes").insert({
      cliente_id: selectedClienteId,
      nome: contatoNome.trim(),
      email: contatoEmail.trim() || null,
      telefone: contatoTelefone.trim() || null,
    });

    if (error) {
      toast.error("Erro ao adicionar contato.");
    } else {
      toast.success("Contato adicionado!");
      setContatoNome("");
      setContatoEmail("");
      setContatoTelefone("");
      setContatoErrors({});
      fetchContatos(selectedClienteId);
    }
    setSavingContato(false);
  };

  const handleDeleteContato = async (contatoId: string) => {
    if (!selectedClienteId) return;
    await supabase.from("contatos_clientes").delete().eq("id", contatoId);
    fetchContatos(selectedClienteId);
    toast.success("Contato removido.");
  };

  const selectedCliente = clientes.find((c) => c.id === selectedClienteId);

  return (
    <div className="space-y-6">
      {/* Client Form */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="font-mono text-foreground flex items-center gap-2 text-base">
            <Plus className="h-4 w-4 text-primary" />
            Cadastrar Cliente
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmitCliente} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <ImageUpload currentUrl={logoUrl} onUploaded={setLogoUrl} folder="clientes" label="Logo" />
            </div>
            <div className="space-y-1">
              <Input placeholder="Nome *" value={nome} onChange={(e) => setNome(e.target.value)}
                className="font-mono bg-secondary border-border text-foreground" />
              {errors.nome && <p className="text-xs text-destructive font-mono">{errors.nome}</p>}
            </div>
            <div className="space-y-1">
              <Input placeholder="E-mail *" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                className="font-mono bg-secondary border-border text-foreground" />
              {errors.email && <p className="text-xs text-destructive font-mono">{errors.email}</p>}
            </div>
            <Input placeholder="Empresa" value={empresa} onChange={(e) => setEmpresa(e.target.value)}
              className="font-mono bg-secondary border-border text-foreground" />
            <Input placeholder="Segmento" value={segmento} onChange={(e) => setSegmento(e.target.value)}
              className="font-mono bg-secondary border-border text-foreground" />
            <div className="space-y-1 sm:col-span-2">
              <Input placeholder="Site (https://...)" value={siteUrl} onChange={(e) => setSiteUrl(e.target.value)}
                className="font-mono bg-secondary border-border text-foreground" />
              {errors.siteUrl && <p className="text-xs text-destructive font-mono">{errors.siteUrl}</p>}
            </div>
            <div className="sm:col-span-2">
              <Button type="submit" className="font-mono w-full sm:w-auto" disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Cadastrar Cliente
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Client List */}
      <Card className="border-border bg-card overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="font-mono text-foreground flex items-center gap-2 text-base">
            <Building2 className="h-4 w-4 text-primary" />
            Clientes
            <Badge variant="outline" className="font-mono text-xs border-primary/30 text-primary ml-auto">
              {clientes.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="font-mono text-xs text-muted-foreground w-12"></TableHead>
                <TableHead className="font-mono text-xs text-muted-foreground">Nome</TableHead>
                <TableHead className="font-mono text-xs text-muted-foreground">E-mail</TableHead>
                <TableHead className="font-mono text-xs text-muted-foreground">Empresa</TableHead>
                <TableHead className="font-mono text-xs text-muted-foreground">Segmento</TableHead>
                <TableHead className="font-mono text-xs text-muted-foreground text-center">Logo</TableHead>
                <TableHead className="font-mono text-xs text-muted-foreground text-center">Contatos</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground font-mono py-12">
                    Carregando...
                  </TableCell>
                </TableRow>
              ) : clientes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground font-mono py-12">
                    Nenhum cliente cadastrado.
                  </TableCell>
                </TableRow>
              ) : (
                clientes.map((c) => (
                  <TableRow
                    key={c.id}
                    className={`border-border cursor-pointer transition-colors ${selectedClienteId === c.id ? "bg-primary/10" : "hover:bg-secondary/50"}`}
                    onClick={() => setSelectedClienteId(selectedClienteId === c.id ? null : c.id)}
                  >
                    <TableCell>
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={c.logo_url ?? undefined} />
                        <AvatarFallback className="bg-secondary text-muted-foreground text-[10px]">
                          {c.nome.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </TableCell>
                    <TableCell className="font-medium text-foreground">{c.nome}</TableCell>
                    <TableCell className="text-muted-foreground text-sm font-mono">{c.email}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{c.empresa ?? "—"}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{c.segmento ?? "—"}</TableCell>
                    <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                      <ImageUpload
                        currentUrl={c.logo_url}
                        onUploaded={(url) => handleUpdateLogo(c.id, url)}
                        folder="clientes"
                        label="Alterar"
                        size="sm"
                      />
                    </TableCell>
                    <TableCell className="text-center">
                      <Button
                        variant={selectedClienteId === c.id ? "default" : "ghost"}
                        size="sm"
                        className="font-mono text-xs gap-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedClienteId(selectedClienteId === c.id ? null : c.id);
                        }}
                      >
                        <Contact className="h-3 w-3" />
                        Contatos
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Contacts Section */}
      {selectedClienteId && (
        <Card className="border-primary/20 bg-card">
          <CardHeader>
            <CardTitle className="font-mono text-foreground flex items-center gap-2 text-base">
              <UserPlus className="h-4 w-4 text-primary" />
              Contatos — {selectedCliente?.nome ?? ""}
              <Badge variant="outline" className="font-mono text-xs border-primary/30 text-primary ml-auto">
                {contatos.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleAddContato} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <Input placeholder="Nome do contato *" value={contatoNome} onChange={(e) => setContatoNome(e.target.value)}
                  className="font-mono bg-secondary border-border text-foreground" />
                {contatoErrors.contatoNome && <p className="text-xs text-destructive font-mono">{contatoErrors.contatoNome}</p>}
              </div>
              <div className="space-y-1">
                <Input placeholder="E-mail" type="email" value={contatoEmail} onChange={(e) => setContatoEmail(e.target.value)}
                  className="font-mono bg-secondary border-border text-foreground" />
                {contatoErrors.contatoEmail && <p className="text-xs text-destructive font-mono">{contatoErrors.contatoEmail}</p>}
              </div>
              <div className="space-y-1">
                <Input placeholder="Telefone" value={contatoTelefone}
                  onChange={(e) => setContatoTelefone(maskPhone(e.target.value))}
                  className="font-mono bg-secondary border-border text-foreground" />
                {contatoErrors.contatoTelefone && <p className="text-xs text-destructive font-mono">{contatoErrors.contatoTelefone}</p>}
              </div>
              <div className="sm:col-span-3">
                <Button type="submit" size="sm" className="font-mono gap-1" disabled={savingContato}>
                  {savingContato && <Loader2 className="h-3 w-3 animate-spin" />}
                  <Plus className="h-3 w-3" /> Adicionar Contato
                </Button>
              </div>
            </form>

            {loadingContatos ? (
              <p className="text-sm text-muted-foreground font-mono text-center py-4">Carregando contatos...</p>
            ) : contatos.length === 0 ? (
              <p className="text-sm text-muted-foreground font-mono text-center py-4">Nenhum contato cadastrado para este cliente.</p>
            ) : (
              <div className="space-y-2">
                {contatos.map((ct) => (
                  <div key={ct.id} className="flex items-center justify-between bg-secondary/50 rounded-lg p-3 text-sm">
                    <div className="space-y-0.5">
                      <p className="font-medium text-foreground">{ct.nome}</p>
                      <p className="text-xs text-muted-foreground font-mono">
                        {[ct.email, ct.telefone].filter(Boolean).join(" · ") || "—"}
                      </p>
                    </div>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive"
                      onClick={() => handleDeleteContato(ct.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default GestaoClientes;
