import { afterEach, describe, expect, it, vi } from "vitest";
import { chamada, json, mockFetch, vazio } from "@/test/fetchMock";
import { portalApi, PortalApiError } from "./apiClient";

afterEach(() => vi.unstubAllGlobals());

/** A falha de uma chamada, tipada (o teste falha se a chamada der certo). */
const falha = async (chamada: Promise<unknown>) =>
  (await chamada.then(() => { throw new Error("esperava falhar"); }, (e) => e)) as PortalApiError;

describe("portalApi", () => {
  it("get usa o prefixo /api/portal, envia o cookie e não manda o header de CSRF", async () => {
    const fetch = mockFetch(json([{ id: "1" }]));

    const r = await portalApi.get<{ id: string }[]>("/clientes");

    expect(r).toEqual([{ id: "1" }]);
    const c = chamada(fetch);
    expect(c.url).toBe("/api/portal/clientes");
    expect(c.init.credentials).toBe("same-origin");
    expect(c.headers["X-Portal-Admin"]).toBeUndefined();
  });

  it.each(["post", "put", "patch"] as const)("%s manda JSON, cookie e o header de CSRF", async (metodo) => {
    const fetch = mockFetch(json({ ok: true }));

    await portalApi[metodo]("/x", { a: 1 });

    const c = chamada(fetch);
    expect(c.init.method).toBe(metodo.toUpperCase());
    expect(c.init.credentials).toBe("same-origin");
    expect(c.headers["X-Portal-Admin"]).toBe("1");
    expect(c.headers["Content-Type"]).toBe("application/json");
    expect(c.init.body).toBe('{"a":1}');
  });

  it("delete manda o CSRF e aceita 204 sem corpo", async () => {
    const fetch = mockFetch(vazio());

    await expect(portalApi.delete("/x/1")).resolves.toBeUndefined();

    const c = chamada(fetch);
    expect(c.init.method).toBe("DELETE");
    expect(c.headers["X-Portal-Admin"]).toBe("1");
  });

  it.each(["postForm", "putForm"] as const)("%s manda multipart sem Content-Type (o navegador define o boundary)", async (metodo) => {
    const fetch = mockFetch(json({}));
    const form = new FormData();
    form.append("file", new Blob(["x"]), "a.png");

    await portalApi[metodo]("/uploads/convites", form);

    const c = chamada(fetch);
    expect(c.init.method).toBe(metodo === "postForm" ? "POST" : "PUT");
    expect(c.init.body).toBe(form);
    expect(c.headers["Content-Type"]).toBeUndefined();
    expect(c.headers["X-Portal-Admin"]).toBe("1");
  });

  it("nunca manda Authorization (a sessão é cookie, não Bearer)", async () => {
    const fetch = mockFetch(json({}), json({}));

    await portalApi.get("/a");
    await portalApi.post("/a", {});

    expect(chamada(fetch, 0).headers.Authorization).toBeUndefined();
    expect(chamada(fetch, 1).headers.Authorization).toBeUndefined();
  });
});

describe("erros", () => {
  it("usa a mensagem do servidor ({ error }) quando houver", async () => {
    mockFetch(json({ error: "Já existe um colaborador com esse e-mail." }, 409));

    const erro = await falha(portalApi.post("/colaboradores", {}));

    expect(erro).toBeInstanceOf(PortalApiError);
    expect(erro.status).toBe(409);
    expect(erro.message).toBe("Já existe um colaborador com esse e-mail.");
  });

  it.each([
    [401, /expirada/i],
    [403, /permissão/i],
    [404, /não encontrado/i],
    [413, /grande demais/i],
    [429, /muitas tentativas/i],
    [500, /HTTP 500/],
  ])("sem mensagem do servidor, o status %i vira texto em português", async (status, esperado) => {
    mockFetch(new Response("", { status }));

    const erro = await falha(portalApi.get("/x"));

    expect(erro.status).toBe(status);
    expect(erro.message).toMatch(esperado);
  });

  it("corpo que não é JSON não quebra o tratamento do erro", async () => {
    mockFetch(new Response("<html>bad gateway</html>", { status: 502 }));

    const erro = await falha(portalApi.get("/x"));

    expect(erro.status).toBe(502);
    expect(erro.message).toMatch(/HTTP 502/);
  });
});
