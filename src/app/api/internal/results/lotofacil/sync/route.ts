import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { syncPendingLotofacilContests } from "@/lib/lotofacil-sync";

export const dynamic = "force-dynamic";

function isAuthorized(request: Request) {
  const secret = process.env.LOTTERY_SYNC_SECRET ?? process.env.CRON_SECRET;

  if (!secret) {
    return process.env.NODE_ENV !== "production";
  }

  const authHeader = request.headers.get("authorization");
  const syncHeader = request.headers.get("x-sync-secret");

  return authHeader === `Bearer ${secret}` || syncHeader === secret;
}

async function handleSync(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ message: "Não autorizado." }, { status: 401 });
  }

  try {
    const result = await syncPendingLotofacilContests();

    revalidatePath("/resultados");
    revalidatePath("/admin/resultados");
    revalidatePath("/admin/premios");
    revalidatePath("/meus-jogos");
    revalidatePath("/carteira");
    revalidatePath("/resgates");

    return NextResponse.json({
      message: result.processed.length > 0 ? "Resultados da Lotofácil sincronizados." : "Nenhum concurso pendente para sincronizar.",
      ...result,
    });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Falha ao sincronizar resultados da Lotofácil." },
      { status: 400 },
    );
  }
}

export async function GET(request: Request) {
  return handleSync(request);
}

export async function POST(request: Request) {
  return handleSync(request);
}
