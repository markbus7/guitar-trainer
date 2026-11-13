import { getEngine, type AudioEngine } from '../audio/engine';
import { mic } from '../audio/mic';
import type { AnalyzerEvent } from '../audio/dsp/analyzer';
import { GuitarSynth } from '../audio/synth/guitar';
import { ToneChain } from '../audio/synth/amp';
import type { Lesson } from '../content/types';
import { TUNINGS, noteName, openMidi, type StringNumber } from '../music/notes';
import { buildArrangement, type ArrEvent, type Arrangement } from './arrangement';
import { buildChart, type Chart, type ChartNote } from './chart';
import { Judge, PracticeJudge, TIMING, multiplierFor, starsFor, type Grade, type Judgement, type Stats } from './judge';
import { routeToJudge, routeToPractice } from './route';
import type { Settings } from '../state/settings';

/**
 * One run of a lesson on the highway: owns the chart, the band, the clock and the
 * judge, and wires the microphone into it.
 *
 *  - play:     the band plays, the highway scrolls, everything is timed
 *  - practice: no band, the highway waits at each note until you play it
 *  - listen:   the guide guitar plays the part for you, nothing is judged
 */
export type SessionMode = 'play' | 'practice' | 'listen';
export type SessionState = 'ready' | 'countin' | 'playing' | 'paused' | 'finished';

export interface NoteVisual {
  state: 'hit' | 'miss' | 'auto';
  grade?: Grade;
  /** performance.now() when it happened, for animations. */
  at: number;
  heard?: string;
  offset?: number;
}

export interface SectionScore {
  name: string;
  accuracy: number;
  total: number;
}

export interface SessionResult {
  lessonId: string;
  mode: SessionMode;
  tempo: number;
  stats: Stats;
  stars: number;
  sections: SectionScore[];
  seconds: number;
  /** Practice mode: share of notes played right on the first try. */
  firstTry?: number;
}

export interface Hud {
  score: number;
  streak: number;
  multiplier: number;
  hits: number;
  judged: number;
  /** Last note the mic heard (name), for the live "I hear" display. */
  heard: string | null;
  heardOk: boolean | null;
  lastGrade: Grade | null;
}

type Listener<T> = (v: T) => void;

const LOOKAHEAD = 0.2;
const MIN_FREQ_MARGIN = 0.7; // semitones below the lowest open string

export function lowestFreqFor(tuning: Chart['tuning']) {
  const low = Math.min(...TUNINGS[tuning].open.slice(1));
  return 440 * Math.pow(2, (low - 69 - MIN_FREQ_MARGIN) / 12);
}

export class GameSession {
  readonly chart: Chart;
  readonly arrangement: Arrangement;
  readonly visuals = new Map<number, NoteVisual>();
  readonly judge: Judge | null;
  readonly practice: PracticeJudge | null;
  state: SessionState = 'ready';
  hud: Hud = { score: 0, streak: 0, multiplier: 1, hits: 0, judged: 0, heard: null, heardOk: null, lastGrade: null };

  private readonly engine: AudioEngine;
  private songStart = 0;
  private evIndex = 0;
  private timer: ReturnType<typeof setInterval> | null = null;
  private guide: GuitarSynth;
  private bass: GuitarSynth;
  private backing: GuitarSynth;
  private chains: ToneChain[] = [];
  private latency: number;
  private unsubMic: (() => void) | null = null;
  private practiceTime: number;
  private lastFrameCtx = 0;
  private pausedAt = 0;
  private playSeconds = 0;
  private lastTick = 0;
  private finishedAt = 0;
  private hudListeners = new Set<Listener<Hud>>();
  private stateListeners = new Set<Listener<SessionState>>();
  private finishListeners = new Set<Listener<SessionResult>>();
  private judgementListeners = new Set<Listener<{ j: Judgement; note: ChartNote }>>();
  private prevMidi = new Map<number, number>();
  private result: SessionResult | null = null;
  private countInEnd = 0;

