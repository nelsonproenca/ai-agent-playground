// Edge function: notifica usuários do Watchtower sobre status de acesso via Resend.
// Eventos suportados:
//   - "welcome_user": cliente acabou de se cadastrar (acesso liberado em 15min)
//   - "welcome_admin_request": admin solicitou acesso (aguardando aprovação)
//   - "admin_approved": pedido de admin aprovado
//   - "admin_rejected": pedido de admin rejeitado
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type EventType =
  | "welcome_user"
  | "welcome_admin_request"
  | "admin_approved"
  | "admin_rejected";

interface Payload {
  event: EventType;
  email: string;
  displayName?: string;
  accessReleasedAt?: string;
}

function buildEmail(payload: Payload): { subject: string; html: string } {
  const name = payload.displayName?.trim() || "novo usuário";
  const releaseDate = payload.accessReleasedAt
    ? new Date(payload.accessReleasedAt).toLocaleString("pt-BR", {
        timeZone: "America/Sao_Paulo",
      })
    : null;

  const wrap = (title: string, body: string) => `
<!DOCTYPE html><html lang="pt-BR"><head><meta charset="utf-8" />
<title>${title}</title></head>
<body style="margin:0;padding:0;background:#ffffff;font-family:Arial,Helvetica,sans-serif;color:#1a1a1a;">
  <div style="max-width:560px;margin:0 auto;padding:32px 24px;">
    <div style="border-bottom:2px solid #d4af37;padding-bottom:16px;margin-bottom:24px;">
      <h1 style="margin:0;font-size:20px;letter-spacing:0.15em;color:#1a1a1a;">WATCHTOWER MONITORAMENTOS</h1>
    </div>
    ${body}
    <div style="margin-top:32px;padding-top:16px;border-top:1px solid #e5e5e5;font-size:11px;color:#888;">
      Este é um e-mail automático do Watchtower. Não responda diretamente.
    </div>
  </div>
</body></html>`;

  switch (payload.event) {
    case "welcome_user":
      return {
        subject: "Bem-vindo ao Watchtower — seu acesso será liberado em 15 minutos",
        html: wrap(
          "Bem-vindo!",
          `<h2 style="font-size:22px;color:#1a1a1a;">Olá, ${name}! 🎉</h2>
           <p style="font-size:14px;line-height:1.6;color:#444;">
             Seu cadastro foi recebido com sucesso! Por questões de segurança, seu acesso
             estará disponível em <strong>15 minutos</strong>.
           </p>
           ${releaseDate ? `<p style="font-size:14px;color:#444;">⏰ <strong>Liberação prevista:</strong> ${releaseDate}</p>` : ""}
           <p style="font-size:14px;line-height:1.6;color:#444;">
             Enquanto isso, prepare suas câmeras — em breve você terá acesso completo ao painel.
           </p>`
        ),
      };
    case "welcome_admin_request":
      return {
        subject: "Pedido de acesso ADMIN recebido — aguardando aprovação",
        html: wrap(
          "Pedido recebido",
          `<h2 style="font-size:22px;color:#1a1a1a;">Olá, ${name}! 🛡️</h2>
           <p style="font-size:14px;line-height:1.6;color:#444;">
             Recebemos seu pedido para acesso como <strong>ADMINISTRADOR</strong>. 
             Outro administrador já foi notificado e analisará seu pedido em breve.
           </p>
           <p style="font-size:14px;line-height:1.6;color:#444;">
             Avisaremos por e-mail assim que houver uma resposta. Tempo médio: até <strong>15 minutos</strong>.
           </p>`
        ),
      };
    case "admin_approved":
      return {
        subject: "🎉 Seu acesso ADMIN foi aprovado",
        html: wrap(
          "Aprovado!",
          `<h2 style="font-size:22px;color:#1a8754;">Bem-vindo ao time, ${name}! 🛡️</h2>
           <p style="font-size:14px;line-height:1.6;color:#444;">
             Seu pedido de acesso administrativo foi <strong>aprovado</strong>. 
             Já pode entrar no painel com privilégios completos.
           </p>
           <p style="margin-top:24px;">
             <a href="https://watchtower.lovable.app/watchtower/auth"
                style="background:#d4af37;color:#1a1a1a;padding:12px 24px;text-decoration:none;font-weight:bold;border-radius:4px;">
               ENTRAR AGORA →
             </a>
           </p>`
        ),
      };
    case "admin_rejected":
      return {
        subject: "Sobre seu pedido de acesso ADMIN",
        html: wrap(
          "Pedido analisado",
          `<h2 style="font-size:22px;color:#1a1a1a;">Olá, ${name}.</h2>
           <p style="font-size:14px;line-height:1.6;color:#444;">
             Seu pedido de acesso administrativo não foi aprovado neste momento. 
             Sua conta de cliente continua ativa normalmente.
           </p>
           <p style="font-size:14px;line-height:1.6;color:#444;">
             Se acredita que houve um engano, entre em contato com nossa equipe.
           </p>`
        ),
      };
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY not configured");

    const payload = (await req.json()) as Payload;
    if (!payload?.event || !payload?.email) {
      return new Response(JSON.stringify({ error: "event e email são obrigatórios" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { subject, html } = buildEmail(payload);

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Watchtower <onboarding@resend.dev>",
        to: [payload.email],
        subject,
        html,
      }),
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
    console.error("notify-access error:", e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
