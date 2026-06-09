import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number | string | { toString(): string }) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(value));
}

export function formatDate(value: Date | string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function getWalletAvailableBalance(wallet?: { balance?: number | string | { toString(): string } | null; bonusBalance?: number | string | { toString(): string } | null } | null) {
  return Number(wallet?.balance ?? 0) + Number(wallet?.bonusBalance ?? 0);
}

export function getWalletBonusBalance(wallet?: { bonusBalance?: number | string | { toString(): string } | null } | null) {
  return Number(wallet?.bonusBalance ?? 0);
}

export function slugToLabel(slug: string) {
  return slug
    .split("-")
    .map((item) => item.charAt(0).toUpperCase() + item.slice(1))
    .join(" ");
}

export function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return "Ocorreu um erro inesperado.";
}

export function getPoolCommercialSummary(input: {
  relativeChance?: string | null;
  description?: string | null;
  totalShares: number;
  sharePrice: number | string | { toString(): string };
  gamesCount: number;
  numbersPerGame?: number | null;
}) {
  return {
    gamesLabel: `${input.gamesCount} jogos`,
    equivalentLabel: `${input.numbersPerGame ?? 15} dezenas`,
    sharesLabel: `${input.totalShares} cotas`,
    sharePriceLabel: `${formatCurrency(input.sharePrice)}/cota`,
  };
}
