/**
 * StatusBadge — WebSocket connection status indicator.
 */
"use client";

import { useRacingStore } from "@/store/racingStore";

export default function StatusBadge() {
  const isConnected = useRacingStore((s) => s.isBridgeConnected);

  return (
    <div
      className={`badge ${isConnected ? "badge--online" : "badge--offline"}`}
      id="status-badge"
    >
      <span className="badge__dot" />
      {isConnected ? "BRIDGE 연결됨" : "BRIDGE 오프라인"}
    </div>
  );
}
