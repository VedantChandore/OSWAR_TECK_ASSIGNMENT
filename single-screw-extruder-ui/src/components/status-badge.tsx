import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { MachineStatus } from "@/lib/machine-data";

const statusStyles: Record<MachineStatus, string> = {
  Running: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
  Idle: "border-amber-500/30 bg-amber-500/10 text-amber-300",
  Fault: "border-red-500/30 bg-red-500/10 text-red-300",
};

export function StatusBadge({ status }: { status: MachineStatus }) {
  return <Badge className={cn(statusStyles[status], "shadow-[0_0_30px_rgba(0,0,0,0.2)]")}>{status}</Badge>;
}