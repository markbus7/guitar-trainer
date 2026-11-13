import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { GistClient, GistError } from '../sync/gist';
import { isPayload, mergeProgress, mergeTabs, stableJson, type SyncPayload } from '../sync/merge';
import { useMyTabs } from './mytabs';
import { progressData, useProgress } from './progress';
import { safeStorage } from './storage';

/**
 * Sync across devices through a private GitHub gist. The token never leaves this browser
 * except in requests to api.github.com.
 */
export type SyncStatus = 'off' | 'idle' | 'syncing' | 'error';

interface SyncStore {
  token?: string;
  login?: string;
  gistId?: string;
  lastSync?: number;
  status: SyncStatus;
  error?: string;
  set: (p: Partial<SyncStore>) => void;
}

export const useSync = create<SyncStore>()(
  persist(
    (set) => ({
      status: 'off',
      set: (p) => set(p),
    }),
    {
      name: 'fretforge.sync.v1',
      storage: safeStorage,
      version: 1,
      partialize: (s) => ({ token: s.token, login: s.login, gistId: s.gistId, lastSync: s.lastSync }),
      merge: (persisted, current) => {
        const p = persisted as Partial<SyncStore>;
        return { ...current, ...p, status: p?.token ? 'idle' : 'off' };
      },
    },
  ),
);

let running: Promise<void> | null = null;
let again = false;
let applying = false;

function localPayload(): SyncPayload {
  return { app: 'fretforge', version: 1, savedAt: Date.now(), progress: progressData(), tabs: useMyTabs.getState().tabs };
}

async function run(): Promise<void> {
  const { token } = useSync.getState();
  if (!token) return;
  const client = new GistClient(token);
  useSync.getState().set({ status: 'syncing', error: undefined });
  try {
    let { gistId } = useSync.getState();
    let remote: SyncPayload | undefined;
    if (gistId) {
      try {
        const text = await client.read(gistId);
        if (text) {
          const parsed = JSON.parse(text);
          if (isPayload(parsed)) remote = parsed;
        }
      } catch (e) {
        if (e instanceof GistError && (e.status === 404 || e.status === 403)) gistId = undefined;
        else throw e;
      }
    }
    if (!gistId) {
      gistId = await client.find();
      if (gistId) {
        const text = await client.read(gistId);
        const parsed = text ? JSON.parse(text) : undefined;
        if (isPayload(parsed)) remote = parsed;
      }
    }

    const local = localPayload();
    const progress = remote ? mergeProgress(local.progress, remote.progress) : local.progress;
    const tabs = remote ? mergeTabs(local.tabs, remote.tabs ?? {}) : local.tabs;

    // Bring this device up to date.
    applying = true;
    try {
      if (stableJson(progress) !== stableJson(local.progress)) useProgress.setState(progress);
      if (stableJson(tabs) !== stableJson(local.tabs)) useMyTabs.getState().replaceAll(tabs);
    } finally {
      applying = false;
    }

    // And the gist, when it is behind.
    const merged: SyncPayload = { app: 'fretforge', version: 1, savedAt: Date.now(), progress, tabs };
    const content = JSON.stringify(merged);
    if (!gistId) gistId = await client.create(content);
    else if (!remote || stableJson({ p: remote.progress, t: remote.tabs ?? {} }) !== stableJson({ p: progress, t: tabs })) await client.write(gistId, content);

    useSync.getState().set({ gistId, lastSync: Date.now(), status: 'idle', error: undefined });
  } catch (e) {
    useSync.getState().set({ status: 'error', error: e instanceof Error ? e.message : 'Sync failed.' });
    if (e instanceof GistError && e.status === 401) useSync.getState().set({ status: 'error' });
  }
}

/** Sync now (or right after the sync that is already running). */
export function syncNow(): Promise<void> {
  if (running) {
    again = true;
    return running;
  }
  running = run().finally(() => {
    running = null;
    if (again) {
      again = false;
      void syncNow();
    }
  });
  return running;
}

/** Check a token, remember it and do a first sync. */
export async function connectGitHub(token: string): Promise<void> {
  const t = token.trim();
  const client = new GistClient(t);
  useSync.getState().set({ status: 'syncing', error: undefined });
  try {
    const { login } = await client.user();
    useSync.getState().set({ token: t, login, gistId: undefined, lastSync: undefined });
  } catch (e) {
    useSync.getState().set({ status: useSync.getState().token ? 'idle' : 'off', error: e instanceof Error ? e.message : 'Could not connect.' });
    throw e;
  }
  await syncNow();
  if (useSync.getState().status === 'error') throw new Error(useSync.getState().error);
}

/** Forget the token on this device. The gist itself stays on GitHub. */
export function disconnectGitHub() {
  useSync.setState({ token: undefined, login: undefined, gistId: undefined, lastSync: undefined, status: 'off', error: undefined });
}

let timer: ReturnType<typeof setTimeout> | null = null;

function schedule(delay: number) {
  if (!useSync.getState().token) return;
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => {
    timer = null;
    void syncNow();
  }, delay);
}

/** Sync on start, when the app comes back into view, and a little while after any change. */
export function startAutoSync(): () => void {
  if (useSync.getState().token) void syncNow();
  const unsubs = [
    useProgress.subscribe(() => !applying && schedule(15_000)),
    useMyTabs.subscribe(() => !applying && schedule(3_000)),
  ];
  const onVis = () => {
    if (!useSync.getState().token) return;
    if (document.hidden) {
      if (timer) {
        clearTimeout(timer);
        timer = null;
        void syncNow();
      }
    } else void syncNow();
  };
  document.addEventListener('visibilitychange', onVis);
  return () => {
    unsubs.forEach((u) => u());
    document.removeEventListener('visibilitychange', onVis);
    if (timer) clearTimeout(timer);
  };
}
