import { useEffect, useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Pencil, Trash2, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface Produto {
  id: string;
  nome: string;
  descricao: string | null;
  preco: number;
  preco_comparativo: number | null;
  imagem_url: string | null;
  shopify_variant_id: string | null;
  ativo: boolean;
  created_at: string;
}

const ProdutosPage = () => {
  const navigate = useNavigate();
  const { authenticated } = useAuth();
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [editId, setEditId] = useState<string | null>(null);
  const formRef = useRef<HTMLDivElement>(null);

  const emptyForm = { nome: "", descricao: "", preco: "", preco_comparativo: "", imagem_url: "", shopify_variant_id: "", ativo: true };
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    if (!authenticated) navigate("/login", { replace: true });
  }, [authenticated, navigate]);

  useEffect(() => { fetchProdutos(); }, []);

  const fetchProdutos = async () => {
    const { data } = await supabase.from("produtos_dtc").select("*").order("created_at", { ascending: false });
    if (data) setProdutos(data as Produto[]);
  };

  const handleEdit = (p: Produto) => {
    setEditId(p.id);
    setForm({
      nome: p.nome,
      descricao: p.descricao || "",
      preco: String(p.preco),
      preco_comparativo: p.preco_comparativo ? String(p.preco_comparativo) : "",
      imagem_url: p.imagem_url || "",
      shopify_variant_id: p.shopify_variant_id || "",
      ativo: p.ativo,
    });
    formRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleCancel = () => {
    setEditId(null);
    setForm(emptyForm);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nome.trim() || !form.preco) {
      toast.error("Nome e Preço são obrigatórios");
      return;
    }

    const payload = {
      nome: form.nome.trim(),
      descricao: form.descricao.trim() || null,
      preco: parseFloat(form.preco),
      preco_comparativo: form.preco_comparativo ? parseFloat(form.preco_comparativo) : null,
      imagem_url: form.imagem_url.trim() || null,
      shopify_variant_id: form.shopify_variant_id.trim() || null,
      ativo: form.ativo,
    };

    if (editId) {
      const { error } = await supabase.from("produtos_dtc").update(payload).eq("id", editId);
      if (error) { toast.error("Erro ao atualizar"); return; }
      toast.success("Produto atualizado!");
    } else {
      const { error } = await supabase.from("produtos_dtc").insert(payload);
      if (error) { toast.error("Erro ao cadastrar"); return; }
      toast.success("Produto cadastrado!");
    }
    handleCancel();
    fetchProdutos();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir este produto?")) return;
    const { error } = await supabase.from("produtos_dtc").delete().eq("id", id);
    if (error) { toast.error("Erro ao excluir"); return; }
    toast.success("Produto excluído!");
    fetchProdutos();
  };

  if (!authenticated) return null;

  return (
    <div className="min-h-screen bg-background grid-pattern">
      <header className="border-b border-border">
        <div className="container max-w-6xl py-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" asChild>
              <Link to="/admin"><ArrowLeft className="h-5 w-5" /></Link>
            </Button>
            <h1 className="font-mono font-bold text-foreground text-lg">
              Produtos <span className="text-primary">DTC</span>
            </h1>
          </div>
        </div>
      </header>

      <main className="container max-w-4xl py-8 px-4 space-y-8">
        {/* Form */}
        <div ref={formRef} className="rounded-xl border border-border bg-card p-6">
          <h2 className="font-mono font-bold text-foreground mb-4 flex items-center gap-2">
            <Plus className="h-4 w-4 text-primary" />
            {editId ? "Editar Produto" : "Novo Produto"}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="font-mono text-xs">Nome do Produto *</Label>
                <Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} placeholder="Ex: Camiseta Premium" />
              </div>
              <div className="space-y-2">
                <Label className="font-mono text-xs">Shopify Variant ID</Label>
                <Input value={form.shopify_variant_id} onChange={(e) => setForm({ ...form, shopify_variant_id: e.target.value })} placeholder="Ex: 44012345678" />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="font-mono text-xs">Descrição</Label>
              <Textarea value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} placeholder="Descrição detalhada do produto..." rows={4} />
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="font-mono text-xs">Preço (R$) *</Label>
                <Input type="number" step="0.01" value={form.preco} onChange={(e) => setForm({ ...form, preco: e.target.value })} placeholder="99.90" />
              </div>
              <div className="space-y-2">
                <Label className="font-mono text-xs">Preço Comparativo (De)</Label>
                <Input type="number" step="0.01" value={form.preco_comparativo} onChange={(e) => setForm({ ...form, preco_comparativo: e.target.value })} placeholder="149.90" />
              </div>
              <div className="space-y-2">
                <Label className="font-mono text-xs">URL da Imagem</Label>
                <Input value={form.imagem_url} onChange={(e) => setForm({ ...form, imagem_url: e.target.value })} placeholder="https://..." />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={form.ativo} onCheckedChange={(v) => setForm({ ...form, ativo: v })} />
              <Label className="font-mono text-xs">Produto Ativo</Label>
            </div>
            <div className="flex gap-2">
              <Button type="submit" className="font-mono gap-2">
                <Save className="h-4 w-4" /> Salvar
              </Button>
              {editId && (
                <Button type="button" variant="outline" className="font-mono gap-2" onClick={handleCancel}>
                  <X className="h-4 w-4" /> Cancelar
                </Button>
              )}
            </div>
          </form>
        </div>

        {/* Table */}
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-mono text-xs">Produto</TableHead>
                <TableHead className="font-mono text-xs">Preço</TableHead>
                <TableHead className="font-mono text-xs">De</TableHead>
                <TableHead className="font-mono text-xs">Variant ID</TableHead>
                <TableHead className="font-mono text-xs">Ativo</TableHead>
                <TableHead className="font-mono text-xs text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {produtos.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-mono text-sm font-semibold max-w-[200px] truncate">{p.nome}</TableCell>
                  <TableCell className="font-mono text-sm text-primary">R$ {p.preco.toFixed(2).replace(".", ",")}</TableCell>
                  <TableCell className="font-mono text-sm text-muted-foreground">
                    {p.preco_comparativo ? `R$ ${p.preco_comparativo.toFixed(2).replace(".", ",")}` : "—"}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground max-w-[120px] truncate">{p.shopify_variant_id || "—"}</TableCell>
                  <TableCell>
                    <Badge variant={p.ativo ? "default" : "secondary"} className="font-mono text-[10px]">
                      {p.ativo ? "Sim" : "Não"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right space-x-1">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(p)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(p.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {produtos.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground font-mono text-sm py-8">
                    Nenhum produto cadastrado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </main>
    </div>
  );
};

export default ProdutosPage;
