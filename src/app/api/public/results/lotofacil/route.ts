import { NextResponse } from "next/server";
import { fetchLatestOfficialLotofacilResultDirect } from "@/lib/lotofacil-official";

export const dynamic = "force-dynamic";

function isAuthorized(request: Request) {
  const secret = process.env.LOTTERY_RESULTS_PROXY_SECRET;

  if (!secret) {
    return true;
  }

  return request.headers.get("authorization") === `Bearer ${secret}`;
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ message: "Não autorizado." }, { status: 401 });
  }

  try {
    const result = await fetchLatestOfficialLotofacilResultDirect();
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Falha ao consultar resultado oficial da Lotofácil." },
      { status: 400 },
    );
  }
}
