import { apiClient } from "./apiClient";
import type { CameraDto, RecordingWindowDto } from "@/watchtower/types/api";

export interface RecordingWindowWithCamera extends RecordingWindowDto {
  cameraSlug: string;
  cameraName: string;
}

const recordingService = {
  async listWindows(cameraSlug: string): Promise<RecordingWindowDto[]> {
    return apiClient.get<RecordingWindowDto[]>(`/api/cameras/${encodeURIComponent(cameraSlug)}/recordings/`);
  },

  /** Busca janelas de várias câmeras em paralelo — tolera falha por câmera
   * (ex: sem gravação ainda) sem derrubar a lista inteira. */
  async listAllWindows(cameras: CameraDto[]): Promise<RecordingWindowWithCamera[]> {
    const results = await Promise.allSettled(
      cameras.map(async (camera) => {
        const windows = await recordingService.listWindows(camera.slug);
        return windows.map((w) => ({ ...w, cameraSlug: camera.slug, cameraName: camera.name }));
      }),
    );
    return results
      .filter((r): r is PromiseFulfilledResult<RecordingWindowWithCamera[]> => r.status === "fulfilled")
      .flatMap((r) => r.value)
      .sort((a, b) => b.start.localeCompare(a.start));
  },

  async download(cameraSlug: string, window: RecordingWindowDto): Promise<{ blob: Blob; filename?: string }> {
    const params = new URLSearchParams({
      start: window.start,
      durationSeconds: window.durationSeconds.toString(),
    });
    return apiClient.getBlob(
      `/api/cameras/${encodeURIComponent(cameraSlug)}/recordings/download?${params.toString()}`,
    );
  },
};

export { recordingService };
