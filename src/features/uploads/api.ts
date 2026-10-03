import { portalApi } from "@/features/portal-shared/apiClient";

/**
 * Imagens públicas do site (logos de clientes, fotos de colaboradores, convites), guardadas no disco do
 * portal-api. Envio e remoção só do admin; a leitura é pública pela `url` devolvida.
 */

export type PastaUpload = "clientes" | "colaboradores" | "convites";

/** Limite do servidor (2 MB), repetido aqui só para avisar antes de enviar. */
export const TAMANHO_MAXIMO_BYTES = 2 * 1024 * 1024;

export interface UploadCriado {
  pasta: PastaUpload;
  arquivo: string;
  path: string;
  url: string;
}

export interface Convite {
  arquivo: string;
  url: string;
  tamanho: number;
  atualizadoEm: string;
}

export function uploadImagem(pasta: PastaUpload, file: File): Promise<UploadCriado> {
  const formData = new FormData();
  formData.append("file", file);
  return portalApi.postForm<UploadCriado>(`/uploads/${pasta}`, formData);
}

export const removerUpload = (pasta: PastaUpload, arquivo: string) =>
  portalApi.delete<void>(`/uploads/${pasta}/${encodeURIComponent(arquivo)}`);

/** Imagens de convite (público). */
export const listConvites = () => portalApi.get<Convite[]>("/convites");

/**
 * Nome do convite de uma pessoa: `convite-<nome-sem-acento-e-simbolos>.png`. O gerador grava com esse nome e a
 * landing procura o convite de cada colaborador por ele, então os dois usam esta mesma função. O servidor só
 * aceita letras, números, ponto, hífen e sublinhado, por isso o resto é descartado.
 */
export function nomeDoConvite(nomePessoa: string): string {
  const slug = nomePessoa
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `convite-${slug || "sem-nome"}.png`;
}

/** Grava (ou regrava) o convite com nome fixo. Só admin. */
export function salvarConvite(arquivo: string, imagem: Blob): Promise<UploadCriado> {
  const formData = new FormData();
  formData.append("file", imagem, arquivo);
  return portalApi.putForm<UploadCriado>(`/uploads/convites/${encodeURIComponent(arquivo)}`, formData);
}
