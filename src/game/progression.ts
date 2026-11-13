import { CHAPTERS, CUSTOM_PREFIX, findLesson, maxStars } from '../content/curriculum';
import type { Chapter, Lesson } from '../content/types';

/**
 * Progress rules: stars, XP, ranks, daily streaks, soft locks and achievements.
 * Pure functions over plain data, so they are easy to test and to persist.
 */
export interface LessonRecord {
  stars: number;
  bestScore: number;
  /** 0..1 */
  bestAccuracy: number;
  plays: number;
  lastPlayed: number;
  /** Highest tempo at which the lesson was passed. */
  bestTempo: number;
  /** Chord drills: best number of changes. */
  bestCount?: number;
}

export interface ProgressData {
  lessons: Record<string, LessonRecord>;
  xp: number;
  /** Seconds practised per local day, keyed "YYYY-MM-DD". */
  days: Record<string, number>;
  /** Achievement id → time unlocked. */
  achievements: Record<string, number>;
  lastLessonId?: string;
  bestStreak: number;
  notesHit: number;
}

export const EMPTY_PROGRESS: ProgressData = {
  lessons: {},
  xp: 0,
  days: {},
  achievements: {},
  bestStreak: 0,
  notesHit: 0,
};

export type RunMode = 'play' | 'practice' | 'learn' | 'drill';

export interface RunResult {
  lessonId: string;
  mode: RunMode;
  stars: number;
  score: number;
  accuracy: number;
  tempo: number;
  maxStreak?: number;
  notesHit?: number;
  /** Chord drill: number of changes. */
  count?: number;
}

export interface Rank {
  id: number;
  title: string;
  xp: number;
}

export const RANKS: Rank[] = [
  { id: 0, title: 'Rookie', xp: 0 },
  { id: 1, title: 'Garage Rat', xp: 150 },
  { id: 2, title: 'Basement Hero', xp: 400 },
  { id: 3, title: 'Bar Brawler', xp: 750 },
  { id: 4, title: 'Skate Punk', xp: 1200 },
  { id: 5, title: 'Campfire Legend', xp: 1800 },
  { id: 6, title: 'Riff Forger', xp: 2600 },
  { id: 7, title: 'Stage Stealer', xp: 3600 },
  { id: 8, title: 'Arena Titan', xp: 4800 },
  { id: 9, title: 'Fretforge Legend', xp: 6500 },
];

export function rankFor(xp: number): { rank: Rank; next: Rank | null; progress: number } {
  let i = 0;
  while (i + 1 < RANKS.length && xp >= RANKS[i + 1].xp) i++;
  const rank = RANKS[i];
  const next = RANKS[i + 1] ?? null;
  const progress = next ? (xp - rank.xp) / (next.xp - rank.xp) : 1;
  return { rank, next, progress };
}

const STAR_XP: Record<Lesson['kind'], number> = { learn: 40, exercise: 25, riff: 35, song: 50, drill: 30 };

