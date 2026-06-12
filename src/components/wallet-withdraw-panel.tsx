"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { formatCurrency, formatDate } from "@/lib/utils";

type WithdrawalStatus = "PENDING" | "COMPLETED" | "CANCELED" | "REVERSED";

type WithdrawalItem = {
  id: string;
  amount: number;
  status: WithdrawalStatus;
  createdAt: string;
  metadata?: {
    pixKeyType?: string;
    pixKey?: string;
  } | null;
};

type WalletWithdrawPanelProps = {
  cashBalance: number;
  withdrawals: WithdrawalItem[];
};

const pixKeyTypeOptions = [
  { value: "CPF", label: "CPF" },
  { value: "EMAIL", label: "E-mail" },
  { value: "PHONE", label: "Telefone" },
  { value: "RANDOM", label: "Chave aleatoria" },
] as const;

function getStatusLabel(status: WithdrawalStatus) {
  switch (status) {
    case "COMPLETED":
      return "Concluido";
    case "CANCELED":
      return "Cancelado";
    case "REVERSED":
      return "Estornado";
    default:
      return "Pendente";
  }
}

export function WalletWithdrawPanel({ cashBalance, withdrawals }: WalletWithdrawPanelProps) {
  const router = useRouter();
  const [pixKeyType, setPixKeyType] = useState<(typeof pixKeyTypeOptions)[number]["value"]>("CPF");
  const [pixKey, setPixKey] = useState("");
  const [amount, setAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [localWithdrawals, setLocalWithdrawals] = useState(withdrawals);

  const parsedAmount = useMemo(() => Number(amount || 0), [amount]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setStatusMessage(null);

    try {
      const response = await fetch("/api/wallet/withdrawals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pixKeyType,
          pixKey,
          amount: parsedAmount,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        setStatusMessage(data.message ?? "Nao foi possivel solicitar o saque.");
        return;
      }

      setStatusMessage(data.message ?? "Solicitacao enviada. O saque pode levar ate 24h para ser finalizado.");
      setAmount("");
      setPixKey("");
      if (data.withdrawal) {
        setLocalWithdrawals((current) => [
          {
            id: data.withdrawal.id,
            amount: Math.abs(Number(data.withdrawal.amount)),
            status: data.withdrawal.status,
            createdAt: data.withdrawal.createdAt,
            metadata: data.withdrawal.metadata,
          },
          ...current,
        ]);
      }
      router.refresh();
    } catch {
      setStatusMessage("Erro ao solicitar saque. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="rounded-[28px] border border-white/80 bg-white/90 p-6 shadow-sm">
      <div className="mb-6 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-fuchsia-500">Sacar saldo</p>
          <h2 className="mt-3 text-2xl font-bold text-slate-900">Solicite um saque via PIX</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Informe sua chave PIX e o valor desejado. Depois da solicitacao, o saque pode levar ate 24h para ser finalizado.
          </p>
        </div>
        <div className="rounded-[24px] bg-fuchsia-50/60 p-4">
          <p className="text-sm font-semibold text-slate-700">Saldo disponivel para saque</p>
          <p className="mt-2 text-2xl font-black text-slate-900">{formatCurrency(cashBalance)}</p>
          <p className="mt-2 text-sm text-slate-500">Creditos promocionais nao entram no saque.</p>
        </div>
      </div>

      <form onSubmit={(event) => void handleSubmit(event)} className="grid gap-4 lg:grid-cols-3">
        <label className="space-y-2 text-sm font-medium text-slate-700">
          Tipo de chave PIX
          <select
            value={pixKeyType}
            onChange={(event) => setPixKeyType(event.target.value as (typeof pixKeyTypeOptions)[number]["value"])}
            className="w-full rounded-2xl border border-fuchsia-100 bg-white px-4 py-3 text-base outline-none"
          >
            {pixKeyTypeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-2 text-sm font-medium text-slate-700 lg:col-span-1">
          Chave PIX
          <input
            type="text"
            value={pixKey}
            onChange={(event) => setPixKey(event.target.value)}
            placeholder="Digite sua chave PIX"
            className="w-full rounded-2xl border border-fuchsia-100 bg-white px-4 py-3 text-base outline-none"
          />
        </label>

        <label className="space-y-2 text-sm font-medium text-slate-700">
          Valor do saque
          <input
            type="number"
            min="1"
            step="0.01"
            max={cashBalance}
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            placeholder="0,00"
            className="w-full rounded-2xl border border-fuchsia-100 bg-white px-4 py-3 text-base outline-none"
          />
        </label>

        <div className="lg:col-span-3">
          <button
            type="submit"
            disabled={isLoading}
            className="inline-flex min-h-12 items-center justify-center rounded-full bg-fuchsia-700 px-6 py-3 text-sm font-semibold text-white transition hover:bg-fuchsia-800 disabled:opacity-60"
          >
            {isLoading ? "Solicitando..." : "Solicitar saque"}
          </button>
        </div>
      </form>

      {statusMessage ? <p className="mt-4 text-sm font-medium text-slate-700">{statusMessage}</p> : null}

      <div className="mt-6 rounded-[24px] border border-fuchsia-100 bg-fuchsia-50/60 p-5">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-lg font-bold text-slate-900">Solicitacoes recentes</h3>
          <span className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">Ate 24h</span>
        </div>

        <div className="mt-4 space-y-3">
          {localWithdrawals.length ? (
            localWithdrawals.map((withdrawal) => (
              <div key={withdrawal.id} className="rounded-2xl bg-white px-4 py-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-900">{formatCurrency(withdrawal.amount)}</p>
                    <p className="mt-1 text-sm text-slate-500">
                      {withdrawal.metadata?.pixKeyType ?? "PIX"} • {withdrawal.metadata?.pixKey ?? "Chave protegida"}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">{formatDate(withdrawal.createdAt)}</p>
                  </div>
                  <span className="rounded-full bg-fuchsia-100 px-3 py-1 text-xs font-semibold text-fuchsia-700">
                    {getStatusLabel(withdrawal.status)}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-2xl bg-white px-4 py-4 text-sm text-slate-500">
              Nenhuma solicitacao de saque registrada ainda.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
