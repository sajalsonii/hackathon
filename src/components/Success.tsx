import { motion } from "framer-motion";
import { ArrowRight, Flame, Sparkles, Swords, Trophy, Zap } from "lucide-react";
import XPBar from "./XPBar";
import { VictorySummary, RankInfo } from "../hooks/useGameState";
import { PlayerStats } from "../types/game";

interface SuccessProps {
  victory: VictorySummary | null;
  rankInfo: RankInfo;
  stats: PlayerStats;
  next: () => void;
}

export default function Success({ victory, rankInfo, stats, next }: SuccessProps) {
  const challenge = victory?.challenge;
  const xpEarned = victory?.xpEarned || 300;
  const worldName = challenge?.worldName || "LOGIC CAVERNS";
  const bugType = challenge?.bugType || "Off-by-one errors";
  const explanation =
    challenge?.explanation ||
    "Array indexes start at zero, so the last valid position is always one less than the array length.";

  return (
    <motion.main
      className="success-screen"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="success-burst" aria-hidden="true">
        {Array.from({ length: 18 }, (_, i) => (
          <i key={i} style={{ transform: `rotate(${i * 20}deg)` }} />
        ))}
      </div>

      <motion.div
        className="victory-icon"
        initial={{ scale: 0 }}
        animate={{ scale: 1, rotate: [0, -8, 8, 0] }}
        transition={{ type: "spring", delay: 0.15 }}
      >
        <Swords />
      </motion.div>

      <motion.span
        className="eyebrow"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        MISSION COMPLETE // {worldName.toUpperCase()}
      </motion.span>

      <motion.h1
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.25 }}
      >
        BUG <span>SLAYED</span>
      </motion.h1>

      <p className="success-subtitle">The anomaly has been neutralized. System integrity restored.</p>

      <motion.div
        className="xp-reward"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.55 }}
      >
        <Zap />
        <span>
          <small>BOUNTY CLAIMED</small>
          <b>+{xpEarned} XP</b>
        </span>
      </motion.div>

      <section className="reward-panel">
        <div className="rank-progress">
          <div>
            <span>
              <small>CURRENT RANK</small>
              <b>{rankInfo.rank.toUpperCase()}</b>
            </span>
            <span className="next-rank">
              <small>NEXT RANK</small>
              <b>{rankInfo.nextRankName.toUpperCase()}</b>
            </span>
          </div>
          <XPBar
            value={rankInfo.progressPercent}
            levelText={rankInfo.levelDisplay}
            xpText={`${stats.xp.toLocaleString()} / ${rankInfo.nextXp.toLocaleString()} XP`}
          />
        </div>
        <div className="reward-stats">
          <div>
            <Flame />
            <span>
              <small>STREAK</small>
              <b>
                {stats.streak} DAYS <em>+1</em>
              </b>
            </span>
          </div>
          <div>
            <Zap />
            <span>
              <small>COMBO</small>
              <b>
                {stats.combo}× <em>+1</em>
              </b>
            </span>
          </div>
          <div>
            <Trophy />
            <span>
              <small>SOLVE TIME</small>
              <b>{victory?.timeSpentSeconds ? `${victory.timeSpentSeconds}s` : "42s"}</b>
            </span>
          </div>
        </div>
      </section>

      {/* Primary Action Button placed directly below stats block, above Bug DNA card */}
      <button className="primary-button next-button" onClick={next}>
        Next hunt <ArrowRight />
      </button>

      <section className="lesson-card">
        <Sparkles />
        <div>
          <span className="eyebrow">BUG DNA ACQUIRED // {challenge?.bugDnaCategory || "LOGIC"}</span>
          <h3>{bugType}</h3>
          <p>{explanation}</p>
        </div>
      </section>
    </motion.main>
  );
}
