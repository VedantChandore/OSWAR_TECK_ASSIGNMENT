"use client";

import { useEffect, useState } from "react";

type AnimatedNumberProps = {
  value: number;
  decimals?: number;
  suffix?: string;
  prefix?: string;
};

export function AnimatedNumber({ value, decimals = 0, suffix = "", prefix = "" }: AnimatedNumberProps) {
  const [displayValue, setDisplayValue] = useState(value);

  useEffect(() => {
    const start = performance.now();
    const from = displayValue;
    const duration = 500;

    const frame = (time: number) => {
      const progress = Math.min(1, (time - start) / duration);
      const eased = 1 - (1 - progress) ** 3;
      setDisplayValue(from + (value - from) * eased);

      if (progress < 1) {
        requestAnimationFrame(frame);
      } else {
        setDisplayValue(value);
      }
    };

    const animation = requestAnimationFrame(frame);

    return () => cancelAnimationFrame(animation);
  }, [value]);

  return (
    <span className="tabular-nums">
      {prefix}
      {displayValue.toFixed(decimals)}
      {suffix}
    </span>
  );
}