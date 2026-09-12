/**
 * Cliente HTTP compartilhado pras features do portal-backend (Clientes, Projetos,
 * Etapas, Artefatos, Pedidos — tickets #15+). Sessão via cookie httpOnly (não
 * Bearer token, ver ticket #14) — por isso `credentials: "same-origin"` em toda
 * chamada, e o header de CSRF (`X-Portal-Admin`) em toda escrita.
 *
 * Same-origin sempre: em produção o Caddy serve o backend no mesmo domínio do
 * site; em dev, o proxy do Vite (`vite.config.ts`) replica isso.
 */

const BASE_URL = "/api/portal";
const CSRF_HEADER = "X-Portal-Admin";

export class PortalApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

async function handle<T>(res: Response): Promise<T> {
  if (res.ok) {
    if (res.status === 204) return undefined as T;
    return res.json() as Promise<T>;
  }
  throw new PortalApiError(res.status, `HTTP ${res.status} ${res.statusText}`);
}

export const portalApi = {
  async get<T>(path: string): Promise<T> {
    const res = await fetch(`${BASE_URL}${path}`, { credentials: "same-origin" });
    return handle<T>(res);
  },

  async post<T>(path: string, body: unknown): Promise<T> {
    const res = await fetch(`${BASE_URL}${path}`, {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json", [CSRF_HEADER]: "1" },
      body: JSON.stringify(body),
    });
    return handle<T>(res);
  },

  async put<T>(path: string, body: unknown): Promise<T> {
    const res = await fetch(`${BASE_URL}${path}`, {
      method: "PUT",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json", [CSRF_HEADER]: "1" },
      body: JSON.stringify(body),
    });
    return handle<T>(res);
  },

  async delete<T>(path: string): Promise<T> {
    const res = await fetch(`${BASE_URL}${path}`, {
      method: "DELETE",
      credentials: "same-origin",
      headers: { [CSRF_HEADER]: "1" },
    });
    return handle<T>(res);
  },
};
