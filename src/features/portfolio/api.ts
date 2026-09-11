import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";

/**
 * Camada de serviço da feature Portfólio/Portal do Cliente (issue #1).
 * Único seam da feature: toda operação contra Supabase para projetos, etapas,
 * artefatos e pedidos deve passar por este módulo — componentes de UI nunca
 * chamam `supabase.from(...)` diretamente para estas tabelas.
 */

export type Projeto = Tables<"projetos">;
export type NovoProjeto = TablesInsert<"projetos">;

export async function createProjeto(input: NovoProjeto): Promise<Projeto> {
  const { data, error } = await supabase
    .from("projetos")
    .insert(input)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function listProjetos(): Promise<Projeto[]> {
  const { data, error } = await supabase
    .from("projetos")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function getProjeto(id: string): Promise<Projeto | null> {
  const { data, error } = await supabase
    .from("projetos")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  return data;
}
