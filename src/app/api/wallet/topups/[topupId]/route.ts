import { NextResponse } from "next/server";
import { getCurrentUserFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { syncWalletTopup } from "@/lib/wallet";

export async function GET(request: Request, context: { params: Promise<{ topupId: string }> }) {
  const { topupId } = await context.params;
  const currentUser = await getCurrentUserFromRequest(request);
  if (!currentUser) {
    return NextResponse.json({ message: "Nao autenticado." }, { status: 401 });
  }

  const topup = await prisma.walletTopup.findUnique({
    where: { id: topupId },
    include: { package: true },
  });

  if (!topup || topup.userId !== currentUser.id) {
    return NextResponse.json({ message: "Topup nao encontrado." }, { status: 404 });
  }

  if (topup.status === "PENDING" && topup.providerChargeId) {
    try {
      const updatedTopup = await syncWalletTopup(topup.id);
      return NextResponse.json({ topup: updatedTopup });
    } catch (error) {
      return NextResponse.json({ message: error instanceof Error ? error.message : "Falha ao atualizar topup." }, { status: 400 });
    }
  }

  return NextResponse.json({ topup });
}
