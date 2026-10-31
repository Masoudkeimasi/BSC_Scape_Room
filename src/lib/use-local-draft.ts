"use client";
import { useEffect, useState } from "react";
/** Editable UI drafts only. The server never trusts them for authenticated credit. */
export function useLocalDraft<T>(key: string, fallback: T) {
  const [value, setValue] = useState<T>(() => {
    if (typeof window === "undefined") return fallback;
    try {
      const saved = localStorage.getItem(key);
      return saved ? (JSON.parse(saved) as T) : fallback;
    } catch {
      return fallback;
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* Graded progress is still saved on the server. */
    }
  }, [key, value]);
  return [value, setValue] as const;
}
