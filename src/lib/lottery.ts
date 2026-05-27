import { Prisma } from "@prisma/client";

export function calculateHits(gameNumbers: number[], drawnNumbers: number[]) {
  const drawn = new Set(drawnNumbers);
  return gameNumbers.filter((number) => drawn.has(number)).length;
}

export function resolvePoolPrizeAmount(
  prizeBreakdown: Record<string, number>,
  hitsByGame: number[],
) {
  return hitsByGame.reduce((sum, hits) => sum + (prizeBreakdown[String(hits)] ?? 0), 0);
}

export function decimalToNumber(value: Prisma.Decimal | number | string | null | undefined) {
  if (value == null) return 0;
  return Number(value);
}

