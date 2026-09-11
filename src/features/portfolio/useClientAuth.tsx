import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

type Cliente = Tables<"clientes">;

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

  const resolveCliente = async (email: string | undefined) => {
    if (!email) {
      setCliente(null);
      return;
    }
    const { data } = await supabase.from("clientes").select("*").eq("email", email).maybeSingle();
    setCliente(data);
  };

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session);
      await resolveCliente(data.session?.user.email);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      setSession(newSession);
      await resolveCliente(newSession?.user.email);
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
