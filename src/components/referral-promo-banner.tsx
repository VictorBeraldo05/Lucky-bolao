"use client";

import Image from "next/image";
import Link from "next/link";
import { Copy, Gift, X } from "lucide-react";
import { useState } from "react";
import { getReferralLink } from "@/lib/referrals";

type ReferralPromoBannerProps = {
  inviteCode?: string | null;
};

export function ReferralPromoBanner({ inviteCode }: ReferralPromoBannerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const inviteLink = inviteCode ? getReferralLink(inviteCode) : null;

  async function handleCopy() {
    if (!inviteLink) return;

    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="block w-full overflow-hidden rounded-[24px] border border-white/70 bg-white text-left shadow-[0_16px_40px_rgba(120,58,166,0.16)] sm:hidden"
      >
        <Image
          src="/promo-indique-ganhe.png"
          alt="Promoção especial: convide um amigo e ganhe R$ 5,00 de crédito"
          width={1790}
          height={888}
          className="h-auto w-full"
          priority
        />
      </button>

      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="mx-auto hidden w-full max-w-[1022px] overflow-hidden rounded-[28px] border border-white/70 bg-white shadow-[0_16px_40px_rgba(120,58,166,0.16)] sm:block"
      >
        <div className="relative h-[250px] w-full bg-white">
          <Image
            src="/promo-indique-ganhe.png"
            alt="Promoção especial: convide um amigo e ganhe R$ 5,00 de crédito"
            fill
            className="object-contain"
            sizes="1022px"
            priority
          />
        </div>
      </button>

      {isOpen ? (
        <div
          className="fixed inset-0 z-[90] flex items-end justify-center bg-slate-950/55 px-3 py-3 backdrop-blur-sm sm:items-center sm:px-4"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="w-full max-w-lg rounded-[28px] border border-white/80 bg-white p-5 shadow-2xl sm:rounded-[32px] sm:p-6"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-fuchsia-500">Indique e ganhe</p>
                <h3 className="mt-2 text-2xl font-bold text-slate-900">Convide amigos e receba R$ 5,00</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-fuchsia-100 bg-white text-slate-500 transition hover:border-fuchsia-200 hover:text-fuchsia-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {inviteLink ? (
              <>
                <div className="mt-5 rounded-[24px] border border-fuchsia-100 bg-fuchsia-50/70 p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-fuchsia-600 shadow-sm">
                      <Gift className="h-6 w-6" />
                    </div>
                    <p className="text-sm leading-6 text-slate-600">
                      Compartilhe seu link. Quando a pessoa criar conta por ele e fizer a primeira compra, você recebe
                      crédito promocional para usar em novas cotas.
                    </p>
                  </div>
                </div>

                <div className="mt-4 rounded-[24px] border border-fuchsia-100 bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-fuchsia-500">Seu link de convite</p>
                  <p className="mt-2 break-all text-sm font-semibold text-slate-900">{inviteLink}</p>
                </div>

                <button
                  type="button"
                  onClick={() => void handleCopy()}
                  className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-fuchsia-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-fuchsia-700"
                >
                  <Copy className="h-4 w-4" />
                  {copied ? "Link copiado" : "Copiar link"}
                </button>
              </>
            ) : (
              <>
                <p className="mt-4 text-sm leading-6 text-slate-600">
                  Entre na sua conta ou crie um cadastro para gerar seu link de indicação e começar a acumular créditos
                  promocionais.
                </p>

                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  <Link
                    href="/login"
                    className="inline-flex items-center justify-center rounded-full border border-fuchsia-200 px-5 py-3 text-sm font-semibold text-fuchsia-700 transition hover:bg-fuchsia-50"
                  >
                    Entrar
                  </Link>
                  <Link
                    href="/cadastro"
                    className="inline-flex items-center justify-center rounded-full bg-fuchsia-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-fuchsia-700"
                  >
                    Criar conta
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}
