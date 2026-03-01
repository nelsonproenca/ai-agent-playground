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
  name: string;
  description: string | null;
  descriptionhtml: string | null;
  price: number;
  image_url: string | null;
  shopify_id: string | null;
  shopify_variant_id: string | null;
  producttype: string | null;
  active: boolean;
  created_at: string;
}

const ProdutosPage = () => {
  const navigate = useNavigate();
  const { authenticated } = useAuth();
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [editId, setEditId] = useState<string | null>(null);
  const formRef = useRef<HTMLDivElement>(null);

  const emptyForm = {
    name: "",
    description: "",
    descriptionhtml: "",
    price: "",
    image_url: "",
    shopify_id: "",
    shopify_variant_id: "",
    producttype: "",
    active: true,
  };
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
      name: p.name,
      description: p.description || "",
      descriptionhtml: p.descriptionhtml || "",
      price: String(p.price),
      image_url: p.image_url || "",
      shopify_id: p.shopify_id || "",
      shopify_variant_id: p.shopify_variant_id || "",
      producttype: p.producttype || "",
      active: p.active,
    });
    formRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleCancel = () => {
    setEditId(null);
    setForm(emptyForm);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.price) {
      toast.error("Nome e Preço são obrigatórios");
      return;
    }

    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      descriptionhtml: form.descriptionhtml.trim() || null,
      price: parseFloat(form.price),
      image_url: form.image_url.trim() || null,
      shopify_id: form.shopify_id.trim() || null,
      shopify_variant_id: form.shopify_variant_id.trim() || null,
      producttype: form.producttype.trim() || null,
      active: form.active,
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
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ex: Camiseta Premium" />
              </div>
              <div className="space-y-2">
                <Label className="font-mono text-xs">Tipo de Produto</Label>
                <Input value={form.producttype} onChange={(e) => setForm({ ...form, producttype: e.target.value })} placeholder="Ex: Acessórios para Celular" />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="font-mono text-xs">Descrição</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Descrição resumida do produto..." rows={3} />
            </div>
            <div className="space-y-2">
              <Label className="font-mono text-xs">Descrição HTML (Rich Text)</Label>
              <Textarea value={form.descriptionhtml} onChange={(e) => setForm({ ...form, descriptionhtml: e.target.value })} placeholder="<p>Descrição detalhada com HTML...</p>" rows={4} className="font-mono text-xs" />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="font-mono text-xs">Preço (R$) *</Label>
                <Input type="number" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="99.90" />
              </div>
              <div className="space-y-2">
                <Label className="font-mono text-xs">URL da Imagem</Label>
                <Input value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} placeholder="https://..." />
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="font-mono text-xs">Shopify Product ID</Label>
                <Input value={form.shopify_id} onChange={(e) => setForm({ ...form, shopify_id: e.target.value })} placeholder="Ex: 9176175935726" />
              </div>
              <div className="space-y-2">
                <Label className="font-mono text-xs">Shopify Variant ID</Label>
                <Input value={form.shopify_variant_id} onChange={(e) => setForm({ ...form, shopify_variant_id: e.target.value })} placeholder="Ex: 47711004360942" />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={form.active} onCheckedChange={(v) => setForm({ ...form, active: v })} />
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
                <TableHead className="font-mono text-xs">Tipo</TableHead>
                <TableHead className="font-mono text-xs">Preço</TableHead>
                <TableHead className="font-mono text-xs">Shopify ID</TableHead>
                <TableHead className="font-mono text-xs">Variant ID</TableHead>
                <TableHead className="font-mono text-xs">Ativo</TableHead>
                <TableHead className="font-mono text-xs text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {produtos.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-mono text-sm font-semibold max-w-[180px] truncate">{p.name}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground max-w-[120px] truncate">{p.producttype || "—"}</TableCell>
                  <TableCell className="font-mono text-sm text-primary">R$ {p.price.toFixed(2).replace(".", ",")}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground max-w-[100px] truncate">{p.shopify_id || "—"}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground max-w-[100px] truncate">{p.shopify_variant_id || "—"}</TableCell>
                  <TableCell>
                    <Badge variant={p.active ? "default" : "secondary"} className="font-mono text-[10px]">
                      {p.active ? "Sim" : "Não"}
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
                  <TableCell colSpan={7} className="text-center text-muted-foreground font-mono text-sm py-8">
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
