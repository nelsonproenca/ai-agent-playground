import { portalApi } from "@/features/portal-shared/apiClient";

/**
 * Seam único da entidade Cliente no portal-backend (ticket #15). `contatos_clientes`
 * continua no Supabase (CRM, fora de escopo) — não faz parte deste módulo.
 */

export interface Cliente {
  id: string;
  nome: string;
  email: string;
  empresa: string | null;
  segmento: string | null;
  siteUrl: string | null;
  logoUrl: string | null;
  status: string | null;
  createdAt: string;
}

export interface UpsertClienteInput {
  nome: string;
  email: string;
  empresa: string | null;
  segmento: string | null;
  siteUrl: string | null;
  logoUrl: string | null;
  status: string | null;
}

export async function listClientes(): Promise<Cliente[]> {
  return portalApi.get<Cliente[]>("/clientes");
}

export async function listClientesPublicos(): Promise<Cliente[]> {
  return portalApi.get<Cliente[]>("/clientes/public");
}

export async function createCliente(input: UpsertClienteInput): Promise<Cliente> {
  return portalApi.post<Cliente>("/clientes", input);
}

export async function updateCliente(id: string, input: UpsertClienteInput): Promise<Cliente> {
  return portalApi.put<Cliente>(`/clientes/${id}`, input);
}
