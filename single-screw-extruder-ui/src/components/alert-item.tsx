"use client";

import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { MachineAlert } from "@/lib/machine-data";
import { AlertTriangle, Flame, Gauge, Thermometer, TriangleAlert, Zap } from "lucide-react";

const severityStyles = {
  info: "border-cyan-500/20 bg-cyan-500/8 text-cyan-200",
  warning: "border-amber-500/20 bg-amber-500/8 text-amber-200",
  danger: "border-red-500/20 bg-red-500/8 text-red-200",
};

const severityBar = {
  info: "bg-cyan-400",
  warning: "bg-amber-400",
  danger: "bg-red-400",
};

const severityIcon = {
  info: Thermometer,
  warning: Gauge,
  danger: AlertTriangle,
};

const metricIcon = (metric: string) => {
  if (metric === "Pressure") return TriangleAlert;
  if (metric === "Torque") return Flame;
  if (metric === "Status") return Zap;
  return Thermometer;
};

export function AlertItem({ alert }: { alert: MachineAlert }) {
  const SeverityIcon = severityIcon[alert.severity];
  const MetricIcon = metricIcon(alert.metric);

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }}>
      <Card className={cn("relative overflow-hidden border-white/8 p-4", severityStyles[alert.severity])}>
        <div className={cn("absolute inset-y-0 left-0 w-1.5", severityBar[alert.severity])} />
        <div className="flex items-start justify-between gap-3 pl-1">
          <div>
            <div className="flex items-center gap-2 text-white">
              <SeverityIcon className="h-4 w-4" />
              <p className="text-sm font-semibold">{alert.title}</p>
            </div>
            <p className="mt-1 text-sm leading-6 text-zinc-300">{alert.message}</p>
          </div>
          <span className="rounded-full border border-white/10 px-2 py-1 text-[0.7rem] uppercase tracking-[0.2em] text-zinc-400">
            <MetricIcon className="mr-1 inline-block h-3.5 w-3.5 align-[-2px]" />
            {alert.metric}
          </span>
        </div>
        <div className="mt-3 flex items-center justify-between text-xs text-zinc-400">
          <span>{alert.value}</span>
          <span>{alert.timestamp}</span>
        </div>
      </Card>
    </motion.div>
  );
}