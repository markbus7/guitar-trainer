import type { AttackCandidate } from '../audio/dsp/attack';
import { matchChord } from '../audio/dsp/chroma';
import { noteName } from '../music/notes';
import type { Chart, ChartNote } from './chart';

export type Grade = 'perfect' | 'great' | 'good' | 'miss';
export type TimingId = 'relaxed' | 'normal' | 'strict';

export interface Windows {
  perfect: number;
  great: number;
  good: number;
  /** 0..1 — how forgiving chord recognition is. */
  chordLeniency: number;
}

export const TIMING: Record<TimingId, Windows> = {
  relaxed: { perfect: 0.07, great: 0.13, good: 0.21, chordLeniency: 0.85 },
  normal: { perfect: 0.05, great: 0.1, good: 0.16, chordLeniency: 0.6 },
  strict: { perfect: 0.035, great: 0.07, good: 0.12, chordLeniency: 0.4 },
};

export const CREDIT: Record<Grade, number> = { perfect: 1, great: 0.85, good: 0.6, miss: 0 };

export interface HeardNote {
  /** Song time in seconds (latency already removed). */
  t: number;
  midi: number;
  candidates?: AttackCandidate[];
  legato?: boolean;
}

export interface Judgement {
  noteId: number;
  grade: Grade;
  /** Seconds; positive = late. */
  offset?: number;
  /** What we heard instead, for feedback on misses. */
  heard?: string;
  /** A bend that did not reach its target pitch. */
  bendShort?: boolean;
}

const pc = (m: number) => ((Math.round(m) % 12) + 12) % 12;

export function isPowerChord(n: ChartNote): boolean {
  if (n.kind !== 'chord') return false;
  const pcs = new Set(n.midis.map(pc));
  return pcs.size <= 2 && n.midis.length <= 3;
}

/** Does a heard note satisfy this target? Octave mix-ups are forgiven. */
export function noteMatches(target: ChartNote, heard: Pick<HeardNote, 'midi' | 'candidates'>): boolean {
  if (target.kind === 'note') {
    const want = target.midis[0];
    if (heard.midi === want || Math.abs(heard.midi - want) === 12) return true;
    return !!heard.candidates?.some(
      (c) => (c.midi === want || Math.abs(c.midi - want) === 12) && c.score >= 0.6,
    );
  }
  if (isPowerChord(target)) {
    // A power chord's pitch reads as its root (or fifth). Good enough for a beginner.
    const pcs = new Set(target.midis.map(pc));
    if (pcs.has(pc(heard.midi))) return true;
    return !!heard.candidates?.slice(0, 2).some((c) => c.score >= 0.75 && pc(c.midi) === pc(target.midis[0]));
  }
  return false;
}

export function chordMatches(target: ChartNote, chroma: ArrayLike<number>, leniency: number) {
  return matchChord(chroma, target.midis, leniency);
}

export interface Stats {
  total: number;
  perfect: number;
  great: number;
  good: number;
  miss: number;
  /** 0..1 */
  accuracy: number;
  score: number;
  maxStreak: number;
  meanOffsetMs: number;
  early: number;
  late: number;
  wrongNotes: number;
  bendShort: number;
  missedStrings: Record<number, number>;
  chordMisses: number;
}

export function multiplierFor(streak: number) {
  return 1 + Math.min(3, Math.floor(streak / 10));
}

/** Real-time judge: matches what was heard to targets within timing windows. */
export class Judge {
  private readonly notes: ChartNote[];
  private readonly limits: number[];
  readonly results = new Map<number, Judgement>();
  private wrong = new Map<number, string[]>();
  private strums: { t: number; noteId: number }[] = [];
  private bendAttacks = new Map<number, number>();
  private cursor = 0;
  streak = 0;
  maxStreak = 0;
  score = 0;

  constructor(
    chart: Chart,
    private readonly win: Windows,
  ) {
    this.notes = chart.notes;
    this.limits = this.notes.map((n, i) => {
      const prev = this.notes[i - 1];
      const next = this.notes[i + 1];
      let gap = Infinity;
      if (prev) gap = Math.min(gap, n.time - prev.time);
      if (next) gap = Math.min(gap, next.time - n.time);
      return Math.max(win.perfect + 0.015, Math.min(win.good, gap * 0.6));
    });
  }

  private grade(offset: number, i: number): Grade {
    const a = Math.abs(offset);
    if (a <= this.win.perfect) return 'perfect';
    if (a <= Math.min(this.win.great, Math.max(this.win.perfect + 0.01, this.limits[i] * 0.75))) return 'great';
    return 'good';
  }

  private open(i: number) {
    return !this.results.has(this.notes[i].id);
  }

  /** Indices of unjudged targets whose window contains time t. */
  private candidates(t: number, filter: (n: ChartNote) => boolean): number[] {
    const out: number[] = [];
    for (let i = this.cursor; i < this.notes.length; i++) {
      const n = this.notes[i];
      if (n.time - this.win.good > t) break;
      if (!this.open(i) || !filter(n)) continue;
      if (Math.abs(t - n.time) <= this.limits[i]) out.push(i);
    }
    return out;
  }

