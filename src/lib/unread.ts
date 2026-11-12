// The unread notification count, shared by the header bell, the home screen
// and the notifications screen, so they always show the same number.
import { useSyncExternalStore } from "react";
import { api } from "./api";

let count = 0;
const listeners = new Set<() => void>();

export function setUnreadCount(value: number) {
  const next = Math.max(0, value || 0);
  if (next === count) return;
  count = next;
  listeners.forEach((listener) => listener());
}

/** Reads the count from the server; any screen showing it updates. */
export async function refreshUnreadCount() {
  try {
    const data = await api<{ unread_count?: number }>("users/me/inbox", { query: { limit: 1 } });
    setUnreadCount(data?.unread_count ?? 0);
  } catch {
    // Signed out or offline: keep the last known number.
  }
}

export function useUnreadCount(): number {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => count,
  );
}
