import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";
import { portalApi, portalClientApi, PortalApiError } from "@/features/portal-shared/apiClient";

/**
 * Camada de serviço da feature Portfólio/Portal do Cliente (issue #1).
 * Único seam da feature: toda operação contra Supabase para projetos, etapas,
 * artefatos e pedidos deve passar por este módulo — componentes de UI nunca
 * chamam `supabase.from(...)` diretamente para estas tabelas.
 */

type NotifyEvent = "novo_pedido" | "novo_artefato" | "pedido_respondido" | "pedido_decidido";

/** Fire-and-forget (issue #11): nunca lança erro, nunca bloqueia quem chamou. */
function notifyPortfolioEvent(payload: {
  event: NotifyEvent;
  projetoNome: string;
  detalhe: string;
  clienteEmail?: string;
}): void {
  supabase.functions.invoke("portfolio-notify-email", { body: payload }).catch((err) => {
    console.error("Falha ao notificar por e-mail (não bloqueia a operação):", err);
  });
}

async function getProjetoNomeECliente(projetoId: string): Promise<{ nome: string; clienteEmail: string | null } | null> {
  const { data } = await supabase
    .from("projetos")
    .select("nome, clientes(email)")
    .eq("id", projetoId)
    .maybeSingle();
  if (!data) return null;
  const clientes = data.clientes as { email: string } | { email: string }[] | null;
  const email = Array.isArray(clientes) ? clientes[0]?.email ?? null : clientes?.email ?? null;
  return { nome: data.nome, clienteEmail: email };
}

async function getProjetoNomePorPedido(pedidoId: string): Promise<string | null> {
  const { data } = await supabase
    .from("pedidos")
    .select("projetos(nome)")
    .eq("id", pedidoId)
    .maybeSingle();
  if (!data) return null;
  const projetos = data.projetos as { nome: string } | { nome: string }[] | null;
  return Array.isArray(projetos) ? projetos[0]?.nome ?? null : projetos?.nome ?? null;
}

// `Projeto`/`NovoProjeto` migraram pro portal-backend (ticket #16) — o shape
// (snake_case) é mantido de propósito igual ao que o Supabase gerava, pra não
// precisar reescrever os componentes que consomem isso (ver spec, "Frontend
// changes").
export type Projeto = Tables<"projetos">;
export type NovoProjeto = TablesInsert<"projetos">;

export async function createProjeto(input: NovoProjeto): Promise<Projeto> {
  return portalApi.post<Projeto>("/projetos", input);
}

export async function listProjetos(): Promise<Projeto[]> {
  return portalApi.get<Projeto[]>("/projetos");
}

export async function listProjetosPublicos(status?: Projeto["status_publico"]): Promise<Projeto[]> {
  const query = status ? `?status=${encodeURIComponent(status)}` : "";
  return portalApi.get<Projeto[]>(`/projetos/public${query}`);
}

/** Projetos do cliente autenticado (ticket #19) — o backend resolve o dono a
 * partir do JWT do Supabase (token Bearer), não de um id passado pelo front. */
export async function listProjetosDoCliente(): Promise<Projeto[]> {
  return portalClientApi.get<Projeto[]>("/projetos/mine");
}

export async function getProjeto(id: string): Promise<Projeto | null> {
  try {
    return await portalApi.get<Projeto>(`/projetos/${id}`);
  } catch (err) {
    if (err instanceof PortalApiError && err.status === 404) return null;
    throw err;
  }
}

export type Etapa = Tables<"etapas">;
export type NovaEtapa = TablesInsert<"etapas">;
export type AtualizacaoEtapa = TablesUpdate<"etapas">;

export async function createEtapa(input: NovaEtapa): Promise<Etapa> {
  return portalApi.post<Etapa>("/etapas", input);
}

export async function listEtapas(projetoId: string): Promise<Etapa[]> {
  return portalApi.get<Etapa[]>(`/etapas?projetoId=${encodeURIComponent(projetoId)}`);
}

export async function updateEtapa(id: string, updates: AtualizacaoEtapa): Promise<Etapa> {
  return portalApi.put<Etapa>(`/etapas/${id}`, updates);
}

