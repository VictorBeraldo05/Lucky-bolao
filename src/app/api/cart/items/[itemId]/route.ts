import { z } from "zod";
import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { getCurrentUserFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const updateQuantitySchema = z.object({
  quantity: z.number().int().positive().max(50),
});

export async function PATCH(request: Request, { params }: { params: Promise<{ itemId: string }> }) {
  const currentUser = await getCurrentUserFromRequest(request);
  if (!currentUser) {
    return NextResponse.json({ message: "Não autenticado." }, { status: 401 });
  }

  try {
    const { itemId } = await params;
    const payload = updateQuantitySchema.parse(await request.json());
    const item = await prisma.cartItem.findUnique({ where: { id: itemId }, include: { cart: true, pool: true } });
    if (!item || item.cart.userId !== currentUser.id) {
      return NextResponse.json({ message: "Item do carrinho não encontrado." }, { status: 404 });
    }
    if (item.pool.availableShares < payload.quantity) {
      return NextResponse.json({ message: "Quantidade maior que o disponível." }, { status: 400 });
    }

    const updatedItem = await prisma.cartItem.update({
      where: { id: item.id },
      data: {
        quantity: payload.quantity,
        totalPrice: item.unitPrice.mul(new Prisma.Decimal(payload.quantity)),
      },
    });

    return NextResponse.json({ item: updatedItem });
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : "Falha ao atualizar item." }, { status: 400 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ itemId: string }> }) {
  const currentUser = await getCurrentUserFromRequest(request);
  if (!currentUser) {
    return NextResponse.json({ message: "Não autenticado." }, { status: 401 });
  }

  const { itemId } = await params;
  const item = await prisma.cartItem.findUnique({ where: { id: itemId }, include: { cart: true } });
  if (!item || item.cart.userId !== currentUser.id) {
    return NextResponse.json({ message: "Item do carrinho não encontrado." }, { status: 404 });
  }

  await prisma.cartItem.delete({ where: { id: item.id } });
  return NextResponse.json({ message: "Item removido do carrinho." });
}
