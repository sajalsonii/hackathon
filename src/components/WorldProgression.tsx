import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import WorldMap from "./WorldMap";
import { initialWorlds } from "../data/worlds";

interface WorldProgressionProps {
  startWorldHunt: (worldLevel?: string) => void;
}

export default function WorldProgression({ startWorldHunt }: WorldProgressionProps) {
  return (
    <motion.main
      className="world-screen subpage"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="subpage-heading">
        <span className="eyebrow">CAMPAIGN MAP // SECTOR 7G</span>
        <h1>
          DIGITAL DEBUGGER <span>WORLD</span>
        </h1>
        <p>Repair each corrupted region to unlock the path to the Debug Core.</p>
      </div>

      <WorldMap onSelect={startWorldHunt} title={false} />

      <section className="world-mission-list">
        {initialWorlds.map((world) => (
          <article key={world.name} className={world.status}>
            <span className="world-index">{world.level}</span>
            <div>
              <small>{world.status}</small>
              <h3>{world.name}</h3>
              <p>{world.focus}</p>
            </div>
            <span className="world-progress">
              {world.status === "complete"
                ? `${world.challengesCount} / ${world.challengesCount}`
                : world.status === "current"
                  ? `${world.completedCount} / ${world.challengesCount}`
                  : "LOCKED"}
            </span>
            {world.status === "current" && (
              <button
                className="primary-button"
                onClick={() => startWorldHunt(world.level)}
              >
                Continue <ChevronRight />
              </button>
            )}
          </article>
        ))}
      </section>
    </motion.main>
  );
}
