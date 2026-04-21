import { MessageCircle } from "lucide-react";

const WHATSAPP_NUMBER = "5511945598960";

export function WatchtowerWhatsAppButton() {
  const handleClick = () => {
    const msg = encodeURIComponent("Olá, preciso de ajuda com meu acesso às câmeras.");
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${msg}`, "_blank");
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 group">
      {/* Tooltip */}
      <span
        role="tooltip"
        className="pointer-events-none absolute right-full top-1/2 -translate-y-1/2 mr-3 whitespace-nowrap rounded-md bg-foreground text-background px-3 py-1.5 text-xs font-medium shadow-lg opacity-0 translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 group-focus-within:opacity-100 group-focus-within:translate-x-0 transition-all duration-200"
      >
        Fale conosco
        <span className="absolute left-full top-1/2 -translate-y-1/2 -ml-px border-4 border-transparent border-l-foreground" />
      </span>

      <button
        onClick={handleClick}
        aria-label="Fale conosco no WhatsApp"
        className="flex h-14 w-14 items-center justify-center rounded-full bg-green-500 text-white shadow-lg hover:bg-green-600 transition-all hover:scale-105 active:scale-95"
      >
        <MessageCircle className="h-7 w-7" />
      </button>
    </div>
  );
}
