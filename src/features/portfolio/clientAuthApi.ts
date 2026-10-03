/**
 * Login do Portal do Cliente por link de e-mail (sem senha). Fluxo: o cliente informa o e-mail →
 * `solicitarLink` → recebe um link para `/portal/entrar?token=...` → a página chama `verificarLink`, que troca o
 * token (uso único, vale 15 min) pelo cookie de sessão. O token só vai no corpo de um POST, nunca fica na URL de
 * uma chamada GET.
 */

import { BASE_URL, CSRF_HEADER, PortalApiError } from "@/features/portal-shared/apiClient";

const AUTH_URL = `${BASE_URL}/auth/cliente`;

/** Pede o link. O servidor responde igual exista o e-mail ou não (não revela quem é cliente). */
export async function solicitarLink(email: string): Promise<{ error: string | null }> {
  try {
    const res = await fetch(`${AUTH_URL}/solicitar`, {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    if (res.status === 429) return { error: "Muitas tentativas. Aguarde alguns minutos e tente de novo." };
    if (!res.ok) return { error: "Não foi possível enviar o link agora. Tente novamente." };
    return { error: null };
  } catch {
    return { error: "Sem conexão. Verifique sua internet e tente novamente." };
  }
}

/** Troca o token do link pela sessão. */
export async function verificarLink(token: string): Promise<{ email: string } | { error: string }> {
  try {
    const res = await fetch(`${AUTH_URL}/verificar`, {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });
    if (res.status === 429) return { error: "Muitas tentativas. Aguarde alguns minutos." };
    if (!res.ok) return { error: "Link inválido ou expirado. Peça um novo acesso." };
    return res.json();
  } catch {
    return { error: "Sem conexão. Verifique sua internet e tente novamente." };
  }
}

/** E-mail da sessão do cliente, ou null se não houver sessão válida. */
export async function getSessaoCliente(): Promise<{ email: string } | null> {
  const res = await fetch(`${AUTH_URL}/me`, { credentials: "same-origin" });
  if (res.status === 401) return null;
  if (!res.ok) throw new PortalApiError(res.status, `Erro inesperado (HTTP ${res.status}).`);
  return res.json();
}

export async function logoutCliente(): Promise<void> {
  await fetch(`${AUTH_URL}/logout`, {
    method: "POST",
    credentials: "same-origin",
    headers: { [CSRF_HEADER]: "1" },
  });
}
