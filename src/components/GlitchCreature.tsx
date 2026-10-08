import { motion } from "framer-motion";
import { CreatureState } from "../types/game";

interface GlitchCreatureProps {
  state?: CreatureState;
  small?: boolean;
}

export default function GlitchCreature({ state = "idle", small = false }: GlitchCreatureProps) {
  const defeated = state === "defeated";

  return (
    <motion.div
      className={`creature ${small ? "small" : ""} ${state}`}
      animate={
        defeated
          ? { opacity: 0, scale: 1.45, filter: "blur(8px)" }
          : state === "damaged"
            ? { x: [-8, 7, -4, 0], rotate: [0, -3, 3, 0] }
            : { y: [0, -8, 0] }
      }
      transition={
        defeated
          ? { duration: 0.55 }
          : { duration: state === "damaged" ? 0.4 : 3.2, repeat: state === "idle" ? Infinity : 0 }
      }
      aria-label={`Glitch creature ${state}`}
    >
      <span className="creature-glitch glitch-a">ERR</span>
      <span className="creature-glitch glitch-b">0x17</span>
      <svg viewBox="0 0 260 220" role="img" aria-hidden="true">
        <path
          className="creature-aura"
          d="M52 65 84 30l34 14 25-30 38 26 31 2 13 42-18 28 12 47-43 21-31 28-39-25-51 4-6-43-22-25z"
        />
        <path
          className="creature-body"
          d="m67 79 31-27 35 14 31-17 35 30-6 64-31 28-65-2-33-34z"
        />
        <path
          className="creature-cut"
          d="m86 77 25 15-16 20 21 34M174 79l-25 14 17 21-22 32"
        />
        <path className="creature-mouth" d="m106 132 13 11 15-12 14 10" />
        <rect className="eye eye-left" x="93" y="101" width="26" height="13" />
        <rect className="eye eye-right" x="143" y="99" width="26" height="13" />
        <path
          className="pixel pixel-1"
          d="M43 77h18v14H43zM197 117h23v13h-23zM75 157h14v17H75z"
        />
      </svg>
      <div className="creature-shadow" />
    </motion.div>
  );
}
