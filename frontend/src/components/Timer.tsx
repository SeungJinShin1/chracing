/**
 * Timer — Large racing timer display.
 * Uses requestAnimationFrame for smooth 0.01s rendering.
 */
"use client";

import { useRacingTimer, formatTime } from "@/hooks/useRacingTimer";
import { useRacingStore } from "@/store/racingStore";

export default function Timer({ size = "lg" }: { size?: "lg" | "md" | "sm" }) {
  const elapsed = useRacingTimer();
  const racingState = useRacingStore((s) => s.racingState);

  const sizeClass = {
    lg: { fontSize: "6rem" },
    md: { fontSize: "3.5rem" },
    sm: { fontSize: "2rem" },
  }[size];

  const stateClass = `timer--${racingState.toLowerCase()}`;

  return (
    <div
      className={`timer ${stateClass}`}
      style={sizeClass}
      id="racing-timer"
      aria-live="polite"
      aria-label={`타이머: ${formatTime(elapsed)}`}
    >
      {formatTime(elapsed)}
    </div>
  );
}
