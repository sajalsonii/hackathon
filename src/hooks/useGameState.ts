import { useState, useEffect } from "react";
import { User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import {
  PlayerStats,
  PlayerProfile,
  GameProgress,
  Language,
  Difficulty,
  Challenge
} from "../types/game";
import { challenges, getChallengeById, getRandomChallenge } from "../data/challenges";

const STORAGE_KEY = "code_slayer_save_v2";

const defaultDnaStats = {
  Syntax: 50,
  Logic: 50,
  Loops: 50,
  Arrays: 50,
  Functions: 50,
  Runtime: 50,
  Conditionals: 50,
  "Off-by-One": 50
};

const guestDefaultStats: PlayerStats = {
  slayerName: "Guest Slayer",
  xp: 0,
  streak: 0,
  longestStreak: 0,
  combo: 0,
  bugsSlain: 0,
  completedChallengeIds: [],
  dnaStats: defaultDnaStats,
  currentWorld: "01",
  achievements: [],
  dailyChallenge: null
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
  userOrProfile?: User | PlayerProfile | null,
  gameProgress?: GameProgress | null,
  onProfileUpdate?: (updates: Partial<PlayerProfile>) => Promise<void>
) {
  // Support either user object or legacy profile object as first argument
  const user = userOrProfile && "id" in userOrProfile && "aud" in userOrProfile
    ? (userOrProfile as User)
    : null;

  const initialProfile = userOrProfile && "slayer_name" in userOrProfile
    ? (userOrProfile as PlayerProfile)
    : null;

  const [stats, setStats] = useState<PlayerStats>(() => {
    if (gameProgress) {
      return {
        slayerName: gameProgress.username,
        xp: gameProgress.xp,
        streak: gameProgress.streak,
        longestStreak: gameProgress.longest_streak,
        combo: gameProgress.combo,
        bugsSlain: gameProgress.bugs_slain,
        completedChallengeIds: [],
        dnaStats: gameProgress.bug_dna || defaultDnaStats,
        currentWorld: gameProgress.current_world || "01",
        achievements: gameProgress.achievements || [],
        dailyChallenge: gameProgress.daily_challenge
      };
    }
    if (initialProfile) {
      return {
        slayerName: initialProfile.slayer_name,
        xp: initialProfile.xp,
        streak: initialProfile.streak,
        combo: initialProfile.combo,
        bugsSlain: initialProfile.bugs_slain,
        completedChallengeIds: initialProfile.challenge_progress || [],
        dnaStats: initialProfile.dna_stats || defaultDnaStats
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

  // Whenever gameProgress updates from Supabase, sync with stats immediately
  useEffect(() => {
    if (gameProgress) {
      setStats({
        slayerName: gameProgress.username,
        xp: gameProgress.xp,
        streak: gameProgress.streak,
        longestStreak: gameProgress.longest_streak,
        combo: gameProgress.combo,
        bugsSlain: gameProgress.bugs_slain,
        completedChallengeIds: [],
        dnaStats: gameProgress.bug_dna || defaultDnaStats,
        currentWorld: gameProgress.current_world || "01",
        achievements: gameProgress.achievements || [],
        dailyChallenge: gameProgress.daily_challenge
      });
    } else if (initialProfile) {
      setStats({
        slayerName: initialProfile.slayer_name,
        xp: initialProfile.xp,
        streak: initialProfile.streak,
        combo: initialProfile.combo,
        bugsSlain: initialProfile.bugs_slain,
        completedChallengeIds: initialProfile.challenge_progress || [],
        dnaStats: initialProfile.dna_stats || defaultDnaStats
      });
    }
  }, [gameProgress, initialProfile]);

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
    const challenge = getRandomChallenge(l, d);
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

  const recordVictory = async (
    challengeId: string,
    timeSpentSeconds: number,
    pulsesUsed: number,
    attempts: number = 1
  ) => {
    const challenge =
      customChallenge && customChallenge.id === challengeId
        ? customChallenge
        : getChallengeById(challengeId);
    const xpReward = challenge.xpReward;
    const prevXp = stats.xp;
    const newXp = prevXp + xpReward;
    const rankData = computeRankInfo(newXp);
    const newRank = rankData.rank;
    const newLevel = rankData.level;

    const alreadyCompleted = stats.completedChallengeIds.includes(challengeId);
    const newDna = { ...stats.dnaStats };
    const cat = challenge.bugDnaCategory;
    if (newDna[cat] !== undefined) {
      newDna[cat] = Math.min(99, newDna[cat] + 2);
    }

    const newStreak = stats.streak + (alreadyCompleted ? 0 : 1);
    const newLongestStreak = Math.max(stats.longestStreak || 0, newStreak);
    const newCombo = stats.combo + 1;
    const newBugsSlain = stats.bugsSlain + 1;
    const currentWorld = challenge.worldId || stats.currentWorld || "01";
    const nowIso = new Date().toISOString();

    const updatedProgress = alreadyCompleted
      ? stats.completedChallengeIds
      : [...stats.completedChallengeIds, challengeId];

    const newStats: PlayerStats = {
      ...stats,
      xp: newXp,
      streak: newStreak,
      longestStreak: newLongestStreak,
      combo: newCombo,
      bugsSlain: newBugsSlain,
      completedChallengeIds: updatedProgress,
      dnaStats: newDna,
      currentWorld
    };

    setStats(newStats);

    setLastVictory({
      challenge,
      xpEarned: xpReward,
      prevXp,
      newXp,
      prevRank: computeRankInfo(prevXp).rank,
      newRank,
      timeSpentSeconds,
      pulsesUsed
    });

    // Supabase Integration: Upsert public.game_progress and insert public.challenge_history
    if (user) {
      const username =
        stats.slayerName ||
        user.user_metadata?.slayer_name ||
        user.email?.split("@")[0] ||
        "Slayer";

      const progressPayload = {
        user_id: user.id,
        username,
        xp: newXp,
        slayer_rank: newRank,
        level: newLevel,
        current_world: currentWorld,
        streak: newStreak,
        longest_streak: newLongestStreak,
        combo: newCombo,
        bugs_slain: newBugsSlain,
        last_activity_date: nowIso,
        bug_dna: newDna,
        achievements: stats.achievements || [],
        daily_challenge: stats.dailyChallenge || null,
        updated_at: nowIso
      };

      try {
        const { error: progressError } = await supabase
          .from("game_progress")
          .upsert(progressPayload, { onConflict: "user_id" });

        if (progressError) {
          console.error("Supabase game_progress upsert error:", progressError.message, progressError);
        }
      } catch (err: unknown) {
        console.error(
          "Supabase game_progress upsert exception:",
          err instanceof Error ? err.message : err
        );
      }

      const historyPayload = {
        user_id: user.id,
        challenge_title: challenge.title,
        language: challenge.language,
        difficulty: challenge.difficulty,
        bug_category: challenge.bugType || challenge.bugDnaCategory || "Logic",
        completed: true,
        attempts: attempts || 1,
        hints_used: pulsesUsed,
        time_taken_seconds: timeSpentSeconds,
        xp_earned: xpReward,
        source: challenge.isAiGenerated
          ? "ai"
          : challenge.id.startsWith("daily")
            ? "daily"
            : "builtin"
      };

      try {
        const { error: historyError } = await supabase
          .from("challenge_history")
          .insert(historyPayload);

        if (historyError) {
          console.error("Supabase challenge_history insert error:", historyError.message, historyError);
        }
      } catch (err: unknown) {
        console.error(
          "Supabase challenge_history insert exception:",
          err instanceof Error ? err.message : err
        );
      }
    }

    if (onProfileUpdate) {
      onProfileUpdate({
        xp: newXp,
        slayer_rank: newRank,
        streak: newStreak,
        combo: newCombo,
        bugs_slain: newBugsSlain,
        challenge_progress: updatedProgress,
        dna_stats: newDna
      }).catch(() => {});
    }
  };

  const clearGameState = () => {
    setStats(guestDefaultStats);
    setCustomChallenge(null);
    setLastVictory(null);
    setActiveChallengeId("js-med-bounds");
    try {
      localStorage.removeItem(STORAGE_KEY);
      sessionStorage.removeItem("code_slayer_recent_titles_v1");
      sessionStorage.removeItem("code_slayer_played_local_ids_v1");
    } catch {
      // ignore
    }
  };

  const resetToDefaults = () => {
    clearGameState();
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
    startCustomChallenge,
    recordVictory,
    lastVictory,
    clearGameState,
    resetToDefaults
  };
}
