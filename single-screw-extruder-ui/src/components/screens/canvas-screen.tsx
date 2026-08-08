"use client";

import { motion } from "framer-motion";
import { AppFrame } from "@/components/app-frame";
import { HoverPointCard } from "@/components/hover-point-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useMachineData } from "@/components/machine-data-provider";
import { getMachinePoints, type MachinePointValue } from "@/lib/machine-data";
import { cn } from "@/lib/utils";
import { useMemo, useState } from "react";

type CanvasPoint = MachinePointValue & {
  x: number;
  y: number;
  cardX: number;
  cardY: number;
  align: "left" | "right";
};

const pointsLayout: Record<string, Pick<CanvasPoint, "x" | "y" | "cardX" | "cardY" | "align">> = {
  feeder: { x: 13, y: 39, cardX: 5, cardY: 17, align: "left" },
  motor: { x: 18, y: 58, cardX: 5, cardY: 56, align: "left" },
  gearbox: { x: 28, y: 48, cardX: 5, cardY: 74, align: "left" },
  "barrel-zone-1": { x: 43, y: 39, cardX: 66, cardY: 15, align: "right" },
  "barrel-zone-2": { x: 50, y: 39, cardX: 78, cardY: 25, align: "right" },
  "barrel-zone-3": { x: 57, y: 39, cardX: 83, cardY: 38, align: "right" },
  screw: { x: 50, y: 50, cardX: 73, cardY: 51, align: "right" },
  die: { x: 81, y: 43, cardX: 72, cardY: 63, align: "right" },
  output: { x: 88, y: 43, cardX: 72, cardY: 80, align: "right" },
};