  constructor(
    readonly lesson: Lesson,
    readonly mode: SessionMode,
    readonly tempo: number,
    private readonly settings: Settings,
  ) {
    this.engine = getEngine();
    this.chart = buildChart(lesson, tempo);
    const speakers = settings.output === 'speakers';
    const listen = mode === 'listen';
    this.arrangement = buildArrangement(this.chart, {
      metronome: mode !== 'practice' && (settings.metronomeInSongs || lesson.kind !== 'song'),
      guide: listen || (mode === 'play' && !speakers),
      band: mode !== 'practice' && (listen || !speakers),
      drums: mode !== 'practice',
    });
    const win = TIMING[settings.timing];
    this.judge = mode === 'play' ? new Judge(this.chart, win) : null;
    this.practice = mode === 'practice' ? new PracticeJudge(this.chart.notes, win.chordLeniency) : null;
    this.latency = settings.latencyMs !== null ? settings.latencyMs / 1000 : this.engine.outputLatency() + mic.inputLatency();
    this.practiceTime = -2.2;

    const ctx = this.engine.ctx;
    const tone = lesson.tone ?? 'crunch';
    const guideChain = new ToneChain(ctx, tone, this.engine.guide, this.engine.reverb);
    const bassChain = ctx.createBiquadFilter();
    bassChain.type = 'lowpass';
    bassChain.frequency.value = tone === 'acoustic' || tone === 'clean' ? 1400 : 2200;
    const bassDrive = ctx.createWaveShaper();
    const curve = new Float32Array(1024);
    for (let i = 0; i < curve.length; i++) {
      const x = (i / (curve.length - 1)) * 2 - 1;
      curve[i] = Math.tanh(2.2 * x) / Math.tanh(2.2);
    }
    bassDrive.curve = curve;
    const bassLevel = ctx.createGain();
    bassLevel.gain.value = 0.75;
    bassDrive.connect(bassChain);
    bassChain.connect(bassLevel);
    bassLevel.connect(this.engine.pitched);
    const backingTone = tone === 'acoustic' ? 'acoustic' : tone === 'metal' || tone === 'punk' ? 'crunch' : 'clean';
    const backingChain = new ToneChain(ctx, backingTone, this.engine.pitched, this.engine.reverb);
    backingChain.output.gain.value *= 0.45;
    this.chains.push(guideChain, backingChain);
    this.disposeNodes = () => {
      bassDrive.disconnect();
      bassChain.disconnect();
      bassLevel.disconnect();
    };
    this.guide = new GuitarSynth(ctx, guideChain.input, tone === 'acoustic' ? 'acoustic' : 'electric');
    this.bass = new GuitarSynth(ctx, bassDrive, 'bass');
    this.backing = new GuitarSynth(ctx, backingChain.input, backingTone === 'acoustic' ? 'acoustic' : 'electric');
  }

  private disposeNodes: () => void = () => {};

  /** Render all sounds ahead of time. */
  prepare() {
    const guideNotes: { midi: number; mute?: boolean; soft?: boolean }[] = [];
    const bassNotes: { midi: number; mute?: boolean }[] = [];
    const backingNotes: { midi: number }[] = [];
    for (const e of this.arrangement.events) {
      if (e.type === 'guide') {
        for (const s of e.note.notes) guideNotes.push({ midi: s.midi, mute: e.note.pm, soft: !!e.note.legato });
      } else if (e.type === 'bass') bassNotes.push({ midi: e.midi, mute: e.mute });
      else if (e.type === 'backing') for (const n of e.notes) backingNotes.push({ midi: n.midi });
    }
    const uniq = <T extends { midi: number }>(xs: T[]) => [...new Map(xs.map((x) => [JSON.stringify(x), x])).values()];
    this.guide.prewarm(uniq(guideNotes));
    this.bass.prewarm(uniq(bassNotes));
    this.backing.prewarm(uniq(backingNotes));
    this.engine.prewarmDrums();
  }

  // ---- events ---------------------------------------------------------------

  onHud(fn: Listener<Hud>) {
    this.hudListeners.add(fn);
    return () => this.hudListeners.delete(fn);
  }
  onState(fn: Listener<SessionState>) {
    this.stateListeners.add(fn);
    return () => this.stateListeners.delete(fn);
  }
  onFinish(fn: Listener<SessionResult>) {
    this.finishListeners.add(fn);
    return () => this.finishListeners.delete(fn);
  }
  onJudgement(fn: Listener<{ j: Judgement; note: ChartNote }>) {
    this.judgementListeners.add(fn);
    return () => this.judgementListeners.delete(fn);
  }

  private setState(s: SessionState) {
    this.state = s;
    this.stateListeners.forEach((f) => f(s));
  }

