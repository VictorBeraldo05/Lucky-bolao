import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { closeDueLotofacilPools } from "@/lib/lotofacil-cutoff";

export const dynamic = "force-dynamic";

function isAuthorized(request: Request) {
  const secrets = [process.env.LOTTERY_SYNC_SECRET, process.env.CRON_SECRET].filter(
    (value): value is string => Boolean(value),
  );

  if (secrets.length === 0) {
    return process.env.NODE_ENV !== "production";
  }

  const authHeader = request.headers.get("authorization");
  const syncHeader = request.headers.get("x-sync-secret");

  return secrets.some((secret) => authHeader === `Bearer ${secret}` || syncHeader === secret);
}

async function handleClose(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ message: "Não autorizado." }, { status: 401 });
  }

  try {
    const result = await closeDueLotofacilPools();

    revalidatePath("/");
    revalidatePath("/loterias/lotofacil");
    revalidatePath("/loterias/lotofacil/boloes");
    revalidatePath("/resultados");
    revalidatePath("/meus-jogos");

    return NextResponse.json({
      message:
        result.closedPools > 0
          ? "Bolões da Lotofácil fechados para compra e aguardando apuração."
          : "Nenhum bolão precisou ser fechado neste momento.",
      ...result,
    });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Falha ao fechar os bolões da Lotofácil." },
      { status: 400 },
    );
  }
}

export async function GET(request: Request) {
  return handleClose(request);
}

export async function POST(request: Request) {
  return handleClose(request);
}