  private finish(i: number, grade: Grade, offset?: number, extra: Partial<Judgement> = {}): Judgement {
    const n = this.notes[i];
    const j: Judgement = { noteId: n.id, grade, offset, ...extra };
    if (grade === 'miss') {
      const heard = this.wrong.get(n.id);
      if (heard?.length) j.heard = heard[heard.length - 1];
      this.streak = 0;
    } else {
      this.streak++;
      this.maxStreak = Math.max(this.maxStreak, this.streak);
      this.score += Math.round(100 * CREDIT[grade] * multiplierFor(this.streak));
    }
    this.results.set(n.id, j);
    while (this.cursor < this.notes.length && !this.open(this.cursor)) this.cursor++;
    return j;
  }

  private nearest(idx: number[], t: number) {
    return idx.reduce((best, i) => (Math.abs(this.notes[i].time - t) < Math.abs(this.notes[best].time - t) ? i : best), idx[0]);
  }

  onNote(h: HeardNote): Judgement[] {
    const idx = this.candidates(h.t, (n) => n.kind === 'note' || isPowerChord(n));
    if (idx.length === 0) return [];
    const matching = idx.filter((i) => noteMatches(this.notes[i], h));
    if (matching.length) {
      const i = this.nearest(matching, h.t);
      const n = this.notes[i];
      const offset = h.t - n.time;
      if (n.bend) {
        if (!this.bendAttacks.has(n.id)) this.bendAttacks.set(n.id, offset);
        return [];
      }
      return [this.finish(i, this.grade(offset, i), offset)];
    }
    const i = this.nearest(idx, h.t);
    const list = this.wrong.get(this.notes[i].id) ?? [];
    list.push(noteName(h.midi, { octave: false }));
    this.wrong.set(this.notes[i].id, list);
    return [];
  }

  onOnset(t: number): Judgement[] {
    const idx = this.candidates(t, (n) => n.kind === 'chord' || n.kind === 'mute');
    if (idx.length === 0) return [];
    const i = this.nearest(idx, t);
    const n = this.notes[i];
    if (n.kind === 'mute') return [this.finish(i, this.grade(t - n.time, i), t - n.time)];
    this.strums.push({ t, noteId: n.id });
    if (this.strums.length > 16) this.strums.shift();
    return [];
  }

  onChroma(t: number, chroma: ArrayLike<number>): Judgement[] {
    const s = this.strums.find((x) => Math.abs(x.t - t) < 0.004);
    if (!s) return [];
    this.strums = this.strums.filter((x) => x !== s);
    const i = this.notes.findIndex((n) => n.id === s.noteId);
    if (i < 0 || !this.open(i)) return [];
    const n = this.notes[i];
    const res = chordMatches(n, chroma, this.win.chordLeniency);
    if (res.ok) return [this.finish(i, this.grade(s.t - n.time, i), s.t - n.time)];
    const list = this.wrong.get(n.id) ?? [];
    list.push(res.bestOtherLabel || 'a different chord');
    this.wrong.set(n.id, list);
    return [];
  }

  /** Continuous pitch (MIDI, fractional) — used to see bends arrive. */
  onPitch(t: number, midi: number): Judgement[] {
    if (this.bendAttacks.size === 0) return [];
    const out: Judgement[] = [];
    for (const [id, offset] of this.bendAttacks) {
      const i = this.notes.findIndex((n) => n.id === id);
      const n = this.notes[i];
      if (!n || !this.open(i)) {
        this.bendAttacks.delete(id);
        continue;
      }
      if (t < n.time || t > n.time + n.dur + 0.4) continue;
      const target = n.midis[0] + (n.bend ?? 0);
      const folded = midi + 12 * Math.round((target - midi) / 12);
      if (folded >= target - 0.35 && folded <= target + 0.6) {
        this.bendAttacks.delete(id);
        out.push(this.finish(i, this.grade(offset, i), offset));
      }
    }
    return out;
  }

  /** Call every frame with the current song time; returns targets that were missed. */
  advance(songTime: number): Judgement[] {
    const out: Judgement[] = [];
    for (let i = this.cursor; i < this.notes.length; i++) {
      const n = this.notes[i];
      if (n.time > songTime) break;
      if (!this.open(i)) continue;
      const grace =
        n.kind === 'chord' && !isPowerChord(n) ? 0.32 : n.bend ? n.dur + 0.4 : n.kind === 'chord' ? 0.3 : 0.14;
      if (songTime > n.time + this.limits[i] + grace) {
        if (n.bend && this.bendAttacks.has(n.id)) {
          const offset = this.bendAttacks.get(n.id)!;
          this.bendAttacks.delete(n.id);
          out.push(this.finish(i, 'good', offset, { bendShort: true }));
        } else out.push(this.finish(i, 'miss'));
      }
    }
    return out;
  }

