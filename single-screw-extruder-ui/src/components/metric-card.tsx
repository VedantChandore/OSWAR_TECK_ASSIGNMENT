import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AnimatedNumber } from "@/components/animated-number";
import { cn } from "@/lib/utils";

type MetricCardProps = {
  title: string;
  value: number;
  suffix?: string;
  prefix?: string;
  description?: string;
  delta?: string;
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

export function MetricCard({ title, value, suffix, prefix, description, delta, accent = "cyan", decimals = 0, highlighted = false, highlightTone = "warning" }: MetricCardProps) {
  return (
    <Card
      className={cn(
        "relative overflow-hidden border-white/8 bg-linear-to-b from-[rgba(255,255,255,0.02)] to-[rgba(255,255,255,0.01)] transition-all duration-300",
        highlighted && highlightStyles[highlightTone],
      )}
    >
      <div className={cn("pointer-events-none absolute inset-0 bg-linear-to-br", accents[accent])} />
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
        {delta ? <div className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-500">{delta}</div> : null}
      </CardContent>
    </Card>
  );
}