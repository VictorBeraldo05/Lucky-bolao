import { cn } from "@/lib/utils";

type NumberGridProps = {
  numbers: number[];
  highlight?: number[];
  size?: "sm" | "md";
};

export function NumberGrid({ numbers, highlight = [], size = "md" }: NumberGridProps) {
  const highlightSet = new Set(highlight);

  return (
    <div className="flex flex-wrap gap-2">
      {numbers.map((number) => (
        <span
          key={`${number}-${size}`}
          className={cn(
            "inline-flex items-center justify-center rounded-2xl border border-white/70 bg-white/80 font-semibold text-slate-700 shadow-sm",
            size === "sm" ? "h-8 w-8 text-sm sm:h-9 sm:w-9" : "h-9 w-9 text-sm sm:h-11 sm:w-11 sm:text-base",
            highlightSet.has(number) && "border-fuchsia-300 bg-fuchsia-100 text-fuchsia-700",
          )}
        >
          {number.toString().padStart(2, "0")}
        </span>
      ))}
    </div>
  );
}
