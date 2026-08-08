export type MachineStatus = "Running" | "Idle" | "Fault";

export type AlertSeverity = "info" | "warning" | "danger";

export type MachineAlert = {
  id: string;
  severity: AlertSeverity;
  title: string;
  message: string;
  metric: string;
  value: string;
  timestamp: string;
};

export type TrendPoint = {
  label: string;
  screwSpeed: number;
  barrelTemperature: number;
  meltPressure: number;
  throughput: number;
  motorPower: number;
  torque: number;
};

export type MachineSnapshot = {
  timestamp: string;
  status: MachineStatus;
  screwSpeed: number;
  barrelTemperatures: number[];
  dieTemperature: number;
  meltPressure: number;
  motorPower: number;
  torque: number;
  throughput: number;
  feedRate: number;
  energyConsumption: number;
  vibration: number;
  uptimePercent: number;
  efficiencyPercent: number;
  cycleCount: number;
  targetThroughput: number;
  alerts: MachineAlert[];
  history: TrendPoint[];
};

export type MachinePointValue = {
  id: string;
  label: string;
  value: string;
  description: string;
  severity: AlertSeverity;
};

const BASELINE = {
  screwSpeed: 145,
  barrelTemperatures: [182, 189, 194, 201],
  dieTemperature: 216,
  meltPressure: 126,
  motorPower: 74,
  torque: 68,
  throughput: 428,
  feedRate: 432,
  energyConsumption: 1148,
  vibration: 1.4,
  uptimePercent: 91,
  efficiencyPercent: 84,
  cycleCount: 1840,
  targetThroughput: 460,
};

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

const easeToward = (current: number, target: number, step: number) => {
  if (Math.abs(current - target) <= step) {
    return target;
  }

  return current + Math.sign(target - current) * step;
};

const formatValue = (value: number, decimals = 1) => value.toFixed(decimals);

const driveTargets = (status: MachineStatus) =>
  status === "Running"
    ? { screwSpeed: BASELINE.screwSpeed, motorPower: BASELINE.motorPower, torque: BASELINE.torque, throughput: BASELINE.throughput, feedRate: BASELINE.feedRate }
    : status === "Idle"
      ? { screwSpeed: 4, motorPower: 3, torque: 6, throughput: 100, feedRate: 118 }
      : { screwSpeed: 0, motorPower: 1.5, torque: 3, throughput: 86, feedRate: 102 };

const walk = (value: number, minimum: number, maximum: number, step: number, drift = 0) => {
  const delta = (Math.random() - 0.5) * step * 2 + drift;
  return clamp(value + delta, minimum, maximum);
};

const formatTime = (date: Date) =>
  new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    timeZone: "UTC",
  }).format(date);

export function createInitialSnapshot(): MachineSnapshot {
  const now = new Date();

  return {
    timestamp: formatTime(now),
    status: "Running",
    screwSpeed: BASELINE.screwSpeed,
    barrelTemperatures: [...BASELINE.barrelTemperatures],
    dieTemperature: BASELINE.dieTemperature,
    meltPressure: BASELINE.meltPressure,
    motorPower: BASELINE.motorPower,
    torque: BASELINE.torque,
    throughput: BASELINE.throughput,
    feedRate: BASELINE.feedRate,
    energyConsumption: BASELINE.energyConsumption,
    vibration: BASELINE.vibration,
    uptimePercent: BASELINE.uptimePercent,
    efficiencyPercent: BASELINE.efficiencyPercent,
    cycleCount: BASELINE.cycleCount,
    targetThroughput: BASELINE.targetThroughput,
    alerts: [],
    history: Array.from({ length: 18 }, (_, index) => ({
      label: `${index}`,
      screwSpeed: BASELINE.screwSpeed - (17 - index) * 0.4,
      barrelTemperature: BASELINE.barrelTemperatures[2] - (17 - index) * 0.25,
      meltPressure: BASELINE.meltPressure - (17 - index) * 0.35,
      throughput: BASELINE.throughput - (17 - index) * 1.3,
      motorPower: BASELINE.motorPower - (17 - index) * 0.2,
      torque: BASELINE.torque - (17 - index) * 0.25,
    })),
  };
}

