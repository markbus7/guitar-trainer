import { describe, expect, it } from 'vitest';
import { ALL_LESSONS, CHAPTERS, FREE_PLAY_SONGS, SCORED_LESSONS, SONGBOOK_CHAPTER, isPlayable, isTourLesson } from '../src/content/curriculum';
import { SONGBOOK } from '../src/content/songbook';
import { buildChart } from '../src/game/chart';
import { CHORDS } from '../src/music/chords';
import { parseTab } from '../src/music/tab';
import type { Figure } from '../src/content/types';

function figureChords(f?: Figure): string[] {
  if (!f) return [];
  if (f.type === 'chord') return [f.chord];
  if (f.type === 'chords') return f.chords;
  return [];
}

describe('curriculum', () => {
  it('has unique lesson ids', () => {
    const ids = SCORED_LESSONS.map((l) => l.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('keeps the songbook apart from the tour', () => {
    expect(SONGBOOK.length).toBeGreaterThanOrEqual(15);
    expect(SONGBOOK_CHAPTER.lessons).toBe(SONGBOOK);
    for (const l of SONGBOOK) {
      expect(l.id.startsWith('sb-'), l.id).toBe(true);
      expect(l.kind, l.id).toBe('song');
      expect(l.band, l.id).toBeTruthy();
      expect(isTourLesson(l.id), l.id).toBe(false);
    }
    expect(ALL_LESSONS.every((l) => isTourLesson(l.id))).toBe(true);
  });

  it('sorts the songbook from easy to hard', () => {
    const levels = SONGBOOK.map((l) => l.level ?? 0);
    expect(levels).toEqual([...levels].sort((a, b) => a - b));
    for (const level of [1, 2, 3, 4, 5]) expect(levels.filter((x) => x === level).length, `level ${level}`).toBeGreaterThanOrEqual(2);
  });

  it('gives every Free play song a genre and a level for the filters', () => {
    expect(FREE_PLAY_SONGS.length).toBe(SONGBOOK.length + CHAPTERS.length + 3);
    for (const l of FREE_PLAY_SONGS) {
      expect(l.genre, l.id).toBeTruthy();
      expect(l.level, l.id).toBeGreaterThanOrEqual(1);
      expect(l.level, l.id).toBeLessThanOrEqual(5);
    }
    for (const genre of ['pop-punk', 'punk', 'rock', 'metal', 'acoustic']) {
      expect(FREE_PLAY_SONGS.filter((l) => l.genre === genre).length, genre).toBeGreaterThanOrEqual(3);
    }
  });

  it('ends every chapter with a gig song', () => {
    for (const c of CHAPTERS) {
      expect(c.lessons.length, c.id).toBeGreaterThanOrEqual(4);
      expect(c.lessons[c.lessons.length - 1].kind, c.id).toBe('song');
    }
  });

  for (const lesson of SCORED_LESSONS) {
    it(`lesson ${lesson.id} is well formed`, () => {
      expect(lesson.title.length).toBeGreaterThan(2);
      expect(lesson.summary.length).toBeGreaterThan(10);
      const chords = [
        ...(lesson.tips ?? []).flatMap((t) => figureChords(t.figure)),
        ...(lesson.steps ?? []).flatMap((s) => [...figureChords(s.figure), ...(s.check?.chord ? [s.check.chord] : [])]),
        ...(lesson.drill?.chords ?? []),
      ];
      for (const c of chords) expect(CHORDS[c], `${lesson.id} uses chord ${c}`).toBeDefined();
      if (lesson.kind === 'learn') expect(lesson.steps?.length).toBeGreaterThan(0);
      if (lesson.kind === 'drill') expect(lesson.drill).toBeDefined();
      if (isPlayable(lesson)) {
        expect(lesson.sections?.length).toBeGreaterThan(0);
        for (const s of lesson.sections ?? []) {
          // Throws with a helpful message if a bar is the wrong length.
          parseTab(s.tab, { tuning: lesson.tuning });
          if (s.bass && s.bass !== 'follow' && s.bass !== 'none') {
            const bars = parseTab(s.tab, { tuning: lesson.tuning }).beats / 4;
            expect(s.bass.trim().split(/\s+/).length, `${lesson.id} bass roots`).toBe(bars);
          }
          if (s.backing) {
            const bars = parseTab(s.tab, { tuning: lesson.tuning }).beats / 4;
            expect(s.backing.trim().split(/\s+/).length, `${lesson.id} backing chords`).toBe(bars);
          }
        }
        const chart = buildChart(lesson);
        expect(chart.notes.length).toBeGreaterThan(4);
        for (const n of chart.notes) {
          for (const spec of n.notes) {
            expect(spec.fret).toBeGreaterThanOrEqual(0);
            expect(spec.fret).toBeLessThanOrEqual(15);
          }
        }
        // Keep songs a sensible length for a beginner session.
        expect(chart.duration, `${lesson.id} lasts ${chart.duration.toFixed(0)} s`).toBeLessThan(150);
      }
    });
  }
});
