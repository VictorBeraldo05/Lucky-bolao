import { requireUser } from "@/lib/auth";
import { Container } from "@/components/container";
import { MobilePixPaymentViewer } from "@/components/cart/mobile-pix-payment-viewer";

export default async function CartPixPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireUser();
  const resolvedSearchParams = (await searchParams) ?? {};
  const paymentId = Array.isArray(resolvedSearchParams.paymentId)
    ? resolvedSearchParams.paymentId[0]
    : resolvedSearchParams.paymentId;

  return (
    <Container className="py-8">
      {paymentId ? (
        <MobilePixPaymentViewer paymentId={paymentId} />
      ) : (
        <div className="rounded-[28px] border border-white/80 bg-white/95 p-6 text-center shadow-sm">
          <p className="text-base font-semibold text-slate-900">Nenhum pagamento PIX foi encontrado.</p>
          <p className="mt-2 text-sm text-slate-600">Volte ao carrinho e gere um novo código para continuar.</p>
        </div>
      )}
    </Container>
  );
}
