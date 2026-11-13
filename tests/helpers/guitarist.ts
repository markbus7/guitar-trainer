import { mulberry32, renderPluck } from '../../src/audio/synth/pluck';
import { Analyzer, type AnalyzerEvent } from '../../src/audio/dsp/analyzer';

/**
 * A "virtual guitarist": renders note events to audio so the listening pipeline can be
 * tested end to end without a real guitar.
 */
export interface PlayedNote {
  t: number;
  midi: number;
  dur?: number;
  velocity?: number;
  mute?: boolean;
  /** Soft attack (hammer-on / pull-off): the previous note is cut off at this point. */
  legato?: boolean;
  /** Bend up by this many semitones shortly after the attack. */
  bend?: number;
  /** Slide from this MIDI note into `midi`. */
  slideFrom?: number;
  /** Guitar string (1-6). A new note on a string stops the previous one. Auto-assigned if missing. */
  string?: number;
}

const OPEN = [0, 64, 59, 55, 50, 45, 40];
/** Pick the string where the note sits lowest on the neck (like a beginner would). */
export function autoString(midi: number): number {
  let best = 6;
  let bestFret = Infinity;
  for (let s = 6; s >= 1; s--) {
    const fret = midi - OPEN[s];
    if (fret >= 0 && fret < bestFret) {
      bestFret = fret;
      best = s;
    }
  }
  return best;
}

export interface RenderOptions {
  sampleRate: number;
  duration: number;
  /** White noise floor in dBFS (default -66). */
  noiseDb?: number;
  /** Simulate a small laptop mic that loses the low end. */
  highpassHz?: number;
  seed?: number;
  /** Overall gain applied at the end. */
  gain?: number;
}

function midiToFreq(m: number) {
  return 440 * Math.pow(2, (m - 69) / 12);
}

/** Additive string model with a pitch glide, used for bends and slides. */
function renderGlide(sr: number, f0: number, f1: number, glideStart: number, glideTime: number, dur: number, vel: number, soft = false) {
  const len = Math.round(dur * sr);
  const out = new Float32Array(len);
  const H = 10;
  const phases = new Float64Array(H);
  for (let n = 0; n < len; n++) {
    const t = n / sr;
    const k = Math.min(1, Math.max(0, (t - glideStart) / glideTime));
    const f = f0 * Math.pow(f1 / f0, k * k * (3 - 2 * k));
    let s = 0;
    for (let h = 1; h <= H; h++) {
      phases[h - 1] += (2 * Math.PI * f * h) / sr;
      s += (Math.sin(phases[h - 1]) / h) * Math.exp(-t * (1.2 + h * 0.6));
    }
    const attack = Math.min(1, t / (soft ? 0.02 : 0.003));
    out[n] = s * vel * 0.5 * attack;
  }
  if (soft) return out;
  // Pick click
  const rng = mulberry32(Math.floor(f0));
  for (let n = 0; n < Math.min(len, Math.round(sr * 0.004)); n++) out[n] += (rng() * 2 - 1) * vel * 0.4 * (1 - n / (sr * 0.004));
  return out;
}

export function renderPerformance(notes: PlayedNote[], opts: RenderOptions): Float32Array {
  const sr = opts.sampleRate;
  const out = new Float32Array(Math.round(opts.duration * sr));
  const rng = mulberry32(opts.seed ?? 7);
  const sorted = [...notes].sort((a, b) => a.t - b.t);
  const voices: { start: number; buf: Float32Array; end: number; string: number }[] = [];

  sorted.forEach((n, i) => {
    const start = Math.round(n.t * sr);
    const dur = Math.max(0.15, n.dur ?? 1.5);
    let buf: Float32Array;
    if (n.bend || n.slideFrom !== undefined) {
      const f0 = midiToFreq(n.slideFrom ?? n.midi);
      const f1 = midiToFreq(n.midi + (n.bend ?? 0));
      const soft = !!n.legato && n.slideFrom !== undefined;
      buf = renderGlide(sr, f0, f1, n.bend ? 0.08 : 0.0, n.bend ? 0.16 : 0.05, dur + 0.3, (n.velocity ?? 0.7) * (soft ? 0.7 : 1), soft);
    } else {
      buf = renderPluck({
        sampleRate: sr,
        freq: midiToFreq(n.midi),
        duration: dur + 0.03,
        velocity: (n.velocity ?? 0.7) * (n.legato ? 0.55 : 1),
        brightness: n.legato ? 0.15 : 0.55 + rng() * 0.35,
        mute: n.mute,
        pluckPosition: 0.12 + rng() * 0.15,
        seed: 1000 + i,
      });
    }
    const string = n.string ?? autoString(n.midi);
    for (const v of voices) {
      // A new note on the same string (or a hammer-on anywhere) stops the old one.
      if ((v.string === string || n.legato) && v.end > start) v.end = start + Math.round(sr * 0.004);
    }
    voices.push({ start, buf, end: start + buf.length, string });
  });

  for (const v of voices) {
    const len = Math.min(v.buf.length, v.end - v.start);
    for (let i = 0; i < len; i++) {
      const j = v.start + i;
      if (j >= out.length) break;
      const fadeOut = v.end - v.start - i < 200 ? (v.end - v.start - i) / 200 : 1;
      out[j] += v.buf[i] * fadeOut;
    }
  }

  const noiseAmp = Math.pow(10, (opts.noiseDb ?? -66) / 20) * Math.sqrt(3);
  for (let i = 0; i < out.length; i++) out[i] += (rng() * 2 - 1) * noiseAmp;

  if (opts.highpassHz) {
    const rc = 1 / (2 * Math.PI * opts.highpassHz);
    const alpha = rc / (rc + 1 / sr);
    for (let pass = 0; pass < 2; pass++) {
      let prevX = 0;
      let prevY = 0;
      for (let i = 0; i < out.length; i++) {
        const y = alpha * (prevY + out[i] - prevX);
        prevX = out[i];
        prevY = y;
        out[i] = y;
      }
    }
  }
  if (opts.gain) for (let i = 0; i < out.length; i++) out[i] *= opts.gain;
  return out;
}

/** Strum a chord: one note per string with a small delay between strings. */
export function strum(t: number, midis: number[], opts: { up?: boolean; spread?: number; velocity?: number; mute?: boolean; dur?: number } = {}): PlayedNote[] {
  const order = opts.up ? [...midis].sort((a, b) => b - a) : [...midis].sort((a, b) => a - b);
  const spread = opts.spread ?? 0.009;
  return order.map((midi, i) => ({
    t: t + i * spread,
    midi,
    string: 100 + i,
    velocity: (opts.velocity ?? 0.6) * (1 - i * 0.04),
    mute: opts.mute,
    dur: opts.dur ?? 1.2,
  }));
}

/** Run audio through the analyzer in realistic 512-sample chunks. */
export function analyze(samples: Float32Array, sampleRate: number, cfg: Partial<ConstructorParameters<typeof Analyzer>[0]> = {}): AnalyzerEvent[] {
  const a = new Analyzer({ sampleRate, ...cfg });
  const events: AnalyzerEvent[] = [];
  const chunk = 512;
  for (let i = 0; i < samples.length; i += chunk) {
    events.push(...a.process(samples.subarray(i, Math.min(samples.length, i + chunk)), i));
  }
  return events;
}

export function ofType<T extends AnalyzerEvent['type']>(events: AnalyzerEvent[], type: T) {
  return events.filter((e): e is Extract<AnalyzerEvent, { type: T }> => e.type === type);
}
