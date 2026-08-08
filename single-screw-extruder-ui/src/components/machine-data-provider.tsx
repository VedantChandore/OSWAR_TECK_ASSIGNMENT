"use client";

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { advanceSnapshot, createInitialSnapshot, type MachineAlert, type MachineSnapshot } from "@/lib/machine-data";

type MachineDataContextValue = {
  snapshot: MachineSnapshot;
  alerts: MachineAlert[];
};

const MachineDataContext = createContext<MachineDataContextValue | null>(null);

export function MachineDataProvider({ children, initialSnapshot }: { children: ReactNode; initialSnapshot: MachineSnapshot }) {
  const [snapshot, setSnapshot] = useState<MachineSnapshot>(initialSnapshot);
  const alertStateRef = useRef<Record<string, boolean>>({});
  const tickRef = useRef(0);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setSnapshot((current) => {
        const next = advanceSnapshot(current, tickRef.current, alertStateRef.current);
        tickRef.current = next.tick;
        alertStateRef.current = next.alertStates;
        return next.snapshot;
      });
    }, 1800);

    return () => window.clearInterval(interval);
  }, []);

  return <MachineDataContext.Provider value={{ snapshot, alerts: snapshot.alerts }}>{children}</MachineDataContext.Provider>;
}

export function useMachineData() {
  const context = useContext(MachineDataContext);

  if (!context) {
    throw new Error("useMachineData must be used within a MachineDataProvider");
  }

  return context;
}