import React, { useEffect, useState } from "react";
import { useInView } from "./Reveal";

interface XPBarProps {
  value?: number;
  label?: boolean;
  levelText?: string;
  xpText?: string;
}

export default function XPBar({
  value = 68,
  label = true,
  levelText = "LEVEL 08",
  xpText = "3,420 / 5,000 XP"
}: XPBarProps) {
  const clampedValue = Math.min(100, Math.max(0, value));
  const { ref, inView } = useInView(0.2);
  const [animatedWidth, setAnimatedWidth] = useState(0);

  useEffect(() => {
    if (inView) {
      setAnimatedWidth(clampedValue);
    }
  }, [inView, clampedValue]);

  return (
    <div className="xp-wrap" ref={ref}>
      {label && (
        <div className="xp-label">
          <span>{levelText}</span>
          <span>{xpText}</span>
        </div>
      )}
      <div className="xp-track">
        <span
          className="xp-track-fill"
          style={{
            width: `${animatedWidth}%`
          }}
        />
      </div>
    </div>
  );
}
