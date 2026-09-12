import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { portalClientApi, PortalApiError } from "@/features/portal-shared/apiClient";
import type { Cliente } from "@/features/clientes/api";

interface ClientAuthContextType {
  session: Session | null;
  cliente: Cliente | null;
  loading: boolean;
  requestMagicLink: (email: string) => Promise<{ error: string | null }>;
  logout: () => Promise<void>;
}

const ClientAuthContext = createContext<ClientAuthContextType>({
  session: null,
  cliente: null,
  loading: true,
  requestMagicLink: async () => ({ error: "not initialized" }),
  logout: async () => {},
});

export const ClientAuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [loading, setLoading] = useState(true);

  /** Resolve o próprio cliente via o backend (ticket #19) — o e-mail vem do JWT
   * validado no servidor, não é mais passado pelo front (que só precisa saber
   * SE há sessão, não confiar no e-mail dela pra decidir o que mostrar). */
  const resolveCliente = async (hasSession: boolean) => {
    if (!hasSession) {
      setCliente(null);
      return;
    }
    try {
      setCliente(await portalClientApi.get<Cliente>("/clientes/me"));
    } catch (err) {
      if (err instanceof PortalApiError && (err.status === 404 || err.status === 401)) {
        setCliente(null);
        return;
      }
      throw err;
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session);
      await resolveCliente(!!data.session);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      setSession(newSession);
      await resolveCliente(!!newSession);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  const requestMagicLink = async (email: string) => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/portal` },
    });
    return { error: error?.message ?? null };
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setCliente(null);
  };

  return (
    <ClientAuthContext.Provider value={{ session, cliente, loading, requestMagicLink, logout }}>
      {children}
    </ClientAuthContext.Provider>
  );
};

export const useClientAuth = () => useContext(ClientAuthContext);
