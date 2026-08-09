"use client";

import { AnimatePresence, motion } from "framer-motion";
import { toPng } from "html-to-image";
import { useEffect, useMemo, useRef } from "react";
import { AlertItem } from "@/components/alert-item";
import { AppFrame } from "@/components/app-frame";
import { DriveTrendChart } from "@/components/drive-trend-chart";
import { MetricCard } from "@/components/metric-card";
import { TrendChart } from "@/components/trend-chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useMachineData } from "@/components/machine-data-provider";
import { cn } from "@/lib/utils";
import { formatMixedDelta } from "@/lib/machine-data";

export function DashboardScreen() {
  const { liveSnapshot: snapshot, alerts, metricFilter, units } = useMachineData();
  const reportRef = useRef<HTMLDivElement>(null);
  const barrelAverage = snapshot.barrelTemperatures.reduce((sum, temperature) => sum + temperature, 0) / snapshot.barrelTemperatures.length;
  const activeAlertIds = new Set(alerts.map((alert) => alert.metric));
  const faultActive = alerts.some((alert) => alert.id === "status-fault");

  const productionCompletion = Math.min(100, (snapshot.throughput / Math.max(1, snapshot.targetThroughput)) * 100);
  const historicalDelta = (series: number[]) => {
    if (series.length < 2) {
      return { direction: "flat" as const, text: "0.0%" };
    }

    return formatMixedDelta(series[series.length - 1], series[0], 1);
  };

  const metricCards = useMemo(
    () => [
      {
        title: "Screw Speed",
        value: snapshot.screwSpeed,
        suffix: " RPM",
        decimals: 0,
        accent: "cyan" as const,
        highlighted: faultActive,
        highlightTone: "danger" as const,
        description: "Rotor speed inside the barrel",
        sparklineData: snapshot.history.map((point) => point.screwSpeed),
      },
      {
        title: "Barrel Temperature",
        value: barrelAverage,
        suffix: units === "metric" ? " °C" : " °F",
        decimals: units === "metric" ? 0 : 1,
        accent: "amber" as const,
        highlighted: activeAlertIds.has("Barrel"),
        highlightTone: "warning" as const,
        description: "Average across all barrel zones",
        sparklineData: snapshot.history.map((point) => point.barrelTemperature),
      },
      {
        title: "Die Temperature",
        value: snapshot.dieTemperature,
        suffix: units === "metric" ? " °C" : " °F",
        decimals: units === "metric" ? 0 : 1,
        accent: "amber" as const,
        sparklineData: snapshot.history.map((point) => point.dieTemperature),
        description: "Final extrusion thermal profile",
        delta: undefined,
      },
      {
        title: "Melt Pressure",
        value: snapshot.meltPressure,
        suffix: units === "metric" ? " bar" : " psi",
        decimals: 1,
        accent: snapshot.meltPressure > 145 ? "red" as const : "green" as const,
        highlighted: activeAlertIds.has("Pressure"),
        highlightTone: "danger" as const,
        description: "Pressure near the die and melt path",
        sparklineData: snapshot.history.map((point) => point.meltPressure),
      },
      {
        title: "Motor Power",
        value: snapshot.motorPower,
        suffix: " kW",
        decimals: 1,
        accent: "green" as const,
        highlighted: faultActive,
        highlightTone: "danger" as const,
        description: "Main drive power draw",
        sparklineData: snapshot.history.map((point) => point.motorPower),
      },
      {
        title: "Torque",
        value: snapshot.torque,
        suffix: " %",
        decimals: 0,
        accent: snapshot.torque > 83 ? "amber" as const : "cyan" as const,
        highlighted: faultActive || activeAlertIds.has("Torque"),
        highlightTone: faultActive ? "danger" as const : "warning" as const,
        description: "Drive load and mechanical demand",
        sparklineData: snapshot.history.map((point) => point.torque),
      },
      {
        title: "Throughput",
        value: snapshot.throughput,
        suffix: " kg/hr",
        decimals: 0,
        accent: "green" as const,
        highlighted: faultActive,
        highlightTone: "danger" as const,
        description: "Material exiting the line",
        sparklineData: snapshot.history.map((point) => point.throughput),
      },
      {
        title: "Feed Rate",
        value: snapshot.feedRate,
        suffix: " kg/hr",
        decimals: 0,
        accent: "cyan" as const,
        highlighted: faultActive,
        highlightTone: "danger" as const,
        description: "Incoming material flow",
        sparklineData: snapshot.history.map((point) => point.feedRate),
      },
      {
        title: "Energy Consumption",
        value: snapshot.energyConsumption,
        suffix: " kWh",
        decimals: 0,
        accent: "cyan" as const,
        description: "Cumulative simulated usage",
        sparklineData: snapshot.history.map((point) => point.energyConsumption),
        delta: undefined,
      },
    ],
    [activeAlertIds, barrelAverage, faultActive, snapshot, units],
  );

  const filteredMetricCards = metricCards.filter((card) => {
    if (!metricFilter.trim()) {
      return true;
    }

    const needle = metricFilter.trim().toLowerCase();
    return `${card.title} ${card.description ?? ""}`.toLowerCase().includes(needle);
  });

  useEffect(() => {
    const onExport = async () => {
      if (!reportRef.current) {
        return;
      }

      const png = await toPng(reportRef.current, { cacheBust: true, pixelRatio: 2, backgroundColor: "#0a0a0a" });
      const link = document.createElement("a");
      link.href = png;
      link.download = `extruder-dashboard-${snapshot.timestamp.replaceAll(":", "-")}.png`;
      link.click();
    };

    window.addEventListener("extruder-download-report", onExport as EventListener);
    return () => window.removeEventListener("extruder-download-report", onExport as EventListener);
  }, [snapshot.timestamp]);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.08),transparent_30%),linear-gradient(180deg,#0d0d0d_0%,#090909_100%)]">
      <AppFrame title="Performance Dashboard" subtitle="Live monitoring with simulated process telemetry and smooth historical trends." />

      <main className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <motion.section ref={reportRef} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }} className="grid gap-4 lg:grid-cols-[1.6fr_0.9fr]">
          <Card className="overflow-hidden border-white/8">
            <CardHeader className="flex items-start justify-between gap-4 border-white/5">
              <div>
                <CardTitle className="text-lg">Current Operating Snapshot</CardTitle>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">
                  The machine is simulated entirely on the frontend with bounded random-walk updates, threshold detection, and synchronized route state.
                </p>
              </div>
              <div className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm text-zinc-300">
                {snapshot.status} • {snapshot.timestamp}
              </div>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {filteredMetricCards.map((card) => {
                const deltaSeries = card.sparklineData ?? [];
                const delta = card.delta ?? (deltaSeries.length > 1 ? historicalDelta(deltaSeries) : undefined);

                return <MetricCard key={card.title} {...card} delta={delta} />;
              })}
            </CardContent>
          </Card>

          <Card className="border-white/8">
            <CardHeader>
              <CardTitle className="text-lg">Live Alerts</CardTitle>
              <p className="mt-2 text-sm text-zinc-400">Threshold-based alerts are generated from the same live machine state used by the canvas.</p>
            </CardHeader>
            <CardContent className="space-y-3">
              <AnimatePresence mode="popLayout">
                {alerts.length > 0 ? (
                  alerts.map((alert) => <AlertItem key={alert.id} alert={alert} />)
                ) : (
                  <motion.div key="no-alerts" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-5 text-sm text-emerald-200">
                    No active alerts. The machine is within the nominal control band.
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
        </motion.section>

        <motion.section initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.08 }} className="grid gap-6 xl:grid-cols-[1.55fr_0.9fr]">
          <Card className="border-white/8">
            <CardHeader>
              <CardTitle className="text-lg">Production / Performance Metrics</CardTitle>
              <p className="mt-2 text-sm text-zinc-400">Simulated running efficiency, uptime, and throughput progress for the current shift.</p>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <MetricCard title="Uptime %" value={snapshot.uptimePercent} suffix=" %" decimals={1} accent="green" description="Running time accumulated this shift" sparklineData={snapshot.history.map((point) => point.uptimePercent)} delta={historicalDelta(snapshot.history.map((point) => point.uptimePercent))} />
              <MetricCard title="OEE / Efficiency" value={snapshot.efficiencyPercent} suffix=" %" decimals={1} accent="cyan" description="Simplified overall equipment effectiveness" sparklineData={snapshot.history.map((point) => point.efficiencyPercent)} delta={historicalDelta(snapshot.history.map((point) => point.efficiencyPercent))} />
              <MetricCard title="Batch / Cycle Count" value={snapshot.cycleCount} suffix=" cycles" decimals={0} accent="amber" description="Increments while the machine is running" sparklineData={snapshot.history.map((point, index) => index)} delta={{ text: `${Math.max(0, snapshot.cycleCount - (snapshot.cycleCount - 9))} cycles`, direction: "up" }} />

              <Card className="border-white/8 bg-white/3 p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[0.72rem] uppercase tracking-[0.24em] text-zinc-400">Target vs Actual Throughput</p>
                    <p className="mt-2 text-3xl font-semibold text-white tabular-nums">
                      {snapshot.throughput.toFixed(0)} <span className="text-base text-zinc-500">/ {snapshot.targetThroughput.toFixed(0)} kg/hr</span>
                    </p>
                  </div>
                  <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.2em] text-zinc-300">
                    {productionCompletion.toFixed(0)}%
                  </div>
                </div>
                <div className="mt-4 h-3 overflow-hidden rounded-full bg-white/5">
                  <div className={cn("h-full rounded-full transition-all duration-500", snapshot.status === "Fault" ? "bg-red-500" : snapshot.status === "Idle" ? "bg-amber-500" : "bg-emerald-500")} style={{ width: `${productionCompletion}%` }} />
                </div>
                <p className="mt-3 text-sm text-zinc-400">Actual output is compared against the current shift target and updates with the live simulation.</p>
              </Card>
            </CardContent>
          </Card>

          <Card className="border-white/8">
            <CardHeader>
              <CardTitle className="text-lg">Shift Notes</CardTitle>
              <p className="mt-2 text-sm text-zinc-400">The production panel keeps the dashboard and alerts column visually balanced on smaller laptops.</p>
            </CardHeader>
            <CardContent className="space-y-3 text-sm leading-6 text-zinc-300">
              <p>Uptime and efficiency trend upward while the machine remains in a stable running state, then taper when the status drops to Idle or Fault.</p>
              <p>Cycle count only increments during Running ticks, and the target throughput bar provides a quick comparison against actual line output.</p>
              <p>All values use a consistent precision rule: temperatures and pressure use one decimal place, while RPM, percentages, and kg/hr render as whole numbers where appropriate.</p>
            </CardContent>
          </Card>
        </motion.section>

        <section className="grid gap-6 xl:grid-cols-4">
          <TrendChart title="Temperature Trend" description="Recent barrel zone behavior with a weighted process average." data={snapshot.history} dataKey="barrelTemperature" color="#f59e0b" suffix={units === "metric" ? " °C" : " °F"} decimals={1} />
          <TrendChart title="Pressure Trend" description="Die pressure stability and transient spikes." data={snapshot.history} dataKey="meltPressure" color="#ef4444" suffix={units === "metric" ? " bar" : " psi"} decimals={1} />
          <TrendChart title="Throughput Trend" description="Output rate changes as the line speeds up or slows down." data={snapshot.history} dataKey="throughput" color="#22c55e" suffix=" kg/hr" decimals={0} />
          <DriveTrendChart data={snapshot.history} />
        </section>
      </main>
    </div>
  );
}