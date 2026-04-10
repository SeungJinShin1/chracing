/**
 * useWebSocket — Custom hook for Bridge WebSocket connection.
 *
 * Features:
 * - Auto-reconnect on disconnect (3s interval)
 * - State Lock: ignores NFC_TAG during RACING
 * - 120s Zombie Timeout: force-reset if FINISH never arrives
 * - Routes SENSOR_EVENT / NFC_TAG / WRITE_RESULT messages
 */
"use client";

import { useEffect, useRef, useCallback } from "react";
import { useRacingStore } from "@/store/racingStore";
import { postRecord } from "@/lib/api";
import { soundManager } from "@/lib/sounds";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

const WS_URL = "ws://localhost:8765";
const RECONNECT_INTERVAL = 3000;
const ZOMBIE_TIMEOUT = 120000; // 120 seconds

export function useWebSocket() {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const zombieTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const {
    setBridgeConnected,
    setCurrentRacer,
    setRacingState,
    setStartTime,
    setLapTime,
    isStateLocked,
    racingState,
    currentRacer,
    startTime,
    addToast,
    resetRace,
  } = useRacingStore();

  // Use refs for values accessed in WS callback to avoid stale closures
  const stateRef = useRef({ isStateLocked, racingState, currentRacer, startTime });
  useEffect(() => {
    stateRef.current = { isStateLocked, racingState, currentRacer, startTime };
  }, [isStateLocked, racingState, currentRacer, startTime]);

  const clearZombieTimer = useCallback(() => {
    if (zombieTimerRef.current) {
      clearTimeout(zombieTimerRef.current);
      zombieTimerRef.current = null;
    }
  }, []);

  const startZombieTimer = useCallback(() => {
    clearZombieTimer();
    zombieTimerRef.current = setTimeout(() => {
      addToast("warning", "120초 타임아웃 — 레이싱 강제 리셋");
      resetRace();
    }, ZOMBIE_TIMEOUT);
  }, [clearZombieTimer, addToast, resetRace]);

  const handleMessage = useCallback(
    async (event: MessageEvent) => {
      let data: { type: string; [key: string]: unknown };
      try {
        data = JSON.parse(event.data);
      } catch {
        return;
      }

      const { isStateLocked, racingState, currentRacer, startTime } = stateRef.current;

      switch (data.type) {
        case "NFC_TAG": {
          const uid = data.uid as string;

          // State Lock: ignore NFC during RACING
          if (isStateLocked) {
            addToast("warning", "레이싱 진행 중입니다! NFC 태그가 무시되었습니다.");
            return;
          }

          // Look up user in Firebase
          try {
            const userDoc = await getDoc(doc(db, "users", uid));
            if (userDoc.exists()) {
              const userData = userDoc.data();
              setCurrentRacer({
                uid,
                name: userData.name || "Unknown",
                bestTime: userData.bestTime || 999.99,
              });
              addToast("info", `${userData.name} 태그 인식됨`);
            } else {
              setCurrentRacer({ uid, name: `신규(${uid.slice(-4)})`, bestTime: 999.99 });
              addToast("info", `새 태그 감지: ${uid.slice(-4)}`);
            }
          } catch (err) {
            setCurrentRacer({ uid, name: `태그(${uid.slice(-4)})`, bestTime: 999.99 });
            addToast("error", "Firebase 사용자 조회 실패");
          }
          break;
        }

        case "SENSOR_EVENT": {
          const action = data.action as string;

          if (action === "STANDBY") {
            if (racingState === "IDLE" || racingState === "FINISHED") {
              setRacingState("STANDBY");
            }
          } else if (action === "START") {
            setRacingState("RACING");
            setStartTime(performance.now());
            setLapTime(null);
            startZombieTimer();
            // Traffic light sound sequence is triggered by TrafficLight component
          } else if (action === "FINISH") {
            if (racingState === "RACING" && startTime) {
              const elapsed = (performance.now() - startTime) / 1000;
              const lapTime = Math.round(elapsed * 100) / 100;
              setLapTime(lapTime);
              setRacingState("FINISHED");
              clearZombieTimer();
              soundManager.playFinish();

              // Post record to backend
              if (currentRacer) {
                try {
                  const result = await postRecord(currentRacer.uid, lapTime);
                  if (result.isNewBest) {
                    addToast("success", `🏆 새 기록! ${lapTime}초`);
                    soundManager.playNewRecord();
                  } else {
                    addToast("info", `기록 저장: ${lapTime}초`);
                  }
                } catch (err) {
                  addToast("error", `기록 저장 실패: ${err instanceof Error ? err.message : "unknown error"}`);
                }
              }

              // Auto-reset to IDLE after 8 seconds
              setTimeout(() => {
                resetRace();
              }, 8000);
            }
          }
          break;
        }

        case "WRITE_RESULT": {
          const status = data.status as string;
          const message = data.message as string;
          if (status === "success") {
            addToast("success", message);
          } else {
            addToast("error", message);
          }
          break;
        }
      }
    },
    [
      addToast,
      setCurrentRacer,
      setRacingState,
      setStartTime,
      setLapTime,
      startZombieTimer,
      clearZombieTimer,
      resetRace,
    ]
  );

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    try {
      const ws = new WebSocket(WS_URL);

      ws.onopen = () => {
        setBridgeConnected(true);
        addToast("success", "Bridge 서버 연결됨");
        if (reconnectTimerRef.current) {
          clearInterval(reconnectTimerRef.current);
          reconnectTimerRef.current = null;
        }
      };

      ws.onclose = () => {
        setBridgeConnected(false);
        wsRef.current = null;
        // Start reconnect loop
        if (!reconnectTimerRef.current) {
          reconnectTimerRef.current = setInterval(() => {
            connect();
          }, RECONNECT_INTERVAL);
        }
      };

      ws.onerror = () => {
        ws.close();
      };

      ws.onmessage = handleMessage;
      wsRef.current = ws;
    } catch {
      // Will retry via reconnect interval
    }
  }, [setBridgeConnected, addToast, handleMessage]);

  // Send message to bridge
  const sendMessage = useCallback((data: object) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
    }
  }, []);

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimerRef.current) clearInterval(reconnectTimerRef.current);
      clearZombieTimer();
      wsRef.current?.close();
    };
  }, [connect, clearZombieTimer]);

  return { sendMessage };
}
