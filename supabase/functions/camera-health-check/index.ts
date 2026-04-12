import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MEDIAMTX_SERVER = "https://seu-servidor-mediamtx.com";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const { data: cameras, error: camError } = await supabase
      .from("cameras")
      .select("id, display_name, internal_stream_key, location");

    if (camError) throw camError;
    if (!cameras || cameras.length === 0) {
      return new Response(JSON.stringify({ message: "No cameras found" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: configRows } = await supabase
      .from("camera_health_config")
      .select("*")
      .limit(1);
    const config = configRows?.[0];
    const notifyAfter = config?.notify_after_failures ?? 2;

    const results: Array<{
      camera_id: string;
      status: string;
      response_time_ms: number | null;
      error_message: string | null;
    }> = [];

    for (const camera of cameras) {
      const startTime = Date.now();
      let status = "online";
      let errorMsg: string | null = null;

      try {
        const hlsUrl = `${MEDIAMTX_SERVER}/${camera.internal_stream_key}/index.m3u8`;
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000);

        const response = await fetch(hlsUrl, {
          method: "HEAD",
          signal: controller.signal,
        });
        clearTimeout(timeout);

        if (!response.ok) {
          status = "offline";
          errorMsg = `HLS returned ${response.status}`;
        }
      } catch (e) {
        status = "offline";
        errorMsg = e instanceof Error ? e.message : "Unknown error";
      }

      if (status === "online") {
        try {
          const apiUrl = `${MEDIAMTX_SERVER}/v3/paths/get/${camera.internal_stream_key}`;
          const controller2 = new AbortController();
          const timeout2 = setTimeout(() => controller2.abort(), 5000);

          const apiResp = await fetch(apiUrl, { signal: controller2.signal });
          clearTimeout(timeout2);

          if (!apiResp.ok) {
            status = "offline";
            errorMsg = `MediaMTX API returned ${apiResp.status}`;
          } else {
            const body = await apiResp.json();
            if (!body.source || body.source.type === "none") {
              status = "offline";
              errorMsg = "No active source on MediaMTX";
            }
          }
        } catch (e) {
          status = "offline";
          errorMsg = e instanceof Error ? e.message : "MediaMTX API error";
        }
      }

      const elapsed = Date.now() - startTime;
      results.push({
        camera_id: camera.id,
        status,
        response_time_ms: elapsed,
        error_message: errorMsg,
      });
    }

    const { error: insertError } = await supabase
      .from("camera_health_logs")
      .insert(
        results.map((r) => ({
          camera_id: r.camera_id,
          status: r.status,
          response_time_ms: r.response_time_ms,
          error_message: r.error_message,
        }))
      );

    if (insertError) throw insertError;

    const offlineCameras = results.filter((r) => r.status === "offline");

    if (offlineCameras.length > 0 && config) {
      const camerasToNotify: Array<{ id: string; name: string; error: string }> = [];

      for (const offCam of offlineCameras) {
        const { data: recentLogs } = await supabase
          .from("camera_health_logs")
          .select("status")
          .eq("camera_id", offCam.camera_id)
          .order("checked_at", { ascending: false })
          .limit(notifyAfter);

        const allOffline = recentLogs?.every((l: any) => l.status === "offline");
        if (allOffline && recentLogs?.length === notifyAfter) {
          const cam = cameras.find((c: any) => c.id === offCam.camera_id);
          camerasToNotify.push({
            id: offCam.camera_id,
            name: cam?.display_name ?? "Desconhecida",
            error: offCam.error_message ?? "Sem detalhes",
          });
        }
      }

      if (camerasToNotify.length > 0) {
        const alertMsg = camerasToNotify
          .map((c) => `🔴 ${c.name}: ${c.error}`)
          .join("\n");

        const notifications: string[] = [];

        const twilioSid = Deno.env.get("TWILIO_ACCOUNT_SID");
        const twilioAuth = Deno.env.get("TWILIO_AUTH_TOKEN");
        const twilioFrom = Deno.env.get("TWILIO_WHATSAPP_FROM");

        if (twilioSid && twilioAuth && config.admin_whatsapp) {
          try {
            const waBody = `⚠️ ALERTA DE CÂMERA OFFLINE\n\n${alertMsg}\n\nVerifique o dashboard para mais detalhes.`;
            const resp = await fetch(
              `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`,
              {
                method: "POST",
                headers: {
                  Authorization: `Basic ${btoa(`${twilioSid}:${twilioAuth}`)}`,
                  "Content-Type": "application/x-www-form-urlencoded",
                },
                body: new URLSearchParams({
                  To: `whatsapp:+${config.admin_whatsapp}`,
                  From: twilioFrom || "whatsapp:+14155238886",
                  Body: waBody,
                }),
              }
            );
            if (resp.ok) notifications.push("whatsapp");
          } catch (e) {
            console.error("WhatsApp send error:", e);
          }
        }

        if (twilioSid && twilioAuth && config.admin_phone) {
          try {
            const smsFrom = Deno.env.get("TWILIO_SMS_FROM");
            const smsBody = `ALERTA: ${camerasToNotify.length} câmera(s) offline. ${camerasToNotify.map((c) => c.name).join(", ")}`;
            const resp = await fetch(
              `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`,
              {
                method: "POST",
                headers: {
                  Authorization: `Basic ${btoa(`${twilioSid}:${twilioAuth}`)}`,
                  "Content-Type": "application/x-www-form-urlencoded",
                },
                body: new URLSearchParams({
                  To: config.admin_phone,
                  From: smsFrom || "+15005550006",
                  Body: smsBody,
                }),
              }
            );
            if (resp.ok) notifications.push("sms");
          } catch (e) {
            console.error("SMS send error:", e);
          }
        }

        if (config.admin_email) {
          try {
            const emailBody = `
              <h2>⚠️ Alerta de Câmera Offline</h2>
              <p>As seguintes câmeras estão offline:</p>
              <ul>${camerasToNotify.map((c) => `<li><strong>${c.name}</strong>: ${c.error}</li>`).join("")}</ul>
              <p>Verifique o dashboard para mais detalhes.</p>
            `;
            await supabase.functions.invoke("send-health-alert-email", {
              body: { to: config.admin_email, subject: `🔴 ${camerasToNotify.length} câmera(s) offline`, html: emailBody },
            });
            notifications.push("email");
          } catch (e) {
            console.error("Email send error:", e);
          }
        }

        console.log(`Notifications sent: ${notifications.join(", ") || "none"}`);
      }
    }

    return new Response(
      JSON.stringify({
        checked: results.length,
        online: results.filter((r) => r.status === "online").length,
        offline: results.filter((r) => r.status === "offline").length,
        results,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Health check error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
