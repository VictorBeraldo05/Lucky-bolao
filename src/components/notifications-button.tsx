"use client";

import Link from "next/link";
import { useState } from "react";
import { Bell, X } from "lucide-react";
import { formatDate } from "@/lib/utils";

type HeaderNotification = {
  id: string;
  title: string;
  message: string;
  createdAt: string;
};

export function NotificationsButton({ notifications }: { notifications: HeaderNotification[] }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="relative inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/70 bg-white text-slate-600 shadow-sm transition hover:border-fuchsia-200"
      >
        <Bell className="h-5 w-5" />
        {notifications.length ? <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-fuchsia-500" /> : null}
      </button>

      {isOpen ? (
        <div className="fixed inset-0 z-[73] bg-slate-950/45 backdrop-blur-sm" onClick={() => setIsOpen(false)}>
          <div className="flex h-full justify-end">
            <div
              className="flex h-full w-full max-w-md flex-col overflow-hidden border-l border-white/80 bg-white shadow-2xl sm:max-w-lg"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-4 border-b border-fuchsia-100 px-5 py-5 sm:px-6">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-fuchsia-500">Notificações</p>
                  <h2 className="mt-2 text-2xl font-bold text-slate-900">Atualizações da sua conta</h2>
                </div>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-fuchsia-100 bg-white text-slate-500 transition hover:border-fuchsia-200 hover:text-fuchsia-700"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-6">
                <div className="space-y-3">
                  {notifications.length ? (
                    notifications.map((notification) => (
                      <div key={notification.id} className="rounded-[24px] border border-fuchsia-100 bg-fuchsia-50/60 p-4">
                        <p className="font-semibold text-slate-900">{notification.title}</p>
                        <p className="mt-2 text-sm leading-6 text-slate-600">{notification.message}</p>
                        <p className="mt-3 text-xs text-slate-400">{formatDate(notification.createdAt)}</p>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-[24px] border border-dashed border-fuchsia-200 bg-white p-6 text-sm text-slate-500">
                      Você não tem notificações novas no momento.
                    </div>
                  )}
                </div>
              </div>

              <div className="border-t border-fuchsia-100 px-5 py-5 sm:px-6">
                <Link
                  href="/notificacoes"
                  onClick={() => setIsOpen(false)}
                  className="inline-flex w-full items-center justify-center rounded-full bg-fuchsia-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-fuchsia-700"
                >
                  Ver todas as notificações
                </Link>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
