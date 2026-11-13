import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  EMPTY_PROGRESS,
  addPracticeTime,
  applyRun,
  type Achievement,
  type ProgressData,
  type RunOutcome,
  type RunResult,
} from '../game/progression';
import { safeStorage } from './storage';

interface ProgressStore extends ProgressData {
  record: (run: RunResult) => RunOutcome;
  addTime: (seconds: number) => Achievement[];
  resetProgress: () => void;
}

const data = (s: ProgressStore): ProgressData => ({
  lessons: s.lessons,
  xp: s.xp,
  days: s.days,
  achievements: s.achievements,
  lastLessonId: s.lastLessonId,
  bestStreak: s.bestStreak,
  notesHit: s.notesHit,
});

export const useProgress = create<ProgressStore>()(
  persist(
    (set, get) => ({
      ...EMPTY_PROGRESS,
      record: (run) => {
        const outcome = applyRun(data(get()), run);
        set(outcome.next);
        return outcome;
      },
      addTime: (seconds) => {
        if (seconds <= 0) return [];
        const { next, unlocked } = addPracticeTime(data(get()), seconds);
        set(next);
        return unlocked;
      },
      resetProgress: () => set({ ...EMPTY_PROGRESS }),
    }),
    {
      name: 'fretforge.progress.v1',
      storage: safeStorage,
      version: 1,
      partialize: (s) => data(s),
    },
  ),
);

export function progressData(): ProgressData {
  return data(useProgress.getState());
}
