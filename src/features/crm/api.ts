import { portalApi } from "@/features/portal-shared/apiClient";

/**
 * Seam único do CRM do site (leads, enriquecimento de empresa, playground, colaboradores, contatos de clientes
 * e agendamentos) no portal-api. Os formulários públicos (lead, enrich,
 * playground) não exigem login; o resto exige a sessão do admin. O n8n nunca é chamado daqui: o portal-api
 * grava e avisa o n8n, e o resultado volta por polling nos GETs abaixo.
 */

// ─── Colaboradores ────────────────────────────────────────────────────────────

export interface Colaborador {
  id: string;
  nome: string;
  cargo: string | null;
  departamento: string | null;
  email: string;
  fotoUrl: string | null;
  createdAt: string;
}

export interface UpsertColaboradorInput {
  nome: string;
  cargo: string | null;
  departamento: string | null;
  email: string;
  fotoUrl: string | null;
}

/** Leitura pública (landing e página de colaboradores). */
export const listColaboradores = () => portalApi.get<Colaborador[]>("/colaboradores");
export const createColaborador = (input: UpsertColaboradorInput) => portalApi.post<Colaborador>("/colaboradores", input);
export const updateColaborador = (id: string, input: UpsertColaboradorInput) =>
  portalApi.put<Colaborador>(`/colaboradores/${id}`, input);
export const deleteColaborador = (id: string) => portalApi.delete<void>(`/colaboradores/${id}`);

// ─── Contatos de clientes ─────────────────────────────────────────────────────

export interface ContatoCliente {
  id: string;
  clienteId: string;
  nome: string;
  telefone: string | null;
  email: string | null;
  createdAt: string;
}

export interface UpsertContatoInput {
  clienteId: string;
  nome: string;
  telefone: string | null;
  email: string | null;
}

export const listContatos = (clienteId?: string) =>
  portalApi.get<ContatoCliente[]>(`/contatos-clientes${clienteId ? `?clienteId=${encodeURIComponent(clienteId)}` : ""}`);
export const createContato = (input: UpsertContatoInput) => portalApi.post<ContatoCliente>("/contatos-clientes", input);
export const updateContato = (id: string, input: UpsertContatoInput) =>
  portalApi.put<ContatoCliente>(`/contatos-clientes/${id}`, input);
export const deleteContato = (id: string) => portalApi.delete<void>(`/contatos-clientes/${id}`);

// ─── Leads ────────────────────────────────────────────────────────────────────

export interface Lead {
  id: string;
  nome: string | null;
  empresa: string | null;
  contato: string | null;
  canal: string | null;
  desafioTecnico: string | null;
  origem: string | null;
  analiseIa: string | null;
  vistoPeloNelson: boolean;
  createdAt: string;
}

export interface NovoLeadInput {
  nome: string;
  empresa: string | null;
  contato: string;
  canal: string | null;
  desafioTecnico: string;
}

/** Formulário público do site. */
export const criarLead = (input: NovoLeadInput) => portalApi.post<{ id: string }>("/leads", input);
export const listLeads = () => portalApi.get<Lead[]>("/leads");
export const marcarLeadVisto = (id: string, visto: boolean) => portalApi.patch<Lead>(`/leads/${id}/visto`, { visto });

// ─── Enriquecer empresa e playground (públicos, com polling) ──────────────────

export interface ResultadoEnrich {
  id: string;
  outputAi: string | null;
  pronto: boolean;
}

export interface ResultadoPlayground {
  id: string;
  outputIa: string | null;
  status: string | null;
  pronto: boolean;
}

export const iniciarEnrich = (input: { nomeEmpresa: string; segmento: string }) =>
  portalApi.post<{ id: string }>("/enrich", input);
export const obterEnrich = (id: string) => portalApi.get<ResultadoEnrich>(`/enrich/${id}`);

export const iniciarPlayground = (input: { tipoAnalise: string; inputTecnico: string }) =>
  portalApi.post<{ id: string }>("/playground", input);
export const obterPlayground = (id: string) => portalApi.get<ResultadoPlayground>(`/playground/${id}`);

/**
 * Espera o resultado do n8n consultando o portal-api. Devolve o texto, ou null se estourar o tempo
 * (o chamador mostra "tente novamente"). Falha pontual de rede não derruba a espera: tenta de novo.
 */
export async function aguardarResultado(
  buscar: () => Promise<{ pronto: boolean; texto: string | null }>,
  { tentativas = 30, intervaloMs = 2000 }: { tentativas?: number; intervaloMs?: number } = {},
): Promise<string | null> {
  for (let i = 0; i < tentativas; i++) {
    await new Promise((r) => setTimeout(r, intervaloMs));
    try {
      const r = await buscar();
      if (r.pronto && r.texto) return r.texto;
    } catch {
      // erro momentâneo: segue tentando até esgotar o tempo
    }
  }
  return null;
}

// ─── Agendamentos ─────────────────────────────────────────────────────────────

export interface Agendamento {
  id: string;
  clienteNome: string | null;
  clienteEmail: string | null;
  clienteWhatsapp: string | null;
  dataReuniao: string;
  status: string | null;
  instagramUserId: string | null;
  expertResponsavel: string | null;
  indicadoPor: string | null;
  origem: string | null;
  valorProjeto: number | null;
  comissaoPaga: boolean;
  createdAt: string;
}

export const listAgendamentos = () => portalApi.get<Agendamento[]>("/agendamentos");
export const atualizarAgendamento = (
  id: string,
  patch: { status?: string; comissaoPaga?: boolean; valorProjeto?: number },
) => portalApi.patch<Agendamento>(`/agendamentos/${id}`, patch);
