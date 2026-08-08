"use client";

import { motion } from "framer-motion";
import { type MutableRefObject, useLayoutEffect, useMemo, useRef, useState } from "react";
import { AppFrame } from "@/components/app-frame";
import { HoverPointCard } from "@/components/hover-point-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useMachineData } from "@/components/machine-data-provider";
import { getMachinePoints, type MachinePointValue, type MachineSnapshot } from "@/lib/machine-data";
import { cn } from "@/lib/utils";

type CanvasPoint = MachinePointValue & {
  side: "left" | "right";
  node: {
    x: number;
    y: number;
  };
  order: number;
};

type Connector = {
  id: string;
  side: "left" | "right";
  start: {
    x: number;
    y: number;
  };
  end: {
    x: number;
    y: number;
  };
};

const pointLayout: Record<string, Pick<CanvasPoint, "side" | "node" | "order">> = {
  feeder: { side: "left", node: { x: 13, y: 40 }, order: 0 },
  motor: { side: "left", node: { x: 16, y: 57 }, order: 1 },
  gearbox: { side: "left", node: { x: 27, y: 49 }, order: 2 },
  "barrel-zone-1": { side: "right", node: { x: 42, y: 39 }, order: 3 },
  "barrel-zone-2": { side: "right", node: { x: 50, y: 39 }, order: 4 },
  "barrel-zone-3": { side: "right", node: { x: 58, y: 39 }, order: 5 },
  screw: { side: "right", node: { x: 50, y: 52 }, order: 6 },
  die: { side: "right", node: { x: 83, y: 43 }, order: 7 },
  output: { side: "right", node: { x: 91, y: 43 }, order: 8 },
};

