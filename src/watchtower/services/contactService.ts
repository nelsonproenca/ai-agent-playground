import { apiClient } from "./apiClient";
import type { SubmitContactPayload } from "@/watchtower/types/api";

const contactService = {
  async submit(payload: SubmitContactPayload): Promise<void> {
    await apiClient.post<void>("/api/contact", payload, false);
  },
};

export { contactService };
