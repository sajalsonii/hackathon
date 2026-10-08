import { Challenge, Language, Difficulty, ThreatClass } from "../types/game";
import { supabase } from "../lib/supabase";
import { createAiChallengeValidator, getRandomChallenge, challenges } from "../data/challenges";

export const POOL_SIZE = 5;
export const REPLENISH_THRESHOLD = 2; // When 2 or fewer unused questions remain, silently generate 5 more in background

export const POOL_BUG_CATEGORIES = [
  "syntax",
  "logic",
  "loops",
  "arrays",
  "runtime",
  "conditionals",
  "functions",
  "off-by-one"
] as const;

export type PoolBugCategory = (typeof POOL_BUG_CATEGORIES)[number];
export type ChallengeStatus = "unused" | "used";

export interface StoredChallengeData {
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
  isAiGenerated?: boolean;
  creatureName?: string;
  missionDescription?: string;
  fixedCode?: string;
  bugLine?: number;
  whatYouLearned?: string;
}

export interface PooledChallengeItem {
  data: StoredChallengeData;
  status: ChallengeStatus;
  category: string;
  createdAt: number;
}

export interface PoolConfigState {
  key: string; // e.g. "javascript_medium"
  language: Language;
  difficulty: Difficulty;
  items: PooledChallengeItem[];
  usedIds: string[];
  usedTitles: string[];
  totalServed: number;
}

export interface StoredSessionMeta {
  sessionId: string;
  userId: string;
  createdAt: number;
}

const POOL_STORAGE_KEY = "code_slayer_pool_v3";
const SESSION_META_KEY = "code_slayer_session_v3";

function getConfigKey(language: string, difficulty: string): string {
  return `${language.toLowerCase()}_${difficulty.toLowerCase()}`;
}

export function inflateChallenge(data: StoredChallengeData): Challenge {
  return {
    ...data,
    validate: createAiChallengeValidator(data.fixedCode || data.sampleSolution)
  };
}

class ChallengePoolService {
  private activeSessionId: string | null = null;
  private activeUserId: string | null = null;
  private pools: Map<string, PoolConfigState> = new Map();
  private generatingConfigs: Set<string> = new Set();
  private listeners: Set<() => void> = new Set();
  private isConsumingMutex = false;
  private lastServedChallenge: Challenge | null = null;

  constructor() {
    this.hydrateFromStorage();
  }

