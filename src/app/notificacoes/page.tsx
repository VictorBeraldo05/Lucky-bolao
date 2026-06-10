import { AccountShell } from "@/components/account-shell";
import { StatusBadge } from "@/components/status-badge";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";

export default async function NotificationsPage() {
  const user = await requireUser();
  const notifications = await prisma.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <AccountShell
      currentPath="/notificacoes"
      title="Notificações"
      description="Mensagens operacionais, premiações, créditos e alterações relevantes da sua conta."
    >
      <div className="space-y-4">
        {notifications.map((notification) => (
          <div key={notification.id} className="rounded-[28px] border border-white/80 bg-white/90 p-5 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-lg font-semibold text-slate-900">{notification.title}</p>
                <p className="mt-1 text-sm text-slate-500">{formatDate(notification.createdAt)}</p>
              </div>
              <StatusBadge status={notification.type} />
            </div>
            <p className="mt-3 text-slate-600">{notification.message}</p>
          </div>
        ))}
      </div>
    </AccountShell>
  );
}