export function CanvasScreen() {
  const { snapshot } = useMachineData();
  const [activePointId, setActivePointId] = useState("barrel-zone-2");

  const points = useMemo<CanvasPoint[]>(() => {
    return getMachinePoints(snapshot).map((point) => ({ ...point, ...pointsLayout[point.id] }));
  }, [snapshot]);

  const activePoint = points.find((point) => point.id === activePointId) ?? points[0];

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.08),transparent_30%),linear-gradient(180deg,#0d0d0d_0%,#090909_100%)]">
      <AppFrame title="Interactive Machine Canvas" subtitle="Original extruder visualization with interactive measurement points and synchronized simulated values." />

      <main className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:px-8 xl:grid-cols-[1.35fr_0.65fr]">
        <Card className="relative overflow-hidden border-white/8 p-0">
          <CardHeader className="border-white/5">
            <CardTitle className="text-lg">Single Screw Extruder Template</CardTitle>
            <p className="mt-2 text-sm text-zinc-400">
              Hover or focus any measurement node to inspect its live callout. The layout is reusable through point configuration props.
            </p>
          </CardHeader>
          <CardContent className="relative p-0">
            <div className="relative aspect-[16/10] min-h-[620px] overflow-hidden bg-[linear-gradient(180deg,rgba(255,255,255,0.02),rgba(255,255,255,0.01))]">
              <div className="absolute inset-0 grid-pattern opacity-25" />
              <MachineIllustration status={snapshot.status} temperatures={snapshot.barrelTemperatures} screwSpeed={snapshot.screwSpeed} meltPressure={snapshot.meltPressure} />

              <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                {points.map((point) => (
                  <line
                    key={`${point.id}-connector`}
                    x1={point.x}
                    y1={point.y}
                    x2={point.cardX}
                    y2={point.cardY}
                    stroke={point.id === activePointId ? "rgba(56,189,248,0.9)" : "rgba(255,255,255,0.28)"}
                    strokeWidth="0.35"
                    strokeDasharray="1.2 1.2"
                  />
                ))}
              </svg>

              {points.map((point) => {
                const isActive = point.id === activePointId;

                return (
                  <button
                    key={point.id}
                    type="button"
                    aria-label={`Inspect ${point.label}`}
                    onMouseEnter={() => setActivePointId(point.id)}
                    onFocus={() => setActivePointId(point.id)}
                    onClick={() => setActivePointId(point.id)}
                    className={cn(
                      "group absolute z-20 flex h-5 w-5 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70",
                      isActive ? "border-cyan-300 bg-cyan-300 shadow-[0_0_0_8px_rgba(56,189,248,0.12)]" : "border-white/45 bg-white/10 hover:border-cyan-300 hover:bg-cyan-300/80",
                    )}
                    style={{ left: `${point.x}%`, top: `${point.y}%` }}
                  >
                    <span className="h-2 w-2 rounded-full bg-current" />
                  </button>
                );
              })}

              {points.map((point) => {
                const isActive = point.id === activePointId;

                return (
                  <motion.div
                    key={`${point.id}-card`}
                    initial={false}
                    animate={{ opacity: isActive ? 1 : 0.68, scale: isActive ? 1.01 : 0.98 }}
                    transition={{ duration: 0.22 }}
                    className={cn("absolute z-10 w-[240px] max-w-[40vw]", point.align === "left" ? "-translate-x-0" : "translate-x-[-100%]")}
                    style={{ left: `${point.cardX}%`, top: `${point.cardY}%` }}
                  >
                    <HoverPointCard point={point} active={isActive} />
                  </motion.div>
                );
              })}

              <div className="pointer-events-none absolute left-1/2 top-[39%] z-0 h-[14%] w-[36%] -translate-x-1/2 rounded-[999px] bg-gradient-to-r from-transparent via-cyan-400/15 to-transparent blur-2xl animate-sweep" />
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="border-white/8">
            <CardHeader>
              <CardTitle className="text-lg">Selected Measurement Point</CardTitle>
            </CardHeader>
            <CardContent>
              <HoverPointCard point={activePoint} active />
            </CardContent>
          </Card>

          <Card className="border-white/8">
            <CardHeader>
              <CardTitle className="text-lg">Operating Notes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm leading-6 text-zinc-300">
              <p>Subtle rotation, live connector highlights, and tonal state changes are tied to the shared data store used by the dashboard.</p>
              <p>Component positions are configuration-driven, so a future extruder template can reuse the same canvas infrastructure with different measurements.</p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

function MachineIllustration({ status, temperatures, screwSpeed, meltPressure }: { status: "Running" | "Idle" | "Fault"; temperatures: number[]; screwSpeed: number; meltPressure: number; }) {
  const running = status === "Running";
  const fault = status === "Fault";
  const barrelTint = temperatures[2] > 208 ? "rgba(245,158,11,0.9)" : "rgba(56,189,248,0.8)";

  return (
    <svg className="absolute inset-0 h-full w-full" viewBox="0 0 1000 620" role="img" aria-label="Single screw extruder diagram">
      <defs>
        <linearGradient id="barrelGradient" x1="0" x2="1">
          <stop offset="0%" stopColor="#6b7280" />
          <stop offset="45%" stopColor="#a3a3a3" />
          <stop offset="100%" stopColor="#71717a" />
        </linearGradient>
        <linearGradient id="materialFlow" x1="0" x2="1">
          <stop offset="0%" stopColor="rgba(34,197,94,0.15)" />
          <stop offset="50%" stopColor="rgba(56,189,248,0.8)" />
          <stop offset="100%" stopColor="rgba(34,197,94,0.15)" />
        </linearGradient>
      </defs>

      <rect x="100" y="480" width="790" height="34" rx="17" fill="rgba(245,222,179,0.28)" />
      <rect x="115" y="490" width="760" height="14" rx="7" fill="rgba(255,240,200,0.38)" />

      <g className={cn(fault ? "animate-pulse" : "", running ? "animate-floatGlow" : "")}>
        <rect x="120" y="350" width="96" height="120" rx="16" fill="#222225" stroke="rgba(255,255,255,0.12)" />
        <rect x="160" y="372" width="72" height="76" rx="12" fill="#4338ca" opacity="0.7" />
        <circle cx="165" cy="410" r="52" fill="#312e81" opacity="0.85" />
        <circle cx="165" cy="410" r="40" fill="#191919" stroke="rgba(255,255,255,0.1)" />
        <g className={running ? "animate-[spin_3.6s_linear_infinite]" : ""} style={{ transformOrigin: "165px 410px" }}>
          <circle cx="165" cy="410" r="18" fill="#0f172a" stroke="rgba(255,255,255,0.16)" />
          {Array.from({ length: 8 }).map((_, index) => (
            <rect key={index} x="162" y="373" width="6" height="74" rx="3" fill="#8b5cf6" transform={`rotate(${index * 45} 165 410)`} opacity="0.9" />
          ))}
        </g>
        <rect x="214" y="402" width="26" height="16" rx="8" fill="#8b5cf6" />
      </g>

      <g>
        <rect x="255" y="292" width="505" height="160" rx="28" fill="url(#barrelGradient)" stroke="rgba(255,255,255,0.16)" />
        {temperatures.map((temperature, index) => {
          const intensity = Math.max(0.18, Math.min(0.85, (temperature - 165) / 65));
          return (
            <rect key={index} x={278 + index * 118} y="304" width="108" height="136" rx="18" fill={index === 2 ? barrelTint : `rgba(56,189,248,${0.08 + intensity * 0.12})`} />
          );
        })}

        <rect x="274" y="314" width="460" height="116" rx="18" fill="rgba(17,17,17,0.28)" stroke="rgba(255,255,255,0.08)" />

        {running ? (
          <g className="animate-[dash_5s_linear_infinite]" style={{ strokeDasharray: "18 14" }}>
            <path d="M 290 372 C 370 330, 470 414, 560 372 S 710 330, 730 372" stroke="url(#materialFlow)" strokeWidth="8" fill="none" strokeLinecap="round" opacity="0.88" />
          </g>
        ) : null}

        <motion.g animate={running ? { rotate: 360 } : { rotate: 0 }} transition={running ? { repeat: Infinity, duration: Math.max(2.2, 7 - screwSpeed / 35), ease: "linear" } : { duration: 0.2 }} style={{ transformOrigin: "505px 372px" }}>
          <circle cx="505" cy="372" r="86" fill="none" stroke="rgba(255,255,255,0.14)" strokeWidth="10" opacity="0.7" />
          {Array.from({ length: 12 }).map((_, index) => (
            <path key={index} d="M 460 354 L 550 390" stroke="rgba(255,255,255,0.52)" strokeWidth="6" strokeLinecap="round" transform={`rotate(${index * 30} 505 372)`} />
          ))}
          <circle cx="505" cy="372" r="28" fill="#e5e7eb" opacity="0.94" />
          <circle cx="505" cy="372" r="10" fill="#737373" />
        </motion.g>

        <rect x="752" y="306" width="72" height="132" rx="18" fill="#c084fc" opacity="0.72" />
        <rect x="796" y="324" width="60" height="96" rx="14" fill="#e879f9" opacity="0.58" />
        <rect x="842" y="352" width="76" height="40" rx="20" fill="#f5f5f5" opacity="0.92" />
      </g>

      <g className={fault ? "animate-pulse" : ""}>
        <path d="M 260 282 L 255 350" stroke="rgba(255,255,255,0.18)" strokeWidth="6" strokeLinecap="round" />
        <rect x="250" y="210" width="132" height="78" rx="14" fill="#2d2d2d" stroke="rgba(255,255,255,0.14)" />
        <rect x="285" y="188" width="72" height="88" rx="18" fill="#4b5563" opacity="0.72" />
        <path d="M 318 188 L 300 188 L 300 154 L 350 154 L 350 188" fill="#64748b" opacity="0.9" />
      </g>

      <g>
        <path d="M 790 342 L 890 342" stroke="rgba(255,255,255,0.18)" strokeWidth="10" strokeLinecap="round" />
        <path d="M 892 342 L 928 372" stroke="rgba(255,255,255,0.18)" strokeWidth="10" strokeLinecap="round" />
        <rect x="892" y="312" width="68" height="106" rx="20" fill="#d4d4d8" opacity="0.84" />
      </g>

      <g opacity="0.95">
        <text x="112" y="136" fill="#d4d4d8" fontSize="24" fontWeight="600">Motor</text>
        <text x="260" y="136" fill="#d4d4d8" fontSize="24" fontWeight="600">Gearbox</text>
        <text x="452" y="136" fill="#d4d4d8" fontSize="24" fontWeight="600">Barrel</text>
        <text x="772" y="136" fill="#d4d4d8" fontSize="24" fontWeight="600">Die</text>
        <text x="456" y="548" fill="#86efac" fontSize="18" fontWeight="500">Running state: {status} • Pressure {meltPressure.toFixed(0)} bar</text>
      </g>
    </svg>
  );
}