import { MessageCircle } from "lucide-react";
import { useLocation } from "react-router-dom";
import { useMemo } from "react";

const WHATSAPP_NUMBER = "5511945598960";

type ContextMessage = { tooltip: string; message: string };

const DEFAULT_CONTEXT: ContextMessage = {
  tooltip: "Fale conosco",
  message: "Olá! Vim pelo site da Watchtower Monitoramentos e gostaria de mais informações.",
};

// Mapeamento de rota → mensagem contextual.
// A chave é um prefixo testado em ordem de especificidade (mais específico primeiro).
const ROUTE_CONTEXTS: ReadonlyArray<readonly [string, ContextMessage]> = [
  [
    "/watchtower/contact",
    {
      tooltip: "Fale conosco",
      message: "Olá! Estou na página de contato e gostaria de falar com um especialista.",
    },
  ],
  [
    "/watchtower/dashboard/billing",
    {
      tooltip: "Dúvidas sobre pagamento?",
      message: "Olá! Tenho dúvidas sobre meu plano/pagamento na Watchtower.",
    },
  ],
  [
    "/watchtower/dashboard/live",
    {
      tooltip: "Problema com a câmera?",
      message: "Olá! Estou com problemas para visualizar minha câmera ao vivo. Pode me ajudar?",
    },
  ],
  [
    "/watchtower/dashboard/support",
    {
      tooltip: "Suporte técnico",
      message: "Olá! Preciso de suporte técnico com meu monitoramento.",
    },
  ],
  [
    "/watchtower/dashboard/health",
    {
      tooltip: "Alerta de saúde",
      message: "Olá! Identifiquei um problema no health check das minhas câmeras.",
    },
  ],
  [
    "/watchtower/dashboard/settings",
    {
      tooltip: "Ajuda com configurações",
      message: "Olá! Preciso de ajuda com as configurações da minha conta Watchtower.",
    },
  ],
  [
    "/watchtower/dashboard",
    {
      tooltip: "Precisa de ajuda?",
      message: "Olá! Estou no painel da Watchtower e gostaria de tirar uma dúvida.",
    },
  ],
  [
    "/watchtower/about",
    {
      tooltip: "Quer saber mais?",
      message: "Olá! Conheci a Watchtower pela página institucional e quero saber mais.",
    },
  ],
  [
    "/watchtower/blog",
    {
      tooltip: "Fale conosco",
      message: "Olá! Vim pelo blog da Watchtower e gostaria de mais informações.",
    },
  ],
  [
    "/watchtower/auth",
    {
      tooltip: "Problema para entrar?",
      message: "Olá! Estou com dificuldade para acessar minha conta Watchtower.",
    },
  ],
  [
    "/watchtower",
    DEFAULT_CONTEXT,
  ],
];

function getContextFor(pathname: string): ContextMessage {
  for (const [prefix, ctx] of ROUTE_CONTEXTS) {
    if (pathname === prefix || pathname.startsWith(prefix + "/")) return ctx;
  }
  return DEFAULT_CONTEXT;
}

export function WatchtowerWhatsAppButton() {
  const { pathname } = useLocation();
  const { tooltip, message } = useMemo(() => getContextFor(pathname), [pathname]);

  const handleClick = () => {
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 group">
      {/* Tooltip contextual */}
      <span
        role="tooltip"
        className="pointer-events-none absolute right-full top-1/2 -translate-y-1/2 mr-3 whitespace-nowrap rounded-md bg-foreground text-background px-3 py-1.5 text-xs font-medium shadow-lg opacity-0 translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 group-focus-within:opacity-100 group-focus-within:translate-x-0 transition-all duration-200"
      >
        {tooltip}
        <span className="absolute left-full top-1/2 -translate-y-1/2 -ml-px border-4 border-transparent border-l-foreground" />
      </span>

      <button
        onClick={handleClick}
        aria-label={`${tooltip} no WhatsApp`}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-green-500 text-white shadow-lg hover:bg-green-600 transition-all hover:scale-105 active:scale-95"
      >
        <MessageCircle className="h-7 w-7" />
      </button>
    </div>
  );
}
