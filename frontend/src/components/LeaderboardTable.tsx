/**
 * LeaderboardTable — Real-time top 10 leaderboard.
 * Uses Firebase onSnapshot for live updates.
 */
"use client";

import { useEffect, useState } from "react";
import {
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { formatTime } from "@/hooks/useRacingTimer";
import { useRacingStore } from "@/store/racingStore";

interface LeaderEntry {
  uid: string;
  name: string;
  bestTime: number;
}

export default function LeaderboardTable() {
  const [entries, setEntries] = useState<LeaderEntry[]>([]);
  const [newEntryIds, setNewEntryIds] = useState<Set<string>>(new Set());
  const setTopBestTime = useRacingStore((s) => s.setTopBestTime);

  useEffect(() => {
    const q = query(
      collection(db, "users"),
      orderBy("bestTime", "asc"),
      limit(100)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items: LeaderEntry[] = [];
        const changedIds = new Set<string>();

        snapshot.docChanges().forEach((change) => {
          if (change.type === "added" || change.type === "modified") {
            changedIds.add(change.doc.id);
          }
        });

        snapshot.docs.forEach((doc) => {
          const data = doc.data();
          if (data.bestTime < 999) {
            items.push({
              uid: doc.id,
              name: data.name,
              bestTime: data.bestTime,
            });
          }
        });

        setEntries(items);
        setNewEntryIds(changedIds);

        // Update global top best time for Ghost Pacer
        if (items.length > 0) {
          setTopBestTime(items[0].bestTime);
        }

        // Clear new entry highlights after animation
        setTimeout(() => setNewEntryIds(new Set()), 600);
      },
      (error) => {
        console.error("Leaderboard snapshot error:", error);
      }
    );

    return () => unsubscribe();
  }, [setTopBestTime]);

  return (
    <div className="table-container" id="leaderboard-table">
      <table>
        <thead>
          <tr>
            <th style={{ width: "80px" }}>RANK</th>
            <th>NAME</th>
            <th style={{ width: "180px", textAlign: "right" }}>BEST TIME</th>
          </tr>
        </thead>
        <tbody>
          {entries.length === 0 ? (
            <tr>
              <td colSpan={3} style={{ textAlign: "center", color: "var(--text-muted)", padding: "48px" }}>
                아직 기록이 없습니다
              </td>
            </tr>
          ) : (
            entries.map((entry, i) => (
              <tr
                key={entry.uid}
                className={`leaderboard-row ${
                  newEntryIds.has(entry.uid) ? "leaderboard-row--new" : ""
                }`}
              >
                <td>
                  <span
                    className={`leaderboard-rank ${
                      i < 3 ? `leaderboard-rank--${i + 1}` : ""
                    }`}
                  >
                    {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : i + 1}
                  </span>
                </td>
                <td style={{ fontWeight: 600 }}>{entry.name}</td>
                <td
                  style={{
                    textAlign: "right",
                    fontFamily: "var(--font-display)",
                    fontSize: "1.25rem",
                    color: i === 0 ? "var(--clr-secondary)" : "var(--text-primary)",
                  }}
                >
                  {formatTime(entry.bestTime)}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
