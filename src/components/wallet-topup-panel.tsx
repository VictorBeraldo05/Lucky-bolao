"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { WalletPackage } from "@prisma/client";

type WalletTopupPanelProps = {
  packages: WalletPackage[];
  userCpf?: string | null;
};

type TopupState = {
  id: string;
  status: string;
  qrCodeText?: string | null;
  qrCodeImageBase64?: string | null;
  paymentLinkUrl?: string | null;
  expiresAt?: string | null;
  package: {
    title: string;
    price: string;
  };
};

export function WalletTopupPanel({ packages, userCpf }: WalletTopupPanelProps) {
  const [selectedPackageId, setSelectedPackageId] = useState<number>(packages[0]?.id ?? 0);
  const [topup, setTopup] = useState<TopupState | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const selectedPackage = useMemo(
    () => packages.find((item) => item.id === selectedPackageId) ?? packages[0],
    [packages, selectedPackageId],
  );

  const canDeposit = Boolean(userCpf);

  async function createTopup() {
    if (!selectedPackage) return;
    setIsLoading(true);
    setStatusMessage(null);

    try {
      const response = await fetch("/api/wallet/topups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packageId: selectedPackage.id }),
      });

      const data = await response.json();
      if (!response.ok) {
        setStatusMessage(data.message ?? "Falha ao criar deposito.");
        return;
      }

      setTopup(data.topup);
      setStatusMessage("Topup criado. Aguarde a confirmacao do pagamento.");
    } catch {
      setStatusMessage("Erro ao criar topup. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (!topup || topup.status !== "PENDING") return;

    const interval = window.setInterval(async () => {
      try {
        const response = await fetch(`/api/wallet/topups/${topup.id}`);
        const data = await response.json();
        if (response.ok) {
          setTopup(data.topup);
        }
      } catch {
        // ignore refresh errors
      }
    }, 5000);

    return () => window.clearInterval(interval);
  }, [topup]);

  function handleCopy(value: string | null | undefined) {
    if (!value) return;
    navigator.clipboard.writeText(value);
    setStatusMessage("Texto copiado para a area de transferencia.");
  }

  return (
    <div className="rounded-[28px] border border-white/80 bg-white/90 p-6 shadow-sm">
      <div className="mb-6 grid gap-4 lg:grid-cols-[1.3fr_0.9fr]">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-fuchsia-500">Depositar saldo</p>
          <h2 className="mt-3 text-2xl font-bold text-slate-900">Adicione crédito via Pix</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Use Mercado Pago para gerar o QR code e creditar o valor diretamente na sua carteira.
          </p>
        </div>
        <div className="rounded-[24px] bg-fuchsia-50/60 p-4">
          <p className="text-sm font-semibold text-slate-700">CPF cadastrado</p>
          <p className="mt-2 text-lg font-bold text-slate-900">{userCpf ?? "Nao cadastrado"}</p>
          {!userCpf ? (
            <p className="mt-2 text-sm text-rose-600">Atualize seu CPF em Perfil para usar o deposito.</p>
          ) : null}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {packages.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setSelectedPackageId(item.id)}
            className={`rounded-[24px] border p-4 text-left transition ${selectedPackageId === item.id ? "border-fuchsia-300 bg-fuchsia-50 shadow-sm" : "border-fuchsia-100 bg-white hover:border-fuchsia-200"}`}
          >
            <p className="text-sm font-semibold text-slate-900">{item.title}</p>
            <p className="mt-2 text-sm text-slate-500">{item.description ?? "Credito de carteira."}</p>
            <p className="mt-4 text-2xl font-black text-fuchsia-700">{formatCurrency(item.price)}</p>
          </button>
        ))}
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-600">Selecione o pacote e gere o pagamento via Pix imediatamente.</p>
        <button
          type="button"
          onClick={createTopup}
          disabled={!canDeposit || isLoading}
          className="inline-flex items-center justify-center rounded-full bg-fuchsia-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-fuchsia-800 disabled:opacity-60"
        >
          {isLoading ? "Gerando..." : "Gerar pagamento Pix"}
        </button>
      </div>

      {statusMessage ? <p className="mt-4 text-sm font-medium text-slate-700">{statusMessage}</p> : null}

      {topup ? (
        <div className="mt-6 rounded-[24px] border border-fuchsia-100 bg-fuchsia-50/70 p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.16em] text-fuchsia-600">Status</p>
              <p className="mt-1 text-lg font-bold text-slate-900">{topup.status}</p>
            </div>
            <div>
              <p className="text-sm uppercase tracking-[0.16em] text-slate-600">Expira em</p>
              <p className="mt-1 text-lg font-bold text-slate-900">{topup.expiresAt ? formatDate(topup.expiresAt) : "—"}</p>
            </div>
          </div>

          {topup.qrCodeImageBase64 ? (
            <div className="mt-5 rounded-[24px] border border-fuchsia-100 bg-white p-4 text-center">
              <Image
                src={topup.qrCodeImageBase64}
                alt="QR code PIX"
                width={320}
                height={320}
                className="mx-auto max-h-72"
                unoptimized
              />
            </div>
          ) : null}

          {topup.qrCodeText ? (
            <div className="mt-4 space-y-3">
              <div className="rounded-2xl bg-white p-4">
                <p className="text-sm text-slate-500">PIX copia e cola</p>
                <p className="mt-2 break-all text-sm font-semibold text-slate-900">{topup.qrCodeText}</p>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <button
                  type="button"
                  onClick={() => handleCopy(topup.qrCodeText)}
                  className="inline-flex items-center justify-center rounded-full border border-fuchsia-200 bg-white px-4 py-3 text-sm font-semibold text-fuchsia-700 transition hover:bg-fuchsia-50"
                >
                  Copiar codigo Pix
                </button>
                {topup.paymentLinkUrl ? (
                  <a
                    href={topup.paymentLinkUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center rounded-full bg-fuchsia-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-fuchsia-800"
                  >
                    Abrir link de pagamento
                  </a>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
