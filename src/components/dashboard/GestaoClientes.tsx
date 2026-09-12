import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Building2, Plus, Loader2, UserPlus, Contact, Trash2, Pencil } from "lucide-react";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";
import { listClientes, createCliente, updateCliente, type Cliente } from "@/features/clientes/api";
import ImageUpload from "./ImageUpload";

type Contato = Tables<"contatos_clientes">;

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
  const [editId, setEditId] = useState<string | null>(null);
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [empresa, setEmpresa] = useState("");
  const [segmento, setSegmento] = useState("");
  const [siteUrl, setSiteUrl] = useState("");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Contact form
  const [selectedClienteId, setSelectedClienteId] = useState<string | null>(null);
  const [contatos, setContatos] = useState<Contato[]>([]);
  const [loadingContatos, setLoadingContatos] = useState(false);
  const [editContatoId, setEditContatoId] = useState<string | null>(null);
  const [contatoNome, setContatoNome] = useState("");
  const [contatoEmail, setContatoEmail] = useState("");
  const [contatoTelefone, setContatoTelefone] = useState("");
  const [savingContato, setSavingContato] = useState(false);
  const [contatoErrors, setContatoErrors] = useState<Record<string, string>>({});

  const fetchClientes = async () => {
    setLoading(true);
    try {
      setClientes(await listClientes());
    } catch {
      toast.error("Erro ao carregar clientes.");
    }
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

  useEffect(() => { fetchClientes(); }, []);

  useEffect(() => {
    if (selectedClienteId) {
      fetchContatos(selectedClienteId);
    } else {
      setContatos([]);
    }
  }, [selectedClienteId]);

  // --- Client form helpers ---
  const resetClientForm = () => {
    setEditId(null);
    setNome(""); setEmail(""); setEmpresa(""); setSegmento(""); setSiteUrl(""); setLogoUrl(null); setStatus(null); setErrors({});
  };

  const handleEditCliente = (c: Cliente) => {
    setEditId(c.id);
    setNome(c.nome);
    setEmail(c.email);
    setEmpresa(c.empresa ?? "");
    setSegmento(c.segmento ?? "");
    setSiteUrl(c.siteUrl ?? "");
    setLogoUrl(c.logoUrl);
    setStatus(c.status);
    setErrors({});
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

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
    const payload = {
      nome: nome.trim(),
      email: email.trim(),
      empresa: empresa.trim() || null,
      segmento: segmento.trim() || null,
      siteUrl: siteUrl.trim() || null,
      logoUrl,
      status,
    };

    try {
      if (editId) {
        await updateCliente(editId, payload);
        toast.success("Cliente atualizado!");
      } else {
        await createCliente(payload);
        toast.success("Cliente cadastrado!");
      }
      resetClientForm();
      fetchClientes();
    } catch {
      toast.error(editId ? "Erro ao atualizar cliente." : "Erro ao cadastrar cliente.");
    }
    setSaving(false);
  };

  // --- Contact form helpers ---
  const resetContatoForm = () => {
    setEditContatoId(null);
    setContatoNome(""); setContatoEmail(""); setContatoTelefone(""); setContatoErrors({});
  };

  const handleEditContato = (ct: Contato) => {
    setEditContatoId(ct.id);
    setContatoNome(ct.nome);
    setContatoEmail(ct.email ?? "");
    setContatoTelefone(ct.telefone ?? "");
    setContatoErrors({});
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

  const handleSubmitContato = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClienteId || !validateContato()) return;

    setSavingContato(true);
    const payload = {
      cliente_id: selectedClienteId,
      nome: contatoNome.trim(),
      email: contatoEmail.trim() || null,
      telefone: contatoTelefone.trim() || null,
    };

    if (editContatoId) {
      const { error } = await supabase.from("contatos_clientes").update(payload).eq("id", editContatoId);
      if (error) { toast.error("Erro ao atualizar contato."); }
      else { toast.success("Contato atualizado!"); resetContatoForm(); fetchContatos(selectedClienteId); }
    } else {
      const { error } = await supabase.from("contatos_clientes").insert(payload);
      if (error) { toast.error("Erro ao adicionar contato."); }
      else { toast.success("Contato adicionado!"); resetContatoForm(); fetchContatos(selectedClienteId); }
    }
    setSavingContato(false);
  };

  const handleDeleteContato = async (contatoId: string) => {
    if (!selectedClienteId) return;
    await supabase.from("contatos_clientes").delete().eq("id", contatoId);
    if (editContatoId === contatoId) resetContatoForm();
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
            {editId ? "Editar Cliente" : "Cadastrar Cliente"}
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
            <div className="sm:col-span-2 flex gap-2">
              <Button type="submit" className="font-mono w-full sm:w-auto" disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Salvar
              </Button>
              {editId && (
                <Button type="button" variant="outline" className="font-mono" onClick={resetClientForm}>
                  Cancelar
                </Button>
              )}
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
                <TableHead className="font-mono text-xs text-muted-foreground">Nome</TableHead>
                <TableHead className="font-mono text-xs text-muted-foreground">E-mail</TableHead>
                <TableHead className="font-mono text-xs text-muted-foreground">Empresa</TableHead>
                <TableHead className="font-mono text-xs text-muted-foreground">Segmento</TableHead>
                <TableHead className="font-mono text-xs text-muted-foreground text-center">Contatos</TableHead>
                <TableHead className="font-mono text-xs text-muted-foreground text-center w-16">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground font-mono py-12">
                    Carregando...
                  </TableCell>
                </TableRow>
              ) : clientes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground font-mono py-12">
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
                    <TableCell className="font-medium text-foreground">{c.nome}</TableCell>
                    <TableCell className="text-muted-foreground text-sm font-mono">{c.email}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{c.empresa ?? "—"}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{c.segmento ?? "—"}</TableCell>
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
                    <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEditCliente(c)}>
                        <Pencil className="h-4 w-4 text-primary" />
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
              {editContatoId ? "Editar Contato" : "Contatos"} — {selectedCliente?.nome ?? ""}
              <Badge variant="outline" className="font-mono text-xs border-primary/30 text-primary ml-auto">
                {contatos.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleSubmitContato} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
              <div className="sm:col-span-3 flex gap-2">
                <Button type="submit" size="sm" className="font-mono gap-1" disabled={savingContato}>
                  {savingContato && <Loader2 className="h-3 w-3 animate-spin" />}
                  Salvar
                </Button>
                {editContatoId && (
                  <Button type="button" variant="outline" size="sm" className="font-mono" onClick={resetContatoForm}>
                    Cancelar
                  </Button>
                )}
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
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary"
                        onClick={() => handleEditContato(ct)}>
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive"
                        onClick={() => handleDeleteContato(ct.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
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
