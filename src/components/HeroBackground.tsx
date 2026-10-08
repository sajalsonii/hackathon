import React from "react";

interface Particle {
  id: number;
  left: number;
  top: number;
  size: number;
  colorVar: string;
  duration: number;
  delay: number;
  isMobileHidden: boolean;
}

const particles: Particle[] = [
  { id: 1, left: 4, top: 20, size: 3, colorVar: "var(--acid)", duration: 16, delay: -3, isMobileHidden: false },
  { id: 2, left: 10, top: 68, size: 3.5, colorVar: "var(--cyan)", duration: 21, delay: -11, isMobileHidden: true },
  { id: 3, left: 17, top: 38, size: 2.5, colorVar: "var(--acid)", duration: 18, delay: -7, isMobileHidden: false },
  { id: 4, left: 23, top: 85, size: 4, colorVar: "var(--warning)", duration: 24, delay: -15, isMobileHidden: true },
  { id: 5, left: 28, top: 14, size: 2.5, colorVar: "var(--cyan)", duration: 15, delay: -4, isMobileHidden: false },
  { id: 6, left: 33, top: 54, size: 3, colorVar: "var(--acid)", duration: 19, delay: -9, isMobileHidden: true },
  { id: 7, left: 38, top: 76, size: 3.5, colorVar: "var(--cyan)", duration: 22, delay: -13, isMobileHidden: false },
  { id: 8, left: 44, top: 26, size: 2.5, colorVar: "var(--acid)", duration: 17, delay: -6, isMobileHidden: true },
  { id: 9, left: 50, top: 64, size: 3.5, colorVar: "var(--danger)", duration: 20, delay: -12, isMobileHidden: false },
  { id: 10, left: 55, top: 16, size: 3, colorVar: "var(--cyan)", duration: 16, delay: -2, isMobileHidden: true },
  { id: 11, left: 61, top: 48, size: 4, colorVar: "var(--acid)", duration: 23, delay: -17, isMobileHidden: false },
  { id: 12, left: 66, top: 82, size: 2.5, colorVar: "var(--cyan)", duration: 18, delay: -8, isMobileHidden: true },
  { id: 13, left: 72, top: 24, size: 3, colorVar: "var(--warning)", duration: 21, delay: -14, isMobileHidden: false },
  { id: 14, left: 77, top: 58, size: 3.5, colorVar: "var(--acid)", duration: 19, delay: -5, isMobileHidden: true },
  { id: 15, left: 83, top: 12, size: 2.5, colorVar: "var(--cyan)", duration: 15, delay: -10, isMobileHidden: false },
  { id: 16, left: 88, top: 70, size: 3.5, colorVar: "var(--acid)", duration: 22, delay: -16, isMobileHidden: true },
  { id: 17, left: 94, top: 34, size: 3, colorVar: "var(--danger)", duration: 17, delay: -7, isMobileHidden: false },
  { id: 18, left: 7, top: 44, size: 2.5, colorVar: "var(--cyan)", duration: 20, delay: -13, isMobileHidden: true },
  { id: 19, left: 14, top: 12, size: 3.5, colorVar: "var(--acid)", duration: 16, delay: -4, isMobileHidden: false },
  { id: 20, left: 20, top: 56, size: 3, colorVar: "var(--warning)", duration: 24, delay: -18, isMobileHidden: true },
  { id: 21, left: 26, top: 92, size: 2.5, colorVar: "var(--cyan)", duration: 18, delay: -8, isMobileHidden: false },
  { id: 22, left: 31, top: 32, size: 3.5, colorVar: "var(--acid)", duration: 21, delay: -12, isMobileHidden: true },
  { id: 23, left: 41, top: 6, size: 3, colorVar: "var(--cyan)", duration: 15, delay: -3, isMobileHidden: false },
  { id: 24, left: 47, top: 42, size: 4, colorVar: "var(--acid)", duration: 22, delay: -14, isMobileHidden: true },
  { id: 25, left: 53, top: 90, size: 2.5, colorVar: "var(--warning)", duration: 19, delay: -9, isMobileHidden: false },
  { id: 26, left: 58, top: 30, size: 3, colorVar: "var(--cyan)", duration: 17, delay: -6, isMobileHidden: true },
  { id: 27, left: 64, top: 72, size: 3.5, colorVar: "var(--acid)", duration: 23, delay: -16, isMobileHidden: false },
  { id: 28, left: 70, top: 14, size: 2.5, colorVar: "var(--danger)", duration: 16, delay: -5, isMobileHidden: true },
  { id: 29, left: 75, top: 44, size: 3, colorVar: "var(--cyan)", duration: 20, delay: -11, isMobileHidden: false },
  { id: 30, left: 81, top: 88, size: 3.5, colorVar: "var(--acid)", duration: 18, delay: -7, isMobileHidden: true },
  { id: 31, left: 87, top: 40, size: 2.5, colorVar: "var(--warning)", duration: 22, delay: -15, isMobileHidden: false },
  { id: 32, left: 93, top: 80, size: 4, colorVar: "var(--cyan)", duration: 25, delay: -19, isMobileHidden: true },
  { id: 33, left: 3, top: 82, size: 3, colorVar: "var(--acid)", duration: 17, delay: -8, isMobileHidden: false },
  { id: 34, left: 35, top: 94, size: 2.5, colorVar: "var(--cyan)", duration: 21, delay: -12, isMobileHidden: true },
  { id: 35, left: 68, top: 94, size: 3.5, colorVar: "var(--acid)", duration: 19, delay: -6, isMobileHidden: false },
  { id: 36, left: 96, top: 16, size: 2.5, colorVar: "var(--cyan)", duration: 16, delay: -2, isMobileHidden: true }
];

