// Shopify Headless Checkout via Permalinks
const SHOPIFY_STORE_DOMAIN = "nelson-proenca-informatica.myshopify.com";

/**
 * Resolve Shopify product images via edge function.
 * Returns a map of shopify_id (numeric) -> CDN image URL.
 */
export async function resolveShopifyImageUrls(): Promise<Record<string, string>> {
  try {
    const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID || "nsdektdgohfqfioonosc";
    const res = await fetch(
      `https://${projectId}.supabase.co/functions/v1/resolve-shopify-images`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
      }
    );
    if (!res.ok) return {};
    return await res.json();
  } catch {
    console.error("Failed to resolve Shopify image URLs");
    return {};
  }
}

export function buildCheckoutUrl(variantId: string, quantity = 1, discountCode?: string): string {
  let url = `https://${SHOPIFY_STORE_DOMAIN}/cart/${variantId}:${quantity}`;
  if (discountCode) {
    url += `?discount=${encodeURIComponent(discountCode)}`;
  }
  return url;
}

export function redirectToCheckout(variantId: string, quantity = 1, discountCode?: string) {
  const url = buildCheckoutUrl(variantId, quantity, discountCode);
  window.open(url, "_blank");
}
