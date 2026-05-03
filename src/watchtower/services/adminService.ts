import { apiClient } from "./apiClient";
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
  async getCameras(): Promise<AdminCameraDto[]> {
    return apiClient.get<AdminCameraDto[]>("/api/admin/cameras");
  },

  async createCamera(payload: CreateCameraPayload): Promise<string> {
    return apiClient.post<string>("/api/admin/cameras", payload);
  },

  async updateCamera(id: string, payload: CreateCameraPayload): Promise<string> {
    return apiClient.put<string>(`/api/admin/cameras/${id}`, payload);
  },

  async deleteCamera(id: string): Promise<string> {
    return apiClient.delete<string>(`/api/admin/cameras/${id}`);
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

  // ─── Bridge Config ─────────────────────────────────────────────────────────
  async downloadBridgeConfig(userId: string | null): Promise<void> {
    const path = userId ? `/api/admin/bridge/${userId}` : `/api/admin/bridge/unassigned`;
    const defaultName = userId
      ? `watchtower-bridge-${userId.replace(/-/g, "")}.zip`
      : `watchtower-bridge-sem-dono.zip`;
    const { blob, filename } = await apiClient.getBlob(path);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename ?? defaultName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  },
};

export { adminService };
