import { createJSONStorage, type StateStorage } from 'zustand/middleware';

/** localStorage that never throws (private windows, blocked storage): falls back to memory. */
const memory = new Map<string, string>();

const safe: StateStorage = {
  getItem: (key) => {
    try {
      return window.localStorage.getItem(key) ?? memory.get(key) ?? null;
    } catch {
      return memory.get(key) ?? null;
    }
  },
  setItem: (key, value) => {
    memory.set(key, value);
    try {
      window.localStorage.setItem(key, value);
    } catch {
      /* storage full or blocked: keep the in-memory copy */
    }
  },
  removeItem: (key) => {
    memory.delete(key);
    try {
      window.localStorage.removeItem(key);
    } catch {
      /* ignore */
    }
  },
};

export const safeStorage = createJSONStorage(() => safe);
