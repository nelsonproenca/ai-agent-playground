import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { supabase as testDb } from "@/integrations/supabase/client";
import {
  approvePedido, createArtefatoLink, createEtapa, createPedido, createProjeto, getArtefatoUrl,
  getProjeto, getProjetoDetalhado, listArtefatos, listEtapas, listPedidos, listProjetos,
  listProjetosDoCliente, listProjetosPublicos, listRespostas, requestChangesPedido,
  submitRespostaPedido, updateEtapa, updateEtapaStatus, uploadArtefatoArquivo,
} from "./api";

/**
 * Testes de integração da camada de serviço (seam único da feature Portfólio,
 * ver issue #1). Não há Supabase local disponível neste ambiente (sem
 * Docker), então rodam contra o mesmo projeto Supabase remoto que o app usa
 * (`VITE_SUPABASE_URL`/`VITE_SUPABASE_PUBLISHABLE_KEY` do `.env`) — decisão
 * consciente, não o ideal.
 *
 * `clientes` não tem policy de DELETE (decisão deliberada — não abrir
 * exclusão ampla de clientes reais via anon key), então os testes NÃO criam
 * um cliente novo a cada run: reaproveitam (find-or-create) um fixture fixo
 * por e-mail. Só `projetos` (que tem DELETE) é criado e limpo a cada run.
 */

const FIXTURE_EMAIL_A = "portfolio-tests-fixture-a@example.com";

async function findOrCreateClienteFixture(email: string, nome: string): Promise<string> {
  const existing = await testDb.from("clientes").select("id").eq("email", email).maybeSingle();
  if (existing.data) return existing.data.id;

  const { data, error } = await testDb
    .from("clientes")
    .insert({ nome, email })
    .select()
    .single();
  if (error) throw error;
  return data.id;
}