  /**
   * Initializes a session for the specified user.
   * If a matching session already exists in sessionStorage, reuses it.
   * If user has changed or no session exists, creates a fresh session and clears old pools.
   */
  public initSession(userId: string, language: Language, difficulty: Difficulty): void {
    if (!userId) return;

    const storedMeta = this.loadSessionMeta();

    if (storedMeta && storedMeta.userId === userId && storedMeta.sessionId) {
      this.activeSessionId = storedMeta.sessionId;
      this.activeUserId = userId;
    } else {
      this.activeSessionId = `session_${userId}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      this.activeUserId = userId;
      this.pools.clear();
      this.lastServedChallenge = null;
      this.saveSessionMeta({
        sessionId: this.activeSessionId,
        userId,
        createdAt: Date.now()
      });
      this.persistPools();
    }

    // Immediately start pre-generating 5 problems in the background if pool isn't ready
    this.ensurePool(language, difficulty);
  }

  /**
   * Clears the current session and all stored challenge pools on user logout.
   */
  public clearSession(): void {
    this.activeSessionId = null;
    this.activeUserId = null;
    this.pools.clear();
    this.generatingConfigs.clear();
    this.isConsumingMutex = false;
    this.lastServedChallenge = null;

    try {
      sessionStorage.removeItem(POOL_STORAGE_KEY);
      sessionStorage.removeItem(SESSION_META_KEY);
    } catch {
      // ignore
    }
  }

  /**
   * Ensures that a background pool exists and is populated with at least POOL_SIZE questions.
   */
  public ensurePool(language: Language, difficulty: Difficulty): void {
    if (!this.activeSessionId || !this.activeUserId) return;

    const key = getConfigKey(language, difficulty);
    let pool = this.pools.get(key);

    if (!pool) {
      pool = {
        key,
        language,
        difficulty,
        items: [],
        usedIds: [],
        usedTitles: [],
        totalServed: 0
      };
      this.pools.set(key, pool);
      this.persistPools();
    }

    const unusedCount = pool.items.filter((it) => it.status === "unused").length;
    if (unusedCount < POOL_SIZE && !this.generatingConfigs.has(key)) {
      this.startBackgroundGeneration(language, difficulty);
    }
  }

  /**
   * Checks synchronously if there is an unused challenge ready right now in the pool.
   */
  public hasUnused(language: Language, difficulty: Difficulty): boolean {
    const key = getConfigKey(language, difficulty);
    const pool = this.pools.get(key);
    if (!pool) return false;
    return pool.items.some((it) => it.status === "unused");
  }

  /**
   * CRITICAL METHOD: Used by BOTH "START SLAYING" and "NEXT HUNT".
   * 1. Checks for next unused prepared problem.
   * 2. Returns it immediately (instant transition).
   * 3. Marks it as USED so it never repeats.
   * 4. Triggers background replenishment when pool gets low (<= 2 unused remaining).
   * 5. Mutex protected against rapid clicks.
   */
  public async getNextChallenge(
    language: Language,
    difficulty: Difficulty,
    cancelCheck?: () => boolean
  ): Promise<Challenge> {
    // Prevent duplicate consumption from rapid double-clicks
    if (this.isConsumingMutex) {
      if (this.lastServedChallenge) {
        return this.lastServedChallenge;
      }
      await new Promise((r) => setTimeout(r, 150));
    }

    this.isConsumingMutex = true;
    try {
      const key = getConfigKey(language, difficulty);
      this.ensurePool(language, difficulty);

      let pool = this.pools.get(key)!;

      // 1. Check if an unused challenge is ready right now in the pool
      let candidate = pool.items.find((it) => it.status === "unused");

      // 2. If no unused challenge is ready yet (e.g. brand new session first second),
      // wait briefly for the first background problem to finish generating
      if (!candidate) {
        candidate = await this.waitForNextUnusedItem(key, 12000, cancelCheck);
      }

      if (cancelCheck && cancelCheck()) {
        throw new Error("SELECTION_CANCELLED");
      }

      // 3. If a candidate was found, mark it USED immediately and check replenishment
      if (candidate) {
        candidate.status = "used";
        pool.totalServed += 1;
        if (!pool.usedIds.includes(candidate.data.id)) {
          pool.usedIds.push(candidate.data.id);
        }
        if (candidate.data.title && !pool.usedTitles.includes(candidate.data.title)) {
          pool.usedTitles.push(candidate.data.title);
        }
        this.persistPools();

        // Check if pool is getting low (<= 2 unused remaining) -> trigger silent background replenishment
        const remainingUnused = pool.items.filter((it) => it.status === "unused").length;
        if (remainingUnused <= REPLENISH_THRESHOLD && !this.generatingConfigs.has(key)) {
          this.startBackgroundGeneration(language, difficulty);
        }

        const inflated = inflateChallenge(candidate.data);
        this.lastServedChallenge = inflated;
        return inflated;
      }

      // 4. Fallback if AI generation failed or timed out: use local challenge formatted as Challenge
      // Ensure we pick an unplayed local challenge that has not been served yet
      console.warn("AI pool had no ready challenge, selecting non-repeating local fallback");
      const unplayedLocal = this.selectNonRepeatingLocal(pool, language, difficulty);
      this.lastServedChallenge = unplayedLocal;
      return unplayedLocal;
    } finally {
      this.isConsumingMutex = false;
    }
  }

  /**
   * Marks a challenge as used/solved if necessary.
   */
  public markChallengeSolved(challengeId: string): void {
    if (!challengeId) return;

    for (const pool of this.pools.values()) {
      const item = pool.items.find((it) => it.data.id === challengeId);
      if (item) {
        item.status = "used";
        if (!pool.usedIds.includes(challengeId)) {
          pool.usedIds.push(challengeId);
        }
        this.persistPools();
        break;
      }
    }
  }

  /**
   * Helper to select an unplayed local challenge when AI is unavailable.
   */
  private selectNonRepeatingLocal(
    pool: PoolConfigState,
    language: Language,
    difficulty: Difficulty
  ): Challenge {
    const matching = challenges.filter(
      (c) => c.language === language && c.difficulty === difficulty
    );
    const unplayed = matching.filter(
      (c) => !pool.usedIds.includes(c.id) && !pool.usedTitles.includes(c.title)
    );
    const candidate = unplayed.length > 0 ? unplayed[0] : matching[0] || challenges[0];

    pool.usedIds.push(candidate.id);
    if (candidate.title) pool.usedTitles.push(candidate.title);
    this.persistPools();
    return candidate;
  }

  // =========================================================================
  // BACKGROUND POOL GENERATION ENGINE (5 QUESTIONS PER BATCH)
  // =========================================================================

  private async startBackgroundGeneration(language: Language, difficulty: Difficulty): Promise<void> {
    const key = getConfigKey(language, difficulty);
    if (this.generatingConfigs.has(key)) return;

    this.generatingConfigs.add(key);
    const capturedSessionId = this.activeSessionId;

    try {
      const pool = this.pools.get(key);
      if (!pool) return;

      // We want at least POOL_SIZE unused questions ready in the pool
      let currentUnused = pool.items.filter((it) => it.status === "unused").length;
      let targetToGenerate = Math.max(0, POOL_SIZE - currentUnused);

      if (targetToGenerate === 0) return;

      // Concurrency: Use 2 concurrent workers to generate quickly without hitting rate limits
      const workerCount = Math.min(2, targetToGenerate);
      const workers: Promise<void>[] = [];

      for (let w = 0; w < workerCount; w++) {
        workers.push(
          (async () => {
            while (true) {
              if (this.activeSessionId !== capturedSessionId) break;

              const p = this.pools.get(key);
              if (!p) break;

              const unused = p.items.filter((it) => it.status === "unused").length;
              if (unused >= POOL_SIZE) break;

              // Pick category cycling through the 8 allowed categories
              const catIndex = (p.totalServed + p.items.length) % POOL_BUG_CATEGORIES.length;
              const category = POOL_BUG_CATEGORIES[catIndex];

              const success = await this.generateSingleQuestion(p, category, capturedSessionId);
              if (!success) {
                // Short wait on failure before retry
                await new Promise((r) => setTimeout(r, 1000));
              }
            }
          })()
        );
      }

      await Promise.all(workers);
    } catch (err) {
      console.warn(`Background generation for ${key} encountered an issue:`, err);
    } finally {
      this.generatingConfigs.delete(key);
    }
  }

  private async generateSingleQuestion(
    pool: PoolConfigState,
    category: PoolBugCategory,
    capturedSessionId: string | null
  ): Promise<boolean> {
    if (this.activeSessionId !== capturedSessionId) return false;

    // Build avoidTitles from all used titles + current pool titles to avoid duplicates across batches
    const avoidTitles = Array.from(
      new Set([...pool.usedTitles, ...pool.items.map((it) => it.data.title)])
    ).slice(-8);

    try {
      const langLower = pool.language.toLowerCase();
      const diffLower = pool.difficulty.toLowerCase();

      let timeoutId: number | undefined;
      const timeoutPromise = new Promise<{ data: null; error: Error }>((_, reject) => {
        timeoutId = window.setTimeout(() => {
          reject(new Error("EDGE_TIMEOUT"));
        }, 11000);
      });

      const invokePromise = supabase.functions.invoke("generate-challenge", {
        body: {
          language: langLower,
          difficulty: diffLower,
          bugCategory: category,
          avoidTitles
        }
      });

      const result = await Promise.race([invokePromise, timeoutPromise]);
      window.clearTimeout(timeoutId);

      if (this.activeSessionId !== capturedSessionId) return false;

      const challengeData = result.data;
      if (result.error || !challengeData || !challengeData.title) {
        return false;
      }

      // Client-side anti-collision: Ensure title has not been used or already in pool
      const titleLower = String(challengeData.title).trim().toLowerCase();
      const isDuplicateTitle =
        pool.usedTitles.some((t) => t.toLowerCase() === titleLower) ||
        pool.items.some((it) => it.data.title.toLowerCase() === titleLower);

      if (isDuplicateTitle) {
        return false;
      }

      const storedData = this.mapRawToStored(challengeData, pool.language, pool.difficulty);

      const newItem: PooledChallengeItem = {
        data: storedData,
        status: "unused",
        category,
        createdAt: Date.now()
      };

      pool.items.push(newItem);
      this.persistPools();
      this.notifyListeners();
      return true;
    } catch {
      return false;
    }
  }

  private mapRawToStored(raw: any, language: Language, difficulty: Difficulty): StoredChallengeData {
    const langLower = language.toLowerCase();
    const fileExt = language === "Python" ? ".py" : language === "Java" ? ".java" : ".js";
    const slug = (raw.title || `anomaly_${Date.now()}`)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "");

    return {
      id: raw.id || `ai-${langLower.slice(0, 2)}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      title: raw.title,
      language,
      difficulty,
      worldId:
        raw.worldId ||
        (difficulty === "Easy" ? "01" : difficulty === "Medium" ? "02" : "03"),
      worldName:
        raw.worldName ||
        (difficulty === "Easy"
          ? "Syntax Forest"
          : difficulty === "Medium"
            ? "Logic Caverns"
            : "Runtime Abyss"),
      threatClass:
        raw.threatClass ||
        (difficulty === "Easy" ? "CLASS I" : difficulty === "Medium" ? "CLASS II" : "CLASS III"),
      threatName: (raw.threatName || raw.creatureName || "GLITCH ANOMALY").toUpperCase(),
      bugType: raw.bugType || raw.bugCategory || "Syntax",
      description: raw.description || raw.missionDescription || "Corrupted code sequence detected.",
      fileName: raw.fileName || `${slug}${fileExt}`,
      brokenCode: raw.brokenCode,
      sampleSolution: raw.fixedCode || raw.sampleSolution,
      hints:
        Array.isArray(raw.hints) && raw.hints.length >= 3
          ? [raw.hints[0], raw.hints[1], raw.hints[2]]
          : [
              raw.hint1 || "Inspect the syntax.",
              raw.hint2 || "Check the modified token.",
              raw.hint3 || "Apply the fix."
            ],
      bugDnaCategory: raw.bugDnaCategory || "Syntax",
      xpReward:
        typeof raw.xpReward === "number"
          ? raw.xpReward
          : difficulty === "Easy"
            ? 150
            : difficulty === "Medium"
              ? 300
              : 550,
      explanation: raw.explanation || "Bug resolved successfully.",
      isAiGenerated: true,
      creatureName: raw.creatureName,
      missionDescription: raw.missionDescription,
      fixedCode: raw.fixedCode || raw.sampleSolution,
      bugLine: raw.bugLine,
      whatYouLearned: raw.whatYouLearned
    };
  }

