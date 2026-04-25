import { apiClient } from "./apiClient";
import { supabase } from "@/integrations/supabase/client";
import type {
  AdminCameraDto,
  AdminPaymentDto,
  AdminPlanDto,
  AdminUserDto,
  ApprovePaymentPayload,
  CreateCameraPayload,
  CreatePlanPayload,
} from "@/watchtower/types/api";

const adminService = {
  // ─── Plans ─────────────────────────────────────────────────────────────────
  async getPlans(): Promise<AdminPlanDto[]> {
    return apiClient.get<AdminPlanDto[]>("/api/admin/plans");
  },

  async createPlan(payload: CreatePlanPayload): Promise<string> {
    return apiClient.post<string>("/api/admin/plans", payload);
  },

  async updatePlan(id: string, payload: CreatePlanPayload): Promise<string> {
    return apiClient.put<string>(`/api/admin/plans/${id}`, payload);
  },

  async deletePlan(id: string): Promise<string> {
    return apiClient.delete<string>(`/api/admin/plans/${id}`);
  },

  // ─── Cameras ───────────────────────────────────────────────────────────────
  // Persistência via Supabase (RLS já restringe a admin). O backend externo
  // continua sendo usado apenas para gerar URLs HLS assinadas.
  async getCameras(): Promise<AdminCameraDto[]> {
    const { data, error } = await supabase
      .from("cameras")
      .select("id, owner_user_id, name, slug, location_name, is_active")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []).map((row) => ({
      id: row.id,
      ownerUserId: row.owner_user_id,
      name: row.name,
      slug: row.slug ?? "",
      locationName: row.location_name ?? "",
      isActive: row.is_active,
    }));
  },

  async createCamera(payload: CreateCameraPayload): Promise<string> {
    const { data, error } = await supabase
      .from("cameras")
      .insert({
        name: payload.name,
        slug: payload.slug,
        location_name: payload.locationName ?? "",
        hls_base_url: payload.hlsBaseUrl || null,
        is_active: payload.isActive,
        owner_user_id: payload.ownerUserId || null,
      })
      .select("id")
      .single();
    if (error) throw error;
    return data.id;
  },

  async updateCamera(id: string, payload: CreateCameraPayload): Promise<string> {
    const updates: Record<string, unknown> = {
      name: payload.name,
      slug: payload.slug,
      location_name: payload.locationName ?? "",
      is_active: payload.isActive,
      owner_user_id: payload.ownerUserId || null,
    };
    // hlsBaseUrl é opcional no update — só sobrescreve se vier preenchido.
    if (payload.hlsBaseUrl) updates.hls_base_url = payload.hlsBaseUrl;

    const { error } = await supabase.from("cameras").update(updates).eq("id", id);
    if (error) throw error;
    return id;
  },

  async deleteCamera(id: string): Promise<string> {
    const { error } = await supabase.from("cameras").delete().eq("id", id);
    if (error) throw error;
    return id;
  },

  // ─── Users ─────────────────────────────────────────────────────────────────
  async getUsers(): Promise<AdminUserDto[]> {
    return apiClient.get<AdminUserDto[]>("/api/admin/users");
  },

  async promoteUser(userId: string): Promise<string> {
    return apiClient.post<string>(`/api/admin/users/${userId}/promote`, {});
  },

  async demoteUser(userId: string): Promise<string> {
    return apiClient.post<string>(`/api/admin/users/${userId}/demote`, {});
  },

  // ─── Payments ──────────────────────────────────────────────────────────────
  async getPayments(): Promise<AdminPaymentDto[]> {
    return apiClient.get<AdminPaymentDto[]>("/api/admin/payments");
  },

  async approvePayment(paymentId: string, payload: ApprovePaymentPayload): Promise<string> {
    return apiClient.post<string>(`/api/admin/payments/${paymentId}/approve`, payload);
  },

  async rejectPayment(paymentId: string): Promise<string> {
    return apiClient.post<string>(`/api/admin/payments/${paymentId}/reject`, {});
  },
};

export { adminService };
