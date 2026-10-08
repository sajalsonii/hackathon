import { useState, useEffect, useRef } from "react";
import { AnimatePresence } from "framer-motion";
import { Screen, Challenge } from "./types/game";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { useGameState } from "./hooks/useGameState";
import { supabase } from "./lib/supabase";
import { challenges, getRandomChallenge, createAiChallengeValidator } from "./data/challenges";
import TopBar from "./components/TopBar";
import Landing from "./components/Landing";
import Setup from "./components/Setup";
import Hunt from "./components/Hunt";
import Success from "./components/Success";
import Leaderboard from "./components/Leaderboard";
import DailyChallenge from "./components/DailyChallenge";
import BugDNAScreen from "./components/BugDNAScreen";
import WorldProgression from "./components/WorldProgression";
import Login from "./components/Login";
import Signup from "./components/Signup";
import HuntLoadingOverlay from "./components/HuntLoadingOverlay";
import { challengePoolService } from "./services/challengePoolService";

const pathToScreenMap: Record<string, Screen> = {
  "/": "landing",
  "/login": "login",
  "/signup": "signup",
  "/dashboard": "dashboard",
  "/setup": "dashboard",
  "/bug-hunt": "hunt",
  "/hunt": "hunt",
  "/daily-challenge": "daily",
  "/daily": "daily",
  "/bug-dna": "bugdna",
  "/bugdna": "bugdna",
  "/world-map": "world",
  "/world": "world",
  "/achievements": "bugdna",
  "/leaderboard": "leaderboard"
};

const screenToPathMap: Record<Screen, string> = {
  landing: "/",
  login: "/login",
  signup: "/signup",
  dashboard: "/dashboard",
  setup: "/dashboard",
  hunt: "/bug-hunt",
  daily: "/daily-challenge",
  bugdna: "/bug-dna",
  world: "/world-map",
  leaderboard: "/leaderboard",
  success: "/bug-hunt"
};

const protectedScreens: Screen[] = [
  "dashboard",
  "setup",
  "hunt",
  "daily",
  "bugdna",
  "world"
];

// Anti-repetition helpers: Tracks up to 8 recent challenge titles to avoid duplication
const RECENT_TITLES_KEY = "code_slayer_recent_titles_v1";

function getRecentTitles(): string[] {
  try {
    const raw = sessionStorage.getItem(RECENT_TITLES_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed
          .filter((t) => typeof t === "string" && t.trim().length > 0)
          .slice(-8);
      }
    }
  } catch {
    // ignore storage issues
  }
  return [];
}

function saveRecentTitle(title: string) {
  if (!title || !title.trim()) return;
  try {
    const current = getRecentTitles();
    const cleanTitle = title.trim();
    const updated = [
      ...current.filter((t) => t.toLowerCase() !== cleanTitle.toLowerCase()),
      cleanTitle
    ].slice(-8);
    sessionStorage.setItem(RECENT_TITLES_KEY, JSON.stringify(updated));
  } catch {
    // ignore storage issues
  }
}

// Session cycling helpers for local challenge fallback
const PLAYED_LOCAL_IDS_KEY = "code_slayer_played_local_ids_v1";

function getPlayedLocalIds(): string[] {
  try {
    const raw = sessionStorage.getItem(PLAYED_LOCAL_IDS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.filter((id) => typeof id === "string");
      }
    }
  } catch {
    // ignore storage issues
  }
  return [];
}

function recordPlayedLocalId(id: string, language: string, difficulty: string) {
  try {
    const current = getPlayedLocalIds();
    const matching = challenges.filter(
      (c) => c.language === language && c.difficulty === difficulty
    );
    const matchingIds = matching.map((c) => c.id);

    const matchingPlayed = current.filter((pid) => matchingIds.includes(pid));
    let nextPlayed: string[];

    // If all matching local challenges have been played, cycle (reset category to just this new id)
    if (matchingPlayed.length >= matchingIds.length - 1) {
      nextPlayed = [...current.filter((pid) => !matchingIds.includes(pid)), id];
    } else {
      nextPlayed = [...current.filter((pid) => pid !== id), id];
    }

    sessionStorage.setItem(PLAYED_LOCAL_IDS_KEY, JSON.stringify(nextPlayed));
  } catch {
    // ignore storage issues
  }
}

