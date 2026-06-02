import { NextResponse } from "next/server";
import { fetchOfficialLotofacilResultByContestDirect } from "@/lib/lotofacil-official";

export const dynamic = "force-dynamic";

function isAuthorized(request: Request) {
  const secret = process.env.LOTTERY_RESULTS_PROXY_SECRET;

  if (!secret) {
    return true;
  }

  return request.headers.get("authorization") === `Bearer ${secret}`;
}

export async function GET(
  request: Request,
  context: { params: Promise<{ contestNumber: string }> },
) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ message: "Não autorizado." }, { status: 401 });
  }

  try {
    const { contestNumber } = await context.params;
    const parsedContestNumber = Number.parseInt(contestNumber, 10);

    if (!Number.isInteger(parsedContestNumber) || parsedContestNumber <= 0) {
      return NextResponse.json({ message: "Concurso inválido." }, { status: 400 });
    }

    const result = await fetchOfficialLotofacilResultByContestDirect(parsedContestNumber);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Falha ao consultar concurso da Lotofácil." },
      { status: 400 },
    );
  }
}
