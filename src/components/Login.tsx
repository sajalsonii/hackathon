import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { AlertCircle, ArrowRight, CheckCircle2, Eye, EyeOff, Lock, Mail, ShieldAlert } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { Logo } from "./TopBar";

interface LoginProps {
  onSuccess: () => void;
  goToSignup: () => void;
  goHome: () => void;
  authNotice?: string | null;
}

export default function Login({ onSuccess, goToSignup, goHome, authNotice }: LoginProps) {
  const { user, login, resetPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetSuccess, setResetSuccess] = useState<string | null>(null);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);

  // If already authenticated, redirect immediately
  useEffect(() => {
    if (user) {
      onSuccess();
    }
  }, [user, onSuccess]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResetSuccess(null);

    if (!email.trim() || !password) {
      setError("Please provide both email and password.");
      return;
    }

    setLoading(true);
    const { error } = await login(email, password);
    setLoading(false);

    if (error) {
      if (error.message.includes("Invalid login credentials")) {
        setError("Invalid Slayer credentials. Check your email and password.");
      } else if (error.message.includes("Email not confirmed")) {
        setError("Email not verified yet. Please check your inbox or spam folder.");
      } else {
        setError(error.message);
      }
      return;
    }

    onSuccess();
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim()) {
      setError("Please enter your registered email address.");
      return;
    }
    setForgotLoading(true);
    const { error } = await resetPassword(forgotEmail);
    setForgotLoading(false);

    if (error) {
      setError(error.message);
    } else {
      setResetSuccess("Recovery pulse sent. Check your email for password reset instructions.");
      setShowForgotModal(false);
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
          <span className="eyebrow">AUTHENTICATION GATEWAY</span>
          <h1>WELCOME BACK, SLAYER</h1>
          <p>Verify your credentials to synchronize with the debugger network.</p>
        </div>

        {authNotice && (
          <div className="auth-error" style={{ marginBottom: 16 }}>
            <ShieldAlert style={{ width: 16, flexShrink: 0 }} />
            <span>{authNotice}</span>
          </div>
        )}

        {error && (
          <div className="auth-error" style={{ marginBottom: 16 }}>
            <AlertCircle style={{ width: 16, flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {resetSuccess && (
          <div className="auth-success" style={{ marginBottom: 16 }}>
            <CheckCircle2 style={{ width: 16, flexShrink: 0 }} />
            <span>{resetSuccess}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-field">
            <label htmlFor="email">SLAYER EMAIL</label>
            <div className="input-wrap">
              <input
                id="email"
                type="email"
                placeholder="hunter@codeslayer.io"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
              <Mail style={{ position: "absolute", right: 12, width: 15, color: "var(--muted)", pointerEvents: "none" }} />
            </div>
          </div>

          <div className="form-field">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <label htmlFor="password">ACCESS CIPHER / PASSWORD</label>
              <button
                type="button"
                className="auth-link"
                style={{ fontSize: "0.75rem" }}
                onClick={() => {
                  setForgotEmail(email);
                  setShowForgotModal(true);
                }}
              >
                Forgot password?
              </button>
            </div>
            <div className="input-wrap">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
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

          <button
            type="submit"
            className="primary-button full"
            disabled={loading}
            style={{ marginTop: 8 }}
          >
            {loading ? (
              <span>VERIFYING CIPHER...</span>
            ) : (
              <>
                <Lock style={{ width: 15 }} /> LOGIN <ArrowRight style={{ width: 15 }} />
              </>
            )}
          </button>

          <div className="auth-divider" />

          <div className="auth-links" style={{ justifyContent: "center" }}>
            <span style={{ color: "var(--muted)" }}>
              Don&apos;t have an account?{" "}
              <button
                type="button"
                className="auth-link"
                onClick={goToSignup}
                style={{ fontWeight: 700 }}
              >
                <b>Sign Up</b>
              </button>
            </span>
          </div>
        </form>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(5, 6, 10, 0.85)",
            backdropFilter: "blur(8px)",
            display: "grid",
            placeItems: "center",
            zIndex: 100,
            padding: 20
          }}
          onClick={() => setShowForgotModal(false)}
        >
          <div
            className="auth-card"
            style={{ maxWidth: 400 }}
            onClick={(e) => e.stopPropagation()}
          >
            <span className="eyebrow">RECOVERY PROTOCOL</span>
            <h2 style={{ fontSize: 20, margin: "6px 0 8px" }}>RESET YOUR PASSWORD</h2>
            <p style={{ color: "var(--muted)", fontSize: 12, marginBottom: 18 }}>
              Enter your registered email address to receive a secure recovery pulse.
            </p>
            <form onSubmit={handleForgotPassword} className="auth-form">
              <div className="form-field">
                <label>SLAYER EMAIL</label>
                <div className="input-wrap">
                  <input
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="hunter@codeslayer.io"
                    required
                  />
                </div>
              </div>
              <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
                <button
                  type="button"
                  className="secondary-button"
                  style={{ flex: 1 }}
                  onClick={() => setShowForgotModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="primary-button"
                  style={{ flex: 1 }}
                  disabled={forgotLoading}
                >
                  {forgotLoading ? "Transmitting..." : "Send Reset"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </motion.main>
  );
}
