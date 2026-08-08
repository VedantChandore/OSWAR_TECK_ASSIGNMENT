"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { StatusBadge } from "@/components/status-badge";
import { useMachineData } from "@/components/machine-data-provider";
import { cn } from "@/lib/utils";

export function AppFrame({ title, subtitle }: { title: string; subtitle: string }) {
  const pathname = usePathname();
  const { snapshot } = useMachineData();

  return (
    <header className="sticky top-0 z-30 border-b border-white/5 bg-[rgba(10,10,10,0.85)] backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <div>
          <p className="text-[0.72rem] font-semibold uppercase tracking-[0.28em] text-cyan-300/80">Single Screw Extruder</p>
          <h1 className="mt-1 text-xl font-semibold text-white sm:text-2xl">{title}</h1>
          <p className="mt-1 text-sm text-zinc-400">{subtitle}</p>
        </div>

        <div className="hidden items-center gap-3 sm:flex">
          <div className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-right">
            <p className="text-[0.65rem] uppercase tracking-[0.2em] text-zinc-500">Live timestamp</p>
            <p className="text-sm font-medium text-white tabular-nums">{snapshot.timestamp}</p>
          </div>
          <StatusBadge status={snapshot.status} />
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-7xl items-center gap-2 px-4 pb-4 sm:px-6 lg:px-8">
        {[
          { href: "/dashboard", label: "Dashboard" },
          { href: "/canvas", label: "Canvas" },
        ].map((item) => {
          const active = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "rounded-full border px-4 py-2 text-sm font-medium transition-all",
                active
                  ? "border-cyan-500/30 bg-cyan-500/10 text-cyan-200"
                  : "border-white/10 bg-white/5 text-zinc-300 hover:border-white/20 hover:bg-white/10",
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </header>
  );
}