  get done() {
    return this.results.size === this.notes.length;
  }

  stats(): Stats {
    return summarize(this.notes, this.results, this.score, this.maxStreak, this.win, this.wrongCount());
  }

  private wrongCount() {
    let n = 0;
    this.wrong.forEach((v) => (n += v.length));
    return n;
  }
}

export function summarize(
  notes: ChartNote[],
  results: Map<number, Judgement>,
  score: number,
  maxStreak: number,
  win: Windows,
  wrongNotes: number,
): Stats {
  const s: Stats = {
    total: notes.length,
    perfect: 0,
    great: 0,
    good: 0,
    miss: 0,
    accuracy: 0,
    score,
    maxStreak,
    meanOffsetMs: 0,
    early: 0,
    late: 0,
    wrongNotes,
    bendShort: 0,
    missedStrings: {},
    chordMisses: 0,
  };
  let credit = 0;
  let offSum = 0;
  let offN = 0;
  for (const n of notes) {
    const r = results.get(n.id);
    const g = r?.grade ?? 'miss';
    s[g]++;
    credit += CREDIT[g];
    if (r?.bendShort) s.bendShort++;
    if (g === 'miss') {
      if (n.kind === 'chord') s.chordMisses++;
      for (const spec of n.notes) s.missedStrings[spec.string] = (s.missedStrings[spec.string] ?? 0) + 1;
    }
    if (r?.offset !== undefined && g !== 'miss') {
      offSum += r.offset;
      offN++;
      if (r.offset < -win.perfect) s.early++;
      if (r.offset > win.perfect) s.late++;
    }
  }
  s.accuracy = notes.length ? credit / notes.length : 0;
  s.meanOffsetMs = offN ? (offSum / offN) * 1000 : 0;
  return s;
}

/** Stars for a run. Full speed is needed for three stars. */
export function starsFor(accuracy: number, tempo: number, mode: 'play' | 'practice'): number {
  if (mode === 'practice') return accuracy >= 0.5 ? 1 : 0;
  let stars = accuracy >= 0.93 ? 3 : accuracy >= 0.8 ? 2 : accuracy >= 0.6 ? 1 : 0;
  if (tempo < 0.999) stars = Math.min(stars, 2);
  if (tempo < 0.75) stars = Math.min(stars, 1);
  return stars;
}

/**
 * Practice ("wait") mode: the song stops at each target until it is played.
 * Tracks how many were nailed on the first try.
 */
export class PracticeJudge {
  index = 0;
  attempts = 0;
  firstTry = 0;
  readonly wrongHeard: (string | undefined)[] = [];
  private pendingStrum: number | null = null;

  constructor(
    private readonly notes: ChartNote[],
    private readonly leniency: number,
  ) {}

  get current(): ChartNote | undefined {
    return this.notes[this.index];
  }

  get done() {
    return this.index >= this.notes.length;
  }

  private advance(): ChartNote {
    const n = this.notes[this.index];
    if (this.attempts === 0) this.firstTry++;
    this.index++;
    this.attempts = 0;
    this.pendingStrum = null;
    return n;
  }

  /** Returns the target that was completed, if any. */
  onNote(h: Pick<HeardNote, 'midi' | 'candidates'>): { hit?: ChartNote; wrong?: string } {
    const n = this.current;
    if (!n) return {};
    if (n.kind === 'note' || isPowerChord(n)) {
      if (noteMatches(n, h)) return { hit: this.advance() };
      if (n.kind === 'note') {
        this.attempts++;
        const heard = noteName(h.midi, { octave: false });
        this.wrongHeard[this.index] = heard;
        return { wrong: heard };
      }
    }
    return {};
  }

  onOnset(t: number): { hit?: ChartNote } {
    const n = this.current;
    if (!n) return {};
    if (n.kind === 'mute') return { hit: this.advance() };
    if (n.kind === 'chord') this.pendingStrum = t;
    return {};
  }

  onChroma(t: number, chroma: ArrayLike<number>): { hit?: ChartNote; wrong?: string } {
    const n = this.current;
    if (!n || n.kind !== 'chord' || this.pendingStrum === null || Math.abs(this.pendingStrum - t) > 0.004) return {};
    const res = chordMatches(n, chroma, this.leniency);
    if (res.ok) return { hit: this.advance() };
    this.attempts++;
    this.pendingStrum = null;
    return { wrong: res.bestOtherLabel || 'something else' };
  }

  /** Give up on the current target (detection trouble, or just stuck). */
  skip(): ChartNote | undefined {
    const n = this.current;
    if (!n) return undefined;
    this.index++;
    this.attempts = 0;
    this.pendingStrum = null;
    return n;
  }

  get accuracy() {
    return this.notes.length ? this.firstTry / this.notes.length : 0;
  }
}