export async function updateEtapaStatus(id: string, status: Etapa["status"]): Promise<Etapa> {
  return updateEtapa(id, { status });
}

export type Artefato = Tables<"artefatos">;

// Usado só por submitRespostaPedido (ticket #20 — pedido_respostas continua no
// Supabase por enquanto). Os artefatos "de verdade" (acima) já migraram.
const ARTEFATOS_BUCKET = "portfolio-privado";

export async function uploadArtefatoArquivo(input: {
  projetoId: string;
  etapaId?: string | null;
  nome: string;
  file: File;
}): Promise<Artefato> {
  const formData = new FormData();
  formData.append("projetoId", input.projetoId);
  if (input.etapaId) formData.append("etapaId", input.etapaId);
  formData.append("nome", input.nome);
  formData.append("file", input.file);

  const data = await portalApi.postForm<Artefato>("/artefatos/upload", formData);

  const contexto = await getProjetoNomeECliente(input.projetoId);
  if (contexto?.clienteEmail) {
    notifyPortfolioEvent({
      event: "novo_artefato",
      projetoNome: contexto.nome,
      detalhe: input.nome,
      clienteEmail: contexto.clienteEmail,
    });
  }

  return data;
}

export async function createArtefatoLink(input: {
  projetoId: string;
  etapaId?: string | null;
  nome: string;
  linkUrl: string;
}): Promise<Artefato> {
  const data = await portalApi.post<Artefato>("/artefatos/link", input);

  const contexto = await getProjetoNomeECliente(input.projetoId);
  if (contexto?.clienteEmail) {
    notifyPortfolioEvent({
      event: "novo_artefato",
      projetoNome: contexto.nome,
      detalhe: input.nome,
      clienteEmail: contexto.clienteEmail,
    });
  }

  return data;
}

export async function listArtefatos(projetoId: string): Promise<Artefato[]> {
  return portalApi.get<Artefato[]>(`/artefatos?projetoId=${encodeURIComponent(projetoId)}`);
}

/** Para artefatos do tipo "link", retorna a própria URL. Para "arquivo", gera
 * uma URL de download assinada e temporária (token HMAC de curta duração,
 * emitido pelo portal-backend) — nunca um path permanente/público. */
export async function getArtefatoUrl(artefato: Artefato): Promise<string> {
  if (artefato.tipo === "link") return artefato.url;

  // O backend devolve um path relativo às próprias rotas (não conhece o prefixo
  // /api/portal — quem monta isso é o Caddy). O front precisa completar o path
  // pra abrir/baixar de verdade (window.open exige URL navegável).
  const { url } = await portalApi.get<{ url: string }>(`/artefatos/${artefato.id}/signed-url`);
  return `/api/portal${url}`;
}

export type Pedido = Tables<"pedidos">;
export type NovoPedido = TablesInsert<"pedidos">;

export async function createPedido(input: NovoPedido): Promise<Pedido> {
  const { data, error } = await supabase
    .from("pedidos")
    .insert(input)
    .select()
    .single();

  if (error) throw error;

  const contexto = await getProjetoNomeECliente(input.projeto_id);
  if (contexto?.clienteEmail) {
    notifyPortfolioEvent({
      event: "novo_pedido",
      projetoNome: contexto.nome,
      detalhe: data.titulo,
      clienteEmail: contexto.clienteEmail,
    });
  }

  return data;
}

