"use client";

import Image from "next/image";
import { useState } from "react";
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
};

export function CartCheckoutPanel({ total, userCpf }: CartCheckoutPanelProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null);

  async function handleCheckout() {
    if (!userCpf) {
      setStatusMessage("Atualize seu CPF em Perfil antes de finalizar o pagamento.");
      return;
    }

    setIsLoading(true);
    setStatusMessage(null);

    try {
      const response = await fetch("/api/cart/checkout", { method: "POST" });
      const data = await response.json();
      if (!response.ok) {
        setStatusMessage(data.message ?? "Falha ao iniciar o pagamento.");
        return;
      }
      setPaymentData(data.paymentData);
      setStatusMessage("Pagamento criado. Escaneie o QR code ou use o copia e cola.");
    } catch {
      setStatusMessage("Erro ao iniciar o pagamento. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="rounded-[28px] border border-white/80 bg-white/90 p-6 shadow-sm">
      <div className="flex flex-col gap-3">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-fuchsia-500">Finalizar compra</p>
          <h2 className="mt-2 text-2xl font-bold text-slate-900">Pagamento via PIX</h2>
        </div>
        <div className="rounded-2xl bg-fuchsia-50 p-4">
          <p className="text-sm text-slate-500">Total do carrinho</p>
          <p className="mt-2 text-3xl font-black text-fuchsia-700">{formatCurrency(total)}</p>
        </div>
        <button
          type="button"
          onClick={handleCheckout}
          disabled={isLoading || total <= 0}
          className="inline-flex items-center justify-center rounded-full bg-fuchsia-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-fuchsia-800 disabled:opacity-60"
        >
          {isLoading ? "Gerando pagamento..." : "Pagar com PIX"}
        </button>
        {!userCpf ? <p className="text-sm text-rose-600">CPF necessario para gerar o QR code. Atualize em Perfil.</p> : null}
        {statusMessage ? <p className="text-sm font-medium text-slate-700">{statusMessage}</p> : null}
      </div>

      {paymentData ? (
        <div className="mt-6 rounded-[24px] border border-fuchsia-100 bg-fuchsia-50/70 p-4">
          {paymentData.qrCodeImageBase64 ? (
            <div className="rounded-[24px] bg-white p-4 text-center">
              <Image src={paymentData.qrCodeImageBase64} alt="QR code PIX" width={320} height={320} className="mx-auto max-h-72" unoptimized />
            </div>
          ) : null}
          {paymentData.qrCodeText ? (
            <div className="mt-4 rounded-2xl bg-white p-4 text-sm text-slate-900">
              <p className="text-sm text-slate-500">PIX copia e cola</p>
              <p className="mt-2 break-all font-semibold">{paymentData.qrCodeText}</p>
            </div>
          ) : null}
          {paymentData.paymentLinkUrl ? (
            <a href={paymentData.paymentLinkUrl} target="_blank" rel="noreferrer" className="mt-4 inline-flex w-full items-center justify-center rounded-full bg-fuchsia-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-fuchsia-800">
              Abrir link de pagamento
            </a>
          ) : null}
          {paymentData.expiresAt ? <p className="mt-3 text-xs text-slate-500">Expira em {formatDate(paymentData.expiresAt)}</p> : null}
        </div>
      ) : null}
    </div>
  );
}
