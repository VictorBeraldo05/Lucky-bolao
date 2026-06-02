import { cn } from "@/lib/utils";
import { formatStatusLabel } from "@/lib/status";

const variants: Record<string, string> = {
  OPEN: "bg-emerald-100 text-emerald-700",
  SOLD_OUT: "bg-amber-100 text-amber-700",
  CLOSED: "bg-slate-100 text-slate-700",
  WAITING_DRAW: "bg-sky-100 text-sky-700",
  AWARDED: "bg-fuchsia-100 text-fuchsia-700",
  NOT_AWARDED: "bg-rose-100 text-rose-700",
  CANCELED: "bg-zinc-200 text-zinc-700",
  PAID: "bg-emerald-100 text-emerald-700",
  PENDING: "bg-amber-100 text-amber-700",
  APPROVED: "bg-emerald-100 text-emerald-700",
  INFO: "bg-sky-100 text-sky-700",
  SUCCESS: "bg-emerald-100 text-emerald-700",
  WARNING: "bg-amber-100 text-amber-700",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={cn("inline-flex rounded-full px-3 py-1 text-xs font-semibold tracking-wide", variants[status] ?? "bg-zinc-100 text-zinc-700")}>
      {formatStatusLabel(status)}
    </span>
  );
}
