import { useState, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import { Screen } from "./types/game";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { useGameState } from "./hooks/useGameState";
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

function AppContent() {
  const { user, profile, logout, updateProfile, isLoading } = useAuth();

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
    recordVictory,
    lastVictory
  } = useGameState(profile, updateProfile);

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

  const handleStartFromSetup = () => {
    startConfiguredHunt(selectedLanguage, selectedDifficulty);
    setScreen("hunt");
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

  const handleWin = (challengeId: string, timeSpentSeconds: number, pulsesUsed: number) => {
    recordVictory(challengeId, timeSpentSeconds, pulsesUsed);
    setScreenState("success");
  };

  const handleNextAfterWin = () => {
    setScreen("dashboard");
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
