"use client";

import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { advanceSnapshot, type MachineAlert, type MachineSnapshot, type UnitSystem } from "@/lib/machine-data";

type MachineDataContextValue = {
  liveSnapshot: MachineSnapshot;
  snapshot: MachineSnapshot;
  alerts: MachineAlert[];
  historyCursor: number;
  setHistoryCursor: (cursor: number) => void;
  metricFilter: string;
  setMetricFilter: (value: string) => void;
  units: UnitSystem;
  setUnits: (value: UnitSystem) => void;
  timeline: MachineSnapshot[];
};

const MachineDataContext = createContext<MachineDataContextValue | null>(null);

export function MachineDataProvider({ children, initialSnapshot }: { children: ReactNode; initialSnapshot: MachineSnapshot }) {
  const [liveSnapshot, setLiveSnapshot] = useState<MachineSnapshot>(initialSnapshot);
  const [timeline, setTimeline] = useState<MachineSnapshot[]>([initialSnapshot]);
  const [historyCursor, setHistoryCursor] = useState(0);
  const [metricFilter, setMetricFilter] = useState("");
  const [units, setUnits] = useState<UnitSystem>("metric");
  const alertStateRef = useRef<Record<string, boolean>>({});
  const tickRef = useRef(0);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setLiveSnapshot((current) => {
        const next = advanceSnapshot(current, tickRef.current, alertStateRef.current);
        tickRef.current = next.tick;
        alertStateRef.current = next.alertStates;
        setTimeline((currentTimeline) => [...currentTimeline.slice(-119), next.snapshot]);
        return next.snapshot;
      });
    }, 1800);

    return () => window.clearInterval(interval);
  }, []);

  const snapshot = useMemo(() => {
    const resolvedIndex = Math.max(0, timeline.length - 1 - historyCursor);
    return timeline[resolvedIndex] ?? liveSnapshot;
  }, [historyCursor, liveSnapshot, timeline]);

  return (
    <MachineDataContext.Provider
      value={{
        liveSnapshot,
        snapshot,
        alerts: liveSnapshot.alerts,
        historyCursor,
        setHistoryCursor,
        metricFilter,
        setMetricFilter,
        units,
        setUnits,
        timeline,
      }}
    >
      {children}
    </MachineDataContext.Provider>
  );
}

export function useMachineData() {
  const context = useContext(MachineDataContext);

  if (!context) {
    throw new Error("useMachineData must be used within a MachineDataProvider");
  }

  return context;
}