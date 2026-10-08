import { motion } from "framer-motion";
import { BrainCircuit } from "lucide-react";
import { PlayerStats } from "../types/game";
import { RankInfo } from "../hooks/useGameState";

interface BugDNAScreenProps {
  stats: PlayerStats;
  rankInfo: RankInfo;
}

export default function BugDNAScreen({ stats, rankInfo }: BugDNAScreenProps) {
  const entries = Object.entries(stats.dnaStats);

  // Find strongest trait and lowest trait
  const sorted = [...entries].sort((a, b) => b[1] - a[1]);
  const strongest = sorted[0] || ["Syntax", 86];
  const weakest = sorted[sorted.length - 1] || ["Runtime", 49];

  return (
    <motion.main
      className="dna-screen subpage"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="subpage-heading">
        <span className="eyebrow">SLAYER ANALYTICS // PERSONAL</span>
        <h1>
          YOUR BUG <span>DNA</span>
        </h1>
        <p>A living map of your debugging instincts and error-detection telemetry.</p>
      </div>

      <section className="dna-dashboard">
        <div className="dna-orbit">
          <div className="radar-rings">
            <i />
            <i />
            <i />
          </div>
          {entries.map(([skill, value], index) => (
            <span key={skill} className={`dna-point dna-${index + 1}`}>
              <i style={{ "--value": value } as React.CSSProperties} />
              <b>{skill}</b>
              <small>{value}%</small>
            </span>
          ))}
          <div className="radar-core">
            <BrainCircuit />
            <small>{rankInfo.levelDisplay}</small>
          </div>
        </div>

        <div className="dna-details">
          <div className="dna-summary">
            <div>
              <small>STRONGEST TRAIT</small>
              <b>{strongest[0]} ({strongest[1]}%)</b>
            </div>
            <div>
              <small>TRAIN NEXT</small>
              <b>{weakest[0]} ({weakest[1]}%)</b>
            </div>
          </div>
          <div className="skill-matrix">
            {entries.map(([skill, value]) => (
              <div key={skill}>
                <span>
                  <b>{skill}</b>
                  <small>{value}%</small>
                </span>
                <div>
                  <i style={{ width: `${value}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </motion.main>
  );
}
