// Edge function: notifica por e-mail sobre eventos do Portal do Cliente
// (issue #11), nos dois sentidos:
//   - "novo_pedido" / "novo_artefato" → e-mail pro CLIENTE
//   - "pedido_respondido" / "pedido_decidido" → e-mail pro Nelson (admin)
// Mesmo padrão do watchtower-notify-access: Resend, fire-and-forget do lado
// de quem chama (a falha aqui nunca deve travar a operação principal).

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type EventType = "novo_pedido" | "novo_artefato" | "pedido_respondido" | "pedido_decidido";

interface Payload {
  event: EventType;
  projetoNome: string;
  detalhe: string;
  /** Obrigatório para novo_pedido / novo_artefato (e-mail do cliente). */
  clienteEmail?: string;
}

const ADMIN_EMAIL = Deno.env.get("ADMIN_NOTIFICATION_EMAIL") || "nelsonhaproenca@gmail.com";
const FROM = "Portal do Cliente <noreply@nelson-proenca-info.com.br>";

function wrap(title: string, body: string): string {
  return `
<!DOCTYPE html><html lang="pt-BR"><head><meta charset="utf-8" /><title>${title}</title></head>
<body style="margin:0;padding:0;background:#ffffff;font-family:Arial,Helvetica,sans-serif;color:#1a1a1a;">
  <div style="max-width:560px;margin:0 auto;padding:32px 24px;">
    <div style="border-bottom:2px solid #333;padding-bottom:16px;margin-bottom:24px;">
      <h1 style="margin:0;font-size:18px;letter-spacing:0.1em;color:#1a1a1a;">PORTAL DO CLIENTE</h1>
    </div>
    ${body}
    <div style="margin-top:32px;padding-top:16px;border-top:1px solid #e5e5e5;font-size:11px;color:#888;">
      Este é um e-mail automático. Não responda diretamente.
    </div>
  </div>
</body></html>`;
}

function buildEmail(payload: Payload): { to: string; subject: string; html: string } | null {
  switch (payload.event) {
    case "novo_pedido":
      if (!payload.clienteEmail) return null;
      return {
        to: payload.clienteEmail,
        subject: `Novo pedido no projeto ${payload.projetoNome}`,
        html: wrap(
          "Novo pedido",
          `<h2 style="font-size:20px;">Você tem um novo pedido em <strong>${payload.projetoNome}</strong></h2>
           <p style="font-size:14px;line-height:1.6;color:#444;">${payload.detalhe}</p>
           <p style="font-size:14px;color:#444;">Acesse o portal pra responder.</p>`,
        ),
      };
    case "novo_artefato":
      if (!payload.clienteEmail) return null;
      return {
        to: payload.clienteEmail,
        subject: `Novo artefato disponível em ${payload.projetoNome}`,
        html: wrap(
          "Novo artefato",
          `<h2 style="font-size:20px;">Um novo artefato foi adicionado a <strong>${payload.projetoNome}</strong></h2>
           <p style="font-size:14px;line-height:1.6;color:#444;">${payload.detalhe}</p>
           <p style="font-size:14px;color:#444;">Acesse o portal pra visualizar.</p>`,
        ),
      };
    case "pedido_respondido":
      return {
        to: ADMIN_EMAIL,
        subject: `Cliente respondeu um pedido em ${payload.projetoNome}`,
        html: wrap(
          "Resposta recebida",
          `<h2 style="font-size:20px;">Novo retorno em <strong>${payload.projetoNome}</strong></h2>
           <p style="font-size:14px;line-height:1.6;color:#444;">${payload.detalhe}</p>`,
        ),
      };
    case "pedido_decidido":
      return {
        to: ADMIN_EMAIL,
        subject: `Decisão registrada em ${payload.projetoNome}`,
        html: wrap(
          "Decisão do cliente",
          `<h2 style="font-size:20px;">Novo retorno em <strong>${payload.projetoNome}</strong></h2>
           <p style="font-size:14px;line-height:1.6;color:#444;">${payload.detalhe}</p>`,
        ),
      };
    default:
      return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY not configured");

    const payload = (await req.json()) as Payload;
    if (!payload?.event || !payload?.projetoNome || !payload?.detalhe) {
      return new Response(JSON.stringify({ error: "event, projetoNome e detalhe são obrigatórios" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const email = buildEmail(payload);
    if (!email) {
      return new Response(JSON.stringify({ error: "evento inválido ou clienteEmail ausente" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({ from: FROM, to: [email.to], subject: email.subject, html: email.html }),
    });

    const data = await res.json();
    if (!res.ok) {
      console.error("Resend error:", data);
      return new Response(JSON.stringify({ error: "resend_failed", details: data }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ ok: true, id: data?.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("portfolio-notify-email error:", e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
