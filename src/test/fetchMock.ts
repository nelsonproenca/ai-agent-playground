import { vi } from "vitest";

/** Respostas simuladas do `fetch`, na ordem em que as chamadas acontecem. */
export function mockFetch(...respostas: Array<Response | (() => Response) | Error>) {
  const fn = vi.fn();
  respostas.forEach((r) => {
    if (r instanceof Error) fn.mockRejectedValueOnce(r);
    else fn.mockResolvedValueOnce(typeof r === "function" ? r() : r);
  });
  vi.stubGlobal("fetch", fn);
  return fn;
}

export const json = (corpo: unknown, status = 200) =>
  new Response(JSON.stringify(corpo), { status, headers: { "Content-Type": "application/json" } });

export const vazio = (status = 204) => new Response(null, { status });

/** Primeira chamada do fetch: `[url, init]`. */
export function chamada(fn: ReturnType<typeof vi.fn>, indice = 0) {
  const [url, init] = fn.mock.calls[indice] as [string, RequestInit | undefined];
  return { url, init: init ?? {}, headers: (init?.headers ?? {}) as Record<string, string> };
}

/**
 * Responde por rota ("MÉTODO /caminho"), independentemente da ordem das chamadas. Rota não prevista vira 404
 * e o teste falha se alguma chamada inesperada acontecer (veja `inesperadas`).
 */
export function mockFetchRotas(rotas: Record<string, () => Response>) {
  const inesperadas: string[] = [];
  const fn = vi.fn(async (url: string, init?: RequestInit) => {
    const chave = `${init?.method ?? "GET"} ${url}`;
    const resposta = rotas[chave];
    if (!resposta) {
      inesperadas.push(chave);
      return new Response("", { status: 404 });
    }
    return resposta();
  });
  vi.stubGlobal("fetch", fn);
  return Object.assign(fn, { inesperadas });
}
