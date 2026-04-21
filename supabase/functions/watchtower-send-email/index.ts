const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const SUPABASE_PROJECT_REF = "nsdektdgohfqfioonosc";
const FROM = "Watchtower Monitoramentos <noreply@nelson-proenca-info.com.br>";

interface HookPayload {
  user: { email: string };
  email_data: {
    token_hash: string;
    email_action_type: string;
    redirect_to: string;
  };
}

Deno.serve(async (req) => {
  try {
    const payload: HookPayload = await req.json();
    const { user, email_data } = payload;
    const actionType = email_data.email_action_type;

    const confirmUrl =
      `https://${SUPABASE_PROJECT_REF}.supabase.co/auth/v1/verify` +
      `?token=${email_data.token_hash}` +
      `&type=${actionType}` +
      `&redirect_to=${encodeURIComponent(email_data.redirect_to)}`;

    const { subject, html } = buildEmail(actionType, confirmUrl);

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from: FROM, to: [user.email], subject, html }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("Resend error:", err);
      return new Response(JSON.stringify({ error: err }), { status: 500 });
    }

    return new Response(JSON.stringify({}), { status: 200 });
  } catch (e) {
    console.error("Hook error:", e);
    return new Response(JSON.stringify({ error: String(e) }), { status: 500 });
  }
});

function buildEmail(actionType: string, confirmUrl: string): { subject: string; html: string } {
  const base = (title: string, body: string, btnLabel: string) => ({
    subject: `${title} — Watchtower Monitoramentos`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0a0a0a;color:#e5e5e5;padding:40px;border-radius:8px;">
        <h1 style="color:#D4AF37;font-size:18px;letter-spacing:0.1em;margin-bottom:4px;">WATCHTOWER MONITORAMENTOS</h1>
        <hr style="border:none;border-top:1px solid #333;margin:16px 0 24px;" />
        <h2 style="font-size:20px;margin-bottom:12px;">${title}</h2>
        <p style="color:#999;font-size:14px;line-height:1.7;margin-bottom:28px;">${body}</p>
        <div style="text-align:center;margin-bottom:28px;">
          <a href="${confirmUrl}" style="display:inline-block;background:#D4AF37;color:#000;padding:14px 36px;text-decoration:none;border-radius:4px;font-weight:bold;font-size:13px;letter-spacing:0.1em;">
            ${btnLabel}
          </a>
        </div>
        <p style="color:#555;font-size:11px;">Se você não realizou esta ação, ignore este e-mail. O link expira em 1 hora.</p>
      </div>`,
  });

  if (actionType === "recovery") {
    return base(
      "Redefinição de Senha",
      "Você solicitou a redefinição de senha da sua conta. Clique no botão abaixo para criar uma nova senha.",
      "REDEFINIR SENHA",
    );
  }
  if (actionType === "signup") {
    return base(
      "Confirme seu Cadastro",
      "Obrigado por se cadastrar na Watchtower Monitoramentos! Clique no botão abaixo para confirmar seu e-mail.",
      "CONFIRMAR E-MAIL",
    );
  }
  if (actionType === "email_change") {
    return base(
      "Confirme a Alteração de E-mail",
      "Clique no botão abaixo para confirmar a alteração do seu endereço de e-mail.",
      "CONFIRMAR ALTERAÇÃO",
    );
  }
  return base("Ação Necessária", "Clique no botão abaixo para continuar.", "CONFIRMAR");
}
