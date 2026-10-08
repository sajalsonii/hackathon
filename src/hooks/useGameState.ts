import { useState, useEffect } from "react";
import { PlayerStats, PlayerProfile, Language, Difficulty, Challenge } from "../types/game";
import { challenges, getChallenge, getChallengeById } from "../data/challenges";

const STORAGE_KEY = "code_slayer_save_v2";

const guestDefaultStats: PlayerStats = {
  slayerName: "Guest Slayer",
  xp: 3420,
  streak: 7,
  combo: 4,
  bugsSlain: 38,
  completedChallengeIds: [],
  dnaStats: {
    Syntax: 86,
    Logic: 72,
    Loops: 64,
    Arrays: 78,
    Functions: 58,
    Runtime: 49,
    Conditionals: 81,
    "Off-by-One": 69
  }
};

export interface RankInfo {
  rank: string;
  level: number;
  levelDisplay: string;
  currentBaseXp: number;
  nextXp: number;
  progressPercent: number;
  nextRankName: string;
  xpUntilNext: number;
}

export function computeRankInfo(xp: number): RankInfo {
  const tiers = [
    { rank: "Rookie Slayer", level: 1, min: 0, next: 500, nextRank: "Byte Scout" },
    { rank: "Byte Scout", level: 2, min: 500, next: 1000, nextRank: "Code Hunter I" },
    { rank: "Code Hunter I", level: 3, min: 1000, next: 1750, nextRank: "Code Hunter II" },
    { rank: "Code Hunter II", level: 4, min: 1750, next: 2500, nextRank: "Byte Hunter I" },
    { rank: "Byte Hunter I", level: 5, min: 2500, next: 3300, nextRank: "Byte Hunter II" },
    { rank: "Byte Hunter II", level: 8, min: 3300, next: 5000, nextRank: "Logic Breaker" },
    { rank: "Logic Breaker", level: 9, min: 5000, next: 6500, nextRank: "Array Warden" },
    { rank: "Array Warden", level: 10, min: 6500, next: 8000, nextRank: "Runtime Reaper" },
    { rank: "Runtime Reaper", level: 11, min: 8000, next: 10000, nextRank: "Core Breaker" },
    { rank: "Core Breaker", level: 12, min: 10000, next: 15000, nextRank: "Grand Slayer" }
  ];

  let currentTier = tiers[0];
  for (const tier of tiers) {
    if (xp >= tier.min) {
      currentTier = tier;
    }
  }

  const range = currentTier.next - currentTier.min;
  const inTier = Math.max(0, xp - currentTier.min);
  const progressPercent = Math.min(100, Math.round((inTier / range) * 100));
  const xpUntilNext = Math.max(0, currentTier.next - xp);

  return {
    rank: currentTier.rank,
    level: currentTier.level,
    levelDisplay: `LV. ${String(currentTier.level).padStart(2, "0")}`,
    currentBaseXp: currentTier.min,
    nextXp: currentTier.next,
    progressPercent,
    nextRankName: currentTier.nextRank,
    xpUntilNext
  };
}

export interface VictorySummary {
  challenge: Challenge;
  xpEarned: number;
  prevXp: number;
  newXp: number;
  prevRank: string;
  newRank: string;
  timeSpentSeconds: number;
  pulsesUsed: number;
}

