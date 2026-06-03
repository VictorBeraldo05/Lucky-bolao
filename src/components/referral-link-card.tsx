"use client";

import { useState } from "react";
import { Copy, Gift, Share2 } from "lucide-react";
import { getReferralLink } from "@/lib/referrals";

type ReferralLinkCardProps = {
  inviteCode: string;
};

export function ReferralLinkCard({ inviteCode }: ReferralLinkCardProps) {
  const [copied, setCopied] = useState(false);
  const inviteLink = getReferralLink(inviteCode);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="rounded-[28px] border border-lime-200/70 bg-[radial-gradient(circle_at_top_left,_rgba(187,247,110,0.2),_transparent_30%),linear-gradient(135deg,_#240046_0%,_#40106f_52%,_#22003c_100%)] p-5 text-white shadow-[0_18px_50px_rgba(77,19,148,0.18)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-lime-300">Indique e ganhe</p>
          <h2 className="mt-2 text-2xl font-black leading-tight">Convide um amigo e receba R$ 5,00 de crédito</h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-white/85">
            Quando a pessoa criar conta pelo seu link e fizer a primeira compra, você recebe R$ 5,00 para usar em
            novas cotas. Esse crédito promocional não pode ser sacado.
          </p>
        </div>
        <div className="hidden rounded-2xl bg-white/10 p-3 backdrop-blur-sm sm:block">
          <Gift className="h-7 w-7 text-lime-300" />
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-3 rounded-[24px] border border-white/12 bg-white/10 p-4 backdrop-blur-sm sm:flex-row sm:items-center">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/65">Seu link de convite</p>
          <p className="mt-1 truncate text-sm font-medium text-white">{inviteLink}</p>
        </div>
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-lime-300 px-4 py-2.5 text-sm font-bold text-slate-950 transition hover:bg-lime-200"
        >
          {copied ? <Share2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          {copied ? "Link copiado" : "Copiar link"}
        </button>
      </div>
    </div>
  );
}
