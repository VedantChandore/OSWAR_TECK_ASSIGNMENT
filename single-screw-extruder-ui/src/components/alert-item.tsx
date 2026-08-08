import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { MachineAlert } from "@/lib/machine-data";

const severityStyles = {
  info: "border-cyan-500/20 bg-cyan-500/8 text-cyan-200",
  warning: "border-amber-500/20 bg-amber-500/8 text-amber-200",
  danger: "border-red-500/20 bg-red-500/8 text-red-200",
};

export function AlertItem({ alert }: { alert: MachineAlert }) {
  return (
    <Card className={cn("border-white/8 p-4", severityStyles[alert.severity])}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-white">{alert.title}</p>
          <p className="mt-1 text-sm leading-6 text-zinc-300">{alert.message}</p>
        </div>
        <span className="rounded-full border border-white/10 px-2 py-1 text-[0.7rem] uppercase tracking-[0.2em] text-zinc-400">
          {alert.metric}
        </span>
      </div>
      <div className="mt-3 flex items-center justify-between text-xs text-zinc-400">
        <span>{alert.value}</span>
        <span>{alert.timestamp}</span>
      </div>
    </Card>
  );
}