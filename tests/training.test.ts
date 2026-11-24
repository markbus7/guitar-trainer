import { describe, expect, it } from 'vitest';
import { CHAPTERS, getLesson, lessonParts, partLesson } from '../src/content/curriculum';
import { buildChart } from '../src/game/chart';
import { nextLoopTempo } from '../src/game/loop';
import { EMPTY_PROGRESS, applyRun, chapterUnlockLesson, isChapterUnlocked, type ProgressData } from '../src/game/progression';
import { TRAINER_LEVELS, levelPositions, nextQuestion, trainerRecordId } from '../src/game/trainers';
import { buildWorkout, isWorkoutItemDone, playerLevel } from '../src/game/workout';
import { tapTempo } from '../src/audio/metronome';
import { pitchClass } from '../src/music/notes';

const NOW = new Date(2026, 10, 24, 18, 0, 0).getTime();
const pass = (p: ProgressData, id: string, stars = 1) => applyRun(p, { lessonId: id, mode: 'play', stars, score: 1000, accuracy: 0.9, tempo: 1 }, NOW).next;

describe('loop trainer', () => {
  it('lists each distinct part of a song once', () => {
    const song = getLesson('stage-thunder-lane');
    const parts = lessonParts(song);
    const names = parts.map((p) => p.name);
    expect(names).toContain('Verse');
    expect(names).toContain('Chorus');
    expect(new Set(parts.map((p) => p.index)).size).toBe(parts.length);
    // Thunder Lane has two verses with the same tab: listed once.
    expect(names.filter((n) => n === 'Verse')).toHaveLength(1);
  });

  it('builds a short chart for one part', () => {
    const song = getLesson('stage-thunder-lane');
    const full = buildChart(song, 1);
    const part = partLesson(song, 1)!;
    expect(part.sections).toHaveLength(1);
    const chart = buildChart(part, 1);
    expect(chart.notes.length).toBeGreaterThan(4);
    expect(chart.notes.length).toBeLessThan(full.notes.length);
    expect(partLesson(song, 99)).toBeNull();
  });

  it('speeds up after clean passes and slows down when it is a struggle', () => {
    expect(nextLoopTempo(0.7, 0.95, true)).toBe(0.75);
    expect(nextLoopTempo(0.98, 0.95, true)).toBe(1);
    expect(nextLoopTempo(0.7, 0.75, true)).toBe(0.7);
    expect(nextLoopTempo(0.7, 0.3, true)).toBe(0.65);
    expect(nextLoopTempo(0.5, 0.3, true)).toBe(0.5);
    expect(nextLoopTempo(0.7, 0.95, false)).toBe(0.7);
  });
});

describe('note finder and echo', () => {
  it('only asks natural notes on natural-note levels', () => {
    const level = TRAINER_LEVELS.find((l) => l.id === 'notes-e')!;
    const names = levelPositions(level).map((q) => pitchClass(q.midi));
    for (const pc of names) expect([0, 2, 4, 5, 7, 9, 11]).toContain(pc);
    expect(levelPositions(level).every((q) => q.string === 6)).toBe(true);
  });

  it('never asks the same note twice in a row', () => {
    for (const level of TRAINER_LEVELS) {
      let q = nextQuestion(level, null);
      for (let i = 0; i < 60; i++) {
        const n = nextQuestion(level, q);
        expect(pitchClass(n.midi)).not.toBe(pitchClass(q.midi));
        expect(level.strings).toContain(n.string);
        expect(n.fret).toBeGreaterThanOrEqual(level.frets[0]);
        expect(n.fret).toBeLessThanOrEqual(level.frets[1]);
        q = n;
      }
    }
  });

  it('keeps game bests in progress without awarding stars', () => {
    const id = trainerRecordId('notes-e');
    const p = applyRun(EMPTY_PROGRESS, { lessonId: id, mode: 'drill', stars: 0, score: 1200, accuracy: 0.8, tempo: 1, count: 12 }, NOW).next;
    expect(p.lessons[id].bestCount).toBe(12);
    expect(p.lessons[id].stars).toBe(0);
  });
});

describe('metronome', () => {
  it('finds the tempo from taps', () => {
    expect(tapTempo([0])).toBeNull();
    expect(tapTempo([0, 500, 1000, 1500])).toBe(120);
    expect(tapTempo([0, 1000])).toBe(60);
  });
});

describe('the studio', () => {
  it('opens after the campfire gig, not after the arena', () => {
    const ci = CHAPTERS.findIndex((c) => c.id === 'studio');
    expect(ci).toBeGreaterThan(0);
    expect(chapterUnlockLesson(ci).id).toBe('camp-gig');
    expect(isChapterUnlocked(EMPTY_PROGRESS, ci)).toBe(false);
    expect(isChapterUnlocked(pass(EMPTY_PROGRESS, 'camp-gig'), ci)).toBe(true);
  });

  it('keeps the main stage behind the arena gig', () => {
    const ci = CHAPTERS.findIndex((c) => c.id === 'mainstage');
    expect(ci).toBe(CHAPTERS.length - 1);
    expect(chapterUnlockLesson(ci).id).toBe('arena-gig');
    expect(isChapterUnlocked(pass(EMPTY_PROGRESS, 'camp-gig'), ci)).toBe(false);
    expect(isChapterUnlocked(pass(EMPTY_PROGRESS, 'arena-gig'), ci)).toBe(true);
  });
});

describe("today's workout", () => {
  it('gives a beginner a short plan that starts at the beginning', () => {
    const items = buildWorkout(EMPTY_PROGRESS, '2026-11-24');
    expect(items[0].kind).toBe('tune');
    expect(items.find((i) => i.kind === 'learn')?.doneId).toBe('garage-meet');
    expect(items.some((i) => i.kind === 'warmup')).toBe(false);
    expect(items.some((i) => i.kind === 'train')).toBe(true);
    for (const it of items) expect(it.route.startsWith('/')).toBe(true);
  });

  it('adds a warm-up once one is learned and marks items done when played today', () => {
    let p = pass(EMPTY_PROGRESS, 'garage-strings');
    const items = buildWorkout(p, '2026-11-24');
    const warm = items.find((i) => i.kind === 'warmup');
    expect(warm?.doneId).toBe('garage-strings');
    expect(isWorkoutItemDone(warm!, p, '2026-11-24')).toBe(true);
    expect(isWorkoutItemDone(warm!, p, '2026-11-25')).toBe(false);
    const tune = items[0];
    expect(isWorkoutItemDone(tune, p, '2026-11-24', '2026-11-24')).toBe(true);
    p = pass(p, 'bar-gig');
    expect(playerLevel(p)).toBe(1);
  });

  it('is the same all day and changes between days', () => {
    const a = buildWorkout(EMPTY_PROGRESS, '2026-11-24');
    expect(buildWorkout(EMPTY_PROGRESS, '2026-11-24')).toEqual(a);
    const days = ['2026-11-25', '2026-11-26', '2026-11-27', '2026-11-28', '2026-11-29'].map((d) => JSON.stringify(buildWorkout(EMPTY_PROGRESS, d)));
    expect(new Set([JSON.stringify(a), ...days]).size).toBeGreaterThan(1);
  });
});
