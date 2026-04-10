/**
 * Zustand global state for CH Racing.
 *
 * Manages:
 * - Bridge WebSocket connection status
 * - Current racer (NFC tagged student)
 * - Racing state machine (IDLE → STANDBY → RACING → FINISHED)
 * - State Lock (prevent NFC changes during RACING)
 * - Ghost Pacer data (top #1 best time)
 * - Toast notifications
 */

import { create } from "zustand";

export type RacingStateType = "IDLE" | "STANDBY" | "RACING" | "FINISHED";

export interface Racer {
  uid: string;
  name: string;
  bestTime: number;
}

export interface ToastItem {
  id: string;
  type: "success" | "error" | "warning" | "info";
  message: string;
  exiting?: boolean;
}

interface RacingStore {
  // ---- Connection ----
  isBridgeConnected: boolean;
  setBridgeConnected: (connected: boolean) => void;

  // ---- Racer ----
  currentRacer: Racer | null;
  setCurrentRacer: (racer: Racer | null) => void;

  // ---- Racing State Machine ----
  racingState: RacingStateType;
  setRacingState: (state: RacingStateType) => void;

  // ---- State Lock ----
  isStateLocked: boolean;

  // ---- Timer ----
  startTime: number | null;
  lapTime: number | null;
  setStartTime: (t: number | null) => void;
  setLapTime: (t: number | null) => void;

  // ---- Ghost Pacer ----
  topBestTime: number | null;
  setTopBestTime: (t: number | null) => void;

  // ---- Toasts ----
  toasts: ToastItem[];
  addToast: (type: ToastItem["type"], message: string) => void;
  removeToast: (id: string) => void;
  markToastExiting: (id: string) => void;

  // ---- Reset ----
  resetRace: () => void;
}

export const useRacingStore = create<RacingStore>((set, get) => ({
  // Connection
  isBridgeConnected: false,
  setBridgeConnected: (connected) => set({ isBridgeConnected: connected }),

  // Racer
  currentRacer: null,
  setCurrentRacer: (racer) => set({ currentRacer: racer }),

  // Racing State
  racingState: "IDLE",
  setRacingState: (state) => {
    const locked = state === "RACING";
    set({ racingState: state, isStateLocked: locked });
  },

  // State Lock
  isStateLocked: false,

  // Timer
  startTime: null,
  lapTime: null,
  setStartTime: (t) => set({ startTime: t }),
  setLapTime: (t) => set({ lapTime: t }),

  // Ghost Pacer
  topBestTime: null,
  setTopBestTime: (t) => set({ topBestTime: t }),

  // Toasts
  toasts: [],
  addToast: (type, message) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    set((s) => ({ toasts: [...s.toasts, { id, type, message }] }));

    // Auto-remove after 4 seconds
    setTimeout(() => {
      get().markToastExiting(id);
      setTimeout(() => get().removeToast(id), 300);
    }, 4000);
  },
  removeToast: (id) =>
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
  markToastExiting: (id) =>
    set((s) => ({
      toasts: s.toasts.map((t) => (t.id === id ? { ...t, exiting: true } : t)),
    })),

  // Reset
  resetRace: () =>
    set({
      racingState: "IDLE",
      isStateLocked: false,
      startTime: null,
      lapTime: null,
      currentRacer: null,
    }),
}));
