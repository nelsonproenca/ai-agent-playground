import { supabase } from "@/integrations/supabase/client";
import type { CameraDto } from "@/watchtower/types/api";

/**
 * Lê câmeras direto do Supabase (fonte de verdade do cadastro).
 * O backend externo é usado apenas para gerar URLs HLS assinadas (streamService).
 *
 * RLS já filtra automaticamente:
 *  - admin vê todas
 *  - usuário vê apenas as câmeras com owner_user_id = ele OU sem dono
 */
const cameraService = {
  async getAll(): Promise<CameraDto[]> {
    const { data, error } = await supabase
      .from("cameras")
      .select("id, name, slug, location_name, is_active")
      .order("created_at", { ascending: false });

    if (error) throw error;

    return (data ?? []).map((row) => ({
      id: row.id,
      name: row.name,
      // Slug é necessário para o stream — fallback para id se ainda não estiver preenchido.
      slug: row.slug ?? row.id,
      locationName: row.location_name ?? "",
      isActive: row.is_active,
    }));
  },
};

export { cameraService };
