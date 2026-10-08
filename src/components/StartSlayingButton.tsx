import React, { useState } from "react";
import { Swords, ArrowRight } from "lucide-react";

interface StartSlayingButtonProps {
  onClick: () => void;
  isHero?: boolean;
}

export default function StartSlayingButton({ onClick, isHero = false }: StartSlayingButtonProps) {
  const [pulseActive, setPulseActive] = useState(false);
  const [pressed, setPressed] = useState(false);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    // Trigger digital pulse ring (animates ~480ms)
    setPulseActive(true);
    setTimeout(() => {
      setPulseActive(false);
    }, 500);

    // Call original click handler immediately with zero delay
    onClick();
  };

  const handleMouseDown = () => setPressed(true);
  const handleMouseUp = () => setPressed(false);
  const handleMouseLeave = () => setPressed(false);

  return (
    <button
      className={`primary-button start-slaying-btn ${isHero ? "hero-btn" : ""} ${pressed ? "is-pressed" : ""}`}
      onClick={handleClick}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      aria-label="Start slaying bugs"
    >
      {/* Glitch light sweep bar */}
      <span className="btn-sweep" aria-hidden="true" />

      {/* Button content */}
      <Swords aria-hidden="true" />
      <span>Start slaying</span>
      <span className="btn-arrow" aria-hidden="true">
        <ArrowRight />
      </span>

      {/* Expanding digital pulse ring */}
      {pulseActive && <span className="btn-pulse-ring" aria-hidden="true" />}
    </button>
  );
}
