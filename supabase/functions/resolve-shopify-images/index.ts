import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SHOPIFY_STORE = "nelson-proenca-informatica.myshopify.com";
const CLIENT_ID = "f0a0a8efe3f42a361f44af7076653f11";
const CLIENT_SECRET = "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";

async function getAccessToken(): Promise<string> {
  const res = await fetch(`https://${SHOPIFY_STORE}/admin/oauth/access_token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ client_id: CLIENT_ID, client_secret: CLIENT_SECRET, grant_type: "client_credentials" }),
  });
  if (!res.ok) throw new Error(`Token request failed: ${res.status}`);
  const data = await res.json();
  return data.access_token;
}

async function fetchProductImages(token: string): Promise<Record<string, string>> {
  const map: Record<string, string> = {};
  let url: string | null = `https://${SHOPIFY_STORE}/admin/api/2024-01/products.json?limit=250&fields=id,images`;

  while (url) {
    const res = await fetch(url, {
      headers: { "X-Shopify-Access-Token": token },
    });
    if (!res.ok) throw new Error(`Admin API failed: ${res.status} ${await res.text()}`);
    const json = await res.json();

    for (const product of json?.products ?? []) {
      for (const img of product?.images ?? []) {
        const gid = `gid://shopify/MediaImage/${img.id}`;
        if (img.src) map[gid] = img.src;
      }
    }

    // Check for pagination
    const linkHeader = res.headers.get("link");
    const nextMatch = linkHeader?.match(/<([^>]+)>;\s*rel="next"/);
    url = nextMatch ? nextMatch[1] : null;
  }

  return map;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const token = await getAccessToken();
    const imageMap = await fetchProductImages(token);

    return new Response(JSON.stringify(imageMap), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
