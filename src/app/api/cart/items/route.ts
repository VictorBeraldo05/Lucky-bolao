import { NextResponse } from "next/server";
import { getCurrentUserFromRequest } from "@/lib/auth";
import { closeDueLotofacilPools } from "@/lib/lotofacil-cutoff";
import { prisma } from "@/lib/prisma";
import { cartItemSchema } from "@/lib/validations";

export async function POST(request: Request) {
  const currentUser = await getCurrentUserFromRequest(request);
  if (!currentUser) {
    return NextResponse.json({ message: "Não autenticado." }, { status: 401 });
  }

  try {
    await closeDueLotofacilPools();

    const payload = cartItemSchema.parse(await request.json());
    const pool = await prisma.pool.findUnique({ where: { id: payload.poolId } });
    if (!pool) {
      return NextResponse.json({ message: "Bolão não encontrado." }, { status: 404 });
    }
    if (pool.status !== "OPEN") {
      return NextResponse.json({ message: "Este bolão não está disponível para compra." }, { status: 400 });
    }
    if (pool.availableShares < payload.quantity) {
      return NextResponse.json({ message: "Quantidade maior que o disponível." }, { status: 400 });
    }

    const unitPrice = pool.sharePrice;
    const totalPrice = unitPrice.mul(payload.quantity);

    const { cart, item } = await prisma.$transaction(async (tx) => {
      const baseCart = await tx.cart.upsert({
        where: { userId: currentUser.id },
        update: {},
        create: {
          userId: currentUser.id,
          status: "OPEN",
        },
      });

      const cart =
        baseCart.status === "OPEN"
          ? baseCart
          : await tx.cart.update({
              where: { id: baseCart.id },
              data: { status: "OPEN" },
            });

      const existingItem = await tx.cartItem.findFirst({
        where: { cartId: cart.id, poolId: payload.poolId },
      });

      if (existingItem) {
        const newQuantity = existingItem.quantity + payload.quantity;
        if (pool.availableShares < newQuantity) {
          throw new Error("Quantidade no carrinho excede o disponível.");
        }

        const item = await tx.cartItem.update({
          where: { id: existingItem.id },
          data: {
            quantity: newQuantity,
            totalPrice: unitPrice.mul(newQuantity),
            updatedAt: new Date(),
          },
        });

        return { cart, item };
      }

      const item = await tx.cartItem.create({
        data: {
          cartId: cart.id,
          poolId: payload.poolId,
          quantity: payload.quantity,
          unitPrice,
          totalPrice,
        },
      });

      return { cart, item };
    });

    return NextResponse.json({ item, cart });
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : "Falha ao adicionar ao carrinho." }, { status: 400 });
  }
}

export async function GET(request: Request) {
  const currentUser = await getCurrentUserFromRequest(request);
  if (!currentUser) {
    return NextResponse.json({ message: "Não autenticado." }, { status: 401 });
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
        availableShares: item.pool.availableShares,
      },
    })) ?? [];

  const total = items.reduce((sum, item) => sum + Number(item.totalPrice), 0);

  return NextResponse.json({
    cartId: cart?.id ?? null,
    items,
    total,
  });
}