export function dayKey(d: Date | number = Date.now()): string {
  const date = typeof d === 'number' ? new Date(d) : d;
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Days in a row with practice, ending today (or yesterday, if today has none yet). */
export function streakDays(days: Record<string, number>, now = Date.now(), minSeconds = 60): number {
  const has = (t: number) => (days[dayKey(t)] ?? 0) >= minSeconds;
  const DAY = 86_400_000;
  let t = now;
  if (!has(t)) t -= DAY;
  let n = 0;
  // Step by calendar days via noon to avoid DST edge cases.
  const d = new Date(t);
  d.setHours(12, 0, 0, 0);
  while (has(d.getTime())) {
    n++;
    d.setDate(d.getDate() - 1);
  }
  return n;
}

/** Stars from the tour and the songbook (tabs you added yourself don't count). */
export function totalStars(p: ProgressData) {
  let n = 0;
  for (const [id, r] of Object.entries(p.lessons)) if (!id.startsWith(CUSTOM_PREFIX)) n += r.stars;
  return n;
}

export function totalSeconds(p: ProgressData) {
  return Object.values(p.days).reduce((a, s) => a + s, 0);
}

export function lessonStars(p: ProgressData, id: string) {
  return p.lessons[id]?.stars ?? 0;
}

export function chapterStars(p: ProgressData, ch: Chapter) {
  let got = 0;
  let max = 0;
  for (const l of ch.lessons) {
    got += lessonStars(p, l.id);
    max += maxStars(l);
  }
  return { got, max };
}

export function isChapterUnlocked(p: ProgressData, chapterIndex: number, unlockAll = false): boolean {
  if (unlockAll || chapterIndex <= 0) return true;
  const prev = CHAPTERS[chapterIndex - 1];
  const gig = prev.lessons[prev.lessons.length - 1];
  if (lessonStars(p, gig.id) > 0) return true;
  // Already started here (e.g. skipped ahead earlier): keep it open.
  return CHAPTERS[chapterIndex].lessons.some((l) => lessonStars(p, l.id) > 0);
}

export function isLessonUnlocked(p: ProgressData, lessonId: string, unlockAll = false): boolean {
  if (unlockAll) return true;
  const ci = CHAPTERS.findIndex((c) => c.lessons.some((l) => l.id === lessonId));
  // Free play (songbook and your own tabs) is always open.
  if (ci < 0) return true;
  if (!isChapterUnlocked(p, ci)) return false;
  const lessons = CHAPTERS[ci].lessons;
  const li = lessons.findIndex((l) => l.id === lessonId);
  if (li === 0) return true;
  if (lessonStars(p, lessons[li - 1].id) > 0) return true;
  return lessons.slice(li).some((l) => lessonStars(p, l.id) > 0);
}

/** The lesson to suggest on the home screen. */
export function nextRecommended(p: ProgressData, unlockAll = false): Lesson {
  const all = CHAPTERS.flatMap((c) => c.lessons);
  const fresh = all.find((l) => lessonStars(p, l.id) === 0 && isLessonUnlocked(p, l.id, unlockAll));
  if (fresh) return fresh;
  const improvable = all.find((l) => lessonStars(p, l.id) < maxStars(l));
  return improvable ?? all[all.length - 1];
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  check: (p: ProgressData, run?: RunResult) => boolean;
}

const passed = (id: string) => (p: ProgressData) => lessonStars(p, id) > 0;

export const ACHIEVEMENTS: Achievement[] = [
  { id: 'first-lesson', title: 'First Noise', description: 'Finish your first lesson.', check: (p) => totalStars(p) > 0 },
  { id: 'garage-gig', title: 'Garage Band', description: 'Play your first gig.', check: passed('garage-gig') },
  { id: 'power', title: 'Power Up', description: 'Rock the Dive Bar with power chords.', check: passed('bar-gig') },
  { id: 'punk', title: 'Skate or Die', description: 'Survive the Skatepark gig.', check: passed('skate-gig') },
  { id: 'campfire', title: 'Singalong', description: 'Strum through the Campfire gig.', check: passed('camp-gig') },
  { id: 'metal', title: 'Forged in Fire', description: 'Chug your way through the Furnace.', check: passed('furnace-gig') },
  { id: 'lead', title: 'Spotlight', description: 'Play your first solo in the Theater.', check: passed('theater-gig') },
  { id: 'arena', title: 'Thunder', description: 'Conquer the Arena in drop D.', check: passed('arena-gig') },
  {
    id: 'headliner',
    title: 'Headliner',
    description: 'Play every song on the Main Stage.',
    check: (p) => CHAPTERS[CHAPTERS.length - 1].lessons.every((l) => lessonStars(p, l.id) > 0),
  },
  {
    id: 'flawless',
    title: 'Flawless',
    description: 'Hit every single note in a run.',
    check: (_p, run) => !!run && run.mode === 'play' && run.accuracy >= 0.999,
  },
  { id: 'on-fire', title: 'On Fire', description: 'Hit 50 notes in a row.', check: (p) => p.bestStreak >= 50 },
  { id: 'unstoppable', title: 'Unstoppable', description: 'Hit 150 notes in a row.', check: (p) => p.bestStreak >= 150 },
  { id: 'streak-3', title: 'Habit', description: 'Practise three days in a row.', check: (p) => streakDays(p.days) >= 3 },
  { id: 'streak-7', title: 'Week Warrior', description: 'Practise seven days in a row.', check: (p) => streakDays(p.days) >= 7 },
  { id: 'calluses', title: 'Calluses', description: 'Practise for an hour in total.', check: (p) => totalSeconds(p) >= 3600 },
  { id: 'stars-50', title: 'Star Collector', description: 'Collect 50 stars.', check: (p) => totalStars(p) >= 50 },
  {
    id: 'crate-digger',
    title: 'Crate Digger',
    description: 'Play 5 different songs from the Free play songbook.',
    check: (p) => Object.entries(p.lessons).filter(([id, r]) => id.startsWith('sb-') && r.stars > 0).length >= 5,
  },
  {
    id: 'own-material',
    title: 'Own Material',
    description: 'Play a tab you added yourself.',
    check: (p) => Object.entries(p.lessons).some(([id, r]) => id.startsWith(CUSTOM_PREFIX) && r.stars > 0),
  },
  { id: 'notes-1000', title: 'Thousand Notes', description: 'Play 1,000 correct notes.', check: (p) => p.notesHit >= 1000 },
];

export interface RunOutcome {
  next: ProgressData;
  xpGained: number;
  prevStars: number;
  newStars: number;
  unlocked: Achievement[];
  rankUp: Rank | null;
  newBest: boolean;
}

export function applyRun(p: ProgressData, run: RunResult, now = Date.now()): RunOutcome {
  // A tab you added yourself may since have been deleted: score it like a song.
  const lesson: Pick<Lesson, 'kind'> & Partial<Lesson> = findLesson(run.lessonId)?.lesson ?? { kind: 'song' };
  const prev = p.lessons[run.lessonId];
  const prevStars = prev?.stars ?? 0;
  const stars = Math.max(0, Math.min(maxStars(lesson as Lesson), run.stars));
  const gained = Math.max(0, stars - prevStars);
  const participation = run.mode === 'learn' ? (prevStars > 0 ? 5 : 0) : Math.round(4 + run.accuracy * 8);
  const xpGained = gained * STAR_XP[lesson.kind] + participation;

  const newBest = !prev || run.score > prev.bestScore || (run.count ?? 0) > (prev.bestCount ?? 0);
  const record: LessonRecord = {
    stars: Math.max(prevStars, stars),
    bestScore: Math.max(prev?.bestScore ?? 0, run.score),
    bestAccuracy: Math.max(prev?.bestAccuracy ?? 0, run.mode === 'play' || run.mode === 'drill' ? run.accuracy : 0),
    plays: (prev?.plays ?? 0) + 1,
    lastPlayed: now,
    bestTempo: stars > 0 ? Math.max(prev?.bestTempo ?? 0, run.tempo) : prev?.bestTempo ?? 0,
    bestCount: run.count !== undefined ? Math.max(prev?.bestCount ?? 0, run.count) : prev?.bestCount,
  };

  const next: ProgressData = {
    ...p,
    lessons: { ...p.lessons, [run.lessonId]: record },
    xp: p.xp + xpGained,
    lastLessonId: run.lessonId,
    bestStreak: Math.max(p.bestStreak, run.maxStreak ?? 0),
    notesHit: p.notesHit + (run.notesHit ?? 0),
    achievements: { ...p.achievements },
  };

  const unlocked: Achievement[] = [];
  for (const a of ACHIEVEMENTS) {
    if (next.achievements[a.id]) continue;
    if (a.check(next, run)) {
      next.achievements[a.id] = now;
      unlocked.push(a);
    }
  }
  const before = rankFor(p.xp).rank;
  const after = rankFor(next.xp).rank;
  return { next, xpGained, prevStars, newStars: record.stars, unlocked, rankUp: after.id > before.id ? after : null, newBest };
}

/** Add practice time for today; returns achievements newly unlocked by it. */
export function addPracticeTime(p: ProgressData, seconds: number, now = Date.now()): { next: ProgressData; unlocked: Achievement[] } {
  const key = dayKey(now);
  const next: ProgressData = { ...p, days: { ...p.days, [key]: (p.days[key] ?? 0) + seconds }, achievements: { ...p.achievements } };
  const unlocked: Achievement[] = [];
  for (const a of ACHIEVEMENTS) {
    if (next.achievements[a.id]) continue;
    if ((a.id.startsWith('streak') || a.id === 'calluses') && a.check(next)) {
      next.achievements[a.id] = now;
      unlocked.push(a);
    }
  }
  return { next, unlocked };
}

/** Stars for a chord-change drill. */
export function drillStars(changes: number, seconds: number): number {
  const perMinute = (changes * 60) / seconds;
  return perMinute >= 24 ? 3 : perMinute >= 14 ? 2 : perMinute >= 6 ? 1 : 0;
}