export function advanceSnapshot(previous: MachineSnapshot, tick: number, previousAlertState: Record<string, boolean>) {
  const now = new Date();
  let status = previous.status;

  const transitionRoll = Math.random();
  if (previous.status === "Running" && transitionRoll < 0.05) {
    status = Math.random() < 0.7 ? "Idle" : "Fault";
  } else if (previous.status === "Idle" && transitionRoll < 0.28) {
    status = Math.random() < 0.82 ? "Running" : "Fault";
  } else if (previous.status === "Fault" && transitionRoll < 0.35) {
    status = Math.random() < 0.5 ? "Idle" : "Running";
  }

  const targets = driveTargets(status);
  const screwSpeed = clamp(walk(easeToward(previous.screwSpeed, targets.screwSpeed, status === "Running" ? 4.5 : 8), 0, 165, status === "Running" ? 2.2 : 1.2, status === "Running" ? 0.15 : -0.2), 0, 165);

  const barrelTemperatures = previous.barrelTemperatures.map((temperature, index) => {
    const drift = status === "Running" ? 0.18 + index * 0.12 : status === "Idle" ? -0.22 - index * 0.05 : 1.2 + index * 0.55;
    const target = status === "Fault" && index >= 2 ? 220 + index * 1.2 : status === "Idle" ? 176 + index * 0.4 : BASELINE.barrelTemperatures[index];
    return clamp(
      walk(temperature, 160, 224, status === "Fault" ? 2.2 : 1.3, status === "Running" ? drift : target - temperature),
      160,
      224,
    );
  });

  const meltPressure = clamp(
    walk(previous.meltPressure, 88, 165, status === "Fault" ? 7 : 3.1, status === "Fault" ? 8 : status === "Idle" ? -1.1 : 0.5),
    88,
    165,
  );

  const dieTemperature = clamp(
    walk(previous.dieTemperature, 190, 232, status === "Fault" ? 4.8 : 2.1, status === "Fault" ? 2.2 : status === "Idle" ? -0.8 : 0.4),
    190,
    232,
  );

  const motorPower = clamp(walk(easeToward(previous.motorPower, targets.motorPower, status === "Running" ? 2.5 : 5), 0, 96, status === "Running" ? 2.2 : 3.8, status === "Fault" ? -0.8 : 0.05), 0, 96);

  const torque = clamp(walk(easeToward(previous.torque, targets.torque, status === "Running" ? 2 : 6), 0, 96, status === "Running" ? 1.8 : 3.8, status === "Fault" ? -0.8 : 0.05), 0, 96);

  const throughput = clamp(walk(easeToward(previous.throughput, targets.throughput, status === "Running" ? 5 : 12), 0, 470, status === "Running" ? 4.2 : 5.6, status === "Fault" ? -1.8 : 0.05), 0, 470);

  const feedRate = clamp(walk(easeToward(previous.feedRate, targets.feedRate, status === "Running" ? 4.4 : 10), 0, 470, status === "Running" ? 3.4 : 5, status === "Fault" ? -1.4 : 0.05), 0, 470);

  const vibration = clamp(
    walk(previous.vibration, 0.6, 5.8, status === "Fault" ? 0.7 : 0.24, faultBias * 1.2),
    0.6,
    5.8,
  );

  const uptimePercent = clamp(previous.uptimePercent + (status === "Running" ? 0.02 : status === "Idle" ? -0.01 : -0.03), 0, 100);
  const efficiencyPercent = clamp((throughput / Math.max(1, BASELINE.targetThroughput)) * 100 * (status === "Running" ? 1 : status === "Idle" ? 0.35 : 0.18), 0, 100);
  const cycleCount = previous.cycleCount + (status === "Running" && tick % 2 === 0 ? 1 : 0);
  const targetThroughput = clamp(BASELINE.targetThroughput + (status === "Running" ? Math.sin(tick / 8) * 8 : status === "Idle" ? -12 : -38), 0, 520);
  const energyConsumption = previous.energyConsumption + motorPower * 0.02;

  const history: TrendPoint[] = [
    ...previous.history.slice(-17),
    {
      label: formatTime(now),
      screwSpeed,
      barrelTemperature: barrelTemperatures[2],
      meltPressure,
      throughput,
      motorPower,
      torque,
    },
  ];

  const candidateAlerts: MachineAlert[] = [
    ...(barrelTemperatures.some((temperature) => temperature > 208)
      ? [
          {
            id: "barrel-high",
            severity: "warning" as const,
            title: "Barrel temperature rising",
            message: "One or more barrel zones are trending above the nominal thermal band.",
            metric: "Barrel",
            value: `${formatValue(Math.max(...barrelTemperatures))}°C`,
            timestamp: formatTime(now),
          },
        ]
      : []),
    ...(meltPressure > 145
      ? [
          {
            id: "pressure-high",
            severity: "danger" as const,
            title: "Melt pressure spike",
            message: "Die pressure is exceeding the comfortable operating range.",
            metric: "Pressure",
            value: `${formatValue(meltPressure)} bar`,
            timestamp: formatTime(now),
          },
        ]
      : []),
    ...(status === "Fault"
      ? [
          {
            id: "status-fault",
            severity: "danger" as const,
            title: "Machine fault state",
            message: "The simulated machine has entered a fault condition for demonstration purposes.",
            metric: "Status",
            value: "Fault",
            timestamp: formatTime(now),
          },
        ]
      : []),
    ...(torque > 83
      ? [
          {
            id: "torque-high",
            severity: "warning" as const,
            title: "Torque is elevated",
            message: "Drive load is above the nominal band and should be monitored.",
            metric: "Torque",
            value: `${torque.toFixed(0)}%`,
            timestamp: formatTime(now),
          },
        ]
      : []),
  ];

  const alertStates = {
    barrelHigh: barrelTemperatures.some((temperature) => temperature > 208),
    pressureHigh: meltPressure > 145,
    torqueHigh: torque > 83,
    faultState: status === "Fault",
  };

  const alerts: MachineAlert[] = [];
  for (const [key, active] of Object.entries(alertStates)) {
    if (active && !previousAlertState[key]) {
      const alert = candidateAlerts.find((entry) => {
        if (key === "barrelHigh") return entry.id === "barrel-high";
        if (key === "pressureHigh") return entry.id === "pressure-high";
        if (key === "torqueHigh") return entry.id === "torque-high";
        return entry.id === "status-fault";
      });

      if (alert) {
        alerts.push(alert);
      }
    }
  }

  const currentAlerts = candidateAlerts;

  return {
    snapshot: {
      timestamp: formatTime(now),
      status,
      screwSpeed,
      barrelTemperatures,
      dieTemperature,
      meltPressure,
      motorPower,
      torque,
      throughput,
      feedRate,
      energyConsumption,
      vibration,
      uptimePercent,
      efficiencyPercent,
      cycleCount,
      targetThroughput,
      history,
      alerts: [...alerts, ...currentAlerts.filter((entry) => !alerts.some((alert) => alert.id === entry.id))].slice(0, 5),
    },
    alertStates,
    tick: tick + 1,
  };
}

