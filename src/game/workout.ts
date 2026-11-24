import { CHAPTERS, FREE_PLAY_SONGS, findLesson } from '../content/curriculum';
import { dayKey, isLessonUnlocked, lessonStars, nextRecommended, type ProgressData } from './progression';
import { TRAINER_LEVELS, trainerRecordId } from './trainers';

/**
 * Today's workout: a short, varied practice plan built from where the player is.
 * Tune, warm up, train a skill, learn something new, play a song for fun.
 */
export type WorkoutKind = 'tune' | 'warmup' | 'train' | 'learn' | 'song';

export interface WorkoutItem {
  kind: WorkoutKind;
  title: string;
  detail: string;
  /** Route to open (without the leading #). */
  route: string;
  /** Progress record that marks it done when played today ('tune' for the tuner). */
  doneId: string;
  minutes: number;
}

export const WORKOUT_LABEL: Record<WorkoutKind, string> = {
  tune: 'Tune up',
  warmup: 'Warm up',
  train: 'Train',
  learn: 'Learn',
  song: 'Play for fun',
};

/** Warm-ups in order of difficulty; the player gets ones they have already passed. */
const WARMUPS = ['garage-strings', 'garage-skip', 'basement-chromatic', 'basement-spider', 'skate-downstrokes', 'furnace-stamina', 'arena-alternate'];

function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

function pick<T>(xs: T[], seed: number, salt: number): T {
  return xs[(seed + salt * 7919) % xs.length];
}

/** How far along the tour the player is, as a song level from 1 to 5. */
export function playerLevel(p: ProgressData): number {
  let passed = 0;
  for (const c of CHAPTERS) if (lessonStars(p, c.lessons[c.lessons.length - 1].id) > 0) passed++;
  return Math.max(1, Math.min(5, 1 + Math.floor(passed / 2)));
}

export function buildWorkout(p: ProgressData, day = dayKey(), unlockAll = false): WorkoutItem[] {
  const seed = hash(day);
  const items: WorkoutItem[] = [];
  const lesson = (id: string) => findLesson(id)?.lesson;

  items.push({ kind: 'tune', title: 'Tune your guitar', detail: 'Thirty seconds that make everything else sound right.', route: '/tuner', doneId: 'tune', minutes: 1 });

  const warmups = WARMUPS.filter((id) => lessonStars(p, id) > 0);
  if (warmups.length) {
    // Lean towards the hardest warm-ups the player knows.
    const recent = warmups.slice(-3);
    const id = pick(recent, seed, 1);
    const l = lesson(id)!;
    items.push({ kind: 'warmup', title: l.title, detail: 'Get the fingers moving. Play it at a comfortable speed.', route: `/lesson/${id}`, doneId: id, minutes: 2 });
  }

  const next = nextRecommended(p, unlockAll);
  items.push({ kind: 'learn', title: next.title, detail: next.summary, route: `/lesson/${next.id}`, doneId: next.id, minutes: 4 });

  // A skill game, rotating by day: the fretboard, the ear, or chord changes once the player knows chords.
  const games: WorkoutItem[] = [];
  const firstUnbeaten = (game: 'notes' | 'ear') => {
    const levels = TRAINER_LEVELS.filter((l) => l.game === game);
    return levels.find((l) => (p.lessons[trainerRecordId(l.id)]?.bestCount ?? 0) < 15) ?? levels[levels.length - 1];
  };
  const nf = firstUnbeaten('notes');
  games.push({ kind: 'train', title: `Note Finder: ${nf.title}`, detail: 'Learn where the notes are. One minute against the clock.', route: `/training/notes/${nf.id}`, doneId: trainerRecordId(nf.id), minutes: 1 });
  const ear = firstUnbeaten('ear');
  games.push({ kind: 'train', title: `Echo: ${ear.title}`, detail: 'Hear a note, find it on the neck. Ear training for working out riffs.', route: `/training/ear/${ear.id}`, doneId: trainerRecordId(ear.id), minutes: 1 });
  const drills = CHAPTERS.flatMap((c) => c.lessons).filter((l) => l.kind === 'drill' && isLessonUnlocked(p, l.id, unlockAll) && lessonStars(p, l.id) > 0);
  for (const d of drills) games.push({ kind: 'train', title: d.title, detail: 'Chord changes against the clock. Beat yesterday’s count.', route: `/lesson/${d.id}`, doneId: d.id, minutes: 1 });
  items.push(pick(games, seed, 2));

  const level = playerLevel(p);
  const songs = FREE_PLAY_SONGS.filter((s) => s.id !== next.id && (s.level ?? 3) <= level && isLessonUnlocked(p, s.id, unlockAll));
  const fresh = songs.filter((s) => lessonStars(p, s.id) < 3);
  const pool = fresh.length ? fresh : songs;
  if (pool.length) {
    const song = pick(pool, seed, 3);
    items.push({ kind: 'song', title: song.title, detail: song.band ? `${song.band} · ${song.style ?? ''}`.replace(/ · $/, '') : song.summary, route: `/lesson/${song.id}`, doneId: song.id, minutes: 3 });
  }
  return items;
}

/** Whether an item was done on the given day. */
export function isWorkoutItemDone(item: WorkoutItem, p: ProgressData, day: string, tunedOn?: string): boolean {
  if (item.doneId === 'tune') return tunedOn === day;
  const rec = p.lessons[item.doneId];
  return !!rec && dayKey(rec.lastPlayed) === day;
}
