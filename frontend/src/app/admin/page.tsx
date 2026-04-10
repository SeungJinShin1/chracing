/**
 * Admin Page — /admin
 *
 * Protected by middleware (password check).
 * Features:
 * - Student list with delete buttons
 * - Manual state override
 * - NFC music write
 * - Add new student form
 */
"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { deleteUser, createUser } from "@/lib/api";
import { useWebSocket } from "@/hooks/useWebSocket";
import { useRacingStore } from "@/store/racingStore";
import AdminControls from "@/components/AdminControls";
import StatusBadge from "@/components/StatusBadge";
import ToastContainer from "@/components/Toast";
import Timer from "@/components/Timer";
import { formatTime } from "@/hooks/useRacingTimer";

interface UserEntry {
  uid: string;
  name: string;
  bestTime: number;
  musicUrl: string;
  createdAt: string;
}

export default function AdminPage() {
  const { sendMessage } = useWebSocket();
  const { addToast, racingState } = useRacingStore();
  const [users, setUsers] = useState<UserEntry[]>([]);
  const [newUid, setNewUid] = useState("");
  const [newName, setNewName] = useState("");

  // Real-time user list
  useEffect(() => {
    const q = query(collection(db, "users"), orderBy("bestTime", "asc"));
    const unsub = onSnapshot(q, (snap) => {
      const items: UserEntry[] = snap.docs.map((doc) => ({
        uid: doc.id,
        ...doc.data(),
      })) as UserEntry[];
      setUsers(items);
    });
    return () => unsub();
  }, []);

  const handleDelete = async (uid: string, name: string) => {
    if (!confirm(`${name} 학생과 모든 기록을 삭제하시겠습니까?`)) return;
    try {
      await deleteUser(uid);
      addToast("success", `${name} 삭제 완료`);
    } catch (err) {
      addToast("error", `삭제 실패: ${err instanceof Error ? err.message : "error"}`);
    }
  };

  const handleAddUser = async () => {
    if (!newUid.trim() || !newName.trim()) {
      addToast("error", "UID와 이름을 입력해주세요.");
      return;
    }
    try {
      await createUser(newUid.trim(), newName.trim());
      addToast("success", `${newName} 등록 완료`);
      setNewUid("");
      setNewName("");
    } catch (err) {
      addToast("error", `등록 실패: ${err instanceof Error ? err.message : "error"}`);
    }
  };

  const handleWriteNFC = (url: string) => {
    sendMessage({ type: "WRITE_NFC", url });
  };

  return (
    <div className="page-container">
      {/* Header */}
      <header className="flex-between" style={{ marginBottom: "var(--space-xl)" }}>
        <div className="flex-center gap-md">
          <h1 className="heading heading--lg" style={{ color: "var(--clr-primary)" }}>
            ⚙️ ADMIN
          </h1>
          <a
            href="/"
            className="btn btn--ghost btn--sm"
            style={{ textDecoration: "none" }}
          >
            레이싱 화면
          </a>
          <a
            href="/leaderboard"
            className="btn btn--ghost btn--sm"
            style={{ textDecoration: "none" }}
          >
            리더보드
          </a>
        </div>
        <div className="flex-center gap-md">
          <StatusBadge />
          <div
            className="badge"
            style={{
              background: "var(--bg-elevated)",
              color: racingState === "RACING" ? "var(--clr-success)" : "var(--text-secondary)",
            }}
          >
            {racingState}
          </div>
        </div>
      </header>

      {/* Mini Timer */}
      <div style={{ textAlign: "center", marginBottom: "var(--space-xl)" }}>
        <Timer size="md" />
      </div>

      {/* Admin Grid */}
      <div className="admin-grid">
        {/* Left: Student List */}
        <div className="flex-col gap-lg">
          {/* Add Student */}
          <div className="card">
            <h3 className="heading heading--sm" style={{ marginBottom: "var(--space-md)" }}>
              ➕ 학생 등록
            </h3>
            <div className="flex-col gap-sm">
              <input
                className="input"
                placeholder="NFC UID (태그 터치 시 자동 감지)"
                value={newUid}
                onChange={(e) => setNewUid(e.target.value)}
                id="new-user-uid-input"
              />
              <input
                className="input"
                placeholder="학생 이름"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddUser()}
                id="new-user-name-input"
              />
              <button className="btn btn--primary btn--sm" onClick={handleAddUser} id="add-user-btn">
                등록
              </button>
            </div>
          </div>

          {/* Student Table */}
          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            <div style={{ padding: "var(--space-md) var(--space-lg)" }}>
              <h3 className="heading heading--sm">
                👥 학생 목록 ({users.length}명)
              </h3>
            </div>
            <div className="table-container" style={{ border: "none", borderRadius: 0 }}>
              <table>
                <thead>
                  <tr>
                    <th>이름</th>
                    <th>UID</th>
                    <th>BEST</th>
                    <th style={{ width: "60px" }}></th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.uid}>
                      <td style={{ fontWeight: 600 }}>{user.name}</td>
                      <td style={{ fontFamily: "var(--font-display)", fontSize: "0.7rem", color: "var(--text-muted)" }}>
                        {user.uid.slice(-6)}
                      </td>
                      <td style={{ fontFamily: "var(--font-display)", fontSize: "0.8rem" }}>
                        {user.bestTime >= 999 ? "—" : formatTime(user.bestTime)}
                      </td>
                      <td>
                        <button
                          className="btn btn--danger btn--sm"
                          onClick={() => handleDelete(user.uid, user.name)}
                          id={`delete-user-${user.uid}`}
                        >
                          삭제
                        </button>
                      </td>
                    </tr>
                  ))}
                  {users.length === 0 && (
                    <tr>
                      <td colSpan={4} style={{ textAlign: "center", color: "var(--text-muted)", padding: "32px" }}>
                        등록된 학생이 없습니다
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right: Controls */}
        <AdminControls onWriteNFC={handleWriteNFC} />
      </div>

      <ToastContainer />
    </div>
  );
}
