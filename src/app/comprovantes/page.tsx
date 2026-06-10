import Link from "next/link";
import { AccountShell } from "@/components/account-shell";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";

export default async function ReceiptsPage() {
  const user = await requireUser();
  const shares = await prisma.poolShare.findMany({
    where: { userId: user.id },
    include: {
      pool: {
        include: { contest: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <AccountShell
      currentPath="/comprovantes"
      title="Comprovantes"
      description="Cada participação mantém vínculo com o bolão e seu comprovante interno."
    >
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
        {shares.map((share) => (
          <div key={share.id} className="rounded-[28px] border border-white/80 bg-white/90 p-5 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-fuchsia-500">{share.pool.code}</p>
            <h2 className="mt-2 text-xl font-bold text-slate-900">{share.pool.title}</h2>
            <p className="mt-2 text-sm text-slate-600">
              Concurso #{share.pool.contest.contestNumber} em {formatDate(share.pool.contest.drawDate)}
            </p>
            <Link
              href={`/boloes/${share.pool.code}`}
              className="mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-full border border-fuchsia-200 px-4 py-2 text-sm font-semibold text-fuchsia-700 md:min-h-0 md:w-auto"
            >
              Abrir comprovante
            </Link>
          </div>
        ))}
      </div>
    </AccountShell>
  );
}
