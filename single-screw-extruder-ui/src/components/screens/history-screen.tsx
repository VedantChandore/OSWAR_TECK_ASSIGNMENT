"use client";

import { motion } from "framer-motion";
import { AppFrame } from "@/components/app-frame";
import { AlertItem } from "@/components/alert-item";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MetricCard } from "@/components/metric-card";
import { DriveTrendChart } from "@/components/drive-trend-chart";
import { TrendChart } from "@/components/trend-chart";
import { useMachineData } from "@/components/machine-data-provider";
import { formatMixedDelta } from "@/lib/machine-data";

export function HistoryScreen() {
  const { snapshot, timeline, historyCursor, setHistoryCursor, units } = useMachineData();
  const progress = timeline.length > 1 ? Math.round((historyCursor / (timeline.length - 1)) * 100) : 0;
  const barrelAverage = snapshot.barrelTemperatures.reduce((sum, temperature) => sum + temperature, 0) / snapshot.barrelTemperatures.length;

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.08),transparent_30%),linear-gradient(180deg,#0d0d0d_0%,#090909_100%)]">
      <AppFrame title="History Timeline" subtitle="Scrub back through recent simulated data and inspect the machine state at any captured moment." />

      <main className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="grid gap-6 xl:grid-cols-[1.5fr_0.9fr]">
          <Card className="border-white/8">
            <CardHeader>
              <CardTitle className="text-lg">Timeline Scrubber</CardTitle>
              <p className="mt-2 text-sm text-zinc-400">Drag the timeline to review the last captured states. The selected snapshot is used below for all values and charts.</p>
            </CardHeader>
            <CardContent className="space-y-5">
              <div>
                <div className="flex items-center justify-between gap-4 text-sm text-zinc-400">
                  <span>Oldest captured state</span>
                  <span className="font-mono text-white tabular-nums">{snapshot.timestamp}</span>
                  <span>Live</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={Math.max(0, timeline.length - 1)}
                  value={historyCursor}
                  onChange={(event) => setHistoryCursor(Number(event.target.value))}
                  className="mt-3 h-2 w-full cursor-pointer appearance-none rounded-full bg-white/10 accent-cyan-400"
                  aria-label="History timeline scrubber"
                />
                <div className="mt-2 flex items-center justify-between text-xs uppercase tracking-[0.22em] text-zinc-500">
                  <span>Rewind</span>
                  <span>{timeline.length > 1 ? `${progress}% through recent history` : "History warming up"}</span>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                <MetricCard title="Screw Speed" value={snapshot.screwSpeed} suffix=" RPM" decimals={0} accent="cyan" sparklineData={snapshot.history.map((point) => point.screwSpeed)} delta={formatMixedDelta(snapshot.history.at(-1)?.screwSpeed ?? snapshot.screwSpeed, snapshot.history[0]?.screwSpeed ?? snapshot.screwSpeed, 1)} />
                <MetricCard title="Barrel Temperature" value={barrelAverage} suffix={units === "metric" ? " °C" : " °F"} decimals={units === "metric" ? 0 : 1} accent="amber" sparklineData={snapshot.history.map((point) => point.barrelTemperature)} />
                <MetricCard title="Melt Pressure" value={snapshot.meltPressure} suffix={units === "metric" ? " bar" : " psi"} decimals={1} accent="red" sparklineData={snapshot.history.map((point) => point.meltPressure)} />
                <MetricCard title="Motor Power" value={snapshot.motorPower} suffix=" kW" decimals={1} accent="green" sparklineData={snapshot.history.map((point) => point.motorPower)} />
                <MetricCard title="Throughput" value={snapshot.throughput} suffix=" kg/hr" decimals={0} accent="green" sparklineData={snapshot.history.map((point) => point.throughput)} />
                <MetricCard title="Feed Rate" value={snapshot.feedRate} suffix=" kg/hr" decimals={0} accent="cyan" sparklineData={snapshot.history.map((point) => point.feedRate)} />
              </div>
            </CardContent>
          </Card>

          <Card className="border-white/8">
            <CardHeader>
              <CardTitle className="text-lg">Selected Snapshot</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm leading-6 text-zinc-300">
              <p>The selected time slice captures the machine state, alerts, and recent trend history at a specific point in the last few minutes.</p>
              <div className="rounded-2xl border border-white/8 bg-white/3 p-4 text-zinc-200">
                <p className="text-[0.72rem] uppercase tracking-[0.22em] text-zinc-500">Status</p>
                <p className="mt-1 text-lg font-semibold">{snapshot.status}</p>
                <p className="mt-3 text-[0.72rem] uppercase tracking-[0.22em] text-zinc-500">Timestamp</p>
                <p className="mt-1 font-mono text-white tabular-nums">{snapshot.timestamp}</p>
              </div>
              <div className="space-y-3">
                {snapshot.alerts.length > 0 ? snapshot.alerts.map((alert) => <AlertItem key={`${alert.id}-${alert.timestamp}`} alert={alert} />) : <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-emerald-200">No active alerts in this captured history state.</div>}
              </div>
            </CardContent>
          </Card>
        </motion.section>

        <section className="grid gap-6 xl:grid-cols-4">
          <TrendChart title="Temperature Trend" description="Selected historical sample of barrel temperature behavior." data={snapshot.history} dataKey="barrelTemperature" color="#f59e0b" suffix={units === "metric" ? " °C" : " °F"} decimals={1} />
          <TrendChart title="Pressure Trend" description="Selected historical sample of die pressure movement." data={snapshot.history} dataKey="meltPressure" color="#ef4444" suffix={units === "metric" ? " bar" : " psi"} decimals={1} />
          <TrendChart title="Throughput Trend" description="Selected historical sample of output rate." data={snapshot.history} dataKey="throughput" color="#22c55e" suffix=" kg/hr" decimals={0} />
          <DriveTrendChart data={snapshot.history} />
        </section>
      </main>
    </div>
  );
}
