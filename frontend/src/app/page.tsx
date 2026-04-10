/**
 * Racing Page — Main racing screen (/).
 *
 * Shows:
 * - Connection status badge
 * - Traffic light
 * - Large timer (rAF, 0.01s)
 * - Racer card
 * - Ghost Pacer progress bar
 * - Confetti on new record
 * - Toast notifications
 */
"use client";

import { useWebSocket } from "@/hooks/useWebSocket";
import { useRacingStore } from "@/store/racingStore";
import Timer from "@/components/Timer";
import RacerCard from "@/components/RacerCard";
import TrafficLight from "@/components/TrafficLight";
import GhostPacer from "@/components/GhostPacer";
import Confetti from "@/components/Confetti";
import StatusBadge from "@/components/StatusBadge";
import ToastContainer from "@/components/Toast";
import LeaderboardTable from "@/components/LeaderboardTable";
import { formatTime } from "@/hooks/useRacingTimer";

export default function RacingPage() {
  useWebSocket();
  const racingState = useRacingStore((s) => s.racingState);
  const lapTime = useRacingStore((s) => s.lapTime);

  const stateMessages: Record<string, string> = {
    IDLE: "NFC 태그를 대주세요",
    STANDBY: "출발선 준비 완료!",
    RACING: "GO!",
    FINISHED: lapTime ? `${formatTime(lapTime)}` : "완료!",
  };

  return (
    <div className={`racing-bg racing-bg--${racingState.toLowerCase()}`}>
      <div className="page-container--full">
        {/* Header */}
        <header className="flex-between" style={{ marginBottom: "var(--space-xl)" }}>
          <div className="flex-center gap-md">
            <h1
              className="heading heading--lg"
              style={{
                background: "linear-gradient(135deg, var(--clr-primary), var(--clr-secondary))",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              CH RACING
            </h1>
          </div>
          <StatusBadge />
        </header>

        {/* Main Content */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "auto 1fr auto",
            gap: "var(--space-2xl)",
            alignItems: "center",
            minHeight: "60vh",
          }}
        >
          {/* Left: Traffic Light */}
          <div className="flex-center">
            <TrafficLight />
          </div>

          {/* Center: Timer + State Message */}
          <div className="flex-col flex-center gap-xl" style={{ textAlign: "center" }}>
            {/* State Label */}
            <div
              className="heading heading--sm"
              style={{
                color:
                  racingState === "RACING"
                    ? "var(--clr-success)"
                    : racingState === "STANDBY"
                    ? "var(--clr-secondary)"
                    : racingState === "FINISHED"
                    ? "var(--clr-primary)"
                    : "var(--text-muted)",
                fontSize: "0.85rem",
                letterSpacing: "0.2em",
              }}
            >
              {stateMessages[racingState]}
            </div>

            {/* Timer */}
            <Timer size="lg" />

            {/* Ghost Pacer */}
            <div style={{ width: "100%", maxWidth: "600px" }}>
              <GhostPacer />
            </div>
          </div>

          {/* Right: Racer Card + Mini Leaderboard */}
          <div
            className="flex-col gap-lg"
            style={{ width: "320px", alignSelf: "start", paddingTop: "var(--space-xl)" }}
          >
            <RacerCard />
            <div>
              <h3
                className="heading heading--sm"
                style={{ marginBottom: "var(--space-sm)" }}
              >
                LEADERBOARD
              </h3>
              <LeaderboardTable />
            </div>
          </div>
        </div>
      </div>

      {/* Overlays */}
      <Confetti />
      <ToastContainer />
    </div>
  );
}
