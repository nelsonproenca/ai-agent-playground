import { apiClient } from "./apiClient";
import type { NotificationPreferencesDto } from "@/watchtower/types/api";

const userService = {
  async updateProfile(displayName: string): Promise<void> {
    await apiClient.put<void>("/api/users/profile", { displayName });
  },

  async getNotifications(): Promise<NotificationPreferencesDto> {
    return apiClient.get<NotificationPreferencesDto>("/api/users/notifications");
  },

  async updateNotifications(prefs: NotificationPreferencesDto): Promise<void> {
    await apiClient.put<void>("/api/users/notifications", prefs);
  },
};

export { userService };
