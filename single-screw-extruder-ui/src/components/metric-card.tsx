import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AnimatedNumber } from "@/components/animated-number";
import { cn } from "@/lib/utils";

type MetricCardProps = {
  title: string;
  value: number;
  suffix?: string;
  prefix?: string;
  description?: string;
  delta?: {
    text: string;
    direction: "up" | "down" | "flat";
  };
  sparklineData?: number[];
  accent?: "green" | "amber" | "red" | "cyan";
  decimals?: number;
  highlighted?: boolean;
  highlightTone?: "warning" | "danger";
};

const accents = {
  green: "from-emerald-500/15 via-transparent to-transparent text-emerald-300",
  amber: "from-amber-500/15 via-transparent to-transparent text-amber-300",
  red: "from-red-500/15 via-transparent to-transparent text-red-300",
  cyan: "from-cyan-500/15 via-transparent to-transparent text-cyan-300",
};

const highlightStyles = {
  warning: "border-amber-400/35 ring-1 ring-amber-400/25 shadow-[0_0_0_1px_rgba(251,191,36,0.18),0_0_30px_rgba(251,191,36,0.08)]",
  danger: "border-red-400/40 ring-1 ring-red-400/25 shadow-[0_0_0_1px_rgba(248,113,113,0.22),0_0_30px_rgba(248,113,113,0.1)]",
};

function buildSparklinePath(points: number[]) {
  if (points.length < 2) {
    return "";
  }

  const min = Math.min(...points);
  const max = Math.max(...points);
  const span = max - min || 1;
  const width = 84;
  const height = 28;

  return points
    .map((point, index) => {
      const x = (index / (points.length - 1)) * width;
      const y = height - ((point - min) / span) * (height - 3) - 1.5;
      return `${index === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");
}

export function MetricCard({ title, value, suffix, prefix, description, delta, sparklineData, accent = "cyan", decimals = 0, highlighted = false, highlightTone = "warning" }: MetricCardProps) {
  const sparklinePath = sparklineData ? buildSparklinePath(sparklineData) : "";

  return (
    <Card
      className={cn(
        "relative overflow-hidden border-white/8 bg-linear-to-b from-[rgba(255,255,255,0.02)] to-[rgba(255,255,255,0.01)] transition-all duration-300",
        highlighted && highlightStyles[highlightTone],
      )}
    >
      <div className={cn("pointer-events-none absolute inset-0 bg-linear-to-br", accents[accent])} />
      <div className="pointer-events-none absolute right-4 top-4 h-8 w-24 opacity-90">
        {sparklinePath ? (
          <svg viewBox="0 0 84 28" className="h-full w-full overflow-visible" aria-hidden="true">
            <path d={sparklinePath} fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
            <path d={sparklinePath} fill="none" stroke="rgba(255,255,255,0.72)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ) : null}
      </div>
      <CardHeader className="relative border-none pb-2">
        <CardTitle className="text-[0.72rem] uppercase tracking-[0.24em] text-zinc-400">{title}</CardTitle>
      </CardHeader>
      <CardContent className="relative flex items-end justify-between gap-4 pt-0">
        <div>
          <div className="text-3xl font-semibold tracking-tight text-white md:text-4xl">
            <AnimatedNumber value={value} suffix={suffix} prefix={prefix} decimals={decimals} />
          </div>
          {description ? <CardDescription className="mt-2 text-xs text-zinc-400">{description}</CardDescription> : null}
        </div>
        {delta ? (
          <div
            className={cn(
              "rounded-full border px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.16em]",
              delta.direction === "up"
                ? "border-emerald-400/20 bg-emerald-500/10 text-emerald-200"
                : delta.direction === "down"
                  ? "border-amber-400/20 bg-amber-500/10 text-amber-200"
                  : "border-white/10 bg-white/5 text-zinc-400",
            )}
          >
            {delta.direction === "up" ? "▲" : delta.direction === "down" ? "▼" : "•"} {delta.text}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}