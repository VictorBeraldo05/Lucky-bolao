import Link from "next/link";
import { CartCheckoutPanel } from "@/components/cart/cart-checkout-panel";
import { CartItemsTable } from "@/components/cart/cart-items-table";
import { formatCurrency } from "@/lib/utils";

type MobileCartItem = {
  id: string;
  quantity: number;
  unitPrice: string;
  totalPrice: string;
  pool: {
    id: string;
    title: string;
    code: string;
  };
};

type MobileCartViewProps = {
  items: MobileCartItem[];
  total: number;
  userCpf?: string | null;
  walletAvailableBalance?: number;
};

export function MobileCartView({ items, total, userCpf, walletAvailableBalance = 0 }: MobileCartViewProps) {
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="space-y-4 px-4 py-4 pb-40 md:hidden">
      <section className="rounded-[28px] border border-white/80 bg-white/95 p-5 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-fuchsia-500">Carrinho</p>
        <h1 className="mt-2 text-[2rem] font-black leading-[1.05] tracking-tight text-slate-900">Finalize sua compra</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Revise seus itens, confira o total e escolha se quer pagar com saldo ou PIX.
        </p>
      </section>

      <CartItemsTable initialItems={items} />

      <section id="checkout-mobile" className="scroll-mt-24">
        <CartCheckoutPanel total={total} userCpf={userCpf} walletAvailableBalance={walletAvailableBalance} />
      </section>

      {items.length === 0 ? (
        <div className="rounded-[24px] border border-dashed border-fuchsia-200 bg-white p-5 text-sm text-slate-500">
          Seu carrinho está vazio. Volte para os bolões e adicione uma cota.
        </div>
      ) : (
        <div className="fixed inset-x-0 z-[72] px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] md:hidden" style={{ bottom: "84px" }}>
          <div className="rounded-[28px] border border-fuchsia-100 bg-white/95 p-3 shadow-[0_18px_34px_rgba(15,23,42,0.14)] backdrop-blur-xl">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-fuchsia-500">{itemCount} cota(s)</p>
                <p className="mt-1 text-lg font-black text-slate-900">{formatCurrency(total)}</p>
              </div>
              <Link
                href="#checkout-mobile"
                className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-full bg-fuchsia-700 px-5 py-3 text-sm font-semibold text-white"
              >
                Finalizar compra
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
