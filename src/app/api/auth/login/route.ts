import { NextResponse } from "next/server";
import { createSessionCookie, getRequestMeta, verifyPassword } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { loginSchema } from "@/lib/validations";

export async function POST(request: Request) {
  try {
    const payload = loginSchema.parse(await request.json());
    const user = await prisma.user.findUnique({ where: { email: payload.email } });

    if (!user || !(await verifyPassword(payload.password, user.passwordHash))) {
      return NextResponse.json({ message: "E-mail ou senha invalidos." }, { status: 401 });
    }

    await createSessionCookie({
      sub: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    });

    const meta = await getRequestMeta();

    await prisma.auditLog.create({
      data: {
        actorUserId: user.id,
        userId: user.id,
        action: "LOGIN",
        entityType: "user",
        entityId: user.id,
        ipAddress: meta.ipAddress,
        userAgent: meta.userAgent,
        newData: { email: user.email },
      },
    });

    return NextResponse.json({ message: "Login realizado com sucesso." });
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : "Falha no login." }, { status: 400 });
  }
}

