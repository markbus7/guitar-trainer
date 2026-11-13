import { garage } from './chapters/01-garage';
import { basement } from './chapters/02-basement';
import { divebar } from './chapters/03-divebar';
import { skatepark } from './chapters/04-skatepark';
import { campfire } from './chapters/05-campfire';
import { furnace } from './chapters/06-furnace';
import { theater } from './chapters/07-theater';
import { arena } from './chapters/08-arena';
import { mainstage } from './chapters/09-mainstage';
import type { Chapter, Lesson } from './types';

/** The tour: nine stops from the garage to the main stage. */
export const CHAPTERS: Chapter[] = [garage, basement, divebar, skatepark, campfire, furnace, theater, arena, mainstage];

export const ALL_LESSONS: Lesson[] = CHAPTERS.flatMap((c) => c.lessons);

const lessonIndex = new Map<string, { lesson: Lesson; chapter: Chapter; index: number }>();
CHAPTERS.forEach((chapter) =>
  chapter.lessons.forEach((lesson, index) => lessonIndex.set(lesson.id, { lesson, chapter, index })),
);

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

export function nextLesson(id: string): Lesson | undefined {
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