  private pushHud(patch: Partial<Hud>) {
    this.hud = { ...this.hud, ...patch };
    this.hudListeners.forEach((f) => f(this.hud));
  }

  // ---- transport --------------------------------------------------------------

  get secPerBeat() {
    return this.chart.secPerBeat;
  }

  /** Song time for drawing (what you hear right now). */
  songTime(): number {
    if (this.mode === 'practice') return this.practiceTime;
    if (this.state === 'paused') return this.pausedAt;
    if (this.state === 'ready') return -this.arrangement.countIn;
    return this.engine.outputTime() - this.songStart;
  }

  /** Seconds left in the count-in (0 when playing). */
  countInRemaining(): number {
    if (this.state !== 'countin' || this.mode === 'practice') return 0;
    return Math.max(0, this.countInEnd - this.engine.outputTime());
  }

  /** The target the practice highway is waiting for. */
  get currentTarget(): ChartNote | undefined {
    return this.practice?.current;
  }

  async start() {
    await this.engine.resume();
    this.engine.setVolumes(this.settings.volumes);
    if (this.mode !== 'listen') this.attachMic();
    const ctx = this.engine.ctx;
    this.lastFrameCtx = ctx.currentTime;
    this.lastTick = ctx.currentTime;
    if (this.mode === 'practice') {
      this.setState('playing');
      return;
    }
    this.songStart = ctx.currentTime + 0.3 + this.arrangement.countIn;
    this.countInEnd = this.songStart;
    this.evIndex = 0;
    this.setState('countin');
    this.startScheduler();
  }

  private attachMic() {
    if (this.unsubMic) return;
    mic.configure({ minFreq: lowestFreqFor(this.chart.tuning), sensitivity: this.settings.sensitivity, emitPitch: true, chroma: true });
    this.unsubMic = mic.on((events) => this.onMic(events));
  }

  private startScheduler() {
    this.stopScheduler();
    this.tick();
    this.timer = setInterval(() => this.tick(), 25);
  }

