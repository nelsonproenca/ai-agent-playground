import { apiClient } from "./apiClient";
import type { StreamUrlDto } from "@/watchtower/types/api";

const streamService = {
  async getUrl(cameraSlug: string): Promise<StreamUrlDto> {
    return apiClient.get<StreamUrlDto>(`/api/stream/${encodeURIComponent(cameraSlug)}`);
  },
};

export { streamService };
