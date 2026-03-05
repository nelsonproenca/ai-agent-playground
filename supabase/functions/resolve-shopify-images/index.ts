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
  const query = `{
    products(first: 250) {
      edges {
        node {
          media(first: 10) {
            edges {
              node {
                ... on MediaImage {
                  id
                  image { url }
                }
              }
            }
          }
        }
      }
    }
  }`;

  const res = await fetch(`https://${SHOPIFY_STORE}/api/2024-01/graphql.json`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Storefront-Access-Token": token,
    },
    body: JSON.stringify({ query }),
  });

  if (!res.ok) throw new Error(`GraphQL failed: ${res.status}`);
  const json = await res.json();
  const map: Record<string, string> = {};

  for (const edge of json?.data?.products?.edges ?? []) {
    for (const mediaEdge of edge?.node?.media?.edges ?? []) {
      const node = mediaEdge?.node;
      if (node?.id && node?.image?.url) {
        map[node.id] = node.image.url;
      }
    }
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
