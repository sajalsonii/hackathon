import { motion } from "framer-motion";
import { Award, Clock3, Flame, Swords, Zap } from "lucide-react";
import GlitchCreature from "./GlitchCreature";

interface DailyChallengeProps {
  startDaily: () => void;
}

export default function DailyChallenge({ startDaily }: DailyChallengeProps) {
  return (
    <motion.main
      className="daily-screen subpage"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="subpage-heading">
        <span className="eyebrow">DAILY PROTOCOL // 07:42:18 LEFT</span>
        <h1>
          THE DAILY <span>BUG</span>
        </h1>
        <p>One hunt. One bonus. Return tomorrow to keep the streak alive.</p>
      </div>

      <section className="daily-mission">
        <div className="daily-visual">
          <GlitchCreature />
          <div className="daily-countdown">
            <Clock3 />
            <span>
              <small>EXPIRES IN</small>
              <b>07:42:18</b>
            </span>
          </div>
        </div>

        <div className="daily-brief">
          <span className="threat-badge">SPECIAL EVENT // MEDIUM</span>
          <h2>THE INFINITE LOOP INCIDENT</h2>
          <p>
            A corrupted worker has trapped Runtime City in a recursive time fracture. Break the cycle
            before the daily window closes.
          </p>
          <div className="daily-rewards">
            <div>
              <Zap />
              <span>
                <small>BASE BOUNTY</small>
                <b>+250 XP</b>
              </span>
            </div>
            <div>
              <Flame />
              <span>
                <small>STREAK BONUS</small>
                <b>+100 XP</b>
              </span>
            </div>
            <div>
              <Award />
              <span>
                <small>REWARD</small>
                <b>Timebreaker</b>
              </span>
            </div>
          </div>
          <button className="primary-button" onClick={startDaily}>
            <Swords /> Accept daily hunt
          </button>
        </div>
      </section>
    </motion.main>
  );
}
