import { NextResponse } from "next/server";
import { getCurrentUserFromRequest } from "@/lib/auth";
import { syncPendingCartPaymentsForUser } from "@/lib/cart";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const currentUser = await getCurrentUserFromRequest(request);
  if (!currentUser) {
    return NextResponse.json({ message: "Nao autenticado." }, { status: 401 });
  }

  await syncPendingCartPaymentsForUser(currentUser.id);

  const payments = await prisma.payment.findMany({
    where: { userId: currentUser.id, method: "pix" },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  const latestCartPayment = payments.find((payment) => {
    const metadata = (payment.metadata as { cartId?: string } | null) ?? {};
    return Boolean(metadata.cartId);
  });

  return NextResponse.json({ payment: latestCartPayment ?? null });
}