export async function listPedidos(projetoId: string): Promise<Pedido[]> {
  const { data, error } = await supabase
    .from("pedidos")
    .select("*")
    .eq("projeto_id", projetoId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export interface ProjetoDetalhado {
  projeto: Projeto | null;
  etapas: Etapa[];
  artefatos: Artefato[];
}

/** Usado pelo portal do cliente (issue #8): se o `projetoId` não pertencer
 * ao cliente autenticado, o RLS faz `getProjeto` retornar null e as demais
 * listas virem vazias — sem precisar de checagem manual de dono aqui. */
export async function getProjetoDetalhado(projetoId: string): Promise<ProjetoDetalhado> {
  const [projeto, etapas, artefatos] = await Promise.all([
    getProjeto(projetoId),
    listEtapas(projetoId),
    listArtefatos(projetoId),
  ]);
  return { projeto, etapas, artefatos };
}

export type PedidoResposta = Tables<"pedido_respostas">;

const RESPOSTA_ARQUIVO_MAX_BYTES = 10 * 1024 * 1024; // 10MB
const RESPOSTA_TIPOS_ACEITOS = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

function validarArquivoResposta(file: File): void {
  if (file.size > RESPOSTA_ARQUIVO_MAX_BYTES) {
    throw new Error("O arquivo excede o limite de 10MB.");
  }
  const isImagem = file.type.startsWith("image/");
  if (!isImagem && !RESPOSTA_TIPOS_ACEITOS.includes(file.type)) {
    throw new Error("Tipo de arquivo não permitido. Envie uma imagem, PDF ou documento (Word).");
  }
}

/** Resposta do cliente a um pedido tipo "pergunta" — texto + arquivo
 * opcional. Marca o pedido como "respondido" ao final. */
export async function submitRespostaPedido(input: {
  pedidoId: string;
  projetoId: string;
  texto: string;
  file?: File | null;
}): Promise<PedidoResposta> {
  let arquivoUrl: string | null = null;

  if (input.file) {
    validarArquivoResposta(input.file);
    const path = `${input.projetoId}/respostas/${crypto.randomUUID()}-${input.file.name}`;
    const { error: uploadError } = await supabase.storage.from(ARTEFATOS_BUCKET).upload(path, input.file);
    if (uploadError) throw uploadError;
    arquivoUrl = path;
  }

  const { data, error } = await supabase
    .from("pedido_respostas")
    .insert({ pedido_id: input.pedidoId, texto: input.texto, arquivo_url: arquivoUrl })
    .select()
    .single();
  if (error) throw error;

  const { error: statusError } = await supabase
    .from("pedidos")
    .update({ status: "respondido" })
    .eq("id", input.pedidoId);
  if (statusError) throw statusError;

  const projetoNome = await getProjetoNomePorPedido(input.pedidoId);
  if (projetoNome) {
    notifyPortfolioEvent({ event: "pedido_respondido", projetoNome, detalhe: input.texto });
  }

  return data;
}

export async function listRespostas(pedidoId: string): Promise<PedidoResposta[]> {
  const { data, error } = await supabase
    .from("pedido_respostas")
    .select("*")
    .eq("pedido_id", pedidoId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

/** Aprova um pedido tipo "validacao". Comentário é opcional aqui. */
export async function approvePedido(input: { pedidoId: string; comentario?: string }): Promise<PedidoResposta> {
  const { data, error } = await supabase
    .from("pedido_respostas")
    .insert({ pedido_id: input.pedidoId, texto: input.comentario?.trim() || "Aprovado." })
    .select()
    .single();
  if (error) throw error;

  const { error: statusError } = await supabase
    .from("pedidos")
    .update({ status: "aprovado" })
    .eq("id", input.pedidoId);
  if (statusError) throw statusError;

  const projetoNome = await getProjetoNomePorPedido(input.pedidoId);
  if (projetoNome) {
    notifyPortfolioEvent({ event: "pedido_decidido", projetoNome, detalhe: `Aprovado: ${data.texto}` });
  }

  return data;
}

/** Pede ajustes num pedido tipo "validacao". Comentário é obrigatório. */
export async function requestChangesPedido(input: { pedidoId: string; comentario: string }): Promise<PedidoResposta> {
  if (!input.comentario.trim()) {
    throw new Error("Comentário é obrigatório ao pedir ajustes.");
  }

  const { data, error } = await supabase
    .from("pedido_respostas")
    .insert({ pedido_id: input.pedidoId, texto: input.comentario.trim() })
    .select()
    .single();
  if (error) throw error;

  const { error: statusError } = await supabase
    .from("pedidos")
    .update({ status: "ajuste_solicitado" })
    .eq("id", input.pedidoId);
  if (statusError) throw statusError;

  const projetoNome = await getProjetoNomePorPedido(input.pedidoId);
  if (projetoNome) {
    notifyPortfolioEvent({ event: "pedido_decidido", projetoNome, detalhe: `Ajuste solicitado: ${data.texto}` });
  }

  return data;
}
