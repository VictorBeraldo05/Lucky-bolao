import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { AccountShell } from "@/components/account-shell";
import { CartItemsTable } from "@/components/cart/cart-items-table";
import { CartCheckoutPanel } from "@/components/cart/cart-checkout-panel";
import { syncPendingCartPaymentsForUser } from "@/lib/cart";

export default async function CartPage() {
  const user = await requireUser();
  try {
    await syncPendingCartPaymentsForUser(user.id);
  } catch {
    // keep cart page available even if payment sync fails
  }
  const cart = await prisma.cart.findUnique({
    where: { userId: user.id },
    include: { items: { include: { pool: true } } },
  });

  const cartItems =
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

  const total = cartItems.reduce((sum, item) => sum + Number(item.totalPrice), 0);

  return (
    <AccountShell currentPath="/carrinho" title="Carrinho" description="Revise seus itens e finalize a compra via PIX no carrinho.">
      <div className="grid gap-6 xl:grid-cols-[1.4fr_0.8fr]">
        <CartItemsTable initialItems={cartItems} />
        <CartCheckoutPanel total={total} userCpf={user.cpf ?? null} />
      </div>
      {cartItems.length === 0 ? (
        <div className="mt-6 rounded-[28px] border border-white/80 bg-white/90 p-6 text-center text-slate-600 shadow-sm">
          Não há itens no carrinho. Selecione uma cota em algum bolão para adicionar ao carrinho.
        </div>
      ) : null}
    </AccountShell>
  );
}
