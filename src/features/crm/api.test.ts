import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { chamada, json, mockFetch, vazio } from "@/test/fetchMock";
import {
  aguardarResultado, atualizarAgendamento, criarLead, createContato, excluirLead, deleteColaborador, iniciarEnrich,
  iniciarPlayground, listContatos, listLeads, marcarLeadVisto, obterEnrich, obterPlayground,
} from "./api";

afterEach(() => vi.unstubAllGlobals());

describe("features/crm/api: chamadas ao portal-api (nunca direto ao n8n)", () => {
  it("criarLead faz POST /leads com o corpo em camelCase", async () => {
    const fetch = mockFetch(json({ id: "abc" }, 201));

    const r = await criarLead({ nome: "Ana", empresa: null, contato: "a@a.com", canal: "email", desafioTecnico: "CRM" });

    expect(r).toEqual({ id: "abc" });
    const c = chamada(fetch);
    expect(c.url).toBe("/api/portal/leads");
    expect(c.init.method).toBe("POST");
    expect(JSON.parse(c.init.body as string)).toEqual({
      nome: "Ana", empresa: null, contato: "a@a.com", canal: "email", desafioTecnico: "CRM",
    });
  });

  it("enrich e playground criam por POST e consultam o resultado por GET /<id>", async () => {
    const fetch = mockFetch(json({ id: "e1" }), json({ id: "e1", outputAi: null, pronto: false }), json({ id: "p1" }), json({ id: "p1", outputIa: "ok", status: "concluido", pronto: true }));

    await iniciarEnrich({ nomeEmpresa: "Acme", segmento: "Varejo" });
    expect((await obterEnrich("e1")).pronto).toBe(false);
    await iniciarPlayground({ tipoAnalise: "sql", inputTecnico: "select 1" });
    expect((await obterPlayground("p1")).outputIa).toBe("ok");

    expect(chamada(fetch, 0).url).toBe("/api/portal/enrich");
    expect(JSON.parse(chamada(fetch, 0).init.body as string)).toEqual({ nomeEmpresa: "Acme", segmento: "Varejo" });
    expect(chamada(fetch, 1).url).toBe("/api/portal/enrich/e1");
    expect(chamada(fetch, 2).url).toBe("/api/portal/playground");
    expect(chamada(fetch, 3).url).toBe("/api/portal/playground/p1");
  });

  it("nenhuma chamada vai para o n8n", async () => {
    const fetch = mockFetch(json({ id: "1" }), json({ id: "2" }), json({ id: "3" }));

    await criarLead({ nome: "A", empresa: null, contato: "c", canal: null, desafioTecnico: "d" });
    await iniciarEnrich({ nomeEmpresa: "A", segmento: "B" });
    await iniciarPlayground({ tipoAnalise: "a", inputTecnico: "b" });

    for (const [url] of fetch.mock.calls) {
      expect(String(url)).toMatch(/^\/api\/portal\//);
      expect(String(url)).not.toMatch(/n8n|webhook/);
    }
  });

  it("marcarLeadVisto usa PATCH com o header de CSRF", async () => {
    const fetch = mockFetch(json({ id: "1", vistoPeloNelson: true }));

    await marcarLeadVisto("1", true);

    const c = chamada(fetch);
    expect(c.url).toBe("/api/portal/leads/1/visto");
    expect(c.init.method).toBe("PATCH");
    expect(c.headers["X-Portal-Admin"]).toBe("1");
    expect(c.init.body).toBe('{"visto":true}');
  });

  it("listLeads, listContatos(clienteId), createContato e deleteColaborador usam as rotas certas", async () => {
    const fetch = mockFetch(json([]), json([]), json({ id: "c" }, 201), vazio());

    await listLeads();
    await listContatos("cli 1");
    await createContato({ clienteId: "cli", nome: "Zé", telefone: null, email: null });
    await deleteColaborador("col-1");

    expect(chamada(fetch, 0).url).toBe("/api/portal/leads");
    expect(chamada(fetch, 1).url).toBe("/api/portal/contatos-clientes?clienteId=cli%201");
    expect(chamada(fetch, 2).url).toBe("/api/portal/contatos-clientes");
    expect(chamada(fetch, 3).url).toBe("/api/portal/colaboradores/col-1");
    expect(chamada(fetch, 3).init.method).toBe("DELETE");
  });

  it("excluirLead usa DELETE com o header de CSRF", async () => {
    const fetch = mockFetch(vazio());

    await excluirLead("l1");

    const c = chamada(fetch);
    expect(c.url).toBe("/api/portal/leads/l1");
    expect(c.init.method).toBe("DELETE");
    expect(c.headers["X-Portal-Admin"]).toBe("1");
  });

  it("atualizarAgendamento manda só os campos informados", async () => {
    const fetch = mockFetch(json({}));

    await atualizarAgendamento("ag1", { comissaoPaga: true });

    expect(chamada(fetch).url).toBe("/api/portal/agendamentos/ag1");
    expect(chamada(fetch).init.body).toBe('{"comissaoPaga":true}');
  });
});

describe("aguardarResultado (polling)", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  const opcoes = { tentativas: 5, intervaloMs: 1000 };

  it("devolve o texto assim que o resultado fica pronto", async () => {
    const buscar = vi.fn()
      .mockResolvedValueOnce({ pronto: false, texto: null })
      .mockResolvedValueOnce({ pronto: true, texto: "resultado" });

    const promessa = aguardarResultado(buscar, opcoes);
    await vi.advanceTimersByTimeAsync(5000);

    await expect(promessa).resolves.toBe("resultado");
    expect(buscar).toHaveBeenCalledTimes(2);
  });

  it("devolve null quando o tempo esgota (o chamador mostra o timeout amigável)", async () => {
    const buscar = vi.fn().mockResolvedValue({ pronto: false, texto: null });

    const promessa = aguardarResultado(buscar, opcoes);
    await vi.advanceTimersByTimeAsync(10_000);

    await expect(promessa).resolves.toBeNull();
    expect(buscar).toHaveBeenCalledTimes(5);
  });

  it("falha de rede em uma tentativa não derruba a espera", async () => {
    const buscar = vi.fn()
      .mockRejectedValueOnce(new Error("rede"))
      .mockResolvedValueOnce({ pronto: true, texto: "voltou" });

    const promessa = aguardarResultado(buscar, opcoes);
    await vi.advanceTimersByTimeAsync(5000);

    await expect(promessa).resolves.toBe("voltou");
  });

  it("resultado pronto mas vazio não conta como resposta", async () => {
    const buscar = vi.fn().mockResolvedValue({ pronto: true, texto: "" });

    const promessa = aguardarResultado(buscar, { tentativas: 2, intervaloMs: 1000 });
    await vi.advanceTimersByTimeAsync(5000);

    await expect(promessa).resolves.toBeNull();
  });
});
