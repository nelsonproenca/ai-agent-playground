import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface AuthContextType {
  authenticated: boolean;
  login: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  authenticated: false,
  login: () => {},
  logout: () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [authenticated, setAuthenticated] = useState(
    () => sessionStorage.getItem("admin_auth") === "true"
  );

  const login = () => {
    sessionStorage.setItem("admin_auth", "true");
    setAuthenticated(true);
  };

  const logout = () => {
    sessionStorage.removeItem("admin_auth");
    setAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ authenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
