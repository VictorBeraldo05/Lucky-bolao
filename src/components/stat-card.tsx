import { cn } from "@/lib/utils";

type StatCardProps = {
  label: string;
  value: string;
  helper?: string;
  className?: string;
};

export function StatCard({ label, value, helper, className }: StatCardProps) {
  return (
    <div className={cn("rounded-[28px] border border-white/80 bg-white/90 p-5 shadow-[0_18px_60px_rgba(176,120,219,0.12)]", className)}>
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-bold text-slate-900">{value}</p>
      {helper ? <p className="mt-2 text-sm text-slate-500">{helper}</p> : null}
    </div>
  );
}