  private waitForNextUnusedItem(
    configKey: string,
    timeoutMs: number,
    cancelCheck?: () => boolean
  ): Promise<PooledChallengeItem | null> {
    return new Promise((resolve) => {
      let timeoutId: number;

      const checkNow = () => {
        if (cancelCheck && cancelCheck()) {
          cleanup();
          resolve(null);
          return;
        }

        const pool = this.pools.get(configKey);
        const item = pool?.items.find((it) => it.status === "unused");
        if (item) {
          cleanup();
          resolve(item);
        }
      };

      const cleanup = () => {
        window.clearTimeout(timeoutId);
        this.listeners.delete(checkNow);
      };

      this.listeners.add(checkNow);

      timeoutId = window.setTimeout(() => {
        cleanup();
        const pool = this.pools.get(configKey);
        const item = pool?.items.find((it) => it.status === "unused") || null;
        resolve(item);
      }, timeoutMs);
    });
  }

  private notifyListeners(): void {
    this.listeners.forEach((listener) => {
      try {
        listener();
      } catch {
        // ignore
      }
    });
  }

  // =========================================================================
  // STORAGE PERSISTENCE
  // =========================================================================

  private persistPools(): void {
    try {
      const serializable: Record<string, PoolConfigState> = {};
      for (const [k, v] of this.pools.entries()) {
        serializable[k] = v;
      }
      sessionStorage.setItem(POOL_STORAGE_KEY, JSON.stringify(serializable));
    } catch {
      // ignore
    }
  }

