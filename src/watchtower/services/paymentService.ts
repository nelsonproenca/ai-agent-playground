import { apiClient } from "./apiClient";
import type {
  SubmitPaymentPayload,
  SubmitPaymentResponse,
  PaymentStatusDto,
} from "@/watchtower/types/api";

const paymentService = {
  async submitComprovante(
    payload: SubmitPaymentPayload,
  ): Promise<SubmitPaymentResponse> {
    const form = new FormData();
    form.append("planId", payload.planId);
    form.append("nome", payload.nome);
    form.append("cpf", payload.cpf);
    form.append("comprovante", payload.comprovante);
    return apiClient.postForm<SubmitPaymentResponse>("/api/payments/submit", form);
  },

  async getStatus(): Promise<PaymentStatusDto> {
    return apiClient.get<PaymentStatusDto>("/api/payments/status");
  },
};

export { paymentService };
