import { afterEach, describe, expect, it, vi } from "vitest";
import { chamada, json, mockFetch, vazio } from "@/test/fetchMock";
import { listConvites, nomeDoConvite, removerUpload, salvarConvite, uploadImagem } from "./api";

afterEach(() => vi.unstubAllGlobals());

describe("nomeDoConvite", () => {
  it.each([
    ["Nelson Proença", "convite-nelson-proenca.png"],
    ["  Ana   Maria  ", "convite-ana-maria.png"],
    ["João D'Ávila", "convite-joao-d-avila.png"],
    ["José/../etc", "convite-jose-etc.png"],
    ["!!!", "convite-sem-nome.png"],
  ])("%s → %s", (entrada, esperado) => {
    expect(nomeDoConvite(entrada)).toBe(esperado);
  });

  it("só gera nomes que o servidor aceita (letras, números e hífen, terminando em .png)", () => {
    for (const nome of ["Zé Ninguém", "A_B C", "x".repeat(40), "Çãõ ÉÍ"]) {
      expect(nomeDoConvite(nome)).toMatch(/^convite-[a-z0-9-]+\.png$/);
    }
  });

  it("é o nome que o importador do backend preserva para o convite já existente", () => {
    expect(nomeDoConvite("Nelson Proença")).toBe("convite-nelson-proenca.png");
  });
});

describe("features/uploads/api", () => {
  it("uploadImagem envia multipart com o campo file para a pasta", async () => {
    const fetch = mockFetch(json({ pasta: "colaboradores", arquivo: "a.png", path: "colaboradores/a.png", url: "/api/portal/uploads/colaboradores/a.png" }, 201));
    const arquivo = new File(["x"], "foto.png", { type: "image/png" });

    const r = await uploadImagem("colaboradores", arquivo);

    expect(r.url).toBe("/api/portal/uploads/colaboradores/a.png");
    const c = chamada(fetch);
    expect(c.url).toBe("/api/portal/uploads/colaboradores");
    expect(c.init.method).toBe("POST");
    expect((c.init.body as FormData).get("file")).toBeInstanceOf(File);
    expect(c.headers["X-Portal-Admin"]).toBe("1");
  });

  it("salvarConvite regrava pelo nome fixo com PUT", async () => {
    const fetch = mockFetch(json({ url: "/api/portal/uploads/convites/convite-ana.png" }));

    await salvarConvite("convite-ana.png", new Blob(["x"], { type: "image/png" }));

    const c = chamada(fetch);
    expect(c.url).toBe("/api/portal/uploads/convites/convite-ana.png");
    expect(c.init.method).toBe("PUT");
    expect(((c.init.body as FormData).get("file") as File).name).toBe("convite-ana.png");
  });

  it("removerUpload e listConvites", async () => {
    const fetch = mockFetch(vazio(), json([]));

    await removerUpload("convites", "convite-ana.png");
    await listConvites();

    expect(chamada(fetch, 0).url).toBe("/api/portal/uploads/convites/convite-ana.png");
    expect(chamada(fetch, 0).init.method).toBe("DELETE");
    expect(chamada(fetch, 1).url).toBe("/api/portal/convites");
  });
});
