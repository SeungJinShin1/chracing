/**
 * Confetti — Canvas confetti animation + "NEW RECORD!" text.
 * Triggered when a new best time is achieved.
 */
"use client";

import { useEffect, useState } from "react";
import confetti from "canvas-confetti";
import { useRacingStore } from "@/store/racingStore";

export default function Confetti() {
  const racingState = useRacingStore((s) => s.racingState);
  const lapTime = useRacingStore((s) => s.lapTime);
  const currentRacer = useRacingStore((s) => s.currentRacer);
  const [showNewRecord, setShowNewRecord] = useState(false);

  useEffect(() => {
    if (
      racingState === "FINISHED" &&
      lapTime !== null &&
      currentRacer &&
      lapTime < currentRacer.bestTime
    ) {
      // Fire confetti!
      setShowNewRecord(true);

      const duration = 3000;
      const end = Date.now() + duration;

      const frame = () => {
        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ["#FFD700", "#FF6B35", "#00E5FF", "#00E676"],
        });
        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ["#FFD700", "#FF6B35", "#00E5FF", "#00E676"],
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };

      frame();

      const hideTimer = setTimeout(() => setShowNewRecord(false), 4000);
      return () => clearTimeout(hideTimer);
    } else {
      setShowNewRecord(false);
    }
  }, [racingState, lapTime, currentRacer]);

  if (!showNewRecord) return null;

  return (
    <div className="new-record-overlay" id="new-record-overlay">
      <div className="new-record-text">🏆 NEW RECORD!</div>
    </div>
  );
}
