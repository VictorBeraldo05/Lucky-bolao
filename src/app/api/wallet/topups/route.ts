import { NextResponse } from "next/server";
import { getCurrentUserFromRequest } from "@/lib/auth";
import { createPixPayment, determineTopupStatus, normalizeCpf, parsePaymentTopupData } from "@/lib/mercadopago";
import { prisma } from "@/lib/prisma";
import { walletTopupSchema } from "@/lib/validations";

function normalizeAmount(value: number) {
  return value.toFixed(2);
}

function getCustomWalletPackageTitle(amount: number) {
  return `Deposito livre R$ ${normalizeAmount(amount).replace(".", ",")}`;
}

export async function POST(request: Request) {
  const currentUser = await getCurrentUserFromRequest(request);
  if (!currentUser) {
    return NextResponse.json({ message: "Não autenticado." }, { status: 401 });
  }

  if (!currentUser.cpf) {
    return NextResponse.json({ message: "CPF necessário para criar depósitos." }, { status: 400 });
  }

  try {
    const payload = walletTopupSchema.parse(await request.json());

    let walletPackage = null;
    let depositAmount = 0;

    if (payload.packageId) {
      walletPackage = await prisma.walletPackage.findUnique({ where: { id: payload.packageId } });
      if (!walletPackage) {
        return NextResponse.json({ message: "Pacote não encontrado." }, { status: 404 });
      }
      depositAmount = Number(walletPackage.price);
    } else if (payload.amount) {
      depositAmount = Number(payload.amount);
      const matchingPackage = await prisma.walletPackage.findFirst({
        where: { price: depositAmount },
        orderBy: { createdAt: "asc" },
      });

      walletPackage =
        matchingPackage ??
        (await prisma.walletPackage.upsert({
          where: { title: getCustomWalletPackageTitle(depositAmount) },
          update: {
            price: depositAmount,
            description: "Credito personalizado para carteira.",
          },
          create: {
            title: getCustomWalletPackageTitle(depositAmount),
            description: "Credito personalizado para carteira.",
            price: depositAmount,
          },
        }));
    }

    if (!walletPackage || !depositAmount) {
      return NextResponse.json({ message: "Informe um valor válido para depósito." }, { status: 400 });
    }

    const payment = await createPixPayment({
      email: currentUser.email,
      name: currentUser.name,
      cpf: currentUser.cpf,
      title: walletPackage.title,
      amount: depositAmount,
      referenceId: `topup-${walletPackage.id}-${Date.now()}`,
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
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Falha ao criar topup." },
      { status: 400 },
    );
  }
}
