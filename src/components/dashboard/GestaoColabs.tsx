import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Users, Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";

type Colaborador = Tables<"colaboradores">;

const GestaoColabs = () => {
  const [colabs, setColabs] = useState<Colaborador[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [cargo, setCargo] = useState("");
  const [departamento, setDepartamento] = useState("");

  const [errors, setErrors] = useState<Record<string, string>>({});

  const fetchColabs = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("colaboradores")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setColabs(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchColabs();
  }, []);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!nome.trim()) errs.nome = "Nome é obrigatório.";
    if (!email.trim()) {
      errs.email = "E-mail é obrigatório.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errs.email = "E-mail inválido.";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSaving(true);
    const { error } = await supabase.from("colaboradores").insert({
      nome: nome.trim(),
      email: email.trim(),
      cargo: cargo.trim() || null,
      departamento: departamento.trim() || null,
    });

    if (error) {
      toast.error("Erro ao cadastrar colaborador.");
    } else {
      toast.success("Colaborador cadastrado com sucesso!");
      setNome("");
      setEmail("");
      setCargo("");
      setDepartamento("");
      setErrors({});
      fetchColabs();
    }
    setSaving(false);
  };

  return (
    <div className="space-y-6">
      {/* Form */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="font-mono text-foreground flex items-center gap-2 text-base">
            <Plus className="h-4 w-4 text-primary" />
            Cadastrar Colaborador
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Input
                placeholder="Nome *"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="font-mono bg-secondary border-border text-foreground"
              />
              {errors.nome && <p className="text-xs text-destructive font-mono">{errors.nome}</p>}
            </div>
            <div className="space-y-1">
              <Input
                placeholder="E-mail *"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="font-mono bg-secondary border-border text-foreground"
              />
              {errors.email && <p className="text-xs text-destructive font-mono">{errors.email}</p>}
            </div>
            <Input
              placeholder="Cargo"
              value={cargo}
              onChange={(e) => setCargo(e.target.value)}
              className="font-mono bg-secondary border-border text-foreground"
            />
            <Input
              placeholder="Departamento"
              value={departamento}
              onChange={(e) => setDepartamento(e.target.value)}
              className="font-mono bg-secondary border-border text-foreground"
            />
            <div className="sm:col-span-2">
              <Button type="submit" className="font-mono w-full sm:w-auto" disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Cadastrar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* List */}
      <Card className="border-border bg-card overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="font-mono text-foreground flex items-center gap-2 text-base">
            <Users className="h-4 w-4 text-primary" />
            Colaboradores
            <Badge variant="outline" className="font-mono text-xs border-primary/30 text-primary ml-auto">
              {colabs.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="font-mono text-xs text-muted-foreground">Nome</TableHead>
                <TableHead className="font-mono text-xs text-muted-foreground">E-mail</TableHead>
                <TableHead className="font-mono text-xs text-muted-foreground">Cargo</TableHead>
                <TableHead className="font-mono text-xs text-muted-foreground">Departamento</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground font-mono py-12">
                    Carregando...
                  </TableCell>
                </TableRow>
              ) : colabs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground font-mono py-12">
                    Nenhum colaborador cadastrado.
                  </TableCell>
                </TableRow>
              ) : (
                colabs.map((c) => (
                  <TableRow key={c.id} className="border-border">
                    <TableCell className="font-medium text-foreground">{c.nome}</TableCell>
                    <TableCell className="text-muted-foreground text-sm font-mono">{c.email}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{c.cargo ?? "—"}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{c.departamento ?? "—"}</TableCell>
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

export default GestaoColabs;
