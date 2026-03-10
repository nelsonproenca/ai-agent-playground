import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const SHOPIFY_STORE = "nelson-proenca-informatica.myshopify.com";
const STOREFRONT_API = `https://${SHOPIFY_STORE}/api/2026-01/graphql.json`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { variantId, quantity = 1 } = await req.json();

    if (!variantId) {
      return new Response(JSON.stringify({ error: "variantId is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const merchandiseId = variantId.startsWith("gid://")
      ? variantId
      : `gid://shopify/ProductVariant/${variantId}`;

    const token = Deno.env.get("SHOPIFY_STOREFRONT_TOKEN");
    if (!token) throw new Error("Missing SHOPIFY_STOREFRONT_TOKEN");

    const mutation = `
      mutation cartCreate($input: CartInput!) {
        cartCreate(input: $input) {
          cart {
            id
            checkoutUrl
          }
          userErrors {
            field
            message
          }
        }
      }
    `;

    const variables = {
      input: {
        lines: [{ merchandiseId, quantity }],
      },
    };

    const res = await fetch(STOREFRONT_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Storefront-Access-Token": token,
      },
      body: JSON.stringify({ query: mutation, variables }),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("Storefront API error:", text);
      throw new Error(`Storefront API failed: ${res.status}`);
    }

    const json = await res.json();
    const cartData = json?.data?.cartCreate;

    if (cartData?.userErrors?.length > 0) {
      console.error("Cart user errors:", cartData.userErrors);
      return new Response(JSON.stringify({ error: cartData.userErrors[0].message }), {
        status: 422,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const checkoutUrl = cartData?.cart?.checkoutUrl;
    if (!checkoutUrl) {
      throw new Error("No checkoutUrl returned from Shopify");
    }

    return new Response(JSON.stringify({ checkoutUrl, cartId: cartData.cart.id }), {
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
