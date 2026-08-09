"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { MachineStatus } from "@/lib/machine-data";
import { AlertTriangle, PauseCircle, PlayCircle } from "lucide-react";

const statusStyles: Record<MachineStatus, string> = {
  Running: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
  Idle: "border-amber-500/30 bg-amber-500/10 text-amber-300",
  Fault: "border-red-500/30 bg-red-500/10 text-red-300",
};

const statusIcon: Record<MachineStatus, typeof PlayCircle> = {
  Running: PlayCircle,
  Idle: PauseCircle,
  Fault: AlertTriangle,
};

export function StatusBadge({ status }: { status: MachineStatus }) {
  const Icon = statusIcon[status];

  return (
    <Badge className={cn(statusStyles[status], "relative overflow-hidden pr-3 shadow-[0_0_30px_rgba(0,0,0,0.2)]") }>
      {status === "Fault" ? <span className="absolute inset-0 animate-pulse rounded-full border border-red-300/40" aria-hidden="true" /> : null}
      <Icon className="mr-1.5 h-3.5 w-3.5" />
      {status}
    </Badge>
  );
}