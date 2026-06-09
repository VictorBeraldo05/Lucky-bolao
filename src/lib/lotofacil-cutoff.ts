import { PoolStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const BRAZIL_TIMEZONE = "America/Sao_Paulo";
const CUTOFF_HOUR = 20;
const CUTOFF_MINUTE = 30;

function getBrazilDateParts(date = new Date()) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: BRAZIL_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  const parts = formatter.formatToParts(date);
  const read = (type: string) => Number(parts.find((part) => part.type === type)?.value ?? 0);

  return {
    year: read("year"),
    month: read("month"),
    day: read("day"),
    hour: read("hour"),
    minute: read("minute"),
  };
}

function isSameBrazilCalendarDay(left: Date, right = new Date()) {
  const leftParts = getBrazilDateParts(left);
  const rightParts = getBrazilDateParts(right);

  return (
    leftParts.year === rightParts.year &&
    leftParts.month === rightParts.month &&
    leftParts.day === rightParts.day
  );
}

export function isAfterLotofacilSalesCutoff(now = new Date()) {
  const parts = getBrazilDateParts(now);
  return parts.hour > CUTOFF_HOUR || (parts.hour === CUTOFF_HOUR && parts.minute >= CUTOFF_MINUTE);
}

export async function closeDueLotofacilPools() {
  if (!isAfterLotofacilSalesCutoff()) {
    return {
      closedPools: 0,
      updatedContests: 0,
    };
  }

  const candidatePools = await prisma.pool.findMany({
    where: {
      lottery: { slug: "lotofacil" },
      status: { in: [PoolStatus.OPEN, PoolStatus.SOLD_OUT] },
    },
    include: {
      contest: true,
    },
  });

  const duePools = candidatePools.filter((pool) => isSameBrazilCalendarDay(pool.contest.drawDate));
  if (duePools.length === 0) {
    return {
      closedPools: 0,
      updatedContests: 0,
    };
  }

  const contestIds = [...new Set(duePools.map((pool) => pool.contestId))];

  const poolUpdate = await prisma.pool.updateMany({
    where: {
      id: { in: duePools.map((pool) => pool.id) },
    },
    data: {
      status: PoolStatus.WAITING_DRAW,
    },
  });

  const contestUpdate = await prisma.contest.updateMany({
    where: {
      id: { in: contestIds },
      status: { not: "finished" },
    },
    data: {
      status: "awaiting_draw",
    },
  });

  return {
    closedPools: poolUpdate.count,
    updatedContests: contestUpdate.count,
  };
}
