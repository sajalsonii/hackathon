import { useState } from "react";
import { Code2, LogIn, LogOut, Menu, ShieldCheck, UserPlus, X } from "lucide-react";
import { User } from "@supabase/supabase-js";
import { Screen, PlayerProfile } from "../types/game";
import { RankInfo } from "../hooks/useGameState";

interface TopBarProps {
  screen: Screen;
  goTo: (screen: Screen) => void;
  rankInfo: RankInfo;
  user: User | null;
  profile: PlayerProfile | null;
  onLogout: () => void;
}

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <div className="logo" aria-label="Code Slayer">
      <span className="logo-mark">
        <Code2 />
      </span>
      {!compact && (
        <span>
          CODE <b>SLAYER</b>
        </span>
      )}
    </div>
  );
}

export default function TopBar({
  screen,
  goTo,
  rankInfo,
  user,
  profile,
  onLogout
}: TopBarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const displayName = profile?.slayer_name || user?.user_metadata?.slayer_name || user?.email?.split("@")[0] || "Slayer";

  const handleNav = (target: Screen) => {
    setMobileMenuOpen(false);
    goTo(target);
  };

  return (
    <header className="topbar">
      <button className="logo-button" onClick={() => handleNav("landing")} aria-label="Go home">
        <Logo />
      </button>

      {/* Desktop Navigation */}
      <nav className="desktop-nav" aria-label="Primary navigation">
        <button
          className={screen === "landing" ? "active" : ""}
          onClick={() => handleNav("landing")}
        >
          Home
        </button>
        <button
          className={screen === "dashboard" || screen === "setup" ? "active" : ""}
          onClick={() => handleNav(user ? "dashboard" : "login")}
        >
          Dashboard
        </button>
        <button
          className={screen === "world" ? "active" : ""}
          onClick={() => handleNav("world")}
        >
          World map
        </button>
        <button
          className={screen === "leaderboard" ? "active" : ""}
          onClick={() => handleNav("leaderboard")}
        >
          Leaderboard
        </button>
      </nav>

      {/* Desktop & Mobile Actions Bar */}
      <div className="topbar-actions">
        {user ? (
          <div className="topbar-user-group">
            <div className="player-chip">
              <span className="rank-icon">
                <ShieldCheck />
              </span>
              <span>
                <small>{displayName.toUpperCase()}</small>
                <b>{rankInfo.rank.toUpperCase()}</b>
              </span>
              <span className="level">{rankInfo.levelDisplay}</span>
            </div>

            <button
              className="auth-nav-btn logout-btn desktop-logout"
              onClick={onLogout}
              title="Log out active session"
            >
              <LogOut style={{ width: 14 }} />
              <span>LOGOUT</span>
            </button>
          </div>
        ) : (
          <div className="auth-btn-group">
            <button
              className={`auth-nav-btn ${screen === "login" ? "active" : ""}`}
              onClick={() => handleNav("login")}
            >
              <LogIn style={{ width: 14 }} />
              <span>LOGIN</span>
            </button>
            <button
              className={`auth-nav-btn primary ${screen === "signup" ? "active" : ""}`}
              onClick={() => handleNav("signup")}
            >
              <UserPlus style={{ width: 14 }} />
              <span>SIGN UP</span>
            </button>
          </div>
        )}

        {/* Mobile Hamburger Button */}
        <button
          className="mobile-menu-toggle"
          onClick={() => setMobileMenuOpen((prev) => !prev)}
          aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileMenuOpen}
        >
          {mobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Mobile Menu Dropdown Drawer */}
      {mobileMenuOpen && (
        <div className="mobile-nav-drawer" role="dialog" aria-modal="true">
          <nav className="mobile-nav-links">
            <button
              className={screen === "landing" ? "active" : ""}
              onClick={() => handleNav("landing")}
            >
              Home
            </button>
            <button
              className={screen === "dashboard" || screen === "setup" ? "active" : ""}
              onClick={() => handleNav(user ? "dashboard" : "login")}
            >
              Dashboard
            </button>
            <button
              className={screen === "world" ? "active" : ""}
              onClick={() => handleNav("world")}
            >
              World map
            </button>
            <button
              className={screen === "leaderboard" ? "active" : ""}
              onClick={() => handleNav("leaderboard")}
            >
              Leaderboard
            </button>
          </nav>

          {user && (
            <div className="mobile-drawer-footer">
              <button
                className="auth-nav-btn logout-btn mobile-logout"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onLogout();
                }}
              >
                <LogOut style={{ width: 14 }} />
                <span>LOGOUT</span>
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
