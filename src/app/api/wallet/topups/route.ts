import { NextResponse } from "next/server";
import { getCurrentUserFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { walletTopupSchema } from "@/lib/validations";
import { createPixPayment, normalizeCpf, parsePaymentTopupData, determineTopupStatus } from "@/lib/mercadopago";

export async function POST(request: Request) {
  const currentUser = await getCurrentUserFromRequest(request);
  if (!currentUser) {
    return NextResponse.json({ message: "Nao autenticado." }, { status: 401 });
  }

  if (!currentUser.cpf) {
    return NextResponse.json({ message: "CPF necessario para criar depositos." }, { status: 400 });
  }

  try {
    const payload = walletTopupSchema.parse(await request.json());
    const walletPackage = await prisma.walletPackage.findUnique({ where: { id: payload.packageId } });
    if (!walletPackage) {
      return NextResponse.json({ message: "Pacote nao encontrado." }, { status: 404 });
    }

    const payment = await createPixPayment({
      email: currentUser.email,
      name: currentUser.name,
      cpf: currentUser.cpf,
      title: walletPackage.title,
      packageId: walletPackage.id,
      price: Number(walletPackage.price),
    });

    const paymentData = parsePaymentTopupData(payment);
    const status = determineTopupStatus(payment, currentUser.cpf);

    const topup = await prisma.walletTopup.create({
      data: {
        userId: currentUser.id,
        packageId: walletPackage.id,
        providerChargeId: String(payment.id),
        payerCpfExpected: normalizeCpf(currentUser.cpf),
        status,
        qrCodeText: paymentData.qrCodeText,
        qrCodeImageBase64: paymentData.qrCodeImageBase64,
        paymentLinkUrl: paymentData.paymentLinkUrl,
        expiresAt: paymentData.expiresAt ? new Date(paymentData.expiresAt) : undefined,
        providerPayload: payment,
      },
      include: { package: true },
    });

    return NextResponse.json({ topup });
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : "Falha ao criar topup." }, { status: 400 });
  }
}
