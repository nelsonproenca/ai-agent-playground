/**
 * Cliente HTTP compartilhado pelas features do portal-api (Clientes, Projetos, Etapas, Artefatos, Pedidos,
 * CRM, uploads). A sessão é sempre cookie httpOnly (admin: `portal_admin`; cliente do portal: `portal_cliente`),
 * por isso `credentials: "same-origin"` em toda chamada e o header de CSRF (`X-Portal-Admin`) em toda escrita
 * (vale para os dois perfis).
 *
 * Same-origin sempre: em produção o Caddy serve o backend no mesmo domínio do site; em dev, o proxy do Vite
 * (`vite.config.ts`) replica isso.
 */

export const BASE_URL = "/api/portal";
export const CSRF_HEADER = "X-Portal-Admin";

export class PortalApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

const STATUS_MESSAGES: Record<number, string> = {
  401: "Sessão expirada ou acesso negado. Entre novamente.",
  403: "Você não tem permissão para fazer isso.",
  404: "Não encontrado.",
  413: "O conteúdo enviado é grande demais.",
  429: "Muitas tentativas. Aguarde um pouco e tente de novo.",
};

/** Mensagem para mostrar ao usuário: a do servidor (`{ error }`, já em pt-BR), ou uma genérica pelo status. */
async function errorMessage(res: Response): Promise<string> {
  try {
    const body = await res.clone().json();
    if (body && typeof body.error === "string") return body.error;
  } catch {
    // corpo vazio ou não-JSON: cai na mensagem pelo status
  }
  return STATUS_MESSAGES[res.status] ?? `Erro inesperado (HTTP ${res.status}).`;
}

async function handle<T>(res: Response): Promise<T> {
  if (res.ok) {
    if (res.status === 204) return undefined as T;
    return res.json() as Promise<T>;
  }
  throw new PortalApiError(res.status, await errorMessage(res));
}

const jsonWrite = (method: string, body: unknown): RequestInit => ({
  method,
  credentials: "same-origin",
  headers: { "Content-Type": "application/json", [CSRF_HEADER]: "1" },
  body: JSON.stringify(body),
});

export const portalApi = {
  async get<T>(path: string): Promise<T> {
    return handle<T>(await fetch(`${BASE_URL}${path}`, { credentials: "same-origin" }));
  },

  async post<T>(path: string, body: unknown): Promise<T> {
    return handle<T>(await fetch(`${BASE_URL}${path}`, jsonWrite("POST", body)));
  },

  async put<T>(path: string, body: unknown): Promise<T> {
    return handle<T>(await fetch(`${BASE_URL}${path}`, jsonWrite("PUT", body)));
  },

  async patch<T>(path: string, body: unknown): Promise<T> {
    return handle<T>(await fetch(`${BASE_URL}${path}`, jsonWrite("PATCH", body)));
  },

  async delete<T>(path: string): Promise<T> {
    return handle<T>(
      await fetch(`${BASE_URL}${path}`, {
        method: "DELETE",
        credentials: "same-origin",
        headers: { [CSRF_HEADER]: "1" },
      }),
    );
  },

  async postForm<T>(path: string, formData: FormData): Promise<T> {
    // Sem Content-Type — o browser seta multipart/form-data + boundary sozinho.
    return handle<T>(
      await fetch(`${BASE_URL}${path}`, {
        method: "POST",
        credentials: "same-origin",
        headers: { [CSRF_HEADER]: "1" },
        body: formData,
      }),
    );
  },

  async putForm<T>(path: string, formData: FormData): Promise<T> {
    return handle<T>(
      await fetch(`${BASE_URL}${path}`, {
        method: "PUT",
        credentials: "same-origin",
        headers: { [CSRF_HEADER]: "1" },
        body: formData,
      }),
    );
  },
};

/**
 * Endpoints do Portal do Cliente que só fazem sentido para o cliente autenticado (ex.: "meus projetos").
 * Hoje usa o mesmo transporte (cookie) do `portalApi`; o nome fica para deixar a intenção clara nos chamadores.
 */
export const portalClientApi = {
  get: portalApi.get,
};
