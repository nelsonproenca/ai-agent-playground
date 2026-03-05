// Shopify Headless Checkout via Permalinks
const SHOPIFY_STORE_DOMAIN = "nelson-proenca-informatica.myshopify.com";
const STOREFRONT_API_VERSION = "2024-01";
const STOREFRONT_ACCESS_TOKEN = "21fcc0203069e1df316097a4bc221c5d";
const STOREFRONT_API_URL = `https://${SHOPIFY_STORE_DOMAIN}/api/${STOREFRONT_API_VERSION}/graphql.json`;

/**
 * Resolve Shopify MediaImage GIDs to real CDN URLs via Storefront API.
 * Accepts an array of GID strings and returns a map of GID -> URL.
 */
export async function resolveShopifyImageUrls(gids: string[]): Promise<Record<string, string>> {
  if (!gids.length) return {};

  const query = `
    query getNodes($ids: [ID!]!) {
      nodes(ids: $ids) {
        ... on MediaImage {
          id
          image {
            url
          }
        }
      }
    }
  `;

  try {
    const res = await fetch(STOREFRONT_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Storefront-Access-Token": STOREFRONT_ACCESS_TOKEN,
      },
      body: JSON.stringify({ query, variables: { ids: gids } }),
    });

    if (!res.ok) return {};

    const json = await res.json();
    const map: Record<string, string> = {};
    for (const node of json?.data?.nodes ?? []) {
      if (node?.id && node?.image?.url) {
        map[node.id] = node.image.url;
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
