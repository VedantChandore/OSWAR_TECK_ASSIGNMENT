"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Download, Keyboard, Search } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { StatusBadge } from "@/components/status-badge";
import { useMachineData } from "@/components/machine-data-provider";
import { cn } from "@/lib/utils";

export function AppFrame({ title, subtitle }: { title: string; subtitle: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const { liveSnapshot, metricFilter, setMetricFilter, units, setUnits } = useMachineData();
  const searchRef = useRef<HTMLInputElement>(null);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented) {
        return;
      }

      const target = event.target as HTMLElement | null;
      const isTypingField = target?.matches("input, textarea, select, [contenteditable='true']");

      if (event.key === "?" || (event.shiftKey && event.key === "/")) {
        event.preventDefault();
        setShortcutsOpen((current) => !current);
        return;
      }

      if (!isTypingField && event.key.toLowerCase() === "d") {
        router.push("/dashboard");
      }

      if (!isTypingField && event.key.toLowerCase() === "c") {
        router.push("/canvas");
      }

      if (!isTypingField && event.key === "/") {
        event.preventDefault();
        searchRef.current?.focus();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [router]);

  const tabs = useMemo(
    () => [
      { href: "/dashboard", label: "Dashboard" },
      { href: "/canvas", label: "Canvas" },
      { href: "/history", label: "History" },
    ],
    [],
  );

  return (
    <header className="sticky top-0 z-30 border-b border-white/5 bg-[rgba(10,10,10,0.85)] backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.28em] text-cyan-300/80">Single Screw Extruder</p>
            <h1 className="mt-1 text-xl font-semibold text-white sm:text-2xl">{title}</h1>
            <p className="mt-1 text-sm text-zinc-400">{subtitle}</p>
          </div>

          <div className="flex flex-1 flex-wrap items-center justify-start gap-3 xl:justify-end">
            <label className="flex min-w-55 flex-1 items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm text-zinc-300">
              <Search className="h-4 w-4 text-zinc-500" />
              <input
                ref={searchRef}
                value={metricFilter}
                onChange={(event) => setMetricFilter(event.target.value)}
                className="w-full bg-transparent text-sm text-white outline-none placeholder:text-zinc-500"
                placeholder="Filter metrics"
                aria-label="Filter metrics"
              />
            </label>
            <div className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-right">
              <p className="text-[0.65rem] uppercase tracking-[0.2em] text-zinc-500">Live timestamp</p>
              <p className="text-sm font-medium text-white tabular-nums">{liveSnapshot.timestamp}</p>
            </div>
            <StatusBadge status={liveSnapshot.status} />
            <div className="inline-flex rounded-full border border-white/10 bg-white/5 p-1 text-sm">
              <button
                type="button"
                onClick={() => setUnits("metric")}
                className={cn("rounded-full px-3 py-1.5 transition", units === "metric" ? "bg-cyan-500/15 text-cyan-200" : "text-zinc-400 hover:text-white")}
              >
                °C / bar
              </button>
              <button
                type="button"
                onClick={() => setUnits("imperial")}
                className={cn("rounded-full px-3 py-1.5 transition", units === "imperial" ? "bg-cyan-500/15 text-cyan-200" : "text-zinc-400 hover:text-white")}
              >
                °F / psi
              </button>
            </div>
            <button
              type="button"
              onClick={() => setShortcutsOpen(true)}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm text-zinc-300 transition hover:border-white/20 hover:bg-white/10"
              aria-label="View keyboard shortcuts"
            >
              <Keyboard className="h-4 w-4" />
              Press ? for shortcuts
            </button>
            {pathname === "/dashboard" ? (
              <button
                type="button"
                onClick={() => window.dispatchEvent(new Event("extruder-download-report"))}
                className="inline-flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-2 text-sm text-cyan-200 transition hover:border-cyan-500/30 hover:bg-cyan-500/15"
              >
                <Download className="h-4 w-4" />
                Download Report
              </button>
            ) : null}
          </div>
        </div>

        <div className="flex w-full items-center gap-2 overflow-x-auto pb-1">
          {tabs.map((item) => {
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
      </div>

      <AnimatePresence>
        {shortcutsOpen ? (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 px-4 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShortcutsOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.98 }}
              transition={{ duration: 0.18 }}
              className="glass-panel w-full max-w-lg rounded-3xl p-6"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[0.72rem] uppercase tracking-[0.24em] text-cyan-300/80">Keyboard shortcuts</p>
                  <h2 className="mt-1 text-xl font-semibold text-white">Quick actions</h2>
                </div>
                <button type="button" className="text-sm text-zinc-400 hover:text-white" onClick={() => setShortcutsOpen(false)}>
                  Close
                </button>
              </div>
              <div className="mt-4 grid gap-3 text-sm text-zinc-300">
                <ShortcutRow keyText="D" label="Go to Dashboard" />
                <ShortcutRow keyText="C" label="Go to Canvas" />
                <ShortcutRow keyText="/" label="Focus metric search" />
                <ShortcutRow keyText="?" label="Toggle this modal" />
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </header>
  );
}

function ShortcutRow({ keyText, label }: { keyText: string; label: string }) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-white/8 bg-white/3 px-4 py-3">
      <span>{label}</span>
      <span className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 font-mono text-xs uppercase tracking-[0.2em] text-zinc-400">{keyText}</span>
    </div>
  );
}
