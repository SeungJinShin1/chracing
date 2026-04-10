/**
 * NameInputModal — Appears when an unregistered NFC tag is scanned.
 * Lets the participant type their name before racing.
 */
"use client";

import { useState, useEffect, useRef } from "react";
import { useRacingStore } from "@/store/racingStore";
import { createUser } from "@/lib/api";

export default function NameInputModal() {
  const pendingUid = useRacingStore((s) => s.pendingNfcUid);
  const clearPendingNfcUid = useRacingStore((s) => s.clearPendingNfcUid);
  const setCurrentRacer = useRacingStore((s) => s.setCurrentRacer);
  const addToast = useRacingStore((s) => s.addToast);

  const [name, setName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus input when modal opens
  useEffect(() => {
    if (pendingUid) {
      setName("");
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [pendingUid]);

  if (!pendingUid) return null;

  const handleSubmit = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      addToast("warning", "이름을 입력해 주세요!");
      inputRef.current?.focus();
      return;
    }

    setIsSubmitting(true);
    try {
      await createUser(pendingUid, trimmed);
      setCurrentRacer({
        uid: pendingUid,
        name: trimmed,
        bestTime: 999.99,
      });
      addToast("success", `${trimmed} 님, 환영합니다! 🏎️`);
      clearPendingNfcUid();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "등록 실패";
      // If user already exists (409), just load them
      if (msg.includes("already exists")) {
        setCurrentRacer({
          uid: pendingUid,
          name: trimmed,
          bestTime: 999.99,
        });
        addToast("info", "이미 등록된 태그입니다. 바로 진행합니다!");
        clearPendingNfcUid();
      } else {
        addToast("error", `등록 실패: ${msg}`);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = () => {
    // Register with a default name
    const defaultName = `레이서_${pendingUid.slice(-4)}`;
    setCurrentRacer({
      uid: pendingUid,
      name: defaultName,
      bestTime: 999.99,
    });
    clearPendingNfcUid();
    addToast("info", `기본 이름(${defaultName})으로 진행합니다.`);
  };

  return (
    <div className="modal-overlay" id="name-input-modal">
      <div className="modal-card">
        {/* NFC Icon */}
        <div className="modal-icon">📱</div>

        {/* Title */}
        <h2 className="heading heading--md" style={{ color: "var(--clr-primary)", marginBottom: "var(--space-xs)" }}>
          새로운 레이서!
        </h2>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginBottom: "var(--space-lg)" }}>
          NFC 태그가 감지되었습니다. 이름을 입력해 주세요.
        </p>

        {/* UID badge */}
        <div className="modal-uid-badge">
          TAG: {pendingUid.slice(-6).toUpperCase()}
        </div>

        {/* Name Input */}
        <input
          ref={inputRef}
          className="input modal-input"
          type="text"
          placeholder="이름 또는 닉네임을 입력하세요"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !isSubmitting && handleSubmit()}
          maxLength={20}
          disabled={isSubmitting}
          id="name-input-field"
          autoComplete="off"
        />

        {/* Buttons */}
        <div className="modal-buttons">
          <button
            className="btn btn--primary btn--lg"
            onClick={handleSubmit}
            disabled={isSubmitting || !name.trim()}
            id="name-submit-btn"
            style={{ flex: 1 }}
          >
            {isSubmitting ? "등록 중..." : "🏁 등록하고 시작!"}
          </button>
          <button
            className="btn btn--ghost btn--sm"
            onClick={handleSkip}
            disabled={isSubmitting}
            id="name-skip-btn"
          >
            건너뛰기
          </button>
        </div>
      </div>
    </div>
  );
}
