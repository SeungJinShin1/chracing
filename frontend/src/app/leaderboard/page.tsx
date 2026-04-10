/**
 * Leaderboard Page — /leaderboard
 *
 * Designed for a secondary display monitor.
 * Shows:
 * - Real-time top 10 ranking
 * - Live timer (synced with racing page)
 * - Current racer info
 */
"use client";

import { useWebSocket } from "@/hooks/useWebSocket";
import { useRacingStore } from "@/store/racingStore";
import Timer from "@/components/Timer";
import LeaderboardTable from "@/components/LeaderboardTable";
import StatusBadge from "@/components/StatusBadge";
import Confetti from "@/components/Confetti";
import { formatTime } from "@/hooks/useRacingTimer";

export default function LeaderboardPage() {
  useWebSocket();
  const racingState = useRacingStore((s) => s.racingState);
  const currentRacer = useRacingStore((s) => s.currentRacer);
  const lapTime = useRacingStore((s) => s.lapTime);

  return (
    <div className={`racing-bg racing-bg--${racingState.toLowerCase()}`}>
      <div className="page-container" style={{ maxWidth: "900px" }}>
        {/* Header */}
        <header style={{ textAlign: "center", marginBottom: "var(--space-2xl)" }}>
          <div className="flex-center gap-md" style={{ marginBottom: "var(--space-md)" }}>
            <StatusBadge />
          </div>
          <h1
            className="heading"
            style={{
              fontSize: "2rem",
              background: "linear-gradient(135deg, var(--clr-secondary), var(--clr-primary))",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              marginBottom: "var(--space-sm)",
            }}
          >
            🏁 LEADERBOARD
          </h1>
        </header>

        {/* Current Race */}
        {(racingState === "RACING" || racingState === "STANDBY" || racingState === "FINISHED") && (
          <div
            className="card card--glass"
            style={{
              textAlign: "center",
              marginBottom: "var(--space-xl)",
              borderColor:
                racingState === "RACING"
                  ? "var(--clr-success)"
                  : racingState === "FINISHED"
                  ? "var(--clr-primary)"
                  : "var(--clr-secondary)",
              borderWidth: "2px",
            }}
          >
            {currentRacer && (
              <div
                style={{
                  fontSize: "1.25rem",
                  fontWeight: 700,
                  marginBottom: "var(--space-md)",
                  color: "var(--text-primary)",
                }}
              >
                🏎️ {currentRacer.name}
                {racingState === "FINISHED" && lapTime && currentRacer.bestTime > lapTime && (
                  <span
                    style={{
                      marginLeft: "var(--space-sm)",
                      color: "var(--clr-secondary)",
                      fontSize: "0.85rem",
                    }}
                  >
                    🏆 NEW BEST!
                  </span>
                )}
              </div>
            )}
            <Timer size="md" />
            {racingState === "STANDBY" && (
              <div
                style={{
                  marginTop: "var(--space-md)",
                  color: "var(--clr-secondary)",
                  fontFamily: "var(--font-display)",
                  fontSize: "0.85rem",
                  animation: "pulse-text 1s ease-in-out infinite",
                }}
              >
                출발 대기중...
              </div>
            )}
          </div>
        )}

        {/* Leaderboard Table */}
        <LeaderboardTable />

        {/* Footer */}
        <div
          style={{
            textAlign: "center",
            marginTop: "var(--space-2xl)",
            color: "var(--text-muted)",
            fontSize: "0.7rem",
            fontFamily: "var(--font-display)",
          }}
        >
          CH RACING SYSTEM
        </div>
      </div>

      <Confetti />
    </div>
  );
}
