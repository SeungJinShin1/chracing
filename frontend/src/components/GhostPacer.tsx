/**
 * GhostPacer — Progress bar comparing current run vs #1 best time.
 */
"use client";

import { useRacingStore } from "@/store/racingStore";
import { useRacingTimer, formatTime } from "@/hooks/useRacingTimer";

export default function GhostPacer() {
  const topBestTime = useRacingStore((s) => s.topBestTime);
  const racingState = useRacingStore((s) => s.racingState);
  const elapsed = useRacingTimer();

  // Only show during RACING
  if (racingState !== "RACING" || !topBestTime || topBestTime >= 999) {
    return null;
  }

  // Racer progress as % of the ghost's total time
  const racerPct = Math.min((elapsed / topBestTime) * 100, 100);
  // Ghost always finishes at 100% at topBestTime
  const ghostPct = Math.min((elapsed / topBestTime) * 100, 100);

  // Determine if racer is ahead or behind
  const isAhead = elapsed <= topBestTime * (racerPct / 100);

  return (
    <div style={{ width: "100%" }}>
      <div className="flex-between gap-sm" style={{ marginBottom: "6px" }}>
        <span
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "0.65rem",
            color: "var(--text-secondary)",
            textTransform: "uppercase",
          }}
        >
          Ghost Pacer
        </span>
        <span
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "0.65rem",
            color: "var(--clr-secondary)",
          }}
        >
          #1 BEST: {formatTime(topBestTime)}
        </span>
      </div>
      <div className="ghost-pacer" id="ghost-pacer">
        {/* Ghost (1st place) bar */}
        <div
          className="ghost-pacer__bar ghost-pacer__bar--ghost"
          style={{ width: `${ghostPct}%` }}
        />
        {/* Current racer bar */}
        <div
          className="ghost-pacer__bar ghost-pacer__bar--racer"
          style={{
            width: `${racerPct}%`,
            background: isAhead
              ? "linear-gradient(90deg, var(--clr-success), #00C853)"
              : "linear-gradient(90deg, var(--clr-primary), #0091EA)",
          }}
        />
        {/* Labels */}
        <span
          className="ghost-pacer__label"
          style={{ right: "8px", color: "var(--text-secondary)" }}
        >
          {formatTime(elapsed)}
        </span>
      </div>
    </div>
  );
}