  private stopScheduler() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }

  private tick() {
    const ctx = this.engine.ctx;
    const now = ctx.currentTime;
    const horizon = now + LOOKAHEAD;
    const events = this.arrangement.events;
    while (this.evIndex < events.length) {
      const e = events[this.evIndex];
      const when = this.songStart + e.t;
      if (when > horizon) break;
      this.evIndex++;
      if (when < now - 0.03) continue;
      this.schedule(e, Math.max(when, now));
    }
  }

  private schedule(e: ArrEvent, when: number) {
    switch (e.type) {
      case 'click':
        this.engine.playDrum(e.accent ? 'clickAccent' : 'click', when, e.countIn ? 1 : 0.8);
        break;
      case 'drum':
        this.engine.playDrum(e.drum, when, e.vel);
        break;
      case 'bass':
        this.bass.note(when, e.midi, { dur: e.dur, velocity: e.vel, mute: e.mute, string: 0 });
        break;
      case 'backing':
        this.backing.chord(when, e.notes, { dur: e.dur, strum: e.strum, velocity: e.vel });
        break;
      case 'guide':
        this.playGuide(e.note, when);
        break;
    }
  }

  private playGuide(n: ChartNote, when: number) {
    const vel = n.accent ? 0.95 : 0.78;
    if (n.kind === 'note') {
      const s = n.notes[0];
      const prev = this.prevMidi.get(-1);
      this.guide.note(when, s.midi, {
        dur: n.dur,
        velocity: n.legato && n.legato !== 'slide' ? vel * 0.75 : vel,
        mute: n.pm,
        string: s.string,
        bend: n.bend,
        soft: n.legato === 'hammer' || n.legato === 'pull',
        slideFrom: n.legato === 'slide' ? prev : undefined,
        vibrato: n.vibrato,
      });
      this.prevMidi.set(-1, s.midi);
    } else if (n.kind === 'chord') {
      const notes = [...n.notes].sort((a, b) => b.string - a.string).map((s) => ({ midi: s.midi, string: s.string }));
      this.guide.chord(when, notes, { dur: n.dur, strum: n.strum, mute: n.pm, velocity: vel });
    } else {
      const strings = ([6, 5, 4, 3, 2, 1] as StringNumber[]).map((s) => ({ midi: openMidi(this.chart.tuning, s), string: s }));
      this.guide.scratch(when, strings, 0.6);
    }
  }

  pause() {
    if (this.state !== 'playing' && this.state !== 'countin') return;
    this.pausedAt = this.songTime();
    this.accumulateTime();
    this.stopScheduler();
    this.silence();
    this.setState('paused');
  }

  /** Continue after a pause with a one-bar count-in. */
  resume() {
    if (this.state !== 'paused') return;
    const ctx = this.engine.ctx;
    this.lastFrameCtx = ctx.currentTime;
    this.lastTick = ctx.currentTime;
    if (this.mode === 'practice') {
      this.setState('playing');
      return;
    }
    const pos = Math.max(this.pausedAt, -this.arrangement.countIn);
    const bar = this.chart.secPerBeat * this.chart.beatsPerBar;
    this.songStart = ctx.currentTime + 0.25 + bar - pos;
    this.countInEnd = this.songStart + pos;
    for (let b = 0; b < this.chart.beatsPerBar; b++) {
      this.engine.playDrum(b === 0 ? 'clickAccent' : 'click', this.songStart + pos - bar + b * this.chart.secPerBeat, 1);
    }
    const events = this.arrangement.events;
    this.evIndex = events.findIndex((e) => e.t >= pos - 0.005);
    if (this.evIndex < 0) this.evIndex = events.length;
    mic.reset();
    this.setState('countin');
    this.startScheduler();
  }

  private silence() {
    this.guide.stopAll();
    this.bass.stopAll();
    this.backing.stopAll();
    this.engine.stopDrums();
  }

  /** Stop and release everything. Safe to call twice. */
  dispose() {
    this.accumulateTime();
    this.stopScheduler();
    this.silence();
    this.unsubMic?.();
    this.unsubMic = null;
    for (const c of this.chains) c.dispose();
    this.disposeNodes();
    this.chains = [];
    this.hudListeners.clear();
    this.stateListeners.clear();
    this.finishListeners.clear();
    this.judgementListeners.clear();
  }

  private accumulateTime() {
    const now = this.engine.ctx.currentTime;
    if (this.state === 'playing' || this.state === 'countin') this.playSeconds += Math.max(0, now - this.lastTick);
    this.lastTick = now;
  }

  /** Practice seconds since the last call (for the daily goal). */
  takePracticeSeconds(): number {
    this.accumulateTime();
    const s = this.playSeconds;
    this.playSeconds = 0;
    return s;
  }

  /** Play the current practice target as a hint (the mic ignores it). */
  hint() {
    const n = this.currentTarget;
    if (!n) return;
    if (n.kind === 'chord') {
      this.engine.previewChord([...n.notes].sort((a, b) => b.string - a.string).map((s) => ({ midi: s.midi, string: s.string })), 1.6);
    } else if (n.kind === 'note') this.engine.previewNote(n.notes[0].midi, 1.2);
  }

  /** Practice: move past the current target without playing it. */
  skip() {
    const n = this.practice?.skip();
    if (!n) return;
    this.applyJudgement({ noteId: n.id, grade: 'miss' });
    if (this.practice?.done) this.finish();
  }

  // ---- listening --------------------------------------------------------------

  private onMic(events: AnalyzerEvent[]) {
    if (this.state !== 'playing' && this.state !== 'countin') return;
    for (const e of events) {
      if (e.type === 'level') continue;
      if (e.t < this.engine.previewUntil) continue;
      if (e.type === 'note') this.pushHud({ heard: noteName(e.midi, { octave: false }), heardOk: null });
      if (this.judge) {
        const js = routeToJudge(this.judge, e, (t) => t - this.songStart - this.latency);
        for (const j of js) this.applyJudgement(j);
        if (e.type === 'note' && js.length === 0 && this.hud.heardOk === null) this.pushHud({ heardOk: false });
      } else if (this.practice) {
        const out = routeToPractice(this.practice, e);
        if (out.hit) {
          this.applyJudgement({ noteId: out.hit.id, grade: 'perfect' });
          if (this.practice.done) this.finish();
        } else if (out.wrong) this.pushHud({ heard: out.wrong, heardOk: false });
      }
    }
  }

  private applyJudgement(j: Judgement) {
    const note = this.chart.notes.find((n) => n.id === j.noteId);
    if (!note) return;
    const now = performance.now();
    if (j.grade === 'miss') {
      this.visuals.set(j.noteId, { state: 'miss', at: now, heard: j.heard });
      this.pushHud({ streak: 0, multiplier: 1, judged: this.hud.judged + 1, lastGrade: 'miss' });
    } else {
      this.visuals.set(j.noteId, { state: 'hit', grade: j.grade, at: now, offset: j.offset });
      const streak = this.judge ? this.judge.streak : this.hud.streak + 1;
      const score = this.judge ? this.judge.score : this.hud.score + 100;
      this.pushHud({
        score,
        streak,
        multiplier: multiplierFor(streak),
        hits: this.hud.hits + 1,
        judged: this.hud.judged + 1,
        heardOk: true,
        lastGrade: j.grade,
      });
    }
    this.judgementListeners.forEach((f) => f({ j, note }));
  }

  /** Call once per animation frame. */
  frame() {
    const ctx = this.engine.ctx;
    const now = ctx.currentTime;
    if (this.state === 'paused' || this.state === 'finished' || this.state === 'ready') {
      this.lastFrameCtx = now;
      return;
    }
    if (this.mode === 'practice') {
      const dt = Math.min(0.1, Math.max(0, now - this.lastFrameCtx));
      const target = this.practice?.current;
      const limit = target ? target.time : this.chart.duration + 1;
      this.practiceTime = Math.min(limit, this.practiceTime + dt);
      if (!target && this.practiceTime >= this.chart.duration) this.finish();
    } else {
      if (this.state === 'countin' && this.engine.outputTime() >= this.countInEnd) this.setState('playing');
      const t = now - this.songStart;
      if (this.judge) {
        for (const j of this.judge.advance(t - this.latency - 0.12)) this.applyJudgement(j);
        if (this.judge.done && t > this.chart.duration + 0.3) this.finish();
        else if (t > this.chart.duration + 3) {
          for (const j of this.judge.advance(Infinity)) this.applyJudgement(j);
          this.finish();
        }
      } else {
        // Listen mode: light the notes up as the guide plays them.
        const st = this.songTime();
        for (const n of this.chart.notes) {
          if (n.time > st) break;
          if (!this.visuals.has(n.id)) this.visuals.set(n.id, { state: 'auto', at: performance.now() });
        }
        if (st > this.chart.duration + 1) this.finish();
      }
    }
    this.lastFrameCtx = now;
  }

  private finish() {
    if (this.state === 'finished') return;
    this.accumulateTime();
    this.stopScheduler();
    this.finishedAt = performance.now();
    // Let the last notes ring out.
    setTimeout(() => this.silence(), 1500);
    const result = this.buildResult();
    this.result = result;
    this.setState('finished');
    this.finishListeners.forEach((f) => f(result));
  }

  getResult() {
    return this.result;
  }

  get finishedTime() {
    return this.finishedAt;
  }

  private buildResult(): SessionResult {
    const notes = this.chart.notes;
    let stats: Stats;
    if (this.judge) stats = this.judge.stats();
    else {
      const hits = this.practice ? this.practice.index : notes.length;
      stats = {
        total: notes.length,
        perfect: hits,
        great: 0,
        good: 0,
        miss: notes.length - hits,
        accuracy: this.practice ? this.practice.accuracy : 1,
        score: this.hud.score,
        maxStreak: this.hud.streak,
        meanOffsetMs: 0,
        early: 0,
        late: 0,
        wrongNotes: 0,
        bendShort: 0,
        missedStrings: {},
        chordMisses: 0,
      };
    }
    const sections: SectionScore[] = [];
    (this.lesson.sections ?? []).forEach((sec, si) => {
      const inSec = notes.filter((n) => n.section === si);
      if (!inSec.length) return;
      let credit = 0;
      for (const n of inSec) {
        const v = this.visuals.get(n.id);
        credit += v?.state === 'hit' ? (v.grade === 'perfect' ? 1 : v.grade === 'great' ? 0.85 : 0.6) : 0;
      }
      sections.push({ name: sec.name ?? `Part ${si + 1}`, accuracy: credit / inSec.length, total: inSec.length });
    });
    const mode = this.mode;
    const stars = mode === 'listen' ? 0 : starsFor(stats.accuracy, this.tempo, mode === 'practice' ? 'practice' : 'play');
    return {
      lessonId: this.lesson.id,
      mode,
      tempo: this.tempo,
      stats,
      stars,
      sections,
      seconds: this.playSeconds,
      firstTry: this.practice ? this.practice.accuracy : undefined,
    };
  }
}
