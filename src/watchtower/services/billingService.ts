import { apiClient } from "./apiClient";
import type { BillingItemDto } from "@/watchtower/types/api";

const billingService = {
  async getHistory(): Promise<BillingItemDto[]> {
    return apiClient.get<BillingItemDto[]>("/api/billing");
  },
};

export { billingService };
