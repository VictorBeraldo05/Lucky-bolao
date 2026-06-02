const statusLabels: Record<string, string> = {
  OPEN: "Aberto",
  SOLD_OUT: "Esgotado",
  CLOSED: "Encerrado",
  WAITING_DRAW: "Aguardando sorteio",
  AWARDED: "Premiado",
  NOT_AWARDED: "Não premiado",
  CANCELED: "Cancelado",
  PAID: "Pago",
  PENDING: "Pendente",
  APPROVED: "Aprovado",
  INFO: "Informativo",
  SUCCESS: "Sucesso",
  WARNING: "Aviso",
};

export function formatStatusLabel(status: string) {
  return statusLabels[status] ?? status.replaceAll("_", " ");
}
