import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, CalendarDays, Crown, Flame, Medal, Network, Target, Users } from "lucide-react";
import { RankInfo } from "../hooks/useGameState";
import { PlayerStats } from "../types/game";

interface LeaderboardProps {
  rankInfo: RankInfo;
  stats: PlayerStats;
}

const baseSlayers = [
  { rank: 1, name: "CipherByte", xp: 12840, bugs: 147, streak: 21, title: "Core Breaker" },
  { rank: 2, name: "NovaGlitch", xp: 11920, bugs: 139, streak: 18, title: "Runtime Reaper" },
  { rank: 3, name: "ByteKnight", xp: 10740, bugs: 126, streak: 15, title: "Logic Breaker" },
  { rank: 4, name: "CodeRaven", xp: 9860, bugs: 118, streak: 12, title: "Logic Breaker" },
  { rank: 5, name: "DebugMaster", xp: 9240, bugs: 109, streak: 10, title: "Array Warden" },
  { rank: 6, name: "SyntaxWolf", xp: 8710, bugs: 102, streak: 9, title: "Array Warden" },
  { rank: 7, name: "LoopHunter", xp: 8190, bugs: 96, streak: 8, title: "Byte Hunter III" },
  { rank: 8, name: "BugCrusher", xp: 7850, bugs: 91, streak: 7, title: "Byte Hunter III" },
];

export default function Leaderboard({ rankInfo, stats }: LeaderboardProps) {
  const [tab, setTab] = useState("Global");

  return (
    <motion.main
      className="leaderboard-screen subpage"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="subpage-heading">
        <span className="eyebrow">SEASON 01 // LIVE RANKINGS</span>
        <h1>
          CODE SLAYER <span>LEADERBOARD</span>
        </h1>
        <p>The strongest Slayers hunting in the digital expanse.</p>
      </div>

      <div className="leader-tabs" role="tablist" aria-label="Leaderboard period">
        {["Global", "Weekly", "Friends"].map((item) => (
          <button
            key={item}
            role="tab"
            aria-selected={tab === item}
            className={tab === item ? "active" : ""}
            onClick={() => setTab(item)}
          >
            {item === "Global" ? (
              <Network />
            ) : item === "Weekly" ? (
              <CalendarDays />
            ) : (
              <Users />
            )}
            {item}
          </button>
        ))}
      </div>

      <section className="podium" aria-label="Top three Slayers">
        {[baseSlayers[1], baseSlayers[0], baseSlayers[2]].map((player) => (
          <motion.article
            key={player.name}
            className={`podium-player place-${player.rank}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: player.rank * 0.08 }}
          >
            {player.rank === 1 && <Crown className="podium-crown" />}
            <div className="avatar-code">{player.name.slice(0, 2).toUpperCase()}</div>
            <h3>{player.name}</h3>
            <span>{player.title}</span>
            <b>{player.xp.toLocaleString()} XP</b>
            <div className="podium-block">
              <Medal />
              <strong>0{player.rank}</strong>
            </div>
          </motion.article>
        ))}
      </section>

      <section className="leader-table">
        <div className="leader-row leader-head">
          <span>Rank</span>
          <span>Slayer</span>
          <span>XP</span>
          <span>Bugs Slain</span>
          <span>Streak</span>
          <span>Slayer Rank</span>
        </div>
        {baseSlayers.map((player) => (
          <div className="leader-row" key={player.name}>
            <span className={`rank-cell rank-${player.rank}`}>
              {player.rank < 4 ? <Medal /> : null}#{String(player.rank).padStart(2, "0")}
            </span>
            <span className="slayer-cell">
              <i>{player.name.slice(0, 2).toUpperCase()}</i>
              <b>{player.name}</b>
            </span>
            <span className="xp-cell">{player.xp.toLocaleString()} XP</span>
            <span>{player.bugs}</span>
            <span className="streak-cell">
              <Flame />
              {player.streak} days
            </span>
            <span className="title-cell">{player.title}</span>
          </div>
        ))}
      </section>

      <section className="your-rank">
        <div>
          <Target />
          <span>
            <small>YOUR RECORD</small>
            <b>#42 · {rankInfo.rank}</b>
          </span>
        </div>
        <span>
          <small>XP</small>
          <b>{stats.xp.toLocaleString()}</b>
        </span>
        <span>
          <small>BUGS SLAIN</small>
          <b>{stats.bugsSlain}</b>
        </span>
        <span>
          <small>STREAK</small>
          <b>{stats.streak} days</b>
        </span>
        <div className="rank-jump">
          <ArrowRight />
          <span>
            <small>NEXT TARGET</small>
            <b>{rankInfo.xpUntilNext} XP TO {rankInfo.nextRankName.toUpperCase()}</b>
          </span>
        </div>
      </section>
    </motion.main>
  );
}
