/**
 * Camada de serviço da autenticação do admin (ticket #14) — chama o portal-backend
 * (sessão via cookie httpOnly, não Supabase). Único seam da feature: `useAuth.tsx`
 * nunca chama `fetch` diretamente.
 *
 * Em produção o portal-backend é servido no mesmo domínio do site (path-routed
 * pelo Caddy), então usamos sempre path relativo — em dev, o proxy do Vite
 * (`vite.config.ts`) replica o mesmo comportamento same-origin.
 */

const BASE_URL = "/api/portal/auth";
const CSRF_HEADER = "X-Portal-Admin";

export async function login(password: string): Promise<{ email: string } | { error: string }> {
  const res = await fetch(`${BASE_URL}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify({ password }),
  });

  if (res.status === 401) return { error: "Senha incorreta." };
  if (res.status === 429) return { error: "Muitas tentativas — aguarde alguns minutos." };
  if (!res.ok) return { error: `Erro inesperado (HTTP ${res.status}).` };

  return res.json();
}

export async function logout(): Promise<void> {
  await fetch(`${BASE_URL}/logout`, {
    method: "POST",
    credentials: "same-origin",
    headers: { [CSRF_HEADER]: "1" },
  });
}

/** Retorna o e-mail do admin logado, ou null se não houver sessão válida. */
export async function getCurrentAdmin(): Promise<{ email: string } | null> {
  const res = await fetch(`${BASE_URL}/me`, { credentials: "same-origin" });
  if (!res.ok) return null;
  return res.json();
}

/** Troca a própria senha do admin (ticket #22). */
export async function changePassword(
  currentPassword: string,
  newPassword: string,
): Promise<{ error: string } | null> {
  const res = await fetch(`${BASE_URL}/change-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json", [CSRF_HEADER]: "1" },
    credentials: "same-origin",
    body: JSON.stringify({ currentPassword, newPassword }),
  });

  if (res.ok) return null;
  if (res.status === 400) {
    const body = await res.json();
    return { error: body.error ?? "Senha atual incorreta." };
  }
  return { error: `Erro inesperado (HTTP ${res.status}).` };
}
