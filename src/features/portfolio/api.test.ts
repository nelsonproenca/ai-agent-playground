import { afterEach, describe, expect, it, vi } from "vitest";
import { chamada, json, mockFetch } from "@/test/fetchMock";
import {
  approvePedido, createArtefatoLink, createProjeto, getArtefatoUrl, getProjeto, getProjetoDetalhado,
  listProjetosDoCliente, listProjetosPublicos, requestChangesPedido, submitRespostaPedido, uploadArtefatoArquivo,
  type Artefato,
} from "./api";

/**
 * Contrato da camada de serviço do portfólio com o portal-api (rotas, métodos e corpo). Antes esses testes rodavam
 * contra um banco remoto; agora usam `fetch` simulado, sem depender de nenhum serviço no ar.
 */

afterEach(() => vi.unstubAllGlobals());

describe("features/portfolio/api", () => {
  it("createProjeto envia o corpo em snake_case para POST /projetos", async () => {
    const fetch = mockFetch(json({ id: "p1", nome: "Site" }, 201));

    await createProjeto({ cliente_id: "c1", nome: "Site" });

    const c = chamada(fetch);
    expect(c.url).toBe("/api/portal/projetos");
    expect(c.init.method).toBe("POST");
    expect(JSON.parse(c.init.body as string)).toEqual({ cliente_id: "c1", nome: "Site" });
  });

  it("listProjetosPublicos monta a query com status e clienteId", async () => {
    const fetch = mockFetch(json([]), json([]));

    await listProjetosPublicos();
    await listProjetosPublicos("concluido", "c 1");

    expect(chamada(fetch, 0).url).toBe("/api/portal/projetos/public");
    expect(chamada(fetch, 1).url).toBe("/api/portal/projetos/public?status=concluido&clienteId=c+1");
  });

  it("listProjetosDoCliente usa /projetos/mine (o dono vem do cookie, não do front)", async () => {
    const fetch = mockFetch(json([]));

    await listProjetosDoCliente();

    expect(chamada(fetch).url).toBe("/api/portal/projetos/mine");
    expect(chamada(fetch).init.credentials).toBe("same-origin");
  });

  it("getProjeto devolve null em 404 e propaga os outros erros", async () => {
    mockFetch(new Response("", { status: 404 }), new Response("", { status: 500 }));

    expect(await getProjeto("x")).toBeNull();
    await expect(getProjeto("x")).rejects.toMatchObject({ status: 500 });
  });

  it("getProjetoDetalhado junta projeto, etapas e artefatos", async () => {
    const fetch = mockFetch(json({ id: "p1" }), json([{ id: "e1" }]), json([{ id: "a1" }]));

    const r = await getProjetoDetalhado("p1");

    expect(r.projeto).toEqual({ id: "p1" });
    expect(r.etapas).toEqual([{ id: "e1" }]);
    expect(r.artefatos).toEqual([{ id: "a1" }]);
    expect(fetch.mock.calls.map((c) => c[0]).sort()).toEqual([
      "/api/portal/artefatos?projetoId=p1",
      "/api/portal/etapas?projetoId=p1",
      "/api/portal/projetos/p1",
    ]);
  });

  it("artefato de link devolve a própria URL; de arquivo pede a URL assinada e completa o prefixo", async () => {
    const fetch = mockFetch(json({ url: "/artefatos/a2/download?token=abc" }));

    const link = await getArtefatoUrl({ tipo: "link", url: "https://exemplo.com" } as Artefato);
    expect(link).toBe("https://exemplo.com");
    expect(fetch).not.toHaveBeenCalled();

    const arquivo = await getArtefatoUrl({ id: "a2", tipo: "arquivo", url: "" } as Artefato);
    expect(arquivo).toBe("/api/portal/artefatos/a2/download?token=abc");
    expect(chamada(fetch).url).toBe("/api/portal/artefatos/a2/signed-url");
  });

  it("uploadArtefatoArquivo e submitRespostaPedido mandam multipart", async () => {
    const fetch = mockFetch(json({ id: "a" }, 201), json({ id: "r" }, 201));
    const file = new File(["x"], "doc.pdf", { type: "application/pdf" });

    await uploadArtefatoArquivo({ projetoId: "p1", etapaId: "e1", nome: "Doc", file });
    await submitRespostaPedido({ pedidoId: "pd1", projetoId: "p1", texto: "ok", file });

    const upload = chamada(fetch, 0);
    expect(upload.url).toBe("/api/portal/artefatos/upload");
    const form = upload.init.body as FormData;
    expect(form.get("projetoId")).toBe("p1");
    expect(form.get("etapaId")).toBe("e1");
    expect(form.get("nome")).toBe("Doc");
    expect(form.get("file")).toBeInstanceOf(File);
    expect(chamada(fetch, 1).url).toBe("/api/portal/pedido-respostas");
  });

  it("createArtefatoLink, approvePedido e requestChangesPedido", async () => {
    const fetch = mockFetch(json({}), json({}), json({}));

    await createArtefatoLink({ projetoId: "p1", nome: "Figma", linkUrl: "https://f.co" });
    await approvePedido({ pedidoId: "pd1" });
    await requestChangesPedido({ pedidoId: "pd1", comentario: "  ajustar o botão  " });

    expect(chamada(fetch, 0).url).toBe("/api/portal/artefatos/link");
    expect(chamada(fetch, 1).url).toBe("/api/portal/pedidos/pd1/aprovar");
    expect(chamada(fetch, 1).init.body).toBe('{"comentario":null}');
    expect(chamada(fetch, 2).url).toBe("/api/portal/pedidos/pd1/ajustar");
    expect(chamada(fetch, 2).init.body).toBe('{"comentario":"ajustar o botão"}');
  });

  it("requestChangesPedido recusa comentário vazio sem chamar a API", async () => {
    const fetch = mockFetch();

    await expect(requestChangesPedido({ pedidoId: "pd1", comentario: "   " })).rejects.toThrow(/obrigatório/i);
    expect(fetch).not.toHaveBeenCalled();
  });
});
