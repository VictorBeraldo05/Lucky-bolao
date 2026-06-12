"use client";

import { Copy } from "lucide-react";
import { useState } from "react";

type PixCopyActionsProps = {
  qrCodeText?: string | null;
};

export function PixCopyActions({ qrCodeText }: PixCopyActionsProps) {
  const [message, setMessage] = useState<string | null>(null);

  async function handleCopy(value: string | null | undefined) {
    if (!value) return;

    try {
      await navigator.clipboard.writeText(value);
      setMessage("Código PIX copiado com sucesso.");
      window.setTimeout(() => setMessage(null), 2000);
    } catch {
      setMessage("Não foi possível copiar o código PIX.");
    }
  }

  if (!qrCodeText) return null;

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
        <button
          type="button"
          onClick={() => void handleCopy(qrCodeText)}
          className="inline-flex items-center justify-center gap-2 rounded-full border border-fuchsia-200 bg-white px-4 py-3 text-sm font-semibold text-fuchsia-700 transition hover:bg-fuchsia-50"
        >
          <Copy className="h-4 w-4" />
          Copiar código PIX
        </button>
      </div>

      {message ? <p className="text-sm font-medium text-slate-700">{message}</p> : null}
    </div>
  );
}
