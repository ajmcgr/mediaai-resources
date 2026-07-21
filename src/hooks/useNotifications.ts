import { useCallback, useEffect, useState } from "react";

export type AppNotification = {
  id: string;
  title: string;
  description?: string;
  createdAt: number;
  read: boolean;
  kind?: string;
};

const KEY = "mediaai:notifications";
const EVENT = "mediaai:notifications-changed";
const MAX = 50;

function read(): AppNotification[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function write(items: AppNotification[]) {
  localStorage.setItem(KEY, JSON.stringify(items.slice(0, MAX)));
  window.dispatchEvent(new Event(EVENT));
}

export function addNotification(n: Omit<AppNotification, "id" | "createdAt" | "read">) {
  const next: AppNotification = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: Date.now(),
    read: false,
    ...n,
  };
  write([next, ...read()]);
}

export function useNotifications() {
  const [items, setItems] = useState<AppNotification[]>(() => read());

  useEffect(() => {
    const sync = () => setItems(read());
    window.addEventListener(EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const markAllRead = useCallback(() => {
    write(read().map((n) => ({ ...n, read: true })));
  }, []);

  const clear = useCallback(() => write([]), []);

  const unread = items.filter((n) => !n.read).length;

  return { items, unread, markAllRead, clear };
}
