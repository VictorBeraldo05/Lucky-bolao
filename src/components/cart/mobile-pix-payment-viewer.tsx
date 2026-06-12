"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, LoaderCircle } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PixCopyActions } from "@/components/cart/pix-copy-actions";
import { formatDate } from "@/lib/utils";

type PaymentData = {
  qrCodeText?: string | null;
  qrCodeImageBase64?: string | null;
  paymentLinkUrl?: string | null;
  expiresAt?: string | null;
};

type PaymentStatusPayload = {
  payment: { status: string } | null;
  paymentData: PaymentData | null;
};

export function MobilePixPaymentViewer({ paymentId }: { paymentId: string }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState<string | null>("Estamos carregando seu QR code.");
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null);

  const redirectToMyGames = useCallback(() => {
    if (typeof window !== "undefined") {
      window.location.replace("/meus-jogos?payment=approved");
      return;
    }

    router.replace("/meus-jogos?payment=approved");
    router.refresh();
  }, [router]);

  useEffect(() => {
    let isMounted = true;

    async function loadStatus() {
      try {
        const response = await fetch(`/api/cart/checkout/status?paymentId=${paymentId}`, { cache: "no-store" });
        const data = (await response.json()) as PaymentStatusPayload;
        if (!response.ok || !isMounted) return;

        setPaymentData(data.paymentData);

        if (data.payment?.status === "APPROVED") {
          setPaymentData(null);
          setStatusMessage("Pagamento aprovado. Redirecionando para seus jogos.");
          window.dispatchEvent(new CustomEvent("cart:approved"));
          redirectToMyGames();
          return;
        }

        if (data.payment?.status === "CANCELED") {
          setStatusMessage("O pagamento foi cancelado ou expirou.");
        } else {
          setStatusMessage("Escaneie o QR code ou use o PIX copia e cola para concluir.");
        }
      } catch {
        if (isMounted) {
          setStatusMessage("Não foi possível carregar o pagamento agora. Tente novamente.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadStatus();
    const interval = window.setInterval(() => {
      void loadStatus();
    }, 5000);

    return () => {
      isMounted = false;
      window.clearInterval(interval);
    };
  }, [paymentId, redirectToMyGames]);

  return (
    <div className="space-y-6">
      <Link href="/carrinho" className="inline-flex items-center gap-2 text-sm font-semibold text-fuchsia-700">
        <ArrowLeft className="h-4 w-4" />
        Voltar ao carrinho
      </Link>

      <div className="rounded-[32px] border border-white/80 bg-white/95 p-5 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-fuchsia-500">Pagamento via PIX</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950">Escaneie o QR code para pagar</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">{statusMessage}</p>

        {isLoading ? (
          <div className="mt-6 rounded-[28px] border border-fuchsia-100 bg-fuchsia-50/70 px-6 py-10 text-center">
            <LoaderCircle className="mx-auto h-10 w-10 animate-spin text-fuchsia-600" />
            <p className="mt-4 text-base font-semibold text-slate-900">Carregando pagamento</p>
            <p className="mt-2 text-sm text-slate-600">Estamos aguardando a resposta do backend e preparando a visualização do seu PIX.</p>
          </div>
        ) : null}

        {!isLoading && paymentData ? (
          <div className="mt-6 space-y-4">
            {paymentData.qrCodeImageBase64 ? (
              <div className="rounded-[28px] border border-fuchsia-100 bg-fuchsia-50/70 p-4 text-center">
                <div className="rounded-[24px] bg-white p-4">
                  <Image
                    src={paymentData.qrCodeImageBase64}
                    alt="QR code PIX"
                    width={360}
                    height={360}
                    className="mx-auto w-full max-w-xs"
                    unoptimized
                  />
                </div>
              </div>
            ) : null}

            {paymentData.qrCodeText ? (
              <div className="rounded-[28px] border border-fuchsia-100 bg-fuchsia-50/70 p-4">
                <p className="text-sm text-slate-500">PIX copia e cola</p>
                <p className="mt-2 break-all text-sm font-semibold text-slate-900">{paymentData.qrCodeText}</p>
              </div>
            ) : null}

            <PixCopyActions qrCodeText={paymentData.qrCodeText} />

            {paymentData.expiresAt ? (
              <p className="text-center text-xs text-slate-500">Expira em {formatDate(paymentData.expiresAt)}</p>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