export function getMachinePoints(snapshot: MachineSnapshot): MachinePointValue[] {
  return [
    {
      id: "feeder",
      label: "Feeder / Hopper",
      value: `${snapshot.feedRate.toFixed(0)} kg/hr`,
      description: "Material feed rate entering the extruder throat.",
      severity: snapshot.feedRate < 130 ? "warning" : "info",
    },
    {
      id: "motor",
      label: "Motor",
      value: `${snapshot.motorPower.toFixed(0)} kW / ${snapshot.screwSpeed.toFixed(0)} RPM`,
      description: "Main drive output and shaft speed.",
      severity: snapshot.status === "Fault" ? "danger" : "info",
    },
    {
      id: "gearbox",
      label: "Gearbox",
      value: `${snapshot.torque.toFixed(0)}% / ${Math.round(snapshot.screwSpeed * 0.82)} RPM`,
      description: "Torque transfer and reduction ratio to the screw.",
      severity: snapshot.torque > 83 ? "warning" : "info",
    },
    {
      id: "barrel-zone-1",
      label: "Barrel Zone 1",
      value: `${snapshot.barrelTemperatures[0].toFixed(0)}°C`,
      description: "Feed-zone thermal profile.",
      severity: snapshot.barrelTemperatures[0] > 205 ? "warning" : "info",
    },
    {
      id: "barrel-zone-2",
      label: "Barrel Zone 2",
      value: `${snapshot.barrelTemperatures[1].toFixed(0)}°C`,
      description: "Intermediate heating zone.",
      severity: snapshot.barrelTemperatures[1] > 208 ? "warning" : "info",
    },
    {
      id: "barrel-zone-3",
      label: "Barrel Zone 3",
      value: `${snapshot.barrelTemperatures[2].toFixed(0)}°C`,
      description: "Compression-zone thermal profile.",
      severity: snapshot.barrelTemperatures[2] > 210 ? "warning" : "info",
    },
    {
      id: "screw",
      label: "Screw",
      value: `${snapshot.screwSpeed.toFixed(0)} RPM`,
      description: "Visible screw rotation inside the barrel.",
      severity: snapshot.status === "Running" ? "info" : "warning",
    },
    {
      id: "die",
      label: "Die",
      value: `${snapshot.dieTemperature.toFixed(0)}°C / ${snapshot.meltPressure.toFixed(0)} bar`,
      description: "Final forming temperature and pressure.",
      severity: snapshot.meltPressure > 145 ? "danger" : "info",
    },
    {
      id: "output",
      label: "Output / Discharge",
      value: `${snapshot.throughput.toFixed(0)} kg/hr`,
      description: "Finished throughput leaving the line.",
      severity: snapshot.throughput < 190 ? "warning" : "info",
    },
  ];
}