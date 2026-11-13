import { describe, expect, it } from 'vitest';
import { SCORED_LESSONS, isPlayable } from '../src/content/curriculum';
import { Analyzer } from '../src/audio/dsp/analyzer';
import { buildChart } from '../src/game/chart';
import { Judge, PracticeJudge, TIMING } from '../src/game/judge';
import { routeToJudge, routeToPractice } from '../src/game/route';
import { TUNINGS } from '../src/music/notes';
import { renderPerformance } from './helpers/guitarist';
import { performChart } from './helpers/perform';

/**
 * End-to-end: a virtual guitarist plays each lesson, the audio goes through the real
 * listening engine, and the real judge scores it. A good player must score well, a
 * player hitting wrong notes must not.
 */

const LEAD_IN = 0.6;

function lowestFreq(tuning: keyof typeof TUNINGS) {
  const low = Math.min(...TUNINGS[tuning].open.slice(1));
  return 440 * Math.pow(2, (low - 69 - 0.6) / 12);
}

function play(lessonId: string, opts: { sampleRate: number; wrong?: boolean; jitter?: number; tempo?: number; mode?: 'play' | 'practice' }) {
  const lesson = SCORED_LESSONS.find((l) => l.id === lessonId)!;
  const chart = buildChart(lesson, opts.tempo ?? 1);
  const notes = performChart(chart, { leadIn: LEAD_IN, jitter: opts.jitter ?? 0.012, wrong: opts.wrong, seed: lessonId.length });
  const audio = renderPerformance(notes, { sampleRate: opts.sampleRate, duration: LEAD_IN + chart.duration + 1.5, noiseDb: -62 });
  const analyzer = new Analyzer({ sampleRate: opts.sampleRate, minFreq: lowestFreq(chart.tuning) });
  const judge = new Judge(chart, TIMING.normal);
  const chunk = 512;
  for (let i = 0; i < audio.length; i += chunk) {
    const events = analyzer.process(audio.subarray(i, Math.min(audio.length, i + chunk)), i);
    for (const e of events) routeToJudge(judge, e, (t) => t - LEAD_IN);
    judge.advance((i + chunk) / opts.sampleRate - LEAD_IN - 0.05);
  }
  judge.advance(chart.duration + 10);
  return { stats: judge.stats(), chart, judge };
}

/**
 * Practice mode: the highway waits, so the player plays one target at a time with a
 * pause in between. Every target must be recognisable on its own.
 */
function practice(lessonId: string, sampleRate: number, count = 24) {
  const lesson = SCORED_LESSONS.find((l) => l.id === lessonId)!;
  const chart = buildChart(lesson, 1);
  const targets = chart.notes.slice(0, count);
  const gap = 0.7;
  // Re-time the chart so each target gets its own slot, then let the virtual player perform it.
  const spaced = { ...chart, notes: targets.map((n, i) => ({ ...n, time: i * gap, dur: Math.min(n.dur, gap) })) };
  const notes = performChart(spaced, { leadIn: LEAD_IN, jitter: 0, seed: 5 });
  const audio = renderPerformance(notes, { sampleRate, duration: LEAD_IN + targets.length * gap + 1, noiseDb: -62 });
  const analyzer = new Analyzer({ sampleRate, minFreq: lowestFreq(chart.tuning) });
  const judge = new PracticeJudge(targets, TIMING.normal.chordLeniency);
  for (let i = 0; i < audio.length; i += 512) {
    for (const e of analyzer.process(audio.subarray(i, Math.min(audio.length, i + 512)), i)) routeToPractice(judge, e);
  }
  return { judge, targets };
}

const playable = SCORED_LESSONS.filter(isPlayable);

describe('virtual guitarist plays every lesson', () => {
  playable.forEach((lesson, i) => {
    const sampleRate = i % 2 === 0 ? 48000 : 44100;
    it(`${lesson.id} scores high when played well (${sampleRate} Hz)`, () => {
      const { stats, chart, judge } = play(lesson.id, { sampleRate });
      const missed = chart.notes
        .filter((n) => judge.results.get(n.id)?.grade === 'miss')
        .slice(0, 8)
        .map((n) => `${n.beat}:${n.name ?? n.notes.map((s) => `${s.string}:${s.fret}`).join('+')}${judge.results.get(n.id)?.heard ? `(heard ${judge.results.get(n.id)?.heard})` : ''}`);
      expect(stats.accuracy, `${lesson.id} accuracy ${(stats.accuracy * 100).toFixed(1)}%, missed ${stats.miss}/${stats.total}: ${missed.join(', ')}`).toBeGreaterThanOrEqual(0.9);
    });
    it(`${lesson.id} can be completed in practice mode`, () => {
      const { judge, targets } = practice(lesson.id, sampleRate);
      const stuck = targets[judge.index];
      expect(judge.index, `${lesson.id} practice stuck at #${judge.index}: ${stuck?.name ?? stuck?.notes.map((s) => `${s.string}:${s.fret}`).join('+')}`).toBe(targets.length);
    });
  });
});

describe('wrong notes are not rewarded', () => {
  for (const id of ['basement-lowriff', 'bar-movable', 'camp-am-c', 'theater-box', 'skate-downstrokes']) {
    it(`${id} played a semitone off scores low`, () => {
      const { stats } = play(id, { sampleRate: 48000, wrong: true });
      expect(stats.accuracy, `${id} wrong-note accuracy ${(stats.accuracy * 100).toFixed(1)}%`).toBeLessThan(0.25);
    });
  }
});