function AppContent() {
  const { user, profile, gameProgress, logout, updateProfile, isLoading } = useAuth();

  const [screen, setScreenState] = useState<Screen>(() => {
    const path = window.location.pathname;
    return pathToScreenMap[path] || "landing";
  });

  const [authNotice, setAuthNotice] = useState<string | null>(null);
  const [redirectAfterAuth, setRedirectAfterAuth] = useState<Screen>("dashboard");

  const {
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
    clearGameState
  } = useGameState(user, gameProgress, updateProfile);

  const [isLoadingHunt, setIsLoadingHunt] = useState(false);
  const lastAiTitleRef = useRef<string | null>(null);
  const lastPlayedIdRef = useRef<string | null>(null);
  const cancelGenerationRef = useRef(false);
  const isSelectingRef = useRef(false);

  // Initialize AI challenge pool on user login or language/difficulty changes
  useEffect(() => {
    if (user?.id) {
      challengePoolService.initSession(user.id, selectedLanguage, selectedDifficulty);
    }
  }, [user?.id]);

  useEffect(() => {
    if (user?.id) {
      challengePoolService.ensurePool(selectedLanguage, selectedDifficulty);
    }
  }, [selectedLanguage, selectedDifficulty, user?.id]);

  // Authoritative route protection & redirect sync effect
  useEffect(() => {
    if (isLoading) return;

    // Rule 1: Authenticated user must NEVER see login or signup page
    if (user && (screen === "login" || screen === "signup")) {
      setAuthNotice(null);
      const destination =
        redirectAfterAuth && redirectAfterAuth !== "login" && redirectAfterAuth !== "signup"
          ? redirectAfterAuth
          : "dashboard";
      setScreenState(destination);
      const targetPath = screenToPathMap[destination] || "/dashboard";
      if (window.location.pathname !== targetPath) {
        window.history.replaceState(null, "", targetPath);
      }
      return;
    }

    // Rule 2: Unauthenticated user on a protected page must be redirected to login
    if (!user && protectedScreens.includes(screen)) {
      setAuthNotice("AUTHENTICATION REQUIRED // Please login or register to access this mission sector.");
      setRedirectAfterAuth(screen);
      setScreenState("login");
      if (window.location.pathname !== "/login") {
        window.history.replaceState(null, "", "/login");
      }
    }
  }, [user, isLoading, screen, redirectAfterAuth]);

  // Sync state navigation with browser URL
  const setScreen = (newScreen: Screen, notice: string | null = null) => {
    // If target is protected and user is not logged in:
    if (protectedScreens.includes(newScreen) && !user) {
      setAuthNotice(
        notice || "AUTHENTICATION REQUIRED // Please login or register to access this mission sector."
      );
      setRedirectAfterAuth(newScreen);
      setScreenState("login");
      if (window.location.pathname !== "/login") {
        window.history.pushState(null, "", "/login");
      }
      return;
    }

    // If user is authenticated and clicks login/signup:
    if (user && (newScreen === "login" || newScreen === "signup")) {
      setAuthNotice(null);
      setScreenState("dashboard");
      if (window.location.pathname !== "/dashboard") {
        window.history.pushState(null, "", "/dashboard");
      }
      return;
    }

    setAuthNotice(null);
    setScreenState(newScreen);
    const targetPath = screenToPathMap[newScreen] || "/";
    if (window.location.pathname !== targetPath) {
      window.history.pushState(null, "", targetPath);
    }
  };

  // Listen to browser Back/Forward buttons
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      const targetScreen = pathToScreenMap[path] || "landing";
      if (protectedScreens.includes(targetScreen) && !user) {
        setAuthNotice("AUTHENTICATION REQUIRED // Please login to continue.");
        setRedirectAfterAuth(targetScreen);
        setScreenState("login");
      } else if (user && (targetScreen === "login" || targetScreen === "signup")) {
        setScreenState("dashboard");
      } else {
        setScreenState(targetScreen);
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [user]);

  const handleStartFromSetup = async () => {
    // Edge Case: If user is not logged in, maintain local behavior with session cycling
    if (!user) {
      const playedIds = getPlayedLocalIds();
      const guestChallenge = getRandomChallenge(
        selectedLanguage,
        selectedDifficulty,
        playedIds
      );
      recordPlayedLocalId(guestChallenge.id, selectedLanguage, selectedDifficulty);
      if (guestChallenge.title) {
        saveRecentTitle(guestChallenge.title);
      }
      lastPlayedIdRef.current = guestChallenge.id;
      startSpecificChallenge(guestChallenge.id);
      setScreen("hunt");
      return;
    }

    // Prevent duplicate selection on rapid clicks
    if (isSelectingRef.current) return;
    isSelectingRef.current = true;

    // Check if challenge is already pre-generated in the pool:
    const isInstantReady = challengePoolService.hasUnused(selectedLanguage, selectedDifficulty);
    if (!isInstantReady) {
      setIsLoadingHunt(true);
    }
    cancelGenerationRef.current = false;

    try {
      // Retrieve next unused challenge from the 5-problem pre-generated pool
      const challenge = await challengePoolService.getNextChallenge(
        selectedLanguage,
        selectedDifficulty,
        () => cancelGenerationRef.current
      );

      if (cancelGenerationRef.current) {
        setIsLoadingHunt(false);
        isSelectingRef.current = false;
        return;
      }

      if (challenge.title) {
        lastAiTitleRef.current = challenge.title;
        saveRecentTitle(challenge.title);
      }

      lastPlayedIdRef.current = challenge.id;
      startCustomChallenge(challenge);
      setIsLoadingHunt(false);
      setScreen("hunt");
    } catch (err) {
      console.warn("AI challenge selection failed, falling back to local challenge:", err);
      if (cancelGenerationRef.current) {
        setIsLoadingHunt(false);
        isSelectingRef.current = false;
        return;
      }

      const playedIds = getPlayedLocalIds();
      const fallback = getRandomChallenge(
        selectedLanguage,
        selectedDifficulty,
        playedIds
      );
      recordPlayedLocalId(fallback.id, selectedLanguage, selectedDifficulty);
      if (fallback.title) {
        saveRecentTitle(fallback.title);
      }
      lastPlayedIdRef.current = fallback.id;
      startSpecificChallenge(fallback.id);
      setIsLoadingHunt(false);
      setScreen("hunt");
    } finally {
      isSelectingRef.current = false;
    }
  };

  const handleCancelLoading = () => {
    cancelGenerationRef.current = true;
    isSelectingRef.current = false;
    setIsLoadingHunt(false);
  };

  const handleStartDaily = () => {
    startSpecificChallenge("daily-infinite-loop");
    setScreen("hunt");
  };

  const handleStartWorldHunt = (worldLevel?: string) => {
    if (worldLevel === "01") {
      startConfiguredHunt(selectedLanguage, "Easy");
    } else {
      startConfiguredHunt(selectedLanguage, "Medium");
    }
    setScreen("hunt");
  };

  const handleWin = (
    challengeId: string,
    timeSpentSeconds: number,
    pulsesUsed: number,
    attempts?: number
  ) => {
    challengePoolService.markChallengeSolved(challengeId);
    recordVictory(challengeId, timeSpentSeconds, pulsesUsed, attempts || 1);
    setScreenState("success");
  };

  const handleNextAfterWin = () => {
    handleStartFromSetup();
  };

  const handleAuthSuccess = () => {
    setAuthNotice(null);
    const target =
      redirectAfterAuth && redirectAfterAuth !== "login" && redirectAfterAuth !== "signup"
        ? redirectAfterAuth
        : "dashboard";
    setRedirectAfterAuth("dashboard");
    setScreenState(target);
    const targetPath = screenToPathMap[target] || "/dashboard";
    if (window.location.pathname !== targetPath) {
      window.history.pushState(null, "", targetPath);
    }
  };

  const handleLogout = async () => {
    await logout();
    challengePoolService.clearSession();
    clearGameState();
    setAuthNotice(null);
    setRedirectAfterAuth("dashboard");
    setScreenState("login");
    window.history.pushState(null, "", "/login");
  };

  if (isLoading) {
    return (
      <div
        className="app-shell"
        style={{
          display: "grid",
          placeItems: "center",
          height: "100vh"
        }}
      >
        <div style={{ textAlign: "center" }}>
          <span className="eyebrow">CODE SLAYER CORE</span>
          <h2 style={{ fontSize: 24, margin: "12px 0 6px" }}>INITIALIZING TERMINAL...</h2>
          <p style={{ color: "var(--muted)", font: "11px var(--code)" }}>Connecting to Supabase Neural Net</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <TopBar
        screen={screen}
        goTo={(target) => setScreen(target)}
        rankInfo={rankInfo}
        user={user}
        profile={profile}
        onLogout={handleLogout}
      />

      <AnimatePresence mode="wait">
        {screen === "landing" && (
          <Landing
            key="landing"
            start={() => setScreen("dashboard")}
            daily={() => setScreen("daily")}
            bugDna={() => setScreen("bugdna")}
            world={() => setScreen("world")}
            rankInfo={rankInfo}
            stats={stats}
          />
        )}

        {screen === "login" && (
          <Login
            key="login"
            onSuccess={handleAuthSuccess}
            goToSignup={() => setScreen("signup")}
            goHome={() => setScreen("landing")}
            authNotice={authNotice}
          />
        )}

        {screen === "signup" && (
          <Signup
            key="signup"
            onSuccess={handleAuthSuccess}
            goToLogin={() =>
              setScreen(
                "login",
                "Account initialized! If your Supabase requires email verification, check your inbox; otherwise, enter your credentials below."
              )
            }
            goHome={() => setScreen("landing")}
          />
        )}

        {(screen === "dashboard" || screen === "setup") && (
          <Setup
            key="setup"
            language={selectedLanguage}
            setLanguage={setSelectedLanguage}
            difficulty={selectedDifficulty}
            setDifficulty={setSelectedDifficulty}
            start={handleStartFromSetup}
            rankInfo={rankInfo}
            stats={stats}
            isLoading={isLoadingHunt}
          />
        )}

        {screen === "hunt" && (
          <Hunt
            key={activeChallenge.id}
            challenge={activeChallenge}
            onWin={handleWin}
          />
        )}

        {screen === "success" && (
          <Success
            key="success"
            victory={lastVictory}
            rankInfo={rankInfo}
            stats={stats}
            next={handleNextAfterWin}
          />
        )}

        {screen === "leaderboard" && (
          <Leaderboard
            key="leaderboard"
            rankInfo={rankInfo}
            stats={stats}
          />
        )}

        {screen === "daily" && (
          <DailyChallenge
            key="daily"
            startDaily={handleStartDaily}
          />
        )}

        {screen === "bugdna" && (
          <BugDNAScreen
            key="bugdna"
            stats={stats}
            rankInfo={rankInfo}
          />
        )}

        {screen === "world" && (
          <WorldProgression
            key="world"
            startWorldHunt={handleStartWorldHunt}
          />
        )}
      </AnimatePresence>

      <HuntLoadingOverlay
        isOpen={isLoadingHunt}
        language={selectedLanguage}
        difficulty={selectedDifficulty}
        onCancel={handleCancelLoading}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
