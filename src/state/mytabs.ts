import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CUSTOM_PREFIX, registerCustomLessons } from '../content/curriculum';
import type { GrooveId, Lesson, ToneId } from '../content/types';
import { importTabText, type ChordVoicing, type StrumStyle } from '../music/import';
import type { TuningId } from '../music/notes';
import { safeStorage } from './storage';

/** A tab the player pasted in. The original text is kept so it can be edited later. */
export interface CustomTab {
  id: string;
  title: string;
  artist?: string;
  source: string;
  bpm: number;
  tuning: TuningId;
  tone: ToneId;
  drums: GrooveId;
  strum?: StrumStyle;
  voicing?: ChordVoicing;
  createdAt: number;
  updatedAt: number;
  /** Deleted tabs stay as a marker so a deletion also syncs to other devices. */
  deleted?: boolean;
}

export type TabDraft = Omit<CustomTab, 'id' | 'createdAt' | 'updatedAt' | 'deleted'>;

interface MyTabsStore {
  tabs: Record<string, CustomTab>;
  save: (draft: TabDraft, id?: string) => string;
  remove: (id: string) => void;
  replaceAll: (tabs: Record<string, CustomTab>) => void;
}

function newId() {
  const rnd = Math.random().toString(36).slice(2, 8);
  return `${CUSTOM_PREFIX}${Date.now().toString(36)}${rnd}`;
}

export const useMyTabs = create<MyTabsStore>()(
  persist(
    (set, get) => ({
      tabs: {},
      save: (draft, id) => {
        const now = Date.now();
        const prev = id ? get().tabs[id] : undefined;
        const tabId = prev ? prev.id : newId();
        const tab: CustomTab = { ...draft, id: tabId, createdAt: prev?.createdAt ?? now, updatedAt: now };
        set({ tabs: { ...get().tabs, [tabId]: tab } });
        return tabId;
      },
      remove: (id) => {
        const prev = get().tabs[id];
        if (!prev) return;
        set({ tabs: { ...get().tabs, [id]: { ...prev, source: '', deleted: true, updatedAt: Date.now() } } });
      },
      replaceAll: (tabs) => set({ tabs }),
    }),
    { name: 'fretforge.mytabs.v1', storage: safeStorage, version: 1, partialize: (s) => ({ tabs: s.tabs }) },
  ),
);

const cache = new Map<string, { at: number; lesson: Lesson | null }>();

/** Turn a pasted tab into a playable song, or null when nothing in it could be read. */
export function tabToLesson(tab: CustomTab): Lesson | null {
  const hit = cache.get(tab.id);
  if (hit && hit.at === tab.updatedAt) return hit.lesson;
  const r = importTabText(tab.source, { tuning: tab.tuning, strum: tab.strum, voicing: tab.voicing });
  const lesson: Lesson | null = r.sections.length
    ? {
        id: tab.id,
        title: tab.title || 'Untitled tab',
        band: tab.artist || undefined,
        kind: 'song',
        style: 'My tab',
        summary: `Your own ${r.kind === 'chords' ? 'chord sheet' : 'tab'}: ${r.bars} bars. The rhythm is a best guess, so try Practice mode first.`,
        bpm: tab.bpm,
        tuning: tab.tuning,
        tone: tab.tone,
        mode: 'practice',
        sections: r.sections.map((s) => ({ name: s.name, tab: s.tab, repeat: s.repeat, groove: tab.drums })),
      }
    : null;
  cache.set(tab.id, { at: tab.updatedAt, lesson });
  return lesson;
}

/** Tabs that are not deleted, newest first. */
export function activeTabs(tabs: Record<string, CustomTab>): CustomTab[] {
  return Object.values(tabs)
    .filter((t) => !t.deleted)
    .sort((a, b) => b.createdAt - a.createdAt);
}

function register() {
  const lessons: Lesson[] = [];
  for (const t of activeTabs(useMyTabs.getState().tabs)) {
    try {
      const l = tabToLesson(t);
      if (l) lessons.push(l);
    } catch {
      // A tab that cannot be read simply does not show up as playable.
    }
  }
  registerCustomLessons(lessons);
}

register();
useMyTabs.subscribe(register);
