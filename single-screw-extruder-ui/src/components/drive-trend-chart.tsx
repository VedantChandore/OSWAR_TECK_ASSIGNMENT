"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ResponsiveContainer, LineChart, Line, CartesianGrid, Tooltip, XAxis, YAxis } from "recharts";
import type { TrendPoint } from "@/lib/machine-data";

type DriveTrendChartProps = {
  data: TrendPoint[];
};

const formatNumber = (value: number, decimals: number) => value.toFixed(decimals);

export function DriveTrendChart({ data }: DriveTrendChartProps) {
  const latest = data[data.length - 1];

  return (
    <Card className="overflow-hidden border-white/8" aria-label="Drive trend chart">
      <CardHeader>
        <CardTitle className="text-sm">Drive Trend</CardTitle>
        <CardDescription>RPM, torque, and motor power together to show how the drive responds during status changes.</CardDescription>
        <p className="mt-1 text-xs leading-5 text-zinc-500">Values shown together as relative trend lines; the units are not directly comparable.</p>
      </CardHeader>
      <CardContent className="h-65 pb-6">
        {latest ? <p className="sr-only">Latest drive snapshot: {formatNumber(latest.screwSpeed, 0)} RPM, {formatNumber(latest.torque, 0)} percent torque, {formatNumber(latest.motorPower, 1)} kilowatts.</p> : null}
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
            <XAxis dataKey="label" tick={{ fill: "#71717a", fontSize: 12 }} axisLine={false} tickLine={false} minTickGap={18} />
            <YAxis tick={{ fill: "#71717a", fontSize: 12 }} axisLine={false} tickLine={false} width={36} />
            <Tooltip
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) {
                  return null;
                }

                const values = payload.reduce<Record<string, number>>((accumulator, entry) => {
                  accumulator[String(entry.dataKey)] = Number(entry.value ?? 0);
                  return accumulator;
                }, {});

                return (
                  <div className="rounded-2xl border border-white/10 bg-[rgba(10,10,10,0.98)] px-4 py-3 shadow-2xl shadow-black/40">
                    <p className="text-[0.7rem] uppercase tracking-[0.22em] text-zinc-500">Timestamp</p>
                    <p className="mt-1 text-sm font-medium text-white">{String(label)}</p>
                    <div className="mt-3 space-y-1 text-sm text-zinc-300">
                      <p>RPM: <span className="font-semibold text-white">{formatNumber(values.screwSpeed ?? 0, 0)} RPM</span></p>
                      <p>Torque: <span className="font-semibold text-white">{formatNumber(values.torque ?? 0, 0)} %</span></p>
                      <p>Power: <span className="font-semibold text-white">{formatNumber(values.motorPower ?? 0, 1)} kW</span></p>
                    </div>
                  </div>
                );
              }}
            />
            <Line type="monotone" dataKey="screwSpeed" stroke="#38bdf8" strokeWidth={2.5} dot={false} isAnimationActive animationDuration={650} />
            <Line type="monotone" dataKey="torque" stroke="#f59e0b" strokeWidth={2.5} dot={false} isAnimationActive animationDuration={650} />
            <Line type="monotone" dataKey="motorPower" stroke="#22c55e" strokeWidth={2.5} dot={false} isAnimationActive animationDuration={650} />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}