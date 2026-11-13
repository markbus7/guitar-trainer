import { garage } from './chapters/01-garage';
import { basement } from './chapters/02-basement';
import { divebar } from './chapters/03-divebar';
import { skatepark } from './chapters/04-skatepark';
import { campfire } from './chapters/05-campfire';
import { furnace } from './chapters/06-furnace';
import { theater } from './chapters/07-theater';
import { arena } from './chapters/08-arena';
import { mainstage } from './chapters/09-mainstage';
import { SONGBOOK } from './songbook';
import type { Chapter, Lesson } from './types';

/** The tour: nine stops from the garage to the main stage. */
export const CHAPTERS: Chapter[] = [garage, basement, divebar, skatepark, campfire, furnace, theater, arena, mainstage];

/** Every lesson on the tour, in order. */
export const ALL_LESSONS: Lesson[] = CHAPTERS.flatMap((c) => c.lessons);

/** Free play: original songs that live outside the tour and are always open. */
export const SONGBOOK_CHAPTER: Chapter = {
  id: 'songbook',
  venue: 'Free play',
  title: 'Songbook',
  blurb: 'Every song, open from day one. Pick what you like and play.',
  accent: '#ff8a3d',
  art: 'mainstage',
  lessons: SONGBOOK,
};

/** Tabs the player pasted in themselves (kept in their browser). */
export const MY_TABS_CHAPTER: Chapter = {
  id: 'mytabs',
  venue: 'My tabs',
  title: 'My tabs',
  blurb: 'Tabs you added yourself.',
  accent: '#5cc8ff',
  art: 'garage',
  lessons: [],
};

/** Prefix for the ids of player-made tabs. */
export const CUSTOM_PREFIX = 'my-';

/** Lessons that count towards stars and totals: the tour plus the songbook. */
export const SCORED_LESSONS: Lesson[] = [...ALL_LESSONS, ...SONGBOOK];

/** Every song you can pick in Free play: the songbook first, then the tour's gigs. */
export const FREE_PLAY_SONGS: Lesson[] = [...SONGBOOK, ...ALL_LESSONS.filter((l) => l.kind === 'song')];

type Entry = { lesson: Lesson; chapter: Chapter; index: number };
const lessonIndex = new Map<string, Entry>();
CHAPTERS.forEach((chapter) => chapter.lessons.forEach((lesson, index) => lessonIndex.set(lesson.id, { lesson, chapter, index })));
SONGBOOK.forEach((lesson, index) => lessonIndex.set(lesson.id, { lesson, chapter: SONGBOOK_CHAPTER, index }));

/** Make player-made tabs findable by id (called whenever the list changes). */
export function registerCustomLessons(lessons: Lesson[]) {
  for (const [id, entry] of lessonIndex) if (entry.chapter === MY_TABS_CHAPTER) lessonIndex.delete(id);
  MY_TABS_CHAPTER.lessons = lessons;
  lessons.forEach((lesson, index) => lessonIndex.set(lesson.id, { lesson, chapter: MY_TABS_CHAPTER, index }));
}

export function findLesson(id: string) {
  return lessonIndex.get(id);
}

export function getLesson(id: string): Lesson {
  const l = lessonIndex.get(id);
  if (!l) throw new Error(`Unknown lesson ${id}`);
  return l.lesson;
}

export function getChapter(id: string): Chapter | undefined {
  return CHAPTERS.find((c) => c.id === id);
}

/** True for lessons on the tour (as opposed to the songbook and player-made tabs). */
export function isTourLesson(id: string) {
  const c = lessonIndex.get(id)?.chapter;
  return !!c && c !== SONGBOOK_CHAPTER && c !== MY_TABS_CHAPTER;
}

/** True for Free play content: songbook songs and player-made tabs. */
export function isFreePlay(id: string) {
  const c = lessonIndex.get(id)?.chapter;
  return c === SONGBOOK_CHAPTER || c === MY_TABS_CHAPTER;
}

export function nextLesson(id: string): Lesson | undefined {
  const entry = lessonIndex.get(id);
  if (!entry) return undefined;
  if (entry.chapter === MY_TABS_CHAPTER) return undefined;
  if (entry.chapter === SONGBOOK_CHAPTER) return SONGBOOK[entry.index + 1];
  const i = ALL_LESSONS.findIndex((l) => l.id === id);
  return i >= 0 ? ALL_LESSONS[i + 1] : undefined;
}

/** Lessons that are played on the highway (as opposed to walk-throughs and drills). */
export function isPlayable(lesson: Lesson) {
  return lesson.kind === 'exercise' || lesson.kind === 'riff' || lesson.kind === 'song';
}

/** Most stars a lesson can award. */
export function maxStars(lesson: Lesson) {
  return isPlayable(lesson) ? 3 : 1;
}
