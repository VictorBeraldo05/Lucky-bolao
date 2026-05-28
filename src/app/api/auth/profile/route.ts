import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { profileCpfSchema } from "@/lib/validations";
import { normalizeCpf } from "@/lib/mercadopago";

export async function PATCH(request: Request) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return NextResponse.json({ message: "Nao autenticado." }, { status: 401 });
  }

  try {
    const payload = profileCpfSchema.parse(await request.json());
    const cpf = normalizeCpf(payload.cpf);
    await prisma.user.update({ where: { id: currentUser.id }, data: { cpf } });
    return NextResponse.json({ message: "CPF atualizado com sucesso." });
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : "Falha ao atualizar CPF." }, { status: 400 });
  }
}
