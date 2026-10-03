import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { json, mockFetchRotas } from "@/test/fetchMock";
import { ClientAuthProvider } from "@/features/portfolio/useClientAuth";
import PortalEntrarPage from "./PortalEntrarPage";

afterEach(() => vi.unstubAllGlobals());

const Local = () => <p data-testid="local">{useLocation().pathname}</p>;

function renderizar(url: string) {
  return render(
    <MemoryRouter initialEntries={[url]}>
      <Routes>
        <Route path="/portal/entrar" element={<ClientAuthProvider><PortalEntrarPage /></ClientAuthProvider>} />
        <Route path="/portal" element={<Local />} />
      </Routes>
    </MemoryRouter>,
  );
}

const VERIFICAR = "POST /api/portal/auth/cliente/verificar";
const ME = "GET /api/portal/auth/cliente/me";
const CLIENTE = "GET /api/portal/clientes/me";

const quantas = (fetch: ReturnType<typeof mockFetchRotas>, rota: string) =>
  fetch.mock.calls.filter(([u, i]) => `${(i as RequestInit | undefined)?.method ?? "GET"} ${u}` === rota).length;

describe("PortalEntrarPage (destino do link do e-mail)", () => {
  it("troca o token pela sessão uma única vez e leva o cliente ao portal", async () => {
    const fetch = mockFetchRotas({
      [VERIFICAR]: () => json({ email: "ana@acme.com" }),
      [ME]: () => json({ email: "ana@acme.com" }),
      [CLIENTE]: () => json({ id: "c1", nome: "Ana" }),
    });

    renderizar("/portal/entrar?token=abc-123");

    await waitFor(() => expect(screen.getByTestId("local")).toHaveTextContent("/portal"));
    expect(quantas(fetch, VERIFICAR)).toBe(1);
    const corpo = (fetch.mock.calls.find(([u]) => u === "/api/portal/auth/cliente/verificar")![1] as RequestInit).body;
    expect(corpo).toBe('{"token":"abc-123"}');
    expect(fetch.inesperadas).toEqual([]);
  });

  it("sem token na URL mostra o erro e não chama a API de verificação", async () => {
    const fetch = mockFetchRotas({ [ME]: () => new Response("", { status: 401 }) });

    renderizar("/portal/entrar");

    expect(await screen.findByText(/link inválido/i)).toBeInTheDocument();
    expect(quantas(fetch, VERIFICAR)).toBe(0);
    expect(screen.getByRole("link", { name: /pedir novo acesso/i })).toHaveAttribute("href", "/portal");
  });

  it("link expirado ou já usado mostra a mensagem e oferece pedir novo acesso", async () => {
    mockFetchRotas({
      [VERIFICAR]: () => new Response("", { status: 401 }),
      [ME]: () => new Response("", { status: 401 }),
    });

    renderizar("/portal/entrar?token=velho");

    expect(await screen.findByText(/inválido ou expirado/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /pedir novo acesso/i })).toBeInTheDocument();
    expect(screen.queryByTestId("local")).not.toBeInTheDocument();
  });
});
