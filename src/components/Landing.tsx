import { motion } from "framer-motion";
import {
  ArrowRight,
  Award,
  Binary,
  BrainCircuit,
  Bug,
  ChevronRight,
  Flame,
  Radar,
  ScanLine,
  ShieldCheck,
  Swords,
  Target,
  Wrench,
  Zap
} from "lucide-react";
import GlitchCreature from "./GlitchCreature";
import HeroCodeCard from "./HeroCodeCard";
import XPBar from "./XPBar";
import WorldMap from "./WorldMap";
import HeroBackground from "./HeroBackground";
import StartSlayingButton from "./StartSlayingButton";
import Reveal, { useInView } from "./Reveal";
import { AnimatedNumber } from "./AnimatedNumber";
import { initialWorlds } from "../data/worlds";
import { RankInfo } from "../hooks/useGameState";
import { PlayerStats } from "../types/game";

interface LandingProps {
  start: () => void;
  daily: () => void;
  bugDna: () => void;
  world: () => void;
  rankInfo: RankInfo;
  stats: PlayerStats;
}

const processSteps = [
  { title: "Hunt the Bug", text: "Enter a corrupted mission and inspect the failure.", icon: Target },
  { title: "Scan for Clues", text: "Deploy progressive hints without losing the thrill.", icon: ScanLine },
  { title: "Fix the Code", text: "Edit the real code and repair the root cause.", icon: Wrench },
  { title: "Slay the Bug", text: "Submit your attack and destroy the glitch.", icon: Swords },
  { title: "Earn XP", text: "Build streaks, rank up, and unlock new worlds.", icon: Zap },
];

function SectionHeader({ kicker, title, copy }: { kicker: string; title: string; copy: string }) {
  return (
    <div className="marketing-heading">
      <span className="eyebrow">{kicker}</span>
      <h2>{title}</h2>
      <p>{copy}</p>
    </div>
  );
}

function HowItWorks() {
  return (
    <Reveal>
      <section className="marketing-section how-section">
        <SectionHeader
          kicker="MISSION PROTOCOL"
          title="HOW CODE SLAYER WORKS"
          copy="Debugging is a hunt. Every mission trains the instincts real developers use."
        />
        <div className="process-grid">
          {processSteps.map((step, index) => {
            const Icon = step.icon;
            return (
              <article
                key={step.title}
                className="process-card stagger-step-card"
                style={{
                  animationDelay: `${index * 110}ms`
                }}
              >
                <span className="process-number">0{index + 1}</span>
                <Icon />
                <h3>{step.title}</h3>
                <p>{step.text}</p>
                <i />
              </article>
            );
          })}
        </div>
      </section>
    </Reveal>
  );
}

function WhySection() {
  return (
    <Reveal>
      <section className="why-section">
        <div className="why-visual">
          <div className="code-window">
            <div className="editor-top">
              <div className="window-dots">
                <i />
                <i />
                <i />
              </div>
              <span>training-protocol.js</span>
            </div>
            <pre>
              <span>const</span> skill = {"{"}
              <br />
              {"  "}write: <b>true</b>,<br />
              {"  "}debug: <em>false</em>
              <br />
              {"}"};<br />
              <br />
              <span>if</span> (!skill.debug) {"{"}
              <br />
              {"  "}
              <mark>startHunt();</mark>
              <br />
              {"}"}
            </pre>
            <div className="code-scan" />
          </div>
          <div className="recognition-card">
            <BrainCircuit />
            <span>
              <small>PATTERN RECOGNIZED</small>
              <b>Boundary error isolated</b>
            </span>
          </div>
        </div>
        <div className="why-copy">
          <span className="eyebrow">WHY CODE SLAYER?</span>
          <h2>DON&apos;T JUST WRITE CODE. LEARN TO READ ITS BATTLE SCARS.</h2>
          <p>
            Most platforms teach you to build from a blank screen. Code Slayer gives you something closer to
            the real world: code that almost works.
          </p>
          <div className="why-points">
            <div className="stagger-card" style={{ animationDelay: "100ms" }}>
              <Target />
              <span>
                <b>Recognize</b>
                <small>Spot bug patterns faster.</small>
              </span>
            </div>
            <div className="stagger-card" style={{ animationDelay: "200ms" }}>
              <Radar />
              <span>
                <b>Investigate</b>
                <small>Trace symptoms to root causes.</small>
              </span>
            </div>
            <div className="stagger-card" style={{ animationDelay: "300ms" }}>
              <Wrench />
              <span>
                <b>Repair</b>
                <small>Make precise, confident fixes.</small>
              </span>
            </div>
          </div>
        </div>
      </section>
    </Reveal>
  );
}

