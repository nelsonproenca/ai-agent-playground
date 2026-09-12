import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
    proxy: {
      // portal-backend (ticket #12/#13) — em produção o Caddy já serve isso no
      // mesmo domínio (same-origin), então o front sempre usa path relativo
      // "/api/portal/*"; em dev, esse proxy replica o mesmo comportamento
      // same-origin (senão o cookie httpOnly da sessão do admin não funcionaria).
      "/api/portal": {
        target: "http://localhost:5299",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/portal/, ""),
      },
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
