import { supabase } from "@/integrations/supabase/client";

export async function createCartAndRedirect(variantId: string, quantity = 1): Promise<void> {
  const { data, error } = await supabase.functions.invoke("shopify-cart", {
    body: { variantId, quantity },
  });

  if (error) {
    throw new Error(error.message || "Erro ao criar carrinho");
  }

  if (data?.error) {
    throw new Error(data.error);
  }

  if (!data?.checkoutUrl) {
    throw new Error("URL de checkout não encontrada");
  }

  window.open(data.checkoutUrl, "_blank");
}
