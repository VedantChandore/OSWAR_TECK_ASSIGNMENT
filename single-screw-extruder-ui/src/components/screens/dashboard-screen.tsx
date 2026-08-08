"use client";

import { motion } from "framer-motion";
import { AlertItem } from "@/components/alert-item";
import { AppFrame } from "@/components/app-frame";
import { DriveTrendChart } from "@/components/drive-trend-chart";
import { MetricCard } from "@/components/metric-card";
import { TrendChart } from "@/components/trend-chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useMachineData } from "@/components/machine-data-provider";
import { cn } from "@/lib/utils";

export function DashboardScreen() {
  const { snapshot, alerts } = useMachineData();
  const barrelAverage = snapshot.barrelTemperatures.reduce((sum, temperature) => sum + temperature, 0) / snapshot.barrelTemperatures.length;
  const activeAlertIds = new Set(alerts.map((alert) => alert.metric));
  const faultActive = alerts.some((alert) => alert.id === "status-fault");

  const productionCompletion = Math.min(100, (snapshot.throughput / Math.max(1, snapshot.targetThroughput)) * 100);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.08),transparent_30%),linear-gradient(180deg,#0d0d0d_0%,#090909_100%)]">
      <AppFrame title="Performance Dashboard" subtitle="Live monitoring with simulated process telemetry and smooth historical trends." />

      <main className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <motion.section initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }} className="grid gap-4 lg:grid-cols-[1.6fr_0.9fr]">
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
              <MetricCard title="Screw Speed" value={snapshot.screwSpeed} suffix=" RPM" decimals={0} accent="cyan" highlighted={faultActive} highlightTone="danger" description="Rotor speed inside the barrel" />
              <MetricCard title="Barrel Temperature" value={barrelAverage} suffix=" °C" decimals={1} accent="amber" highlighted={activeAlertIds.has("Barrel")} highlightTone="warning" description="Average across all barrel zones" />
              <MetricCard title="Die Temperature" value={snapshot.dieTemperature} suffix=" °C" decimals={1} accent="amber" description="Final extrusion thermal profile" />
              <MetricCard title="Melt Pressure" value={snapshot.meltPressure} suffix=" bar" decimals={1} accent={snapshot.meltPressure > 145 ? "red" : "green"} highlighted={activeAlertIds.has("Pressure")} highlightTone="danger" description="Pressure near the die and melt path" />
              <MetricCard title="Motor Power" value={snapshot.motorPower} suffix=" kW" decimals={1} accent="green" highlighted={faultActive} highlightTone="danger" description="Main drive power draw" />
              <MetricCard title="Torque" value={snapshot.torque} suffix=" %" decimals={0} accent={snapshot.torque > 83 ? "amber" : "cyan"} highlighted={faultActive || activeAlertIds.has("Torque")} highlightTone={faultActive ? "danger" : "warning"} description="Drive load and mechanical demand" />
              <MetricCard title="Throughput" value={snapshot.throughput} suffix=" kg/hr" decimals={0} accent="green" highlighted={faultActive} highlightTone="danger" description="Material exiting the line" />
              <MetricCard title="Feed Rate" value={snapshot.feedRate} suffix=" kg/hr" decimals={0} accent="cyan" highlighted={faultActive} highlightTone="danger" description="Incoming material flow" />
              <MetricCard title="Energy Consumption" value={snapshot.energyConsumption} suffix=" kWh" decimals={0} accent="cyan" description="Cumulative simulated usage" />
            </CardContent>
          </Card>

          <Card className="border-white/8">
            <CardHeader>
              <CardTitle className="text-lg">Live Alerts</CardTitle>
              <p className="mt-2 text-sm text-zinc-400">Threshold-based alerts are generated from the same live machine state used by the canvas.</p>
            </CardHeader>
            <CardContent className="space-y-3">
              {alerts.length > 0 ? alerts.map((alert) => <AlertItem key={alert.id} alert={alert} />) : <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-5 text-sm text-emerald-200">No active alerts. The machine is within the nominal control band.</div>}
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
              <MetricCard title="Uptime %" value={snapshot.uptimePercent} suffix=" %" decimals={1} accent="green" description="Running time accumulated this shift" />
              <MetricCard title="OEE / Efficiency" value={snapshot.efficiencyPercent} suffix=" %" decimals={1} accent="cyan" description="Simplified overall equipment effectiveness" />
              <MetricCard title="Batch / Cycle Count" value={snapshot.cycleCount} suffix=" cycles" decimals={0} accent="amber" description="Increments while the machine is running" />

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
          <TrendChart title="Temperature Trend" description="Recent barrel zone behavior with a weighted process average." data={snapshot.history} dataKey="barrelTemperature" color="#f59e0b" suffix=" °C" decimals={1} />
          <TrendChart title="Pressure Trend" description="Die pressure stability and transient spikes." data={snapshot.history} dataKey="meltPressure" color="#ef4444" suffix=" bar" decimals={1} />
          <TrendChart title="Throughput Trend" description="Output rate changes as the line speeds up or slows down." data={snapshot.history} dataKey="throughput" color="#22c55e" suffix=" kg/hr" decimals={0} />
          <DriveTrendChart data={snapshot.history} />
        </section>
      </main>
    </div>
  );
}