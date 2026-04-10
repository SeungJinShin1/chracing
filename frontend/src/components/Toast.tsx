/**
 * Toast — Notification toast system.
 * Reads from Zustand store and renders with enter/exit animations.
 */
"use client";

import { useRacingStore } from "@/store/racingStore";

export default function ToastContainer() {
  const toasts = useRacingStore((s) => s.toasts);
  const removeToast = useRacingStore((s) => s.removeToast);

  return (
    <div className="toast-container" id="toast-container">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`toast toast--${toast.type} ${toast.exiting ? "toast--exit" : ""}`}
          onClick={() => removeToast(toast.id)}
          role="alert"
        >
          {toast.message}
        </div>
      ))}
    </div>
  );
}
