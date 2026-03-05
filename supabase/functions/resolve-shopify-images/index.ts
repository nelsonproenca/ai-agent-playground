import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const token = await getAccessToken();

    // Fetch products with their first image URL, keyed by product GID
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

    // Map: shopify_id (numeric) -> image CDN URL
    const map: Record<string, string> = {};
    for (const edge of json?.data?.products?.edges ?? []) {
      const node = edge?.node;
      if (node?.id && node?.featuredImage?.url) {
        // Extract numeric ID from gid://shopify/Product/123456
        const numericId = node.id.split("/").pop();
        if (numericId) {
          map[numericId] = node.featuredImage.url;
        }
      }
    }

    return new Response(JSON.stringify(map), {
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
