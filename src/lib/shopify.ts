// Shopify Headless Checkout via Permalinks
const SHOPIFY_STORE_DOMAIN = "sualoja.myshopify.com"; // Configure aqui

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
