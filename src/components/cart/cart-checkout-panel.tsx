"use client";

import Image from "next/image";
import { LoaderCircle } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PixCopyActions } from "@/components/cart/pix-copy-actions";
import { formatCurrency, formatDate } from "@/lib/utils";

type PaymentData = {
  qrCodeText?: string | null;
  qrCodeImageBase64?: string | null;
  paymentLinkUrl?: string | null;
  expiresAt?: string | null;
};

type CartCheckoutPanelProps = {
  total: number;
  userCpf?: string | null;
  onApproved?: () => void;
};

export function CartCheckoutPanel({ total, userCpf, onApproved }: CartCheckoutPanelProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null);
  const [paymentId, setPaymentId] = useState<string | null>(null);

  const redirectToMyGames = useCallback(() => {
    if (typeof window !== "undefined") {
      window.location.replace("/meus-jogos?payment=approved");
      return;
    }

    router.replace("/meus-jogos?payment=approved");
    router.refresh();
  }, [router]);

  useEffect(() => {
    if (!paymentId) return;

    const interval = window.setInterval(async () => {
      try {
        const response = await fetch(`/api/cart/checkout/status?paymentId=${paymentId}`);
        const data = await response.json();
        if (!response.ok || !data.payment) return;

        if (data.payment.status === "APPROVED") {
          setStatusMessage("Pagamento aprovado. Suas cotas foram liberadas.");
          setPaymentData(null);
          setPaymentId(null);
          onApproved?.();
          window.dispatchEvent(new CustomEvent("cart:approved"));
          window.clearInterval(interval);
          redirectToMyGames();
          return;
        }

        if (data.payment.status === "CANCELED") {
          setStatusMessage("O pagamento foi cancelado ou expirou.");
          window.clearInterval(interval);
        }
      } catch {
        // ignore polling errors
      }
    }, 5000);

    return () => window.clearInterval(interval);
  }, [onApproved, paymentId, redirectToMyGames]);

  async function handleCheckout() {
    if (!userCpf) {
      setStatusMessage("Atualize seu CPF em Perfil antes de finalizar o pagamento.");
      return;
    }

    setIsLoading(true);
    setStatusMessage("Estamos preparando seu PIX. Isso pode levar alguns segundos.");

    try {
      const response = await fetch("/api/cart/checkout", { method: "POST" });
      const data = await response.json();
      if (!response.ok) {
        setStatusMessage(data.message ?? "Falha ao iniciar o pagamento.");
        return;
      }

      setPaymentData(data.paymentData);
      setPaymentId(data.payment?.id ?? null);
      setStatusMessage("Pagamento criado. Escaneie o QR code ou use o copia e cola.");

      if (typeof window !== "undefined" && window.innerWidth < 1024 && data.payment?.id) {
        router.push(`/carrinho/pix?paymentId=${data.payment.id}`);
        return;
      }
    } catch {
      setStatusMessage("Erro ao iniciar o pagamento. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="relative rounded-[28px] border border-white/80 bg-white/90 p-5 shadow-sm sm:p-6">
      <div className="flex flex-col gap-2.5">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-fuchsia-500">Finalizar compra</p>
          <h2 className="mt-1.5 text-2xl font-bold text-slate-900">Pagamento via PIX</h2>
        </div>
        <div className="rounded-2xl bg-fuchsia-50 p-4">
          <p className="text-sm text-slate-500">Total do carrinho</p>
          <p className="mt-1.5 text-3xl font-black text-fuchsia-700">{formatCurrency(total)}</p>
        </div>
        <button
          type="button"
          onClick={handleCheckout}
          disabled={isLoading || total <= 0}
          className="inline-flex items-center justify-center rounded-full bg-fuchsia-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-fuchsia-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLoading ? (
            <span className="inline-flex items-center gap-2">
              <LoaderCircle className="h-4 w-4 animate-spin" />
              Gerando pagamento...
            </span>
          ) : (
            "Pagar com PIX"
          )}
        </button>
        {!userCpf ? <p className="text-sm text-rose-600">CPF necessário para gerar o QR code. Atualize em Perfil.</p> : null}
        {statusMessage ? <p className="text-sm font-medium text-slate-700">{statusMessage}</p> : null}
      </div>

      {paymentData ? (
        <div className="mt-5 hidden rounded-[24px] border border-fuchsia-100 bg-fuchsia-50/70 p-4 lg:block">
          {paymentData.qrCodeImageBase64 ? (
            <div className="rounded-[24px] bg-white p-4 text-center">
              <Image
                src={paymentData.qrCodeImageBase64}
                alt="QR code PIX"
                width={320}
                height={320}
                className="mx-auto max-h-72"
                unoptimized
              />
            </div>
          ) : null}
          {paymentData.qrCodeText ? (
            <div className="mt-4 rounded-2xl bg-white p-4 text-sm text-slate-900">
              <p className="text-sm text-slate-500">PIX copia e cola</p>
              <p className="mt-2 break-all font-semibold">{paymentData.qrCodeText}</p>
            </div>
          ) : null}
          <div className="mt-4">
            <PixCopyActions qrCodeText={paymentData.qrCodeText} paymentLinkUrl={paymentData.paymentLinkUrl} />
          </div>
          {paymentData.paymentLinkUrl ? (
            <a href={paymentData.paymentLinkUrl} target="_blank" rel="noreferrer" className="mt-4 inline-flex w-full items-center justify-center rounded-full bg-fuchsia-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-fuchsia-800">
              Abrir link de pagamento
            </a>
          ) : null}
          {paymentData.expiresAt ? <p className="mt-3 text-xs text-slate-500">Expira em {formatDate(paymentData.expiresAt)}</p> : null}
        </div>
      ) : null}

      {isLoading ? (
        <div className="absolute inset-0 flex items-center justify-center rounded-[28px] bg-white/90 backdrop-blur-sm">
          <div className="rounded-[24px] border border-fuchsia-100 bg-white px-6 py-5 text-center shadow-xl">
            <LoaderCircle className="mx-auto h-8 w-8 animate-spin text-fuchsia-600" />
            <p className="mt-4 text-base font-semibold text-slate-900">Preparando seu PIX</p>
            <p className="mt-2 max-w-xs text-sm text-slate-600">
              Estamos processando sua solicitação e aguardando o backend responder. Não feche esta tela.
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
