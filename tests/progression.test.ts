import { describe, expect, it } from 'vitest';
import {
  ACHIEVEMENTS,
  EMPTY_PROGRESS,
  addPracticeTime,
  applyRun,
  dayKey,
  drillStars,
  isChapterUnlocked,
  isLessonUnlocked,
  nextRecommended,
  rankFor,
  streakDays,
  type ProgressData,
} from '../src/game/progression';
import { CHAPTERS, getLesson } from '../src/content/curriculum';
import { buildArrangement, bassRoot, backingVoicing } from '../src/game/arrangement';
import { buildChart } from '../src/game/chart';
import { ALL_LESSONS, isPlayable } from '../src/content/curriculum';

const DAY = 86_400_000;
const NOW = new Date(2026, 10, 13, 18, 0, 0).getTime();

function withStars(ids: string[], stars = 1): ProgressData {
  let p = EMPTY_PROGRESS;
  for (const id of ids) p = applyRun(p, { lessonId: id, mode: 'play', stars, score: 100, accuracy: 0.9, tempo: 1 }, NOW).next;
  return p;
}

describe('progression', () => {
  it('starts with the first lesson recommended and later chapters locked', () => {
    expect(nextRecommended(EMPTY_PROGRESS).id).toBe('garage-meet');
    expect(isChapterUnlocked(EMPTY_PROGRESS, 0)).toBe(true);
    expect(isChapterUnlocked(EMPTY_PROGRESS, 1)).toBe(false);
    expect(isLessonUnlocked(EMPTY_PROGRESS, 'garage-meet')).toBe(true);
    expect(isLessonUnlocked(EMPTY_PROGRESS, 'garage-tune')).toBe(false);
    expect(isLessonUnlocked(EMPTY_PROGRESS, 'garage-tune', true)).toBe(true);
  });

  it('unlocks the next lesson and the next chapter after its gig', () => {
    const p = withStars(['garage-meet']);
    expect(isLessonUnlocked(p, 'garage-tune')).toBe(true);
    expect(nextRecommended(p).id).toBe('garage-tune');
    const garage = CHAPTERS[0].lessons.map((l) => l.id);
    const done = withStars(garage);
    expect(isChapterUnlocked(done, 1)).toBe(true);
    expect(isLessonUnlocked(done, 'basement-fretting')).toBe(true);
    expect(nextRecommended(done).id).toBe(CHAPTERS[1].lessons[0].id);
  });

  it('awards XP for new stars only, plus a little for practice', () => {
    const first = applyRun(EMPTY_PROGRESS, { lessonId: 'garage-gig', mode: 'play', stars: 2, score: 5000, accuracy: 0.85, tempo: 1 }, NOW);
    expect(first.newStars).toBe(2);
    expect(first.xpGained).toBeGreaterThanOrEqual(100);
    const again = applyRun(first.next, { lessonId: 'garage-gig', mode: 'play', stars: 1, score: 3000, accuracy: 0.7, tempo: 1 }, NOW);
    expect(again.newStars).toBe(2);
    expect(again.xpGained).toBeLessThan(20);
    expect(again.next.lessons['garage-gig'].bestScore).toBe(5000);
    expect(again.next.lessons['garage-gig'].plays).toBe(2);
    expect(first.unlocked.map((a) => a.id)).toContain('garage-gig');
  });

  it('caps stars for walkthrough lessons', () => {
    const r = applyRun(EMPTY_PROGRESS, { lessonId: 'garage-meet', mode: 'learn', stars: 3, score: 0, accuracy: 1, tempo: 1 }, NOW);
    expect(r.newStars).toBe(1);
  });

  it('ranks go up with XP', () => {
    expect(rankFor(0).rank.title).toBe('Rookie');
    expect(rankFor(160).rank.title).toBe('Garage Rat');
    expect(rankFor(100000).next).toBeNull();
    expect(rankFor(275).progress).toBeCloseTo(0.5, 1);
  });

  it('counts practice streaks across days', () => {
    let p = EMPTY_PROGRESS;
    for (let d = 0; d < 4; d++) p = addPracticeTime(p, 300, NOW - d * DAY).next;
    expect(streakDays(p.days, NOW)).toBe(4);
    // Nothing yet today: the streak from yesterday still counts.
    expect(streakDays(p.days, NOW + DAY)).toBe(4);
    expect(streakDays(p.days, NOW + 2 * DAY)).toBe(0);
    expect(dayKey(NOW)).toBe('2026-11-13');
    expect(p.achievements['streak-3']).toBeDefined();
  });

  it('every achievement can be checked without crashing', () => {
    for (const a of ACHIEVEMENTS) expect(typeof a.check(EMPTY_PROGRESS)).toBe('boolean');
  });

  it('drill stars scale with changes per minute', () => {
    expect(drillStars(3, 60)).toBe(0);
    expect(drillStars(8, 60)).toBe(1);
    expect(drillStars(16, 60)).toBe(2);
    expect(drillStars(30, 60)).toBe(3);
  });
});

describe('band arrangement', () => {
  it('maps root names into the bass register', () => {
    expect(bassRoot('E')).toBe(28);
    expect(bassRoot('A')).toBe(33);
    expect(bassRoot('D')).toBe(38);
    expect(bassRoot('C')).toBe(36);
    expect(bassRoot('F#')).toBe(30);
    expect(bassRoot('Bb')).toBe(34);
  });

  it('voices backing chords', () => {
    expect(backingVoicing('Am').map((n) => n.midi)).toEqual([45, 52, 57, 60, 64]);
    expect(backingVoicing('F').length).toBeGreaterThanOrEqual(4);
  });

  it('builds a full band for every playable lesson', () => {
    for (const lesson of ALL_LESSONS.filter(isPlayable)) {
      const chart = buildChart(lesson, 1);
      const arr = buildArrangement(chart, { metronome: false, guide: true, band: true, drums: true });
      expect(arr.countIn).toBeGreaterThan(0);
      const clicks = arr.events.filter((e) => e.type === 'click' && e.countIn);
      expect(clicks.length).toBe(arr.countInBeats);
      const guide = arr.events.filter((e) => e.type === 'guide');
      expect(guide.length).toBe(chart.notes.length);
      for (let i = 1; i < arr.events.length; i++) expect(arr.events[i].t).toBeGreaterThanOrEqual(arr.events[i - 1].t);
      if (lesson.kind === 'song') {
        expect(arr.events.some((e) => e.type === 'drum'), lesson.id).toBe(true);
        expect(arr.events.some((e) => e.type === 'bass'), lesson.id).toBe(true);
      }
      const end = chart.duration + 0.001;
      expect(arr.events.every((e) => e.t <= end), lesson.id).toBe(true);
    }
  });

  it('can leave out the pitched parts (speakers mode)', () => {
    const chart = buildChart(getLesson('skate-gig'), 1);
    const arr = buildArrangement(chart, { metronome: true, guide: false, band: false, drums: true });
    expect(arr.events.some((e) => e.type === 'guide' || e.type === 'bass' || e.type === 'backing')).toBe(false);
    expect(arr.events.some((e) => e.type === 'drum')).toBe(true);
    expect(arr.events.filter((e) => e.type === 'click' && !e.countIn).length).toBe(chart.totalBeats);
  });
});
