import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { AlertCircle, ArrowRight, Eye, EyeOff, Swords, User } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { Logo } from "./TopBar";

interface SignupProps {
  onSuccess: () => void;
  goToLogin: () => void;
  goHome: () => void;
}

export default function Signup({ onSuccess, goToLogin, goHome }: SignupProps) {
  const { user, signup } = useAuth();
  const [slayerName, setSlayerName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // If already authenticated, redirect immediately
  useEffect(() => {
    if (user) {
      onSuccess();
    }
  }, [user, onSuccess]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedName = slayerName.trim();
    const trimmedEmail = email.trim();

    if (!trimmedName) {
      setError("Please choose your Slayer callsign/username.");
      return;
    }

    if (!trimmedEmail) {
      setError("Please enter a valid email address.");
      return;
    }

    if (password.length < 6) {
      setError("Access cipher must contain at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Ciphers do not match. Please verify confirmation password.");
      return;
    }

    setLoading(true);
    const { error, session } = await signup(trimmedEmail, password, trimmedName);
    setLoading(false);

    if (error) {
      if (error.message.includes("User already registered") || error.message.includes("already exists")) {
        setError("This Slayer email is already registered. Try logging in instead.");
      } else if (error.message.includes("Password should be")) {
        setError("Access cipher is too weak. Use at least 6 characters.");
      } else {
        setError(error.message);
      }
      return;
    }

    // If an active session is returned, go straight to Dashboard!
    // If Supabase has email confirmation enabled, inform user and go to login.
    if (session) {
      onSuccess();
    } else {
      goToLogin();
    }
  };

  return (
    <motion.main
      className="auth-page"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
    >
      <div className="auth-card">
        <button
          className="logo-button"
          onClick={goHome}
          style={{ cursor: "pointer", display: "block" }}
        >
          <Logo />
        </button>

        <div className="auth-heading">
          <span className="eyebrow">RECRUITMENT PROTOCOL</span>
          <h1>BECOME A CODE SLAYER</h1>
          <p>Register your terminal identity and enter the Digital Debugger World.</p>
        </div>

        {error && (
          <div className="auth-error" style={{ marginBottom: 16 }}>
            <AlertCircle style={{ width: 16, flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-field">
            <label htmlFor="slayerName">SLAYER NAME / CALLSIGN</label>
            <div className="input-wrap">
              <input
                id="slayerName"
                type="text"
                placeholder="CyberKnight_01"
                value={slayerName}
                onChange={(e) => setSlayerName(e.target.value)}
                autoComplete="nickname"
                required
              />
              <User style={{ position: "absolute", right: 12, width: 15, color: "var(--muted)", pointerEvents: "none" }} />
            </div>
          </div>

          <div className="form-field">
            <label htmlFor="signupEmail">SLAYER EMAIL</label>
            <div className="input-wrap">
              <input
                id="signupEmail"
                type="email"
                placeholder="hunter@codeslayer.io"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>
          </div>

          <div className="form-field">
            <label htmlFor="signupPassword">CREATE CIPHER / PASSWORD</label>
            <div className="input-wrap">
              <input
                id="signupPassword"
                type={showPassword ? "text" : "password"}
                placeholder="Minimum 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                required
              />
              <button
                type="button"
                className="input-icon-btn"
                onClick={() => setShowPassword(!showPassword)}
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff style={{ width: 15 }} /> : <Eye style={{ width: 15 }} />}
              </button>
            </div>
          </div>

          <div className="form-field">
            <label htmlFor="confirmPassword">CONFIRM CIPHER</label>
            <div className="input-wrap">
              <input
                id="confirmPassword"
                type={showPassword ? "text" : "password"}
                placeholder="Repeat your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="primary-button full"
            disabled={loading}
            style={{ marginTop: 8 }}
          >
            {loading ? (
              <span>INITIALIZING SLAYER PROFILE...</span>
            ) : (
              <>
                <Swords style={{ width: 15 }} /> CREATE ACCOUNT <ArrowRight style={{ width: 15 }} />
              </>
            )}
          </button>

          <div className="auth-divider" />

          <div className="auth-links" style={{ justifyContent: "center" }}>
            <span style={{ color: "var(--muted)" }}>
              Already have an account?{" "}
              <button
                type="button"
                className="auth-link"
                onClick={goToLogin}
                style={{ fontWeight: 700 }}
              >
                <b>Login</b>
              </button>
            </span>
          </div>
        </form>
      </div>
    </motion.main>
  );
}
