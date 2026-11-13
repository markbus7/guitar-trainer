import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ToneId } from '../content/types';
import type { TimingId } from '../game/judge';
import { safeStorage } from './storage';

export type NoteSpeed = 'slow' | 'normal' | 'fast';
export type GuitarKind = 'acoustic' | 'semi' | 'electric';

export interface Settings {
  inputDeviceId?: string;
  /** 0..1, how easily quiet plucks are picked up. */
  sensitivity: number;
  /** Measured round-trip latency in ms, or null to estimate it. */
  latencyMs: number | null;
  output: 'headphones' | 'speakers';
  volumes: { master: number; guide: number; band: number; click: number };
  metronomeInSongs: boolean;
  timing: TimingId;
  noteSpeed: NoteSpeed;
  noteNames: boolean;
  leftHanded: boolean;
  dailyGoalMin: number;
  unlockAll: boolean;
  /** Hear your own guitar through the amp simulation (headphones only). */
  monitor: { enabled: boolean; tone: ToneId; level: number };
  guitar: GuitarKind;
  onboarded: boolean;
  reducedMotion: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
  sensitivity: 0.6,
  latencyMs: null,
  output: 'headphones',
  volumes: { master: 0.9, guide: 0.45, band: 0.8, click: 0.6 },
  metronomeInSongs: false,
  timing: 'normal',
  noteSpeed: 'normal',
  noteNames: false,
  leftHanded: false,
  dailyGoalMin: 10,
  unlockAll: false,
  monitor: { enabled: false, tone: 'crunch', level: 0.7 },
  guitar: 'semi',
  onboarded: false,
  reducedMotion: false,
};

interface SettingsStore extends Settings {
  set: (patch: Partial<Settings>) => void;
  setVolume: (key: keyof Settings['volumes'], value: number) => void;
  reset: () => void;
}

export const useSettings = create<SettingsStore>()(
  persist(
    (set) => ({
      ...DEFAULT_SETTINGS,
      set: (patch) => set(patch),
      setVolume: (key, value) => set((s) => ({ volumes: { ...s.volumes, [key]: value } })),
      reset: () => set({ ...DEFAULT_SETTINGS, onboarded: true }),
    }),
    {
      name: 'fretforge.settings.v1',
      storage: safeStorage,
      version: 1,
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<Settings>;
        return {
          ...current,
          ...p,
          volumes: { ...DEFAULT_SETTINGS.volumes, ...(p.volumes ?? {}) },
          monitor: { ...DEFAULT_SETTINGS.monitor, ...(p.monitor ?? {}) },
        };
      },
    },
  ),
);

export function getSettings(): Settings {
  return useSettings.getState();
}