  private hydrateFromStorage(): void {
    try {
      const rawSession = sessionStorage.getItem(SESSION_META_KEY);
      if (rawSession) {
        const parsed = JSON.parse(rawSession) as StoredSessionMeta;
        if (parsed.sessionId && parsed.userId) {
          this.activeSessionId = parsed.sessionId;
          this.activeUserId = parsed.userId;
        }
      }

      const rawPools = sessionStorage.getItem(POOL_STORAGE_KEY);
      if (rawPools) {
        const parsed = JSON.parse(rawPools) as Record<string, PoolConfigState>;
        for (const [k, v] of Object.entries(parsed)) {
          this.pools.set(k, v);
        }
      }
    } catch {
      // ignore
    }
  }

  private saveSessionMeta(meta: StoredSessionMeta): void {
    try {
      sessionStorage.setItem(SESSION_META_KEY, JSON.stringify(meta));
    } catch {
      // ignore
    }
  }

  private loadSessionMeta(): StoredSessionMeta | null {
    try {
      const raw = sessionStorage.getItem(SESSION_META_KEY);
      if (raw) {
        return JSON.parse(raw) as StoredSessionMeta;
      }
    } catch {
      // ignore
    }
    return null;
  }
}

export const challengePoolService = new ChallengePoolService();