describe("features/portfolio/api", () => {
  let clienteId: string;
  const criados: string[] = [];

  beforeAll(async () => {
    clienteId = await findOrCreateClienteFixture(FIXTURE_EMAIL_A, "Cliente de Teste (fixture)");
  });

  afterAll(async () => {
    if (criados.length) await testDb.from("projetos").delete().in("id", criados);
  });

  it("createProjeto cria um projeto vinculado ao cliente com os defaults corretos", async () => {
    const projeto = await createProjeto({ cliente_id: clienteId, nome: "Site institucional" });
    criados.push(projeto.id);

    expect(projeto.nome).toBe("Site institucional");
    expect(projeto.cliente_id).toBe(clienteId);
    expect(projeto.status_publico).toBe("em_andamento");
    expect(projeto.visibilidade).toBe("privado");
  });

  it("createProjeto respeita os campos explícitos (categoria, status, visibilidade)", async () => {
    const projeto = await createProjeto({
      cliente_id: clienteId,
      nome: "App mobile",
      categoria: "Mobile",
      status_publico: "concluido",
      visibilidade: "publico",
      link_url: "https://example.com",
    });
    criados.push(projeto.id);

    expect(projeto.categoria).toBe("Mobile");
    expect(projeto.status_publico).toBe("concluido");
    expect(projeto.visibilidade).toBe("publico");
    expect(projeto.link_url).toBe("https://example.com");
  });

  it("listProjetos retorna os projetos existentes ordenados por mais recente", async () => {
    const a = await createProjeto({ cliente_id: clienteId, nome: "Projeto A" });
    const b = await createProjeto({ cliente_id: clienteId, nome: "Projeto B" });
    criados.push(a.id, b.id);

    const lista = await listProjetos();
    const posA = lista.findIndex((p) => p.id === a.id);
    const posB = lista.findIndex((p) => p.id === b.id);

    expect(posA).toBeGreaterThanOrEqual(0);
    expect(posB).toBeGreaterThanOrEqual(0);
    expect(posB).toBeLessThan(posA); // B foi criado depois de A -> aparece antes
  });

  it("getProjeto retorna o projeto pelo id, ou null se não existir", async () => {
    const criado = await createProjeto({ cliente_id: clienteId, nome: "Projeto C" });
    criados.push(criado.id);

    const encontrado = await getProjeto(criado.id);
    expect(encontrado?.id).toBe(criado.id);

    const inexistente = await getProjeto("00000000-0000-0000-0000-000000000000");
    expect(inexistente).toBeNull();
  });

  describe("etapas", () => {
    let projetoId: string;

    beforeAll(async () => {
      const projeto = await createProjeto({ cliente_id: clienteId, nome: "Projeto com etapas" });
      criados.push(projeto.id); // cascade delete cuida das etapas
      projetoId = projeto.id;
    });

    it("createEtapa cria uma etapa vinculada ao projeto com status pendente por padrão", async () => {
      const etapa = await createEtapa({ projeto_id: projetoId, nome: "Descoberta", ordem: 0 });
      expect(etapa.nome).toBe("Descoberta");
      expect(etapa.projeto_id).toBe(projetoId);
      expect(etapa.status).toBe("pendente");
    });

    it("listEtapas retorna as etapas do projeto ordenadas por ordem", async () => {
      const a = await createEtapa({ projeto_id: projetoId, nome: "Etapa A", ordem: 10 });
      const b = await createEtapa({ projeto_id: projetoId, nome: "Etapa B", ordem: 5 });

      const lista = await listEtapas(projetoId);
      const posA = lista.findIndex((e) => e.id === a.id);
      const posB = lista.findIndex((e) => e.id === b.id);

      expect(posB).toBeLessThan(posA); // ordem 5 vem antes de ordem 10
    });

    it("updateEtapaStatus atualiza o status da etapa", async () => {
      const etapa = await createEtapa({ projeto_id: projetoId, nome: "Etapa C", ordem: 20 });
      const atualizada = await updateEtapaStatus(etapa.id, "concluida");
      expect(atualizada.status).toBe("concluida");
    });

    it("updateEtapa permite reordenar (trocar o campo ordem)", async () => {
      const etapa = await createEtapa({ projeto_id: projetoId, nome: "Etapa D", ordem: 30 });
      const atualizada = await updateEtapa(etapa.id, { ordem: 1 });
      expect(atualizada.ordem).toBe(1);
    });
  });

  describe("artefatos", () => {
    let projetoId: string;
    const storagePaths: string[] = [];

    beforeAll(async () => {
      const projeto = await createProjeto({ cliente_id: clienteId, nome: "Projeto com artefatos" });
      criados.push(projeto.id);
      projetoId = projeto.id;
    });

    afterAll(async () => {
      if (storagePaths.length) {
        await testDb.storage.from("portfolio-privado").remove(storagePaths);
      }
    });

    it("uploadArtefatoArquivo sobe o arquivo pro bucket privado e cria o registro", async () => {
      const file = new File(["conteudo de teste"], "documento.txt", { type: "text/plain" });
      const artefato = await uploadArtefatoArquivo({ projetoId, nome: "Documento", file });
      storagePaths.push(artefato.url);

      expect(artefato.tipo).toBe("arquivo");
      expect(artefato.projeto_id).toBe(projetoId);
      expect(artefato.url).toContain(projetoId);
    });

    it("createArtefatoLink cria um artefato do tipo link sem subir arquivo", async () => {
      const artefato = await createArtefatoLink({
        projetoId,
        nome: "Protótipo Figma",
        linkUrl: "https://figma.com/exemplo",
      });

      expect(artefato.tipo).toBe("link");
      expect(artefato.url).toBe("https://figma.com/exemplo");
    });

    it("listArtefatos retorna os artefatos do projeto", async () => {
      const lista = await listArtefatos(projetoId);
      expect(lista.length).toBeGreaterThanOrEqual(2);
    });

    it("getArtefatoUrl retorna a própria URL para link, e uma signed URL para arquivo", async () => {
      const file = new File(["outro conteudo"], "planilha.csv", { type: "text/csv" });
      const arquivo = await uploadArtefatoArquivo({ projetoId, nome: "Planilha", file });
      storagePaths.push(arquivo.url);

      const urlArquivo = await getArtefatoUrl(arquivo);
      expect(urlArquivo).toContain("token="); // signed URL do Supabase Storage

      const link = await createArtefatoLink({ projetoId, nome: "Site", linkUrl: "https://example.com" });
      const urlLink = await getArtefatoUrl(link);
      expect(urlLink).toBe("https://example.com");
    });

    it("o bucket portfolio-privado não é público (objeto não acessível por URL pública direta)", async () => {
      const { data } = testDb.storage.from("portfolio-privado").getPublicUrl(storagePaths[0]);
      const response = await fetch(data.publicUrl);
      expect(response.status).not.toBe(200);
    });
  });

  // "portal do cliente" (listProjetosDoCliente) removido daqui no ticket #19: a
  // função deixou de aceitar um cliente_id arbitrário (era exatamente o padrão
  // inseguro que o ticket eliminou) — agora resolve o dono via o e-mail do JWT
  // do Supabase, validado no portal-backend. Testar isso de verdade exige um
  // JWT real de dois usuários distintos (não dá pra simular só com a anon key),
  // o que é um investimento de infra de teste à parte. A garantia em si
  // (cliente A nunca vê projeto de B) está coberta por verificação manual do
  // portal-backend (ClientAccessService), conforme decisão de testes da spec.

  describe("pedidos", () => {
    let projetoId: string;
    let etapaId: string;

    beforeAll(async () => {
      const projeto = await createProjeto({ cliente_id: clienteId, nome: "Projeto com pedidos" });
      criados.push(projeto.id);
      projetoId = projeto.id;

      const etapa = await createEtapa({ projeto_id: projetoId, nome: "Design", ordem: 0 });
      etapaId = etapa.id;
    });

    it("createPedido cria um pedido do tipo pergunta com status pendente por padrão", async () => {
      const pedido = await createPedido({
        projeto_id: projetoId,
        etapa_id: etapaId,
        tipo: "pergunta",
        titulo: "Qual paleta de cores você prefere?",
      });

      expect(pedido.tipo).toBe("pergunta");
      expect(pedido.etapa_id).toBe(etapaId);
      expect(pedido.status).toBe("pendente");
    });

    it("createPedido cria um pedido do tipo validação de entrega", async () => {
      const pedido = await createPedido({
        projeto_id: projetoId,
        tipo: "validacao",
        titulo: "Aprova o layout da home?",
      });

      expect(pedido.tipo).toBe("validacao");
      expect(pedido.status).toBe("pendente");
    });

    it("listPedidos retorna os pedidos do projeto", async () => {
      const lista = await listPedidos(projetoId);
      expect(lista.length).toBeGreaterThanOrEqual(2);
      expect(lista.some((p) => p.tipo === "pergunta")).toBe(true);
      expect(lista.some((p) => p.tipo === "validacao")).toBe(true);
    });
  });

  describe("submitRespostaPedido", () => {
    let projetoId: string;
    const storagePaths: string[] = [];

    beforeAll(async () => {
      const projeto = await createProjeto({ cliente_id: clienteId, nome: "Projeto com respostas" });
      criados.push(projeto.id);
      projetoId = projeto.id;
    });

    afterAll(async () => {
      if (storagePaths.length) await testDb.storage.from("portfolio-privado").remove(storagePaths);
    });

    it("responde um pedido sem arquivo e muda o status pra 'respondido'", async () => {
      const pedido = await createPedido({ projeto_id: projetoId, tipo: "pergunta", titulo: "Pergunta 1" });
      const resposta = await submitRespostaPedido({ pedidoId: pedido.id, projetoId, texto: "Minha resposta" });

      expect(resposta.texto).toBe("Minha resposta");
      expect(resposta.arquivo_url).toBeNull();

      const pedidos = await listPedidos(projetoId);
      const atualizado = pedidos.find((p) => p.id === pedido.id);
      expect(atualizado?.status).toBe("respondido");
    });

    it("responde um pedido com arquivo válido (PDF)", async () => {
      const pedido = await createPedido({ projeto_id: projetoId, tipo: "pergunta", titulo: "Pergunta 2" });
      const file = new File(["conteudo"], "anexo.pdf", { type: "application/pdf" });

      const resposta = await submitRespostaPedido({ pedidoId: pedido.id, projetoId, texto: "Segue anexo", file });
      expect(resposta.arquivo_url).toContain(projetoId);
      if (resposta.arquivo_url) storagePaths.push(resposta.arquivo_url);
    });

    it("rejeita arquivo maior que 10MB", async () => {
      const pedido = await createPedido({ projeto_id: projetoId, tipo: "pergunta", titulo: "Pergunta 3" });
      const arquivoGrande = new File([new Uint8Array(11 * 1024 * 1024)], "grande.pdf", { type: "application/pdf" });

      await expect(
        submitRespostaPedido({ pedidoId: pedido.id, projetoId, texto: "Anexo grande", file: arquivoGrande }),
      ).rejects.toThrow(/10MB/);
    });

    it("rejeita tipo de arquivo não permitido", async () => {
      const pedido = await createPedido({ projeto_id: projetoId, tipo: "pergunta", titulo: "Pergunta 4" });
      const arquivoInvalido = new File(["conteudo"], "script.exe", { type: "application/x-msdownload" });

      await expect(
        submitRespostaPedido({ pedidoId: pedido.id, projetoId, texto: "Anexo inválido", file: arquivoInvalido }),
      ).rejects.toThrow(/não permitido/);
    });
  });

  describe("approvePedido / requestChangesPedido", () => {
    let projetoId: string;

    beforeAll(async () => {
      const projeto = await createProjeto({ cliente_id: clienteId, nome: "Projeto com validações" });
      criados.push(projeto.id);
      projetoId = projeto.id;
    });

    it("approvePedido aprova o pedido e registra o histórico", async () => {
      const pedido = await createPedido({ projeto_id: projetoId, tipo: "validacao", titulo: "Aprova o layout?" });
      const resposta = await approvePedido({ pedidoId: pedido.id, comentario: "Ficou ótimo!" });

      expect(resposta.texto).toBe("Ficou ótimo!");

      const pedidos = await listPedidos(projetoId);
      expect(pedidos.find((p) => p.id === pedido.id)?.status).toBe("aprovado");

      const historico = await listRespostas(pedido.id);
      expect(historico).toHaveLength(1);
    });

    it("requestChangesPedido pede ajuste com comentário e registra o histórico", async () => {
      const pedido = await createPedido({ projeto_id: projetoId, tipo: "validacao", titulo: "Aprova o texto?" });
      await requestChangesPedido({ pedidoId: pedido.id, comentario: "Trocar o título da seção 2" });

      const pedidos = await listPedidos(projetoId);
      expect(pedidos.find((p) => p.id === pedido.id)?.status).toBe("ajuste_solicitado");

      const historico = await listRespostas(pedido.id);
      expect(historico[0].texto).toBe("Trocar o título da seção 2");
    });

    it("requestChangesPedido exige comentário — rejeita string vazia", async () => {
      const pedido = await createPedido({ projeto_id: projetoId, tipo: "validacao", titulo: "Aprova o header?" });

      await expect(
        requestChangesPedido({ pedidoId: pedido.id, comentario: "   " }),
      ).rejects.toThrow(/obrigatório/);
    });
  });

  /**
   * Notificações por e-mail (ticket #21): desde a migração pro portal-backend,
   * quem dispara os 4 eventos é o próprio backend (`PortfolioNotificationService`,
   * chamado direto de `ArtefatoService`/`PedidoService`) — não existe mais
   * nenhum código de notificação no frontend (`notifyPortfolioEvent` foi
   * removido junto com a edge function `portfolio-notify-email`, que não é
   * mais chamada por nada). A falha de e-mail é engolida no backend (nunca
   * propaga pra quem chamou), então os testes acima já provam isso
   * indiretamente: toda operação retorna normalmente mesmo com um cliente de
   * teste (`@example.com`) cujo e-mail o Resend rejeita.
   */

  describe("lista pública de portfólio", () => {
    let publicoId: string;
    let privadoId: string;

    beforeAll(async () => {
      const publico = await createProjeto({
        cliente_id: clienteId,
        nome: "Projeto Público de Teste",
        visibilidade: "publico",
        status_publico: "concluido",
      });
      const privado = await createProjeto({
        cliente_id: clienteId,
        nome: "Projeto Privado de Teste",
        visibilidade: "privado",
        status_publico: "concluido",
      });
      criados.push(publico.id, privado.id);
      publicoId = publico.id;
      privadoId = privado.id;
    });

    it("listProjetosPublicos retorna projetos públicos", async () => {
      const lista = await listProjetosPublicos();
      expect(lista.some((p) => p.id === publicoId)).toBe(true);
    });

    it("listProjetosPublicos nunca retorna projetos privados", async () => {
      const lista = await listProjetosPublicos();
      expect(lista.some((p) => p.id === privadoId)).toBe(false);
    });

    it("listProjetosPublicos filtra por status quando informado", async () => {
      const lista = await listProjetosPublicos("concluido");
      expect(lista.every((p) => p.status_publico === "concluido")).toBe(true);

      const vazio = await listProjetosPublicos("em_andamento");
      expect(vazio.some((p) => p.id === publicoId)).toBe(false);
    });
  });

  describe("getProjetoDetalhado", () => {
    it("agrega projeto, etapas e artefatos de um mesmo projeto", async () => {
      const projeto = await createProjeto({ cliente_id: clienteId, nome: "Projeto detalhado" });
      criados.push(projeto.id);
      await createEtapa({ projeto_id: projeto.id, nome: "Etapa única", ordem: 0 });
      await createArtefatoLink({ projetoId: projeto.id, nome: "Link único", linkUrl: "https://example.com" });

      const detalhe = await getProjetoDetalhado(projeto.id);

      expect(detalhe.projeto?.id).toBe(projeto.id);
      expect(detalhe.etapas).toHaveLength(1);
      expect(detalhe.artefatos).toHaveLength(1);
    });

    it("retorna projeto null e listas vazias para um id inexistente", async () => {
      const detalhe = await getProjetoDetalhado("00000000-0000-0000-0000-000000000000");
      expect(detalhe.projeto).toBeNull();
      expect(detalhe.etapas).toEqual([]);
      expect(detalhe.artefatos).toEqual([]);
    });
  });

  /**
   * Isolamento por RLS (issue #8): `listEtapas`/`listArtefatos`/o bucket
   * `portfolio-privado` agora têm policy escopada por cliente pro role
   * `authenticated`. Validado MANUALMENTE via SQL simulando
   * `set local role authenticated; set local request.jwt.claims = ...` —
   * não dá pra automatizar aqui sem embutir a service role key no teste ou
   * completar um fluxo real de magic link por e-mail. A prova manual:
   * consultando as etapas de dois projetos de clientes diferentes com a
   * sessão do cliente A simulada, só a etapa do cliente A veio de volta.
   */
});
