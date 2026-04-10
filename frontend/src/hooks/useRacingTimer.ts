/**
 * useRacingTimer — High-precision timer using requestAnimationFrame.
 *
 * Uses performance.now() for accuracy.
 * Only ticks when racingState === "RACING".
 * Returns elapsed time in seconds (2 decimal places).
 */
"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRacingStore } from "@/store/racingStore";

export function useRacingTimer() {
  const { racingState, startTime, lapTime } = useRacingStore();
  const [displayTime, setDisplayTime] = useState(0);
  const rafRef = useRef<number | null>(null);

  const tick = useCallback(() => {
    if (startTime !== null) {
      const elapsed = (performance.now() - startTime) / 1000;
      setDisplayTime(Math.round(elapsed * 100) / 100);
    }
    rafRef.current = requestAnimationFrame(tick);
  }, [startTime]);

  useEffect(() => {
    if (racingState === "RACING" && startTime !== null) {
      rafRef.current = requestAnimationFrame(tick);
    } else {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    }

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [racingState, startTime, tick]);

  // When finished, show the final lap time
  if (racingState === "FINISHED" && lapTime !== null) {
    return lapTime;
  }

  // When idle or standby, show 0
  if (racingState === "IDLE" || racingState === "STANDBY") {
    return 0;
  }

  return displayTime;
}

/**
 * Format seconds to MM:SS.ss display string.
 */
export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const whole = Math.floor(secs);
  const hundredths = Math.round((secs - whole) * 100);

  return `${mins.toString().padStart(2, "0")}:${whole
    .toString()
    .padStart(2, "0")}.${hundredths.toString().padStart(2, "0")}`;
}
