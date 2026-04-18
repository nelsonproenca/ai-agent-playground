import { apiClient } from "./apiClient";
import type { CameraDto } from "@/watchtower/types/api";

const cameraService = {
  async getAll(): Promise<CameraDto[]> {
    return apiClient.get<CameraDto[]>("/api/cameras");
  },
};

export { cameraService };
