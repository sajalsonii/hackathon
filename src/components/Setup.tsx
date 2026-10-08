import { motion } from "framer-motion";
import { ArrowRight, Code2, Flame, Gauge, Play, ShieldCheck, Zap } from "lucide-react";
import GlitchCreature from "./GlitchCreature";
import { Language, Difficulty } from "../types/game";
import { getChallenge } from "../data/challenges";
import { RankInfo } from "../hooks/useGameState";
import { PlayerStats } from "../types/game";

interface SetupProps {
  language: Language;
  setLanguage: (lang: Language) => void;
  difficulty: Difficulty;
  setDifficulty: (diff: Difficulty) => void;
  start: () => void;
  rankInfo: RankInfo;
  stats: PlayerStats;
  isLoading?: boolean;
}

export default function Setup({
  language,
  setLanguage,
  difficulty,
  setDifficulty,
  start,
  rankInfo,
  stats,
  isLoading
}: SetupProps) {
  const currentPreviewChallenge = getChallenge(language, difficulty);

  return (
    <motion.main
      className="setup-screen"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="screen-heading">
        <span className="eyebrow">MISSION CONTROL / LOADOUT</span>
        <h1>PREPARE YOUR HUNT</h1>
        <p>Choose your weapon. The corruption adapts to your skill.</p>
      </div>

      <div className="setup-grid">
        <section className="setup-panel">
          {/* Slayer Telemetry strip */}
          <div className="slayer-telemetry">
            <div className="telemetry-item">
              <Code2 style={{ width: 16, color: "var(--cyan)", flexShrink: 0 }} />
              <div>
                <small>CALLSIGN</small>
                <b style={{ color: "var(--cyan)" }}>{stats.slayerName || "Slayer"}</b>
              </div>
            </div>
            <div className="telemetry-item">
              <ShieldCheck style={{ width: 16, color: "var(--acid)", flexShrink: 0 }} />
              <div>
                <small>SLAYER RANK</small>
                <b>{rankInfo.rank}</b>
              </div>
            </div>
            <div className="telemetry-item">
              <Zap style={{ width: 16, color: "var(--warning)", flexShrink: 0 }} />
              <div>
                <small>TOTAL XP</small>
                <b style={{ color: "var(--acid)" }}>{stats.xp.toLocaleString()}</b>
              </div>
            </div>
            <div className="telemetry-item">
              <Flame style={{ width: 16, color: "var(--danger)", flexShrink: 0 }} />
              <div>
                <small>CURRENT STREAK</small>
                <b>{stats.streak} DAYS</b>
              </div>
            </div>
          </div>

          <div className="panel-number">01</div>
          <span className="eyebrow">SELECT LANGUAGE</span>
          <div className="choice-grid language-grid">
            {(["Python", "JavaScript", "Java"] as Language[]).map((item) => (
              <button
                key={item}
                className={language === item ? "selected" : ""}
                onClick={() => setLanguage(item)}
              >
                <Code2 />
                <b>{item}</b>
                <small>
                  {item === "Python" ? "PY" : item === "JavaScript" ? "JS" : "JV"}
                </small>
              </button>
            ))}
          </div>

          <div className="divider" />

          <div className="panel-number second">02</div>
          <span className="eyebrow">SET THREAT LEVEL</span>
          <div className="choice-grid difficulty-grid">
            {[
              { name: "Easy" as Difficulty, xp: "+150 XP", type: "Syntax" },
              { name: "Medium" as Difficulty, xp: "+300 XP", type: "Logic" },
              { name: "Hard" as Difficulty, xp: "+550 XP", type: "Runtime" }
            ].map(({ name, xp, type }) => (
              <button
                key={name}
                className={difficulty === name ? "selected" : ""}
                onClick={() => setDifficulty(name)}
              >
                <Gauge />
                <b>{name}</b>
                <small>{type}</small>
                <em>{xp}</em>
              </button>
            ))}
          </div>

          {/* Primary Action Button moved directly below Threat Level in left column */}
          <button
            className="primary-button full start-hunt-btn"
            onClick={start}
            disabled={isLoading}
            style={isLoading ? { opacity: 0.65, cursor: "not-allowed" } : {}}
          >
            {isLoading ? (
              <>INITIALIZING SCAN...</>
            ) : (
              <>
                <Play /> Start hunt <ArrowRight />
              </>
            )}
          </button>
        </section>

        <aside className="mission-preview">
          <span className="eyebrow">MISSION PREVIEW</span>
          <div className="preview-creature">
            <GlitchCreature small />
          </div>
          <span className="threat-badge">{currentPreviewChallenge.threatClass}</span>
          <h2>{currentPreviewChallenge.title.toUpperCase()}</h2>
          <p>{currentPreviewChallenge.description}</p>
          <dl>
            <div>
              <dt>WORLD</dt>
              <dd>{currentPreviewChallenge.worldName}</dd>
            </div>
            <div>
              <dt>LANGUAGE</dt>
              <dd>{language}</dd>
            </div>
            <div>
              <dt>DIFFICULTY</dt>
              <dd>{difficulty}</dd>
            </div>
            <div>
              <dt>BUG TYPE</dt>
              <dd style={{ color: "var(--cyan)" }}>{currentPreviewChallenge.bugType}</dd>
            </div>
            <div>
              <dt>BOUNTY</dt>
              <dd className="accent">+{currentPreviewChallenge.xpReward} XP</dd>
            </div>
          </dl>
        </aside>
      </div>
    </motion.main>
  );
}
