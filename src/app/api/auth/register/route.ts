import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { createSessionCookie, getRequestMeta, hashPassword } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { normalizeInviteCode } from "@/lib/referrals";
import { clearReferralCookie, getReferralCodeFromCookies } from "@/lib/referrals-server";
import { registerSchema } from "@/lib/validations";

export async function POST(request: Request) {
  try {
    const payload = registerSchema.parse(await request.json());
    const existing = await prisma.user.findUnique({ where: { email: payload.email } });

    if (existing) {
      return NextResponse.json({ message: "Este e-mail já está em uso." }, { status: 409 });
    }

    const passwordHash = await hashPassword(payload.password);
    const meta = await getRequestMeta();
    const referralCode = normalizeInviteCode(payload.referralCode) ?? (await getReferralCodeFromCookies());
    const inviter = referralCode
      ? await prisma.user.findUnique({
          where: { inviteCode: referralCode },
          select: { id: true },
        })
      : null;

    const user = await prisma.user.create({
      data: {
        name: payload.name,
        email: payload.email,
        cpf: payload.cpf,
        passwordHash,
        referredByUserId: inviter?.id ?? null,
        wallet: {
          create: {
            balance: new Prisma.Decimal(0),
            bonusBalance: new Prisma.Decimal(0),
          },
        },
        notifications: {
          create: {
            title: "Conta criada",
            message: "Sua conta foi criada com sucesso. Agora você já pode receber créditos e participar dos bolões.",
            type: "SUCCESS",
          },
        },
        auditLogs: {
          create: {
            actorUserId: undefined,
            action: "REGISTER",
            entityType: "user",
            entityId: "self",
            ipAddress: meta.ipAddress,
            userAgent: meta.userAgent,
            newData: { email: payload.email, referredByUserId: inviter?.id ?? null },
          },
        },
      },
    });

    await createSessionCookie({
      sub: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    });

    await clearReferralCookie();

    return NextResponse.json({ message: "Conta criada com sucesso." });
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : "Falha ao criar conta." }, { status: 400 });
  }
}
