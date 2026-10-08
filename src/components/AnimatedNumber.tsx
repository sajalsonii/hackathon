import { useState, useEffect } from "react";

interface CounterProps {
  value: number;
  duration?: number;
  formatCommas?: boolean;
}

export function AnimatedNumber({ value, duration = 1200, formatCommas = true }: CounterProps) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    // Check reduced motion
    if (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      setDisplayValue(value);
      return;
    }

    let startTimestamp: number | null = null;
    let animationFrameId: number;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      
      // Quartic ease-out: 1 - Math.pow(1 - progress, 4)
      const easeOut = 1 - Math.pow(1 - progress, 4);
      const current = Math.floor(easeOut * value);
      
      setDisplayValue(current);

      if (progress < 1) {
        animationFrameId = window.requestAnimationFrame(step);
      } else {
        setDisplayValue(value);
      }
    };

    animationFrameId = window.requestAnimationFrame(step);

    return () => {
      if (animationFrameId) {
        window.cancelAnimationFrame(animationFrameId);
      }
    };
  }, [value, duration]);

  return <>{formatCommas ? displayValue.toLocaleString() : displayValue}</>;
}
