import { NextResponse } from "next/server";
import { getCurrentUserFromRequest, getRequestMeta } from "@/lib/auth";
import { requestWalletWithdrawal } from "@/lib/wallet";
import { walletWithdrawalSchema } from "@/lib/validations";

export async function POST(request: Request) {
  const currentUser = await getCurrentUserFromRequest(request);
  if (!currentUser) {
    return NextResponse.json({ message: "Nao autenticado." }, { status: 401 });
  }

  try {
    const payload = walletWithdrawalSchema.parse(await request.json());
    const meta = await getRequestMeta();
    const withdrawal = await requestWalletWithdrawal(currentUser.id, payload, meta);

    return NextResponse.json({
      message: "Solicitacao enviada. O saque pode levar ate 24h para ser finalizado.",
      withdrawal,
    });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Falha ao solicitar saque." },
      { status: 400 },
    );
  }
}
