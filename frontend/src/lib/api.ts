/**
 * Backend API utility functions.
 * All requests include Authorization: Bearer <API_SECRET_KEY> header.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";
const API_KEY = process.env.NEXT_PUBLIC_API_KEY || "change-this-to-a-secure-random-string";

interface RecordResponse {
  success: boolean;
  message: string;
  lapTime: number | null;
  isNewBest: boolean;
}

interface UserData {
  uid: string;
  name: string;
  bestTime: number;
  musicUrl: string;
  createdAt: string;
}

async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEY}`,
      ...options.headers,
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(body.detail || `API Error: ${res.status}`);
  }

  return res.json();
}

/** Save a lap time record. */
export async function postRecord(
  uid: string,
  lapTime: number
): Promise<RecordResponse> {
  return apiFetch<RecordResponse>("/api/records", {
    method: "POST",
    body: JSON.stringify({ uid, lapTime }),
  });
}

/** Register a new user. */
export async function createUser(
  uid: string,
  name: string,
  musicUrl: string = ""
): Promise<UserData> {
  return apiFetch<UserData>("/api/users", {
    method: "POST",
    body: JSON.stringify({ uid, name, musicUrl }),
  });
}

/** Delete a user and all their records. */
export async function deleteUser(uid: string): Promise<{ success: boolean; message: string }> {
  return apiFetch("/api/users/" + uid, {
    method: "DELETE",
  });
}

/** List all users. */
export async function listUsers(): Promise<UserData[]> {
  return apiFetch<UserData[]>("/api/users");
}
