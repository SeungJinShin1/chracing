/**
 * RacerCard — Displays current racer info.
 */
"use client";

import { useRacingStore } from "@/store/racingStore";
import { formatTime } from "@/hooks/useRacingTimer";

export default function RacerCard() {
  const currentRacer = useRacingStore((s) => s.currentRacer);
  const racingState = useRacingStore((s) => s.racingState);

  if (!currentRacer) {
    return (
      <div className="card" id="racer-card" style={{ textAlign: "center", padding: "32px" }}>
        <div style={{ fontSize: "2.5rem", marginBottom: "12px" }}>🏎️</div>
        <p style={{ color: "var(--text-secondary)", fontFamily: "var(--font-display)", fontSize: "0.85rem" }}>
          NFC 태그를 대주세요
        </p>
      </div>
    );
  }

  return (
    <div
      className="card"
      id="racer-card"
      style={{
        borderColor:
          racingState === "RACING"
            ? "var(--clr-success)"
            : racingState === "FINISHED"
            ? "var(--clr-primary)"
            : "rgba(255,255,255,0.05)",
        borderWidth: "2px",
      }}
    >
      <div className="flex-between" style={{ marginBottom: "12px" }}>
        <span className="heading heading--sm" style={{ fontSize: "1rem" }}>RACER</span>
        <span
          style={{
            fontSize: "1rem",
            color: "var(--text-muted)",
            fontFamily: "var(--font-display)",
          }}
        >
          {currentRacer.uid.slice(-6)}
        </span>
      </div>
      <div
        style={{
          fontSize: "2.5rem",
          fontWeight: 700,
          marginBottom: "12px",
        }}
      >
        {currentRacer.name}
      </div>
      <div style={{ color: "var(--text-secondary)", fontSize: "1.25rem" }}>
        <span style={{ fontFamily: "var(--font-display)", fontSize: "1rem", marginRight: "8px" }}>
          BEST
        </span>
        {currentRacer.bestTime >= 999
          ? "—"
          : formatTime(currentRacer.bestTime)}
      </div>
    </div>
  );
}
