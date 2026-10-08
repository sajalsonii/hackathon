import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Radar,
  RotateCcw,
  Swords,
  Target
} from "lucide-react";
import GlitchCreature from "./GlitchCreature";
import { Challenge, CreatureState } from "../types/game";
import { DebugScannerService } from "../services/scannerService";

interface HuntProps {
  challenge: Challenge;
  onWin: (challengeId: string, timeTakenSeconds: number, pulsesUsed: number) => void;
}

export default function Hunt({ challenge, onWin }: HuntProps) {
  const [code, setCode] = useState(challenge.brokenCode);
  const [hintLevel, setHintLevel] = useState(0);
  const [wrong, setWrong] = useState(false);
  const [creatureState, setCreatureState] = useState<CreatureState>("detected");
  const [creatureHealth, setCreatureHealth] = useState(100);
  const [feedback, setFeedback] = useState<{
    type: "error" | "success" | "info" | null;
    message: string;
  }>({
    type: null,
    message: ""
  });
  const [seconds, setSeconds] = useState(0);

  // Reset challenge code and state whenever challenge changes
  useEffect(() => {
    setCode(challenge.brokenCode);
    setHintLevel(0);
    setWrong(false);
    setCreatureState("detected");
    setCreatureHealth(100);
    setFeedback({ type: null, message: "" });
    setSeconds(0);
  }, [challenge]);

  // Live timer
  useEffect(() => {
    const timer = setInterval(() => {
      setSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Tab") {
      e.preventDefault();
      const textarea = e.currentTarget;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const spaces = challenge.language === "Python" ? "    " : "  ";

      const newCode = code.substring(0, start) + spaces + code.substring(end);
      setCode(newCode);

      // Restore cursor position after state update
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + spaces.length;
      }, 0);
    }
  };

  const handleResetCode = () => {
    setCode(challenge.brokenCode);
    setFeedback({
      type: "info",
      message: "Restored initial corrupted code sequence."
    });
  };

  const scan = async () => {
    const nextLevel = Math.min(hintLevel + 1, 3);
    setHintLevel(nextLevel);
    await DebugScannerService.getScanClue(challenge, code, nextLevel);
  };

  const submit = () => {
    const result = challenge.validate(code);

    if (result.passed) {
      setCreatureHealth(0);
      setCreatureState("defeated");
      setFeedback({
        type: "success",
        message: result.message || "CRITICAL HIT! Anomaly eliminated. Threat neutralized."
      });
      setTimeout(() => {
        onWin(challenge.id, seconds, hintLevel);
      }, 750);
    } else {
      setWrong(true);
      setCreatureHealth((prev) => Math.max(30, prev - 15));
      setCreatureState("damaged");
      setFeedback({
        type: "error",
        message: result.message || "The glitch deflected your fix! Inspect the syntax or logic error."
      });

      setTimeout(() => {
        setWrong(false);
        setCreatureState("detected");
      }, 650);
    }
  };

  const lineCount = Math.max(14, code.split("\n").length + 2);

  return (
    <motion.main
      className="hunt-screen"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <section className="hunt-hud">
        <div>
          <span className="eyebrow">
            WORLD {challenge.worldId} // {challenge.worldName.toUpperCase()}
          </span>
          <h1>{challenge.title.toUpperCase()}</h1>
        </div>
        <div className="hud-stat">
          <Clock3 />
          <span>
            <small>TIME</small>
            <b>{formatTime(seconds)}</b>
          </span>
        </div>
        <div className="hud-stat">
          <Target />
          <span>
            <small>BOUNTY</small>
            <b>+{challenge.xpReward} XP</b>
          </span>
        </div>
        <div className="challenge-progress">
          <span>HUNT ACTIVE</span>
          <div>
            <i />
            <i className="active" />
            <i />
            <i />
            <i />
          </div>
        </div>
      </section>

      <div className="hunt-layout">
        <motion.section
          className={`editor-shell ${wrong ? "wrong" : ""}`}
          animate={wrong ? { x: [-5, 5, -3, 0] } : {}}
        >
          <div className="editor-top">
            <div className="window-dots">
              <i />
              <i />
              <i />
            </div>
            <span>{challenge.fileName}</span>
            <button
              className="reset-btn"
              onClick={handleResetCode}
              title="Reset code to initial state"
            >
              <RotateCcw /> Reset
            </button>
            <div className="editor-badges">
              <b>{challenge.language.toUpperCase()}</b>
              <b>{challenge.difficulty.toUpperCase()}</b>
            </div>
          </div>

          <div className="mission-brief">
            <Radar />
            <p>
              <b>MISSION:</b> {challenge.description}
            </p>
          </div>

          <div className={`editor-area ${hintLevel > 0 ? "scanning" : ""}`}>
            <div className="line-numbers">
              {Array.from({ length: lineCount }, (_, i) => (
                <span key={i}>{i + 1}</span>
              ))}
            </div>
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              onKeyDown={handleKeyDown}
              spellCheck={false}
              aria-label="Code editor"
            />
            {hintLevel > 0 && <div className="scan-line" />}
          </div>

          {/* Inline Active Hint strip (shows on mobile directly below code editor) */}
          {hintLevel > 0 && (
            <div className="mobile-active-hint">
              <div className="hint-strip-head">
                <Radar style={{ width: 14, color: "var(--cyan)" }} />
                <span>SCANNER PULSE 0{hintLevel}/03 // {challenge.bugType.toUpperCase()}</span>
              </div>
              <p>{challenge.hints[hintLevel - 1]}</p>
            </div>
          )}

          <div className="editor-footer">
            <span className="console-status">
              <i />
              {feedback.type === "error"
                ? "DEFECT DETECTED"
                : feedback.type === "success"
                  ? "SYSTEM STABILIZED"
                  : "CONSOLE READY"}
            </span>
            <div className="editor-actions">
              <button
                className="scanner-button"
                onClick={scan}
                disabled={hintLevel >= 3}
                type="button"
              >
                <Radar /> Debug scanner{" "}
                <small>{3 - hintLevel} left</small>
              </button>
              <button className="primary-button" onClick={submit} type="button">
                <Swords /> Submit fix
              </button>
            </div>
          </div>

          {/* Feedback output bar placed directly after the submit actions */}
          {feedback.type && (
            <div className={`console-output-bar ${feedback.type}`}>
              {feedback.type === "error" ? (
                <AlertTriangle />
              ) : feedback.type === "success" ? (
                <CheckCircle2 />
              ) : (
                <Radar />
              )}
              <span>{feedback.message}</span>
            </div>
          )}
        </motion.section>

        <aside className="hunt-sidebar">
          <section className="threat-card">
            <div className="card-head">
              <span className="eyebrow">ACTIVE THREAT</span>
              <span className="danger-dot">LIVE</span>
            </div>
            <GlitchCreature state={creatureState} small />
            <div className="health-label">
              <span>GLITCH INTEGRITY</span>
              <b>{creatureHealth}%</b>
            </div>
            <div className="health-track">
              <i style={{ width: `${creatureHealth}%` }} />
            </div>
            <p>
              <b>TYPE:</b> {challenge.bugType}
            </p>
          </section>

          <section className={`hint-panel ${hintLevel ? "open" : ""}`}>
            <div className="card-head">
              <span className="eyebrow">DEBUG SCANNER</span>
              <Radar />
            </div>
            {hintLevel === 0 ? (
              <div className="hint-empty">
                <Radar />
                <p>Scanner standing by.</p>
                <small>Deploy a pulse to reveal corrupted logic.</small>
              </div>
            ) : (
              <AnimatePresence mode="wait">
                <motion.div
                  key={hintLevel}
                  className="hint-content"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <span>PULSE 0{hintLevel} / 03</span>
                  <h3>
                    {hintLevel === 1
                      ? "LOCATION ISOLATED"
                      : hintLevel === 2
                        ? "CORRUPTED TOKEN"
                        : "ROOT CAUSE REPAIR"}
                  </h3>
                  <p>{challenge.hints[hintLevel - 1]}</p>
                  {hintLevel < 3 && (
                    <button
                      className="scanner-button"
                      style={{ marginTop: 12, minHeight: 38, fontSize: 11 }}
                      onClick={scan}
                      type="button"
                    >
                      <Radar /> Next pulse ({3 - hintLevel} left)
                    </button>
                  )}
                </motion.div>
              </AnimatePresence>
            )}
          </section>
        </aside>
      </div>
    </motion.main>
  );
}
