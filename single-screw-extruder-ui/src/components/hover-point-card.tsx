import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { MachinePointValue } from "@/lib/machine-data";

type HoverPointCardProps = {
  point: MachinePointValue;
  active?: boolean;
};

const severityStyles = {
  info: "border-cyan-500/20 bg-cyan-500/10 text-cyan-100",
  warning: "border-amber-500/20 bg-amber-500/10 text-amber-100",
  danger: "border-red-500/20 bg-red-500/10 text-red-100",
};

export function HoverPointCard({ point, active }: HoverPointCardProps) {
  return (
    <Card className={cn("rounded-2xl p-4 transition-all duration-200", severityStyles[point.severity], active && "scale-[1.02] shadow-[0_0_0_1px_rgba(255,255,255,0.08),0_20px_50px_rgba(0,0,0,0.35)]")}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[0.72rem] uppercase tracking-[0.2em] text-zinc-400">{point.label}</p>
          <p className="mt-2 text-lg font-semibold text-white">{point.value}</p>
        </div>
        <span className="h-2.5 w-2.5 rounded-full bg-current shadow-[0_0_18px_currentColor]" />
      </div>
      <p className="mt-3 text-sm leading-6 text-zinc-300">{point.description}</p>
    </Card>
  );
}