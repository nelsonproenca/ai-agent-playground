import { MessageCircle } from "lucide-react";

const WHATSAPP_NUMBER = "5511945598960";

export function WatchtowerWhatsAppButton() {
  const handleClick = () => {
    const msg = encodeURIComponent("Olá, preciso de ajuda com meu acesso às câmeras.");
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${msg}`, "_blank");
  };

  return (
    <button
      onClick={handleClick}
      aria-label="Fale conosco no WhatsApp"
      className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-green-500 text-white shadow-lg hover:bg-green-600 transition-colors hover:scale-105 active:scale-95"
    >
      <MessageCircle className="h-7 w-7" />
    </button>
  );
}