export function useGameState(
  profile?: PlayerProfile | null,
  onProfileUpdate?: (updates: Partial<PlayerProfile>) => Promise<void>
) {
  const [stats, setStats] = useState<PlayerStats>(() => {
    if (profile) {
      return {
        slayerName: profile.slayer_name,
        xp: profile.xp,
        streak: profile.streak,
        combo: profile.combo,
        bugsSlain: profile.bugs_slain,
        completedChallengeIds: profile.challenge_progress || [],
        dnaStats: profile.dna_stats || guestDefaultStats.dnaStats
      };
    }
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return { ...guestDefaultStats, ...JSON.parse(saved) };
      }
    } catch {
      // ignore
    }
    return guestDefaultStats;
  });

  // Whenever user profile updates from Supabase, sync with stats
  useEffect(() => {
    if (profile) {
      setStats({
        slayerName: profile.slayer_name,
        xp: profile.xp,
        streak: profile.streak,
        combo: profile.combo,
        bugsSlain: profile.bugs_slain,
        completedChallengeIds: profile.challenge_progress || [],
        dnaStats: profile.dna_stats || guestDefaultStats.dnaStats
      });
    }
  }, [profile]);

  const [selectedLanguage, setSelectedLanguage] = useState<Language>("JavaScript");
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>("Medium");
  const [activeChallengeId, setActiveChallengeId] = useState<string>("js-med-bounds");
  const [customChallenge, setCustomChallenge] = useState<Challenge | null>(null);
  const [lastVictory, setLastVictory] = useState<VictorySummary | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
    } catch {
      // ignore storage issues
    }
  }, [stats]);

  const activeChallenge = customChallenge || getChallengeById(activeChallengeId) || challenges[0];
  const rankInfo = computeRankInfo(stats.xp);

  const startConfiguredHunt = (lang?: Language, diff?: Difficulty) => {
    setCustomChallenge(null);
    const l = lang || selectedLanguage;
    const d = diff || selectedDifficulty;
    const challenge = getChallenge(l, d);
    setActiveChallengeId(challenge.id);
  };

  const startSpecificChallenge = (challengeId: string) => {
    setCustomChallenge(null);
    const challenge = getChallengeById(challengeId);
    if (challenge) {
      setSelectedLanguage(challenge.language);
      setSelectedDifficulty(challenge.difficulty);
      setActiveChallengeId(challenge.id);
    }
  };

  const startCustomChallenge = (challenge: Challenge) => {
    setCustomChallenge(challenge);
    setSelectedLanguage(challenge.language);
    setSelectedDifficulty(challenge.difficulty);
  };

  const recordVictory = (challengeId: string, timeSpentSeconds: number, pulsesUsed: number) => {
    const challenge =
      customChallenge && customChallenge.id === challengeId
        ? customChallenge
        : getChallengeById(challengeId);
    const xpReward = challenge.xpReward;
    const prevXp = stats.xp;
    const newXp = prevXp + xpReward;
    const prevRank = computeRankInfo(prevXp).rank;
    const newRank = computeRankInfo(newXp).rank;

    setStats((prev) => {
      const alreadyCompleted = prev.completedChallengeIds.includes(challengeId);
      const newDna = { ...prev.dnaStats };
      const cat = challenge.bugDnaCategory;
      if (newDna[cat] !== undefined) {
        newDna[cat] = Math.min(99, newDna[cat] + 2);
      }

      const updatedProgress = alreadyCompleted
        ? prev.completedChallengeIds
        : [...prev.completedChallengeIds, challengeId];

      const newStats: PlayerStats = {
        ...prev,
        xp: newXp,
        streak: prev.streak + (alreadyCompleted ? 0 : 1),
        combo: prev.combo + 1,
        bugsSlain: prev.bugsSlain + 1,
        completedChallengeIds: updatedProgress,
        dnaStats: newDna
      };

      // Sync with Supabase if callback provided
      if (onProfileUpdate) {
        onProfileUpdate({
          xp: newXp,
          slayer_rank: newRank,
          streak: newStats.streak,
          combo: newStats.combo,
          bugs_slain: newStats.bugsSlain,
          challenge_progress: updatedProgress,
          dna_stats: newDna
        }).catch(() => {});
      }

      return newStats;
    });

    setLastVictory({
      challenge,
      xpEarned: xpReward,
      prevXp,
      newXp,
      prevRank,
      newRank,
      timeSpentSeconds,
      pulsesUsed
    });
  };

  const resetToDefaults = () => {
    setStats(guestDefaultStats);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  };

  return {
    stats,
    rankInfo,
    selectedLanguage,
    setSelectedLanguage,
    selectedDifficulty,
    setSelectedDifficulty,
    activeChallenge,
    startConfiguredHunt,
    startSpecificChallenge,
    recordVictory,
    lastVictory,
    resetToDefaults
  };
}
