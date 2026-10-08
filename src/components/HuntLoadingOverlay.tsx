import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Radar, Terminal, X } from "lucide-react";
import { Language, Difficulty } from "../types/game";

interface HuntLoadingOverlayProps {
  isOpen: boolean;
  language: Language;
  difficulty: Difficulty;
  onCancel?: () => void;
}

const LOADING_MESSAGES = [
  "SCANNING CORRUPTED SECTORS...",
  "A GLITCH CREATURE HAS BEEN DETECTED...",
  "COMPILING THE BUG..."
];

export default function HuntLoadingOverlay({
  isOpen,
  language,
  difficulty,
  onCancel
}: HuntLoadingOverlayProps) {
  const [messageIndex, setMessageIndex] = useState(0);

  // Rotate messages every ~1.2s
  useEffect(() => {
    if (!isOpen) {
      setMessageIndex(0);
      return;
    }

    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
    }, 1200);

    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="hunt-loading-overlay" role="dialog" aria-modal="true" aria-label="Loading Challenge">
      <motion.div
        className="loading-terminal-box"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2 }}
      >
        <div className="loading-terminal-header">
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Terminal style={{ width: 14, color: "var(--acid)" }} />
            <span>MISSION CONTROL // QUANTUM SCANNER</span>
          </div>
          {onCancel && (
            <button
              onClick={onCancel}
              className="loading-close-btn"
              title="Cancel and load standard local challenge"
              aria-label="Cancel"
            >
              <X style={{ width: 14 }} />
            </button>
          )}
        </div>

        <div className="loading-terminal-content">
          <div className="loading-radar-ring">
            <Radar style={{ width: 30 }} />
          </div>

          <div className="loading-message-text" aria-live="polite">
            {LOADING_MESSAGES[messageIndex]}
          </div>

          <div className="loading-progress-track">
            <div className="loading-progress-bar" />
          </div>

          <div className="loading-meta-info">
            <span>
              TARGET: <b>{language.toUpperCase()}</b>
            </span>
            <span>//</span>
            <span>
              THREAT: <b>{difficulty.toUpperCase()}</b>
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
