import { supabase } from "@/integrations/supabase/client";
import { ApiError, type ApiProblem } from "@/watchtower/types/api";

const BASE_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? "";

async function getAuthHeader(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (res.ok) {
    if (res.status === 204) return undefined as T;
    return res.json() as Promise<T>;
  }

  let problem: ApiProblem | undefined;
  try {
    problem = (await res.json()) as ApiProblem;
  } catch {
    // corpo não é JSON
  }

  const detail =
    problem?.detail ?? problem?.title ?? `HTTP ${res.status} ${res.statusText}`;

  throw new ApiError(res.status, detail, problem);
}

// ─── Métodos públicos ─────────────────────────────────────────────────────────

async function get<T>(path: string, auth = true): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(auth ? await getAuthHeader() : {}),
  };
  const res = await fetch(`${BASE_URL}${path}`, { headers });
  return handleResponse<T>(res);
}

async function post<T>(
  path: string,
  body: unknown,
  auth = true,
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(auth ? await getAuthHeader() : {}),
  };
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
  return handleResponse<T>(res);
}

async function postForm<T>(path: string, formData: FormData): Promise<T> {
  // Não define Content-Type — o browser seta multipart/form-data + boundary
  const authHeader = await getAuthHeader();
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: { ...authHeader },
    body: formData,
  });
  return handleResponse<T>(res);
}

async function put<T>(path: string, body: unknown): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(await getAuthHeader()),
  };
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "PUT",
    headers,
    body: JSON.stringify(body),
  });
  return handleResponse<T>(res);
}

async function del<T>(path: string): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(await getAuthHeader()),
  };
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "DELETE",
    headers,
  });
  return handleResponse<T>(res);
}

export const apiClient = { get, post, postForm, put, delete: del };
