import { getEngine } from './engine';

/** Clicks per beat: quarter notes, eighths, triplets or sixteenths. */
export type Subdivision = 1 | 2 | 3 | 4;

export interface MetronomeOptions {
  bpm: number;
  beatsPerBar: number;
  subdivision: Subdivision;
  /** Accent the first beat of every bar. */
  accent: boolean;
  /** Speed trainer: add `step` bpm every `everyBars` bars, up to `target`. */
  trainer: { enabled: boolean; step: number; everyBars: number; target: number };
}

export interface Tick {
  beat: number;
  bar: number;
  bpm: number;
}

/**
 * A sample-accurate metronome: a short timer schedules clicks slightly ahead on the
 * audio clock (the classic "lookahead" pattern), so the beat never drifts even when
 * the page is busy.
 */
export class Metronome {
  private opts: MetronomeOptions;
  private timer: ReturnType<typeof setInterval> | null = null;
  private nextTime = 0;
  private sub = 0;
  private beat = 0;
  private bar = 0;
  private bpm: number;
  private visualTimers: ReturnType<typeof setTimeout>[] = [];
  onTick: ((t: Tick) => void) | null = null;

  constructor(opts: MetronomeOptions) {
    this.opts = opts;
    this.bpm = opts.bpm;
  }

  get running() {
    return this.timer !== null;
  }

  get currentBpm() {
    return this.bpm;
  }

  update(opts: MetronomeOptions) {
    const bpmChanged = opts.bpm !== this.opts.bpm;
    this.opts = opts;
    if (bpmChanged || !this.running) this.bpm = opts.bpm;
  }

  start() {
    if (this.running) return;
    const engine = getEngine();
    engine.prewarmDrums();
    this.bpm = this.opts.bpm;
    this.sub = 0;
    this.beat = 0;
    this.bar = 0;
    this.nextTime = engine.ctx.currentTime + 0.08;
    this.timer = setInterval(() => this.schedule(), 25);
    this.schedule();
  }

  stop() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    this.visualTimers.forEach(clearTimeout);
    this.visualTimers = [];
  }

  private schedule() {
    const engine = getEngine();
    const ctx = engine.ctx;
    const { subdivision, beatsPerBar, accent, trainer } = this.opts;
    while (this.nextTime < ctx.currentTime + 0.12) {
      const onBeat = this.sub === 0;
      const downbeat = onBeat && this.beat === 0;
      if (onBeat) engine.playDrum(downbeat && accent ? 'clickAccent' : 'click', this.nextTime, downbeat && accent ? 1 : 0.8);
      else engine.playDrum('click', this.nextTime, 0.35);
      if (onBeat) {
        const tick: Tick = { beat: this.beat, bar: this.bar, bpm: this.bpm };
        const delay = Math.max(0, (this.nextTime - ctx.currentTime) * 1000);
        this.visualTimers.push(setTimeout(() => this.onTick?.(tick), delay));
        if (this.visualTimers.length > 32) this.visualTimers.splice(0, 16);
      }
      this.nextTime += 60 / this.bpm / subdivision;
      this.sub++;
      if (this.sub >= subdivision) {
        this.sub = 0;
        this.beat++;
        if (this.beat >= beatsPerBar) {
          this.beat = 0;
          this.bar++;
          if (trainer.enabled && this.bar % Math.max(1, trainer.everyBars) === 0) {
            const up = trainer.target >= this.bpm;
            this.bpm = up ? Math.min(trainer.target, this.bpm + trainer.step) : Math.max(trainer.target, this.bpm - trainer.step);
          }
        }
      }
    }
  }
}

/** Tap tempo: the average of the last few intervals, or null until there are two taps. */
export function tapTempo(taps: number[]): number | null {
  const recent = taps.slice(-6);
  if (recent.length < 2) return null;
  const gaps: number[] = [];
  for (let i = 1; i < recent.length; i++) gaps.push(recent[i] - recent[i - 1]);
  const avg = gaps.reduce((a, b) => a + b, 0) / gaps.length;
  if (avg <= 0) return null;
  return Math.max(30, Math.min(260, Math.round(60_000 / avg)));
}
