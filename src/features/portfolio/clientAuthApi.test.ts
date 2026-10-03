import { afterEach, describe, expect, it, vi } from "vitest";
import { chamada, json, mockFetch, vazio } from "@/test/fetchMock";
import { getSessaoCliente, logoutCliente, solicitarLink, verificarLink } from "./clientAuthApi";

afterEach(() => vi.unstubAllGlobals());

describe("login do cliente por link", () => {
  it("solicitarLink faz POST com o e-mail e responde sem erro, exista o e-mail ou não", async () => {
    const fetch = mockFetch(json({ ok: true }));

    expect(await solicitarLink("ana@acme.com")).toEqual({ error: null });

    const c = chamada(fetch);
    expect(c.url).toBe("/api/portal/auth/cliente/solicitar");
    expect(c.init.method).toBe("POST");
    expect(c.init.body).toBe('{"email":"ana@acme.com"}');
  });

  it("solicitarLink traduz limite de tentativas e falhas de rede em mensagens para a tela", async () => {
    mockFetch(new Response("", { status: 429 }), new Response("", { status: 500 }), new Error("offline"));

    expect((await solicitarLink("a@a.com")).error).toMatch(/muitas tentativas/i);
    expect((await solicitarLink("a@a.com")).error).toMatch(/não foi possível/i);
    expect((await solicitarLink("a@a.com")).error).toMatch(/sem conexão/i);
  });

  it("verificarLink manda o token no corpo do POST (nunca na URL)", async () => {
    const fetch = mockFetch(json({ email: "ana@acme.com" }));

    expect(await verificarLink("tok-123")).toEqual({ email: "ana@acme.com" });

    const c = chamada(fetch);
    expect(c.url).toBe("/api/portal/auth/cliente/verificar");
    expect(c.url).not.toContain("tok-123");
    expect(c.init.method).toBe("POST");
    expect(c.init.body).toBe('{"token":"tok-123"}');
    expect(c.init.credentials).toBe("same-origin");
  });

  it("verificarLink com link inválido, expirado ou já usado devolve erro", async () => {
    mockFetch(json({ error: "Link inválido ou expirado." }, 401), new Response("", { status: 429 }), new Error("offline"));

    expect(await verificarLink("x")).toEqual({ error: expect.stringMatching(/inválido ou expirado/i) });
    expect(await verificarLink("x")).toEqual({ error: expect.stringMatching(/muitas tentativas/i) });
    expect(await verificarLink("x")).toEqual({ error: expect.stringMatching(/sem conexão/i) });
  });

  it("getSessaoCliente devolve o e-mail, ou null quando não há sessão (401)", async () => {
    mockFetch(json({ email: "ana@acme.com" }), new Response("", { status: 401 }));

    expect(await getSessaoCliente()).toEqual({ email: "ana@acme.com" });
    expect(await getSessaoCliente()).toBeNull();
  });

  it("getSessaoCliente propaga erro de servidor em vez de fingir que não há sessão", async () => {
    mockFetch(new Response("", { status: 500 }));

    await expect(getSessaoCliente()).rejects.toMatchObject({ status: 500 });
  });

  it("logoutCliente faz POST com o header de CSRF", async () => {
    const fetch = mockFetch(vazio(200));

    await logoutCliente();

    const c = chamada(fetch);
    expect(c.url).toBe("/api/portal/auth/cliente/logout");
    expect(c.init.method).toBe("POST");
    expect(c.headers["X-Portal-Admin"]).toBe("1");
  });
});
