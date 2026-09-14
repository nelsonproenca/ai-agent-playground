export function getDateGroup(iso: string): string {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 86400000);
  const weekAgo = new Date(today.getTime() - 7 * 86400000);
  const d = new Date(iso);
  const day = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  if (day >= today) return "Hoje";
  if (day >= yesterday) return "Ontem";
  if (day >= weekAgo) return "Esta semana";
  return "Anterior";
}

export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

export const DATE_GROUP_ORDER = ["Hoje", "Ontem", "Esta semana", "Anterior"];
