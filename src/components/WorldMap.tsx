import { Check, LockKeyhole, Swords } from "lucide-react";
import { initialWorlds } from "../data/worlds";

interface WorldMapProps {
  onSelect: (worldLevel?: string) => void;
  title?: boolean;
}

export default function WorldMap({ onSelect, title = true }: WorldMapProps) {
  return (
    <section className="world-section">
      {title && (
        <div className="section-title">
          <div>
            <span className="eyebrow">YOUR CAMPAIGN</span>
            <h2>THE DEBUGGER WORLD</h2>
          </div>
          <p>Repair the corrupted network, one bug at a time.</p>
        </div>
      )}
      <div className="world-map">
        <div className="map-grid" />
        <svg
          className="map-path"
          viewBox="0 0 1000 300"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path d="M75 205 C165 200 205 100 300 115 S425 220 535 170 S660 50 755 82 S850 185 930 158" />
        </svg>
        {initialWorlds.map((world, idx) => (
          <button
            key={world.level}
            className={`world-node ${world.status} world-stagger-node`}
            style={
              {
                left: `${world.x}%`,
                top: `${world.y}%`,
                "--i": idx,
                animationDelay: `${idx * 150}ms`
              } as React.CSSProperties
            }
            onClick={() => {
              if (world.status !== "locked") {
                onSelect(world.level);
              }
            }}
            disabled={world.status === "locked"}
          >
            <span className="node-orb">
              {world.status === "locked" ? (
                <LockKeyhole />
              ) : world.status === "complete" ? (
                <Check />
              ) : (
                <Swords />
              )}
            </span>
            <span className="node-copy">
              <small>WORLD {world.level}</small>
              <b>{world.name}</b>
              <em>{world.status}</em>
            </span>
          </button>
        ))}
        <div className="map-scan" />
      </div>
    </section>
  );
}