interface CodeSnippet {
  id: number;
  text: string;
  left: number;
  top: number;
  colorVar: string;
  fontSize: number;
  duration: number;
  delay: number;
}

const snippets: CodeSnippet[] = [
  { id: 1, text: "{ }", left: 14, top: 18, colorVar: "var(--acid)", fontSize: 17, duration: 18, delay: -3 },
  { id: 2, text: "</>", left: 48, top: 12, colorVar: "var(--cyan)", fontSize: 16, duration: 21, delay: -9 },
  { id: 3, text: ";", left: 88, top: 22, colorVar: "var(--acid)", fontSize: 18, duration: 15, delay: -5 },
  { id: 4, text: "==", left: 22, top: 78, colorVar: "var(--warning)", fontSize: 16, duration: 23, delay: -13 },
  { id: 5, text: "[]", left: 45, top: 84, colorVar: "var(--cyan)", fontSize: 17, duration: 19, delay: -2 },
  { id: 6, text: "=>", left: 68, top: 70, colorVar: "var(--acid)", fontSize: 16, duration: 24, delay: -16 },
  { id: 7, text: "def", left: 5, top: 52, colorVar: "var(--cyan)", fontSize: 15, duration: 17, delay: -8 },
  { id: 8, text: "0x1F", left: 84, top: 82, colorVar: "var(--danger)", fontSize: 15, duration: 22, delay: -7 }
];

export default function HeroBackground() {
  return (
    <div className="hero-background-layer" aria-hidden="true">
      {/* Subtle Scanlines Overlay */}
      <div className="hero-scanlines" />

      {/* Glowing Scan Beam */}
      <div className="hero-scanbeam" />

      {/* Floating Code Snippets */}
      <div className="hero-snippets-layer">
        {snippets.map((snip) => (
          <span
            key={snip.id}
            className="hero-snippet"
            style={
              {
                left: `${snip.left}%`,
                top: `${snip.top}%`,
                color: snip.colorVar,
                fontSize: `${snip.fontSize}px`,
                animationDuration: `${snip.duration}s`,
                animationDelay: `${snip.delay}s`
              } as React.CSSProperties
            }
          >
            {snip.text}
          </span>
        ))}
      </div>

      {/* Glowing Floating Digital Particles */}
      <div className="hero-particles-layer">
        {particles.map((p) => (
          <i
            key={p.id}
            className={`hero-particle ${p.isMobileHidden ? "mobile-hide" : ""}`}
            style={
              {
                left: `${p.left}%`,
                top: `${p.top}%`,
                width: `${p.size}px`,
                height: `${p.size}px`,
                backgroundColor: p.colorVar,
                boxShadow: `0 0 6px ${p.colorVar}, 0 0 12px ${p.colorVar}`,
                animationDuration: `${p.duration}s`,
                animationDelay: `${p.delay}s`
              } as React.CSSProperties
            }
          />
        ))}
      </div>
    </div>
  );
}
