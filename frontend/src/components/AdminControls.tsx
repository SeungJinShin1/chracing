/**
 * AdminControls — Manual override buttons + NFC write UI.
 * For use on the /admin page.
 */
"use client";

import { useState } from "react";
import { useRacingStore, type RacingStateType } from "@/store/racingStore";

interface AdminControlsProps {
  onWriteNFC: (url: string) => void;
}

export default function AdminControls({ onWriteNFC }: AdminControlsProps) {
  const { racingState, setRacingState, setStartTime, setLapTime, resetRace, addToast } =
    useRacingStore();
  const [musicUrl, setMusicUrl] = useState("");

  const overrideStates: { label: string; state: RacingStateType; color: string }[] = [
    { label: "IDLE", state: "IDLE", color: "var(--text-muted)" },
    { label: "STANDBY", state: "STANDBY", color: "var(--clr-secondary)" },
    { label: "RACING", state: "RACING", color: "var(--clr-success)" },
    { label: "FINISHED", state: "FINISHED", color: "var(--clr-primary)" },
  ];

  const handleOverride = (state: RacingStateType) => {
    if (state === "RACING") {
      setStartTime(performance.now());
      setLapTime(null);
    } else if (state === "IDLE") {
      resetRace();
      return;
    }
    setRacingState(state);
    addToast("warning", `수동 오버라이드: ${state}`);
  };

  const handleWriteNFC = () => {
    if (!musicUrl.trim()) {
      addToast("error", "URL을 입력해주세요.");
      return;
    }
    onWriteNFC(musicUrl.trim());
    addToast("info", "NFC 쓰기 명령 전송됨 — 태그를 대주세요.");
    setMusicUrl("");
  };

  return (
    <div className="flex-col gap-lg">
      {/* Manual Override */}
      <div className="card">
        <h3 className="heading heading--sm" style={{ marginBottom: "var(--space-md)" }}>
          수동 상태 변경 (Manual Override)
        </h3>
        <p
          style={{
            fontSize: "0.75rem",
            color: "var(--text-muted)",
            marginBottom: "var(--space-md)",
          }}
        >
          현재 상태:{" "}
          <strong style={{ color: "var(--clr-primary)" }}>{racingState}</strong>
        </p>
        <div className="override-buttons">
          {overrideStates.map((o) => (
            <button
              key={o.state}
              className={`btn btn--ghost btn--sm`}
              style={{
                borderColor: racingState === o.state ? o.color : undefined,
                color: racingState === o.state ? o.color : undefined,
              }}
              onClick={() => handleOverride(o.state)}
              id={`override-${o.state.toLowerCase()}`}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>

      {/* NFC Music Write */}
      <div className="card">
        <h3 className="heading heading--sm" style={{ marginBottom: "var(--space-md)" }}>
          🎵 NFC 음악 쓰기
        </h3>
        <div className="flex-between gap-sm">
          <input
            className="input"
            type="url"
            placeholder="https://suno.com/song/..."
            value={musicUrl}
            onChange={(e) => setMusicUrl(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleWriteNFC()}
            id="nfc-music-url-input"
          />
          <button className="btn btn--primary btn--sm" onClick={handleWriteNFC} id="nfc-write-btn">
            쓰기
          </button>
        </div>
        <p
          style={{
            fontSize: "0.7rem",
            color: "var(--text-muted)",
            marginTop: "var(--space-sm)",
          }}
        >
          URL 입력 후 NFC 태그를 리더에 대면 기록됩니다.
        </p>
      </div>
    </div>
  );
}