export function CanvasScreen() {
  const { snapshot } = useMachineData();
  const [activePointId, setActivePointId] = useState("barrel-zone-2");

  const points = useMemo<CanvasPoint[]>(() => {
    return getMachinePoints(snapshot)
      .map((point) => ({ ...point, ...pointLayout[point.id] }))
      .sort((left, right) => left.order - right.order);
  }, [snapshot]);

  const activePoint = points.find((point) => point.id === activePointId) ?? points[0];

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.08),transparent_30%),linear-gradient(180deg,#0d0d0d_0%,#090909_100%)]">
      <AppFrame title="Interactive Machine Canvas" subtitle="Original extruder visualization with interactive measurement points and synchronized simulated values." />

      <main className="mx-auto grid w-full max-w-[1680px] gap-6 px-4 py-6 sm:px-6 lg:px-8 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6 min-w-0">
          <Card className="relative overflow-visible border-white/8 p-0">
            <CardHeader className="border-white/5">
              <CardTitle className="text-lg">Single Screw Extruder Template</CardTitle>
              <p className="mt-2 text-sm text-zinc-400">
                Hover or focus any measurement node to inspect its live callout. The layout is reusable through point configuration props.
              </p>
            </CardHeader>
            <CardContent className="overflow-visible p-4 sm:p-6">
              <div className="hidden xl:block">
                <DesktopCanvasGrid points={points} activePointId={activePointId} onPointActivate={setActivePointId} snapshot={snapshot} />
              </div>

              <div className="xl:hidden">
                <MachineIllustration
                  status={snapshot.status}
                  temperatures={snapshot.barrelTemperatures}
                  screwSpeed={snapshot.screwSpeed}
                  meltPressure={snapshot.meltPressure}
                  points={points}
                  activePointId={activePointId}
                  onPointActivate={setActivePointId}
                />

                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  {points.map((point) => (
                    <PointCalloutButton key={`mobile-${point.id}`} point={point} active={point.id === activePointId} onActivate={setActivePointId} />
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4 xl:sticky xl:top-[9.25rem] xl:self-start">
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

function DesktopCanvasGrid({
  points,
  activePointId,
  onPointActivate,
  snapshot,
}: {
  points: CanvasPoint[];
  activePointId: string;
  onPointActivate: (pointId: string) => void;
  snapshot: MachineSnapshot;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const nodeRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const cardRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [connectors, setConnectors] = useState<Connector[]>([]);

  useLayoutEffect(() => {
    const update = () => {
      const container = containerRef.current;
      if (!container) {
        return;
      }

      const containerRect = container.getBoundingClientRect();

      setConnectors(
        points.flatMap((point) => {
          const node = nodeRefs.current[point.id];
          const card = cardRefs.current[point.id];

          if (!node || !card) {
            return [];
          }

          const nodeRect = node.getBoundingClientRect();
          const cardRect = card.getBoundingClientRect();

          const start = {
            x: nodeRect.left - containerRect.left + nodeRect.width / 2,
            y: nodeRect.top - containerRect.top + nodeRect.height / 2,
          };

          const end =
            point.side === "left"
              ? {
                  x: cardRect.right - containerRect.left,
                  y: cardRect.top - containerRect.top + cardRect.height / 2,
                }
              : {
                  x: cardRect.left - containerRect.left,
                  y: cardRect.top - containerRect.top + cardRect.height / 2,
                };

          return [
            {
              id: point.id,
              side: point.side,
              start,
              end,
            },
          ];
        }),
      );
    };

    const frame = window.requestAnimationFrame(update);
    const resizeObserver = typeof ResizeObserver !== "undefined" && containerRef.current ? new ResizeObserver(update) : null;

    if (resizeObserver && containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    window.addEventListener("resize", update);

    return () => {
      window.cancelAnimationFrame(frame);
      resizeObserver?.disconnect();
      window.removeEventListener("resize", update);
    };
  }, [points, activePointId, snapshot]);

  return (
    <div ref={containerRef} className="relative min-w-0 overflow-visible">
      <div className="relative grid min-h-[760px] grid-cols-[minmax(230px,1fr)_minmax(620px,1.5fr)_minmax(230px,1fr)] gap-6 overflow-visible">
        <ConnectorLayer connectors={connectors} activePointId={activePointId} />

        <PointStack points={points.filter((point) => point.side === "left")} activePointId={activePointId} onPointActivate={onPointActivate} refsMap={cardRefs} />

        <MachineIllustration
          status={snapshot.status}
          temperatures={snapshot.barrelTemperatures}
          screwSpeed={snapshot.screwSpeed}
          meltPressure={snapshot.meltPressure}
          points={points}
          activePointId={activePointId}
          onPointActivate={onPointActivate}
          refsMap={nodeRefs}
        />

        <PointStack points={points.filter((point) => point.side === "right")} activePointId={activePointId} onPointActivate={onPointActivate} refsMap={cardRefs} />
      </div>
    </div>
  );
}

function PointStack({
  points,
  activePointId,
  onPointActivate,
  refsMap,
}: {
  points: CanvasPoint[];
  activePointId: string;
  onPointActivate: (pointId: string) => void;
  refsMap: MutableRefObject<Record<string, HTMLButtonElement | null>>;
}) {
  return (
    <div className="relative z-20 flex min-w-0 flex-col gap-6">
      {points.map((point) => (
        <PointCalloutButton key={point.id} point={point} active={point.id === activePointId} onActivate={onPointActivate} buttonRef={(element) => {
          refsMap.current[point.id] = element;
        }} />
      ))}
    </div>
  );
}

function PointCalloutButton({
  point,
  active,
  onActivate,
  buttonRef,
}: {
  point: CanvasPoint;
  active: boolean;
  onActivate: (pointId: string) => void;
  buttonRef?: (element: HTMLButtonElement | null) => void;
}) {
  return (
    <motion.button
      ref={buttonRef}
      type="button"
      aria-pressed={active}
      aria-label={`Inspect ${point.label}`}
      onMouseEnter={() => onActivate(point.id)}
      onFocus={() => onActivate(point.id)}
      onClick={() => onActivate(point.id)}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      className={cn(
        "w-full rounded-[1.4rem] text-left outline-none transition-all focus-visible:ring-2 focus-visible:ring-cyan-300/70",
        active ? "ring-1 ring-cyan-300/50" : "ring-1 ring-white/0 hover:ring-white/10",
      )}
    >
      <HoverPointCard point={point} active={active} />
    </motion.button>
  );
}

function ConnectorLayer({ connectors, activePointId }: { connectors: Connector[]; activePointId: string }) {
  return (
    <svg className="pointer-events-none absolute inset-0 z-10 h-full w-full overflow-visible" aria-hidden="true">
      {connectors.map((connector) => (
        <path
          key={connector.id}
          d={buildConnectorRoute(connector)}
          stroke={connector.id === activePointId ? "rgba(56,189,248,0.92)" : "rgba(255,255,255,0.28)"}
          strokeWidth={connector.id === activePointId ? 1.6 : 1}
          strokeDasharray="7 8"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      ))}
    </svg>
  );
}

function buildConnectorRoute(connector: Connector) {
  const direction = connector.side === "left" ? -1 : 1;
  const arcHeight = Math.max(88, Math.min(connector.start.y, connector.end.y) - 56);
  const spread = Math.min(120, Math.max(56, Math.abs(connector.end.x - connector.start.x) * 0.22));

  const startControlX = connector.start.x + direction * spread;
  const endControlX = connector.end.x - direction * spread * 0.6;

  return [
    `M ${connector.start.x} ${connector.start.y}`,
    `C ${startControlX} ${arcHeight}, ${endControlX} ${arcHeight}, ${connector.end.x} ${connector.end.y}`,
  ].join(" ");
}

function MachineIllustration({
  status,
  temperatures,
  screwSpeed,
  meltPressure,
  points,
  activePointId,
  onPointActivate,
  refsMap,
}: {
  status: "Running" | "Idle" | "Fault";
  temperatures: number[];
  screwSpeed: number;
  meltPressure: number;
  points: CanvasPoint[];
  activePointId: string;
  onPointActivate?: (pointId: string) => void;
  refsMap?: MutableRefObject<Record<string, HTMLButtonElement | null>>;
}) {
  const running = status === "Running";
  const fault = status === "Fault";
  const barrelTint = temperatures[2] > 208 ? "rgba(245,158,11,0.9)" : "rgba(56,189,248,0.8)";

  return (
    <div className="relative z-0 flex min-h-[820px] min-w-0 items-center justify-center overflow-visible rounded-[2rem] border border-white/5 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.015))] p-4">
      <div className="relative h-full w-full max-w-[1160px] overflow-visible">
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 1200 700" role="img" aria-label="Single screw extruder diagram">
          <defs>
            <linearGradient id="machineFloor" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="rgba(255,255,255,0.16)" />
              <stop offset="100%" stopColor="rgba(255,255,255,0.05)" />
            </linearGradient>
            <linearGradient id="motorGradient" x1="0" x2="1">
              <stop offset="0%" stopColor="#1f2937" />
              <stop offset="50%" stopColor="#334155" />
              <stop offset="100%" stopColor="#0f172a" />
            </linearGradient>
            <linearGradient id="gearboxGradient" x1="0" x2="1">
              <stop offset="0%" stopColor="#404146" />
              <stop offset="45%" stopColor="#26272b" />
              <stop offset="100%" stopColor="#151518" />
            </linearGradient>
            <linearGradient id="barrelGradient" x1="0" x2="1">
              <stop offset="0%" stopColor="#5f636d" />
              <stop offset="45%" stopColor="#8b909a" />
              <stop offset="100%" stopColor="#727680" />
            </linearGradient>
            <linearGradient id="barrelCore" x1="0" x2="1">
              <stop offset="0%" stopColor="rgba(255,255,255,0.16)" />
              <stop offset="100%" stopColor="rgba(255,255,255,0.05)" />
            </linearGradient>
            <linearGradient id="hopperGradient" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#f4d9a0" />
              <stop offset="55%" stopColor="#f0b429" />
              <stop offset="100%" stopColor="#d97706" />
            </linearGradient>
            <linearGradient id="materialFlow" x1="0" x2="1">
              <stop offset="0%" stopColor="rgba(34,197,94,0.15)" />
              <stop offset="50%" stopColor="rgba(56,189,248,0.8)" />
              <stop offset="100%" stopColor="rgba(34,197,94,0.15)" />
            </linearGradient>
            <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="8" result="blur" />
              <feColorMatrix in="blur" result="glow" values="0 0 0 0 0.22 0 0 0 0 0.74 0 0 0 0 0.95 0 0 0 0.45 0" />
              <feMerge>
                <feMergeNode in="glow" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <rect x="70" y="562" width="1060" height="28" rx="14" fill="url(#machineFloor)" />
          <rect x="92" y="568" width="1016" height="10" rx="5" fill="rgba(255,255,255,0.14)" />

          <g className={cn(fault ? "animate-pulse" : "", running ? "animate-floatGlow" : "") }>
            <rect x="100" y="378" width="132" height="132" rx="20" fill="url(#motorGradient)" stroke="rgba(255,255,255,0.14)" />
            <rect x="148" y="404" width="64" height="80" rx="12" fill="#4f46e5" opacity="0.52" />
            <circle cx="154" cy="444" r="55" fill="#1e293b" opacity="0.96" />
            <circle cx="154" cy="444" r="42" fill="#111827" stroke="rgba(255,255,255,0.12)" />
            <g className={running ? "animate-[spin_3.6s_linear_infinite]" : ""} style={{ transformOrigin: "154px 444px" }}>
              <circle cx="154" cy="444" r="16" fill="#e5e7eb" stroke="rgba(255,255,255,0.12)" />
              {Array.from({ length: 8 }).map((_, index) => (
                <rect key={index} x="150" y="406" width="8" height="76" rx="4" fill="#8b5cf6" transform={`rotate(${index * 45} 154 444)`} opacity="0.9" />
              ))}
            </g>
            <rect x="222" y="432" width="36" height="24" rx="10" fill="#8b5cf6" opacity="0.9" />
            <rect x="244" y="440" width="20" height="8" rx="4" fill="#c4b5fd" opacity="0.8" />
          </g>

          <g>
            <rect x="300" y="300" width="650" height="146" rx="31" fill="url(#barrelGradient)" stroke="rgba(255,255,255,0.16)" />
            <rect x="316" y="316" width="618" height="114" rx="25" fill="url(#barrelCore)" stroke="rgba(255,255,255,0.08)" />
            <rect x="322" y="322" width="184" height="102" rx="20" fill="rgba(56,189,248,0.08)" />
            <rect x="506" y="322" width="184" height="102" rx="20" fill="rgba(245,158,11,0.11)" />
            <rect x="690" y="322" width="132" height="102" rx="20" fill="rgba(239,68,68,0.08)" />
            {temperatures.map((temperature, index) => {
              const intensity = Math.max(0.18, Math.min(0.85, (temperature - 165) / 65));
              const zoneX = 328 + index * 184;
              return <rect key={index} x={zoneX} y="322" width="160" height="102" rx="18" fill={index === 2 ? barrelTint : `rgba(56,189,248,${0.08 + intensity * 0.12})`} />;
            })}

            <rect x="330" y="330" width="540" height="78" rx="16" fill="rgba(17,17,17,0.22)" stroke="rgba(255,255,255,0.08)" />

            <g opacity="0.95">
              <rect x="404" y="302" width="18" height="18" rx="9" fill="rgba(255,255,255,0.42)" />
              <rect x="590" y="302" width="18" height="18" rx="9" fill="rgba(255,255,255,0.42)" />
              <rect x="760" y="302" width="18" height="18" rx="9" fill="rgba(255,255,255,0.42)" />
            </g>

            {running ? (
              <g className="animate-[dash_5s_linear_infinite]" style={{ strokeDasharray: "18 14" }} filter="url(#softGlow)">
                <path d="M 336 370 C 408 324, 476 412, 560 370 S 748 328, 872 370" stroke="url(#materialFlow)" strokeWidth="8" fill="none" strokeLinecap="round" opacity="0.92" />
              </g>
            ) : null}

            <clipPath id="screwClip">
              <rect x="348" y="344" width="598" height="58" rx="20" />
            </clipPath>
            <motion.g
              clipPath="url(#screwClip)"
              animate={running ? { x: -32 } : { x: 0 }}
              transition={running ? { repeat: Infinity, duration: Math.max(1.8, 5.8 - screwSpeed / 42), ease: "linear" } : { duration: 0.2 }}
            >
              <rect x="348" y="356" width="598" height="34" rx="17" fill="rgba(15,23,42,0.18)" />
              <path d="M 350 383 L 372 359 L 394 383 L 416 359 L 438 383 L 460 359 L 482 383 L 504 359 L 526 383 L 548 359 L 570 383 L 592 359 L 614 383 L 636 359 L 658 383 L 680 359 L 702 383 L 724 359 L 746 383 L 768 359 L 790 383 L 812 359 L 834 383 L 856 359 L 878 383 L 900 359 L 922 383" stroke="rgba(255,255,255,0.54)" strokeWidth="6" strokeLinecap="round" fill="none" />
              <path d="M 360 359 L 382 383 L 404 359 L 426 383 L 448 359 L 470 383 L 492 359 L 514 383 L 536 359 L 558 383 L 580 359 L 602 383 L 624 359 L 646 383 L 668 359 L 690 383 L 712 359 L 734 383 L 756 359 L 778 383 L 800 359 L 822 383 L 844 359 L 866 383 L 888 359 L 910 383 L 932 359" stroke="rgba(56,189,248,0.34)" strokeWidth="4" strokeLinecap="round" fill="none" />
              <path d="M 350 372 L 922 372" stroke="rgba(255,255,255,0.1)" strokeWidth="4" strokeLinecap="round" />
            </motion.g>

            <rect x="932" y="320" width="82" height="104" rx="20" fill="#c084fc" opacity="0.76" />
            <rect x="984" y="338" width="64" height="68" rx="16" fill="#e879f9" opacity="0.52" />
            <path d="M 1046 348 L 1102 354 L 1102 394 L 1046 400 L 1032 374 Z" fill="#f4f4f5" opacity="0.95" />
            <path d="M 1038 366 L 1080 366" stroke="rgba(15,23,42,0.38)" strokeWidth="7" strokeLinecap="round" />
            <path d="M 1038 382 L 1086 382" stroke="rgba(15,23,42,0.34)" strokeWidth="7" strokeLinecap="round" />
          </g>

          <g className={fault ? "animate-pulse" : ""}>
            <path d="M 294 298 L 320 302" stroke="rgba(255,255,255,0.18)" strokeWidth="6" strokeLinecap="round" />
            <rect x="356" y="164" width="148" height="108" rx="16" fill="#d97706" opacity="0.32" stroke="rgba(255,255,255,0.14)" />
            <path d="M 380 164 L 480 164 L 450 114 L 410 114 Z" fill="url(#hopperGradient)" stroke="rgba(255,255,255,0.12)" />
            <rect x="408" y="260" width="58" height="28" rx="10" fill="#f59e0b" opacity="0.92" />
            <path d="M 429 260 L 429 300" stroke="rgba(255,255,255,0.18)" strokeWidth="8" strokeLinecap="round" />
            <path d="M 450 260 L 450 300" stroke="rgba(255,255,255,0.18)" strokeWidth="8" strokeLinecap="round" />
          </g>

          <g>
            <path d="M 300 244 L 324 244" stroke="rgba(255,255,255,0.18)" strokeWidth="8" strokeLinecap="round" />
            <path d="M 276 244 L 300 244" stroke="rgba(255,255,255,0.18)" strokeWidth="8" strokeLinecap="round" />
            <rect x="264" y="220" width="132" height="104" rx="22" fill="url(#gearboxGradient)" stroke="rgba(255,255,255,0.14)" />
            <rect x="284" y="198" width="92" height="32" rx="12" fill="#4b5563" opacity="0.8" />
            <rect x="314" y="296" width="34" height="74" rx="10" fill="#1f2937" opacity="0.92" />
            <rect x="332" y="312" width="18" height="40" rx="8" fill="#94a3b8" opacity="0.5" />
            <path d="M 397 300 L 405 300" stroke="rgba(255,255,255,0.18)" strokeWidth="8" strokeLinecap="round" />
          </g>

          <g opacity="0.95">
            <text x="162" y="356" fill="#d4d4d8" fontSize="16" fontWeight="600" letterSpacing="0.22em" textAnchor="middle">
              MOTOR
            </text>
            <text x="330" y="210" fill="#d4d4d8" fontSize="16" fontWeight="600" letterSpacing="0.22em" textAnchor="middle">
              GEARBOX
            </text>
            <text x="422" y="156" fill="#d4d4d8" fontSize="16" fontWeight="600" letterSpacing="0.22em" textAnchor="middle">
              FEEDER / HOPPER
            </text>
            <text x="608" y="282" fill="#d4d4d8" fontSize="16" fontWeight="600" letterSpacing="0.22em" textAnchor="middle">
              BARREL
            </text>
            <text x="648" y="476" fill="#d4d4d8" fontSize="16" fontWeight="600" letterSpacing="0.22em" textAnchor="middle">
              SCREW
            </text>
            <text x="1048" y="292" fill="#d4d4d8" fontSize="16" fontWeight="600" letterSpacing="0.22em" textAnchor="middle">
              DIE
            </text>
            <text x="600" y="620" fill="#86efac" fontSize="18" fontWeight="500" textAnchor="middle">
              Running state: {status} • Pressure {meltPressure.toFixed(0)} bar
            </text>
          </g>
        </svg>

        {points.map((point) => (
          <button
            key={point.id}
            ref={refsMap ? (element) => {
              refsMap.current[point.id] = element;
            } : undefined}
            type="button"
            aria-label={`Inspect ${point.label}`}
            aria-pressed={activePointId === point.id}
            onMouseEnter={() => onPointActivate?.(point.id)}
            onFocus={() => onPointActivate?.(point.id)}
            onClick={() => onPointActivate?.(point.id)}
            className={cn(
              "absolute z-20 flex h-5 w-5 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70",
              activePointId === point.id ? "border-cyan-300 bg-cyan-300 shadow-[0_0_0_8px_rgba(56,189,248,0.12)]" : "border-white/45 bg-white/10 hover:border-cyan-300 hover:bg-cyan-300/80",
            )}
            style={{ left: `${point.node.x}%`, top: `${point.node.y}%` }}
          >
            <span className="h-2 w-2 rounded-full bg-current" />
          </button>
        ))}

        <div className="pointer-events-none absolute left-1/2 top-[39%] z-0 h-[14%] w-[36%] -translate-x-1/2 rounded-[999px] bg-gradient-to-r from-transparent via-cyan-400/15 to-transparent blur-2xl animate-sweep" />
      </div>
    </div>
  );
}