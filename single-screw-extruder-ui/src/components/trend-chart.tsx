"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ResponsiveContainer, AreaChart, Area, CartesianGrid, Tooltip, XAxis, YAxis } from "recharts";
import type { TrendPoint } from "@/lib/machine-data";

type TrendChartProps = {
  title: string;
  description: string;
  data: TrendPoint[];
  dataKey: keyof TrendPoint;
  color: string;
  suffix?: string;
  decimals?: number;
};

const formatNumber = (value: number, decimals: number) => value.toFixed(decimals);

export function TrendChart({ title, description, data, dataKey, color, suffix, decimals = 0 }: TrendChartProps) {
  return (
    <Card className="overflow-hidden border-white/8">
      <CardHeader>
        <CardTitle className="text-sm">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="h-65 pb-6">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id={`gradient-${String(dataKey)}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.45} />
                <stop offset="100%" stopColor={color} stopOpacity={0.03} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
            <XAxis dataKey="label" tick={{ fill: "#71717a", fontSize: 12 }} axisLine={false} tickLine={false} minTickGap={18} />
            <YAxis tick={{ fill: "#71717a", fontSize: 12 }} axisLine={false} tickLine={false} width={36} />
            <Tooltip
              labelFormatter={(label) => `Timestamp: ${String(label)}`}
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) {
                  return null;
                }

                const rawValue = Number(payload[0]?.value ?? 0);

                return (
                  <div className="rounded-2xl border border-white/10 bg-[rgba(10,10,10,0.98)] px-4 py-3 shadow-2xl shadow-black/40">
                    <p className="text-[0.7rem] uppercase tracking-[0.22em] text-zinc-500">Timestamp</p>
                    <p className="mt-1 text-sm font-medium text-white">{String(label)}</p>
                    <p className="mt-3 text-sm text-zinc-300">
                      <span className="font-semibold text-white">{formatNumber(rawValue, decimals)}{suffix ?? ""}</span>
                    </p>
                  </div>
                );
              }}
              contentStyle={{
                background: "rgba(15,15,15,0.98)",
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: 14,
                color: "white",
              }}
              labelStyle={{ color: "#d4d4d8", fontWeight: 600 }}
              formatter={(value) => [`${formatNumber(Number(value), decimals)}${suffix ?? ""}`, title]}
            />
            <Area
              type="monotone"
              dataKey={dataKey}
              stroke={color}
              strokeWidth={2}
              fill={`url(#gradient-${String(dataKey)})`}
              isAnimationActive
              animationDuration={650}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}