function LevelUpSection({ rankInfo, stats }: { rankInfo: RankInfo; stats: PlayerStats }) {
  const { ref, inView } = useInView(0.15);

  const rewards = [
    { 
      icon: Zap, 
      label: "XP", 
      renderValue: () => inView ? <AnimatedNumber value={stats.xp} duration={1200} /> : stats.xp.toLocaleString() 
    },
    { 
      icon: ShieldCheck, 
      label: "Slayer Rank", 
      renderValue: () => rankInfo.rank 
    },
    { 
      icon: Flame, 
      label: "Streak", 
      renderValue: () => (
        <>
          {inView ? <AnimatedNumber value={stats.streak} duration={900} /> : stats.streak} days
        </>
      )
    },
    { 
      icon: Binary, 
      label: "Combo", 
      renderValue: () => (
        <>
          {inView ? <AnimatedNumber value={stats.combo} duration={900} /> : stats.combo}×
        </>
      ) 
    },
    { 
      icon: Award, 
      label: "Challenges", 
      renderValue: () => (
        <>
          {inView ? <AnimatedNumber value={stats.completedChallengeIds.length} duration={900} /> : stats.completedChallengeIds.length} / 10
        </>
      )
    },
    { 
      icon: Bug, 
      label: "Boss Bugs", 
      renderValue: () => (
        <>
          {inView ? <AnimatedNumber value={stats.bugsSlain} duration={900} /> : stats.bugsSlain} Slain
        </>
      )
    },
  ];

  return (
    <Reveal>
      <section className="marketing-section level-section" ref={ref}>
        <SectionHeader
          kicker="PLAYER PROGRESSION"
          title="LEVEL UP YOUR DEBUGGING"
          copy="Every repaired system makes your Slayer stronger. Progress you can see—and skills you can feel."
        />
        <div className="level-layout">
          <div className="rank-showcase">
            <div className="rank-emblem">
              <ShieldCheck />
              <span>
                {inView ? (
                  String(rankInfo.level).padStart(2, "0")
                ) : (
                  String(rankInfo.level).padStart(2, "0")
                )}
              </span>
            </div>
            <div>
              <span className="eyebrow">CURRENT SLAYER RANK</span>
              <h3>{rankInfo.rank.toUpperCase()}</h3>
              <p>
                {inView ? <AnimatedNumber value={rankInfo.xpUntilNext} duration={1100} /> : rankInfo.xpUntilNext} XP until {rankInfo.nextRankName}
              </p>
              <XPBar
                value={rankInfo.progressPercent}
                levelText={rankInfo.levelDisplay}
                xpText={
                  inView ? (
                    <>
                      <AnimatedNumber value={stats.xp} duration={1200} /> / {stats.xp > 0 ? stats.xp.toLocaleString() : "0"} XP
                    </>
                  ) : (
                    `${stats.xp.toLocaleString()} / ${rankInfo.nextXp.toLocaleString()} XP`
                  )
                }
              />
            </div>
          </div>
          <div className="reward-grid">
            {rewards.map((reward, idx) => {
              const Icon = reward.icon;
              return (
                <div 
                  key={reward.label} 
                  className="stagger-card" 
                  style={{ animationDelay: `${idx * 80}ms` }}
                >
                  <Icon />
                  <span>
                    <small>{reward.label}</small>
                    <b>{reward.renderValue()}</b>
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </Reveal>
  );
}

function BugDNAPreview({ open, dnaStats }: { open: () => void; dnaStats: Record<string, number> }) {
  const entries = Object.entries(dnaStats);
  const { ref, inView } = useInView(0.2);

  return (
    <Reveal>
      <section className="dna-preview" ref={ref}>
        <div className="dna-copy">
          <span className="eyebrow">YOUR DEBUGGING SIGNATURE</span>
          <h2>BUG DNA</h2>
          <p>
            Every hunt reveals how you think. Your DNA map evolves as Code Slayer learns your strengths and
            exposes your blind spots.
          </p>
          <button className="secondary-button" onClick={open}>
            Analyze my DNA <ArrowRight />
          </button>
        </div>
        <button className="dna-radar" onClick={open} aria-label="Open Bug DNA">
          <div className="radar-rings">
            <i />
            <i />
            <i />
          </div>
          {entries.map(([skill, value], index) => {
            const displayValue = inView ? value : 0;
            return (
              <span key={skill} className={`dna-point dna-${index + 1}`}>
                <i 
                  className="dna-mote" 
                  style={{ 
                    "--value": displayValue,
                    transform: inView ? "scale(1)" : "scale(0.3)",
                    transition: "transform 800ms cubic-bezier(0.16, 1, 0.3, 1), box-shadow 800ms ease"
                  } as React.CSSProperties} 
                />
                <b>{skill}</b>
                <small>
                  {inView ? <AnimatedNumber value={value} duration={800} formatCommas={false} /> : value}%
                </small>
              </span>
            );
          })}
          <div className="radar-core">
            <BrainCircuit />
            <small>DNA</small>
          </div>
        </button>
      </section>
    </Reveal>
  );
}

export default function Landing({
  start,
  daily,
  bugDna,
  world,
  rankInfo,
  stats
}: LandingProps) {
  return (
    <motion.main className="landing" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <section className="hero">
        <HeroBackground />
        <div className="hero-grid" aria-hidden="true" />
        <div className="hero-copy">
          <motion.div
            className="live-pill"
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <i /> SYSTEM ONLINE <span>SEASON 01</span>
          </motion.div>
          <motion.h1 initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}>
            HUNT BUGS.<br />
            FIX CODE.<br />
            <span>BECOME A SLAYER.</span>
          </motion.h1>
          <p>
            Enter a corrupted digital world where broken code fights back. Track the flaw, deploy your
            fix, and climb the ranks.
          </p>
          <div className="hero-actions">
            <StartSlayingButton onClick={start} isHero />
            <span className="players">
              <i />
              <b>2,847</b> slayers hunting now
            </span>
          </div>
          <div className="hero-stats">
            <div>
              <strong>128K</strong>
              <span>BUGS SLAYED</span>
            </div>
            <div>
              <strong>42</strong>
              <span>LIVE MISSIONS</span>
            </div>
            <div>
              <strong>5</strong>
              <span>DIGITAL WORLDS</span>
            </div>
          </div>
        </div>
        <div className="hero-visual">
          <div className="threat-label">
            <span>THREAT DETECTED</span>
            <b>LOGIC GLITCH</b>
          </div>
          <GlitchCreature />
          <HeroCodeCard />
          <div className="target-ring" />
        </div>
      </section>

      <Reveal>
        <section className="mission-strip">
          <div className="daily-icon">
            <Zap />
          </div>
          <div>
            <span className="eyebrow">DAILY BUG // 07:42:18 LEFT</span>
            <h3>The Infinite Loop Incident</h3>
          </div>
          <span className="mission-tag">MEDIUM</span>
          <div className="reward">
            <small>STREAK BONUS</small>
            <b>+350 XP</b>
          </div>
          <button className="secondary-button" onClick={daily}>
            Inspect mission <ChevronRight />
          </button>
        </section>
      </Reveal>

      <HowItWorks />

      <Reveal>
        <section className="world-showcase">
          <SectionHeader
            kicker="EXPLORE THE NETWORK"
            title="THE DIGITAL DEBUGGER WORLD"
            copy="Five corrupted regions. Five families of bugs. One connected campaign."
          />
          <WorldMap onSelect={world} title={false} />
          <div className="world-cards">
            {initialWorlds.map((item, index) => (
              <button 
                key={item.name} 
                className="world-stagger-card" 
                style={{ animationDelay: `${index * 150}ms` }}
                onClick={world}
              >
                <span className="card-scan-sweep" aria-hidden="true" />
                <small>{item.level}</small>
                <b>{item.name}</b>
                <span>
                  {[
                    "Syntax bugs",
                    "Conditionals & loops",
                    "Arrays & indexing",
                    "Functions & runtime",
                    "Advanced debugging"
                  ][index]}
                </span>
                <ChevronRight />
              </button>
            ))}
          </div>
        </section>
      </Reveal>

      <WhySection />
      <LevelUpSection rankInfo={rankInfo} stats={stats} />
      <BugDNAPreview open={bugDna} dnaStats={stats.dnaStats} />

      <section className="final-cta">
        <div className="cta-grid" />
        <div className="cta-energy-layer" aria-hidden="true">
          <div className="cta-radial-pulse" />
          <div className="cta-energy-line cta-line-1" />
          <div className="cta-energy-line cta-line-2" />
          <div className="cta-energy-line cta-line-3" />
          <div className="cta-energy-mote cta-mote-1" />
          <div className="cta-energy-mote cta-mote-2" />
          <div className="cta-energy-mote cta-mote-3" />
          <div className="cta-energy-mote cta-mote-4" />
        </div>
        <GlitchCreature small />
        <div>
          <span className="eyebrow">YOUR FIRST MISSION IS READY</span>
          <h2>READY TO HUNT YOUR FIRST BUG?</h2>
          <p>The corruption is spreading. Your scanner is online.</p>
          <StartSlayingButton onClick={start} />
        </div>
      </section>
    </motion.main>
  );
}
