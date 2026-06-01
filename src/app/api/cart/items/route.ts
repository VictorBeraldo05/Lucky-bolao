import { NextResponse } from "next/server";
import { getCurrentUserFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { cartItemSchema } from "@/lib/validations";

export async function POST(request: Request) {
  const currentUser = await getCurrentUserFromRequest(request);
  if (!currentUser) {
    return NextResponse.json({ message: "Nao autenticado." }, { status: 401 });
  }

  try {
    const payload = cartItemSchema.parse(await request.json());
    const pool = await prisma.pool.findUnique({ where: { id: payload.poolId } });
    if (!pool) {
      return NextResponse.json({ message: "Bolao nao encontrado." }, { status: 404 });
    }
    if (pool.status !== "OPEN") {
      return NextResponse.json({ message: "Este bolao nao esta disponivel para compra." }, { status: 400 });
    }
    if (pool.availableShares < payload.quantity) {
      return NextResponse.json({ message: "Quantidade maior que o disponivel." }, { status: 400 });
    }

    let cart = await prisma.cart.findFirst({
      where: { userId: currentUser.id, status: "OPEN" },
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: { userId: currentUser.id },
      });
    }

    const existingItem = await prisma.cartItem.findFirst({
      where: { cartId: cart.id, poolId: payload.poolId },
    });

    const unitPrice = pool.sharePrice;
    const totalPrice = unitPrice.mul(payload.quantity);

    let item;
    if (existingItem) {
      const newQuantity = existingItem.quantity + payload.quantity;
      if (pool.availableShares < newQuantity) {
        return NextResponse.json({ message: "Quantidade no carrinho excede o disponivel." }, { status: 400 });
      }
      item = await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: {
          quantity: newQuantity,
          totalPrice: unitPrice.mul(newQuantity),
          updatedAt: new Date(),
        },
      });
    } else {
      item = await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          poolId: payload.poolId,
          quantity: payload.quantity,
          unitPrice,
          totalPrice,
        },
      });
    }

    return NextResponse.json({ item, cart });
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : "Falha ao adicionar ao carrinho." }, { status: 400 });
  }
}

export async function GET(request: Request) {
  const currentUser = await getCurrentUserFromRequest(request);
  if (!currentUser) {
    return NextResponse.json({ message: "Nao autenticado." }, { status: 401 });
  }

  const cart = await prisma.cart.findFirst({
    where: { userId: currentUser.id, status: "OPEN" },
    include: { items: { include: { pool: true } } },
  });

  const items =
    cart?.items.map((item) => ({
      id: item.id,
      quantity: item.quantity,
      unitPrice: item.unitPrice.toString(),
      totalPrice: item.totalPrice.toString(),
      pool: {
        id: item.pool.id,
        title: item.pool.title,
        code: item.pool.code,
      },
    })) ?? [];

  const total = items.reduce((sum, item) => sum + Number(item.totalPrice), 0);

  return NextResponse.json({
    cartId: cart?.id ?? null,
    items,
    total,
  });
}
