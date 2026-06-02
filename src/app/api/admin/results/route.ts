import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { publishContestResult } from "@/lib/contest-settlement";
import { getCurrentUser, getRequestMeta } from "@/lib/auth";
import { resultSchema } from "@/lib/validations";

export async function POST(request: Request) {
  const admin = await getCurrentUser();

  if (!admin || admin.role !== "ADMIN") {
    return NextResponse.json({ message: "Acesso restrito." }, { status: 403 });
  }

  try {
    const payload = resultSchema.parse(await request.json());
    const meta = await getRequestMeta();

    const result = await publishContestResult({
      contestId: payload.contestId,
      drawnNumbers: payload.drawnNumbers,
      prizeBreakdown: payload.prizeBreakdown,
      source: payload.source,
      actorUserId: admin.id,
      meta,
    });

    revalidatePath("/resultados");
    revalidatePath("/admin/resultados");
    revalidatePath("/admin/premios");
    revalidatePath("/meus-jogos");
    revalidatePath("/carteira");
    revalidatePath("/resgates");

    return NextResponse.json({
      message: result.alreadyProcessed ? "Esse concurso já estava processado." : "Resultado publicado e premiação processada.",
      result,
    });
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : "Falha ao publicar resultado." }, { status: 400 });
  }
}
