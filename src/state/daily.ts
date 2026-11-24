import { useEffect } from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { dayKey } from '../game/progression';
import { buildWorkout, isWorkoutItemDone, type WorkoutItem } from '../game/workout';
import { progressData, useProgress } from './progress';
import { useSettings } from './settings';
import { safeStorage } from './storage';

/** Today's workout plan (fixed for the day once made) and the tuner check-in. */
interface DailyStore {
  tunedOn?: string;
  plan?: { day: string; items: WorkoutItem[] };
  markTuned: () => void;
  ensurePlan: () => WorkoutItem[];
  reshuffle: () => void;
}

export const useDaily = create<DailyStore>()(
  persist(
    (set, get) => ({
      markTuned: () => {
        const day = dayKey();
        if (get().tunedOn !== day) set({ tunedOn: day });
      },
      ensurePlan: () => {
        const day = dayKey();
        const plan = get().plan;
        if (plan && plan.day === day) return plan.items;
        const items = buildWorkout(progressData(), day, useSettings.getState().unlockAll);
        set({ plan: { day, items } });
        return items;
      },
      reshuffle: () => {
        const day = dayKey();
        set({ plan: { day, items: buildWorkout(progressData(), day, useSettings.getState().unlockAll) } });
      },
    }),
    { name: 'fretforge.daily.v1', storage: safeStorage, version: 1, partialize: (s) => ({ tunedOn: s.tunedOn, plan: s.plan }) },
  ),
);

/** Today's workout with a done flag per item. Re-renders when progress changes. */
export function useWorkout(): { items: (WorkoutItem & { done: boolean })[]; done: number; total: number; minutes: number } {
  useProgress((s) => s.lessons);
  const tunedOn = useDaily((s) => s.tunedOn);
  const plan = useDaily((s) => s.plan);
  const day = dayKey();
  const p = progressData();
  const items = plan && plan.day === day ? plan.items : buildWorkout(p, day, useSettings.getState().unlockAll);
  useEffect(() => {
    useDaily.getState().ensurePlan();
  }, [day]);
  const withDone = items.map((it) => ({ ...it, done: isWorkoutItemDone(it, p, day, tunedOn) }));
  const done = withDone.filter((i) => i.done).length;
  return { items: withDone, done, total: items.length, minutes: items.reduce((a, i) => a + i.minutes, 0) };
}
