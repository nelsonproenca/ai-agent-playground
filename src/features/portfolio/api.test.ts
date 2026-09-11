import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { supabase as testDb } from "@/integrations/supabase/client";
import { createProjeto, getProjeto, listProjetos } from "./api";

/**
 * Testes de integração da camada de serviço (seam único da feature Portfólio,
 * ver issue #1). Não há Supabase local disponível neste ambiente (sem
 * Docker), então rodam contra o mesmo projeto Supabase remoto que o app usa
 * (`VITE_SUPABASE_URL`/`VITE_SUPABASE_PUBLISHABLE_KEY` do `.env`) — decisão
 * consciente, não o ideal. Todo dado criado aqui (cliente + projetos de
 * teste) é removido no `afterAll`; nunca reaproveite dados existentes do
 * banco nestes testes.
 */

describe("features/portfolio/api", () => {
  let clienteId: string;
  const criados: string[] = [];

  beforeAll(async () => {
    const { data, error } = await testDb
      .from("clientes")
      .insert({ nome: "Cliente de Teste", email: `teste-${Date.now()}@example.com` })
      .select()
      .single();
    if (error) throw error;
    clienteId = data.id;
  });

  afterAll(async () => {
    if (criados.length) await testDb.from("projetos").delete().in("id", criados);
    await testDb.from("clientes").delete().eq("id", clienteId);
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
});
