import { useState, useEffect } from "react";

export default function HeroCodeCard() {
  // State machine for loop: 
  // 0: broken (hold ~2.2s)
  // 1: glitching (transition 350ms)
  // 2: fixed (hold ~2.5s)
  // 3: reset glitch (transition 350ms)
  const [phase, setPhase] = useState<"broken" | "glitch-fix" | "fixed" | "glitch-reset">("broken");

  useEffect(() => {
    let timer: NodeJS.Timeout;

    if (phase === "broken") {
      timer = setTimeout(() => {
        setPhase("glitch-fix");
      }, 2400);
    } else if (phase === "glitch-fix") {
      timer = setTimeout(() => {
        setPhase("fixed");
      }, 350);
    } else if (phase === "fixed") {
      timer = setTimeout(() => {
        setPhase("glitch-reset");
      }, 2600);
    } else if (phase === "glitch-reset") {
      timer = setTimeout(() => {
        setPhase("broken");
      }, 350);
    }

    return () => clearTimeout(timer);
  }, [phase]);

  const isFixed = phase === "fixed" || phase === "glitch-reset";
  const isGlitching = phase === "glitch-fix" || phase === "glitch-reset";

  return (
    <div 
      className={`hero-code-card ${phase} ${isGlitching ? "is-glitching" : ""}`}
      aria-label="Code inspection card showing live bug fix demo"
    >
      <div className="card-header">
        <div className="card-status-dot" />
        <span className="card-title">
          {isFixed ? "STATUS // FIX APPLIED" : "STATUS // SYNTAX ERROR DETECTED"}
        </span>
        <span className="card-lang">PYTHON</span>
      </div>

      <div className="card-code-area">
        <div className="code-line">
          <span className="line-num">1</span>
          <span className="code-content">
            <span className="kw">def</span> <span className="fn">greet</span>(name)
            {isFixed ? (
              <span className="token-fixed">:</span>
            ) : (
              <span className="token-broken">
                <span className="error-marker">?</span>
              </span>
            )}
          </span>
        </div>
        <div className="code-line">
          <span className="line-num">2</span>
          <span className="code-content indent">
            <span className="kw">return</span> <span className="str">f"Slay on, &#123;name&#125;!"</span>
          </span>
        </div>
      </div>

      <div className="card-footer">
        {isFixed ? (
          <div className="diff-badge fixed">
            <span className="diff-icon">+</span>
            <span>SYNTAX CORRECTED (COLON INSERTED)</span>
          </div>
        ) : (
          <div className="diff-badge broken">
            <span className="diff-icon">!</span>
            <span>MISSING ':' AFTER FUNCTION DECLARATION</span>
          </div>
        )}
      </div>

      {/* Visual Glitch artifact overlay during shift */}
      {isGlitching && <div className="glitch-slice-overlay" />}
    </div>
  );
}
