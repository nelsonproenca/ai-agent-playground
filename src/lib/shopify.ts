// Shopify Headless Checkout via Permalinks
const SHOPIFY_STORE_DOMAIN = "nelson-proenca-informatica.myshopify.com";

/**
 * Resolve Shopify MediaImage GIDs to CDN URLs using the products.json public endpoint.
 * Falls back gracefully if the endpoint is unavailable.
 */
export async function resolveShopifyImageUrls(gids: string[]): Promise<Record<string, string>> {
  if (!gids.length) return {};

  try {
    const res = await fetch(`https://${SHOPIFY_STORE_DOMAIN}/products.json?limit=250`);
    if (!res.ok) return {};

    const json = await res.json();
    const map: Record<string, string> = {};

    for (const product of json?.products ?? []) {
      // Map product images
      for (const img of product?.images ?? []) {
        // Build GID from the image id
        const gid = `gid://shopify/MediaImage/${img.id}`;
        if (gids.includes(gid) && img.src) {
          map[gid] = img.src;
        }
      }
      // Also check the main image
      if (product?.image?.id && product?.image?.src) {
        const gid = `gid://shopify/MediaImage/${product.image.id}`;
        if (gids.includes(gid)) {
          map[gid] = product.image.src;
        }
      }
    }
    return map;
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
