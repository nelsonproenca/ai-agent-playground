import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SHOPIFY_STORE = "nelson-proenca-informatica.myshopify.com";

async function getAccessToken(): Promise<string> {
  const clientId = Deno.env.get("SHOPIFY_CLIENT_ID");
  const clientSecret = Deno.env.get("SHOPIFY_CLIENT_SECRET");
  if (!clientId || !clientSecret) throw new Error("Missing SHOPIFY_CLIENT_ID or SHOPIFY_CLIENT_SECRET");

  const res = await fetch(`https://${SHOPIFY_STORE}/admin/oauth/access_token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ client_id: clientId, client_secret: clientSecret, grant_type: "client_credentials" }),
  });
  if (!res.ok) throw new Error(`Token request failed: ${res.status}`);
  const data = await res.json();
  return data.access_token;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const token = await getAccessToken();

    const query = `{
      products(first: 250) {
        edges {
          node {
            id
            featuredImage {
              url
            }
          }
        }
      }
    }`;

    const res = await fetch(`https://${SHOPIFY_STORE}/api/2024-01/graphql.json`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Shopify-Storefront-Private-Token": token,
      },
      body: JSON.stringify({ query }),
    });

    if (!res.ok) throw new Error(`GraphQL failed: ${res.status}`);
    const json = await res.json();

    // Map: shopify_id (numeric) -> CDN URL
    const imageMap: Record<string, string> = {};
    for (const edge of json?.data?.products?.edges ?? []) {
      const node = edge?.node;
      if (node?.id && node?.featuredImage?.url) {
        const numericId = node.id.split("/").pop();
        if (numericId) imageMap[numericId] = node.featuredImage.url;
      }
    }

    // Update database
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    let updated = 0;
    for (const [shopifyId, cdnUrl] of Object.entries(imageMap)) {
      const { error } = await supabase
        .from("produtos_dtc")
        .update({ image_url: cdnUrl })
        .eq("shopify_id", shopifyId);
      if (!error) updated++;
    }

    return new Response(JSON.stringify({ updated, total: Object.keys(imageMap).length, imageMap }), {
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
