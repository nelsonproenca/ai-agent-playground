import { apiClient } from "./apiClient";
import type {
  HealthConfigDto,
  HealthLogDto,
  RunHealthCheckResult,
  UpdateHealthConfigPayload,
} from "@/watchtower/types/api";

interface GetLogsParams {
  limit?: number;
  cameraId?: string;
}

const healthCheckService = {
  async getConfig(): Promise<HealthConfigDto> {
    return apiClient.get<HealthConfigDto>("/api/health-check/config");
  },

  async updateConfig(config: UpdateHealthConfigPayload): Promise<void> {
    await apiClient.put<void>("/api/health-check/config", config);
  },

  async getLogs(params?: GetLogsParams): Promise<HealthLogDto[]> {
    const qs = new URLSearchParams();
    if (params?.limit !== undefined) qs.set("limit", String(params.limit));
    if (params?.cameraId) qs.set("cameraId", params.cameraId);
    const query = qs.size > 0 ? `?${qs.toString()}` : "";
    return apiClient.get<HealthLogDto[]>(`/api/health-check/logs${query}`);
  },

  async run(): Promise<RunHealthCheckResult> {
    return apiClient.post<RunHealthCheckResult>("/api/health-check/run", {});
  },
};

export { healthCheckService };
