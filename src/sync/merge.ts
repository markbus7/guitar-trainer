import type { LessonRecord, ProgressData } from '../game/progression';
import type { CustomTab } from '../state/mytabs';

/** What is stored in the gist. */
export interface SyncPayload {
  app: 'fretforge';
  version: 1;
  savedAt: number;
  progress: ProgressData;
  tabs: Record<string, CustomTab>;
}

const max = (a = 0, b = 0) => Math.max(a, b);

function mergeLesson(a: LessonRecord, b: LessonRecord): LessonRecord {
  const out: LessonRecord = {
    stars: max(a.stars, b.stars),
    bestScore: max(a.bestScore, b.bestScore),
    bestAccuracy: max(a.bestAccuracy, b.bestAccuracy),
    plays: max(a.plays, b.plays),
    lastPlayed: max(a.lastPlayed, b.lastPlayed),
    bestTempo: max(a.bestTempo, b.bestTempo),
  };
  if (a.bestCount !== undefined || b.bestCount !== undefined) out.bestCount = max(a.bestCount, b.bestCount);
  return out;
}

/**
 * Combine progress from two devices. Every rule keeps the best of both and gives the same
 * answer however often it runs, so syncing again never double-counts.
 */
export function mergeProgress(a: ProgressData, b: ProgressData): ProgressData {
  const lessons: Record<string, LessonRecord> = { ...a.lessons };
  for (const [id, r] of Object.entries(b.lessons ?? {})) lessons[id] = lessons[id] ? mergeLesson(lessons[id], r) : r;
  const days: Record<string, number> = { ...a.days };
  for (const [k, v] of Object.entries(b.days ?? {})) days[k] = max(days[k], v);
  const achievements: Record<string, number> = { ...a.achievements };
  for (const [k, v] of Object.entries(b.achievements ?? {})) achievements[k] = achievements[k] ? Math.min(achievements[k], v) : v;
  const last = (id?: string) => (id ? lessons[id]?.lastPlayed ?? 0 : -1);
  return {
    lessons,
    xp: max(a.xp, b.xp),
    days,
    achievements,
    lastLessonId: last(b.lastLessonId) > last(a.lastLessonId) ? b.lastLessonId : a.lastLessonId ?? b.lastLessonId,
    bestStreak: max(a.bestStreak, b.bestStreak),
    notesHit: max(a.notesHit, b.notesHit),
  };
}

/** Combine player-made tabs: the most recently changed copy wins, deletions included. */
export function mergeTabs(a: Record<string, CustomTab>, b: Record<string, CustomTab>): Record<string, CustomTab> {
  const out: Record<string, CustomTab> = { ...a };
  for (const [id, t] of Object.entries(b ?? {})) {
    if (!out[id] || t.updatedAt > out[id].updatedAt) out[id] = t;
  }
  return out;
}

/** Stable JSON for comparing states (key order does not matter). */
export function stableJson(v: unknown): string {
  if (Array.isArray(v)) return `[${v.map(stableJson).join(',')}]`;
  if (v && typeof v === 'object') {
    return `{${Object.keys(v as object)
      .filter((k) => (v as Record<string, unknown>)[k] !== undefined)
      .sort()
      .map((k) => `${JSON.stringify(k)}:${stableJson((v as Record<string, unknown>)[k])}`)
      .join(',')}}`;
  }
  return JSON.stringify(v);
}

export function isPayload(v: unknown): v is SyncPayload {
  const p = v as SyncPayload;
  return !!p && p.app === 'fretforge' && typeof p.progress === 'object' && p.progress !== null && typeof p.progress.lessons === 'object';
}
