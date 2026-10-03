import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from "react";
import { portalClientApi, PortalApiError } from "@/features/portal-shared/apiClient";
import type { Cliente } from "@/features/clientes/api";
import { getSessaoCliente, logoutCliente, solicitarLink } from "./clientAuthApi";

interface ClientAuthContextType {
  /** Há sessão válida (cookie do portal do cliente). */
  authenticated: boolean;
  cliente: Cliente | null;
  loading: boolean;
  requestMagicLink: (email: string) => Promise<{ error: string | null }>;
  /** Recarrega a sessão (usado pela página que acabou de trocar o token do link pelo cookie). */
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
}

const ClientAuthContext = createContext<ClientAuthContextType>({
  authenticated: false,
  cliente: null,
  loading: true,
  requestMagicLink: async () => ({ error: "not initialized" }),
  refresh: async () => {},
  logout: async () => {},
});

export const ClientAuthProvider = ({ children }: { children: ReactNode }) => {
  const [authenticated, setAuthenticated] = useState(false);
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [loading, setLoading] = useState(true);

  /** Descobre se há sessão e, havendo, resolve o cadastro do cliente. O e-mail vem do cookie validado no
   * servidor; o front só precisa saber SE há sessão, não confia em nada que ele mesmo informou. */
  const refresh = useCallback(async () => {
    try {
      const sessao = await getSessaoCliente();
      setAuthenticated(!!sessao);
      if (!sessao) {
        setCliente(null);
        return;
      }
      setCliente(await portalClientApi.get<Cliente>("/clientes/me"));
    } catch (err) {
      if (err instanceof PortalApiError && (err.status === 404 || err.status === 401)) {
        setCliente(null);
        return;
      }
      throw err;
    }
  }, []);

  useEffect(() => {
    refresh()
      .catch(() => {
        setAuthenticated(false);
        setCliente(null);
      })
      .finally(() => setLoading(false));
  }, [refresh]);

  const logout = async () => {
    await logoutCliente();
    setAuthenticated(false);
    setCliente(null);
  };

  return (
    <ClientAuthContext.Provider
      value={{ authenticated, cliente, loading, requestMagicLink: solicitarLink, refresh, logout }}
    >
      {children}
    </ClientAuthContext.Provider>
  );
};

export const useClientAuth = () => useContext(ClientAuthContext);
