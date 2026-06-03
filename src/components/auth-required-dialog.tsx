"use client";

import Link from "next/link";
import { X } from "lucide-react";

type AuthRequiredDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  redirectPath: string;
  title?: string;
  description?: string;
};

export function AuthRequiredDialog({
  isOpen,
  onClose,
  redirectPath,
  title = "Entre para comprar sua cota",
  description = "Para adicionar cotas ao carrinho e concluir a compra, você precisa entrar na sua conta ou criar um cadastro rápido.",
}: AuthRequiredDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-slate-950/55 px-3 py-3 backdrop-blur-sm sm:items-center sm:px-4" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-[28px] border border-white/80 bg-white p-5 shadow-2xl sm:rounded-[32px] sm:p-6"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-fuchsia-500">Antes de continuar</p>
            <h3 className="mt-2 text-2xl font-bold text-slate-900">{title}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-fuchsia-100 bg-white text-slate-500 transition hover:border-fuchsia-200 hover:text-fuchsia-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="mt-4 text-sm leading-6 text-slate-600">{description}</p>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <Link
            href={`/login?redirect=${encodeURIComponent(redirectPath)}`}
            className="inline-flex items-center justify-center rounded-full border border-fuchsia-200 px-5 py-3 text-sm font-semibold text-fuchsia-700 transition hover:bg-fuchsia-50"
          >
            Entrar
          </Link>
          <Link
            href={`/cadastro?redirect=${encodeURIComponent(redirectPath)}`}
            className="inline-flex items-center justify-center rounded-full bg-fuchsia-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-fuchsia-700"
          >
            Criar conta
          </Link>
        </div>
      </div>
    </div>
  );
}
