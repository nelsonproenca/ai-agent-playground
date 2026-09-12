import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { login as apiLogin, logout as apiLogout, getCurrentAdmin } from "@/features/admin-auth/api";

/**
 * Sessão do admin via cookie httpOnly emitido pelo portal-backend (ticket #14) —
 * substitui a senha fixa comparada no client-side. `authenticated` aqui é só uma
 * dica de UI (qual tela mostrar); a proteção real é sempre no backend, que exige
 * o cookie válido em toda chamada de escrita.
 *
 * Otimista no primeiro render (sessionStorage) pra não redirecionar pro /login
 * um admin já logado enquanto o `/auth/me` do backend ainda não respondeu — e
 * corrige (desloga) se o backend disser que a sessão expirou.
 */

const UI_HINT_KEY = "admin_auth_hint";

interface AuthContextType {
  authenticated: boolean;
  login: (password: string) => Promise<{ error: string | null }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  authenticated: false,
  login: async () => ({ error: "not initialized" }),
  logout: async () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [authenticated, setAuthenticated] = useState(
    () => sessionStorage.getItem(UI_HINT_KEY) === "true"
  );

  useEffect(() => {
    getCurrentAdmin().then((admin) => {
      setAuthenticated(admin !== null);
      if (admin === null) sessionStorage.removeItem(UI_HINT_KEY);
    });
  }, []);

  const login = async (password: string) => {
    const result = await apiLogin(password);
    if ("error" in result) return { error: result.error };

    sessionStorage.setItem(UI_HINT_KEY, "true");
    setAuthenticated(true);
    return { error: null };
  };

  const logout = async () => {
    await apiLogout();
    sessionStorage.removeItem(UI_HINT_KEY);
    setAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ authenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
