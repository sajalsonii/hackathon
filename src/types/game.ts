export type Language = "Python" | "JavaScript" | "Java";
export type Difficulty = "Easy" | "Medium" | "Hard";
export type ThreatClass = "CLASS I" | "CLASS II" | "CLASS III" | "SPECIAL EVENT" | "BOSS";
export type CreatureState = "idle" | "detected" | "damaged" | "defeated";

export type Screen =
  | "landing"
  | "login"
  | "signup"
  | "dashboard"
  | "setup"
  | "hunt"
  | "success"
  | "leaderboard"
  | "daily"
  | "bugdna"
  | "world";

export interface Challenge {
  id: string;
  title: string;
  language: Language;
  difficulty: Difficulty;
  worldId: string;
  worldName: string;
  threatClass: ThreatClass;
  threatName: string;
  bugType: string;
  description: string;
  fileName: string;
  brokenCode: string;
  sampleSolution: string;
  hints: [string, string, string];
  bugDnaCategory: "Syntax" | "Logic" | "Loops" | "Arrays" | "Functions" | "Runtime" | "Conditionals" | "Off-by-One";
  xpReward: number;
  explanation: string;
  validate: (code: string) => { passed: boolean; message: string; output?: string };
  isAiGenerated?: boolean;
  creatureName?: string;
  missionDescription?: string;
  fixedCode?: string;
  bugLine?: number;
  whatYouLearned?: string;
}

export interface PlayerStats {
  slayerName?: string;
  xp: number;
  streak: number;
  longestStreak?: number;
  combo: number;
  bugsSlain: number;
  completedChallengeIds: string[];
  dnaStats: Record<string, number>;
  currentWorld?: string;
  achievements?: string[];
  dailyChallenge?: Record<string, unknown> | null;
  lastPlayedDate?: string;
}

export interface GameProgress {
  user_id: string;
  username: string;
  xp: number;
  slayer_rank: string;
  level: number;
  current_world: string;
  streak: number;
  longest_streak: number;
  combo: number;
  bugs_slain: number;
  last_activity_date: string;
  bug_dna: Record<string, number>;
  achievements: string[];
  daily_challenge: Record<string, unknown> | null;
  updated_at: string;
}

export interface ChallengeHistoryEntry {
  user_id: string;
  challenge_title: string;
  language: string;
  difficulty: string;
  bug_category: string;
  completed: boolean;
  attempts: number;
  hints_used: number;
  time_taken_seconds: number;
  xp_earned: number;
  source: string;
}

export interface PlayerProfile {
  id: string;
  user_id: string;
  slayer_name: string;
  email: string;
  xp: number;
  slayer_rank: string;
  streak: number;
  combo: number;
  bugs_slain: number;
  current_world: string;
  achievements: string[];
  challenge_progress: string[];
  dna_stats: Record<string, number>;
}

export interface WorldNode {
  level: string;
  name: string;
  focus: string;
  status: "complete" | "current" | "locked";
  x: number;
  y: number;
  challengesCount: number;
  completedCount: number;
}
