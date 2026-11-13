import { analyzeAttack, type AttackCandidate } from './attack';
import { computeChroma } from './chroma';
import { Decimator } from './decimate';
import { OnsetDetector } from './onset';
import { Yin } from './yin';

/**
 * The listening brain. Feed it raw microphone samples (with their AudioContext frame
 * numbers) and it reports what it hears:
 *
 *  - `level`   input level for meters
 *  - `pitch`   a continuous pitch track (tuner, live "I hear…" display, bends)
 *  - `onset`   every pluck or strum, timed to a few milliseconds
 *  - `note`    one resolved note per pluck (plus legato notes from hammer-ons/slides)
 *  - `chroma`  which pitch classes ring after a strum (chord recognition)
 *
 * Pure TypeScript with no DOM access, so it runs in a Web Worker and in unit tests.
 */

export interface AnalyzerConfig {
  sampleRate: number;
  /** 0..1, how easily quiet plucks are picked up. */
  sensitivity: number;
  /** Minimum seconds between onsets. */
  refractory: number;
  minFreq: number;
  maxFreq: number;
  /** Emit the per-frame pitch track (needed by the tuner and live displays). */
  emitPitch: boolean;
  /** Compute chord chroma after each onset. */
  chroma: boolean;
}

export type NoteEvent = {
  type: 'note';
  t: number;
  midi: number;
  freq: number;
  cents: number;
  clarity: number;
  legato: boolean;
  /** Other notes the pluck may have been (strongest first), when known. */
  candidates?: AttackCandidate[];
};

export type AnalyzerEvent =
  | { type: 'level'; t: number; db: number; peak: number; floorDb: number; gateDb: number }
  | { type: 'pitch'; t: number; freq: number; clarity: number; db: number }
  | { type: 'onset'; t: number; strength: number }
  | NoteEvent
  | { type: 'chroma'; t: number; chroma: number[]; energyDb: number };

export const DEFAULT_ANALYZER_CONFIG: Omit<AnalyzerConfig, 'sampleRate'> = {
  sensitivity: 0.6,
  refractory: 0.06,
  minFreq: 60,
  maxFreq: 1400,
  emitPitch: true,
  chroma: true,
};

const FULL_RING = 1 << 15;
const ANA_RING = 1 << 12;
/** Minimum YIN clarity for the continuous pitch track. */
const VOICED_CLARITY = 0.75;
/** After a pluck we accept a little more uncertainty, the attack analysis double-checks. */
const ATTACK_CLARITY = 0.6;

interface Frame {
  tStart: number;
  tEnd: number;
  freq: number;
  clarity: number;
  voiced: boolean;
  db: number;
}

interface PendingWindow {
  t: number;
  start: number;
  end: number;
}

export class Analyzer {
  private cfg: AnalyzerConfig;
  private onset: OnsetDetector;
  private yin!: Yin;
  private decimator: Decimator | null = null;
  private stage2: Decimator | null = null;
  private decFactor = 1;
  private anaRate = 0;
  private readonly full = new Float32Array(FULL_RING);
  private fullCount = 0;
  private frameOffset = 0;
  private readonly ana = new Float32Array(ANA_RING);
  private anaCount = 0;
  private hop = 256;
  private sinceHop = 0;
  private yinBuf!: Float32Array;
  private readonly block: Float32Array;
  private blockFill = 0;
  private blockStart = 0;
  private tracker = new NoteTracker();
  private pendingChroma: PendingWindow | null = null;
  private pendingAttack: (PendingWindow & { preStart: number; preEnd: number }) | null = null;
  private readonly chromaLen: number;
  private out: AnalyzerEvent[] = [];

  constructor(cfg: Partial<AnalyzerConfig> & { sampleRate: number }) {
    this.cfg = { ...DEFAULT_ANALYZER_CONFIG, ...cfg };
    this.onset = new OnsetDetector(this.cfg.sampleRate, {
      sensitivity: this.cfg.sensitivity,
      refractory: this.cfg.refractory,
    });
    this.block = new Float32Array(this.onset.blockSize);
    this.chromaLen = this.cfg.sampleRate > 60000 ? 16384 : 8192;
    this.setupPitch();
  }

  private setupPitch() {
    const sr = this.cfg.sampleRate;
    this.decFactor = sr > 60000 ? 4 : sr >= 32000 ? 2 : 1;
    this.decimator = this.decFactor >= 2 ? new Decimator() : null;
    this.stage2 = this.decFactor === 4 ? new Decimator() : null;
    this.anaRate = sr / this.decFactor;
    this.yin = new Yin(this.anaRate, {
      minFreq: this.cfg.minFreq,
      maxFreq: this.cfg.maxFreq,
      threshold: 0.15,
    });
    this.yinBuf = new Float32Array(this.yin.requiredLength);
    this.hop = Math.max(64, Math.round(this.anaRate * 0.0107));
  }

  configure(cfg: Partial<Omit<AnalyzerConfig, 'sampleRate'>>) {
    const pitchChanged =
      (cfg.minFreq !== undefined && cfg.minFreq !== this.cfg.minFreq) ||
      (cfg.maxFreq !== undefined && cfg.maxFreq !== this.cfg.maxFreq);
    this.cfg = { ...this.cfg, ...cfg };
    this.onset.configure({ sensitivity: this.cfg.sensitivity, refractory: this.cfg.refractory });
    if (pitchChanged) this.setupPitch();
  }

  get config(): AnalyzerConfig {
    return this.cfg;
  }

  get noiseFloorDb() {
    return this.onset.noiseFloorDb;
  }

  private get minMidi() {
    return Math.ceil(69 + 12 * Math.log2(this.cfg.minFreq / 440) - 0.3);
  }

  /**
   * Process a chunk of samples. `startFrame` is the AudioContext frame index of the
   * first sample, so event times line up with `AudioContext.currentTime`.
   */
  process(samples: Float32Array, startFrame: number): AnalyzerEvent[] {
    const out: AnalyzerEvent[] = [];
    this.out = out;
    this.frameOffset = startFrame - this.fullCount;
    const sr = this.cfg.sampleRate;
    const fullMask = FULL_RING - 1;
    const anaMask = ANA_RING - 1;
    let peak = 0;
    let sumSq = 0;

    for (let i = 0; i < samples.length; i++) {
      const x = samples[i];
      const ax = x < 0 ? -x : x;
      if (ax > peak) peak = ax;
      sumSq += x * x;

      if (this.blockFill === 0) this.blockStart = this.fullCount + this.frameOffset;
      this.full[this.fullCount & fullMask] = x;
      this.fullCount++;

      this.block[this.blockFill++] = x;
      if (this.blockFill === this.block.length) {
        this.blockFill = 0;
        const hit = this.onset.processBlock(this.block, this.blockStart);
        if (hit) this.handleOnset(hit.frame / sr, hit.frame, hit.strength);
      }

      let y = x;
      if (this.decimator) {
        y = this.decimator.push(x);
        if (Number.isNaN(y)) continue;
        if (this.stage2) {
          y = this.stage2.push(y);
          if (Number.isNaN(y)) continue;
        }
      }
      this.ana[this.anaCount & anaMask] = y;
      this.anaCount++;
      this.sinceHop++;
      if (this.sinceHop >= this.hop && this.anaCount >= this.yinBuf.length) {
        this.sinceHop = 0;
        this.runPitch();
      }
      if (this.pendingAttack && this.fullCount + this.frameOffset >= this.pendingAttack.end) this.runAttack();
    }

    const rmsDb = 10 * Math.log10(sumSq / Math.max(1, samples.length) + 1e-12);
    out.push({
      type: 'level',
      t: (startFrame + samples.length) / sr,
      db: rmsDb,
      peak,
      floorDb: this.onset.noiseFloorDb,
      gateDb: this.onset.gateDb,
    });

    this.checkChroma(false);
    return out;
  }

  private nowFrame() {
    return this.fullCount + this.frameOffset;
  }

  private handleOnset(t: number, frame: number, strength: number) {
    // Finish analysis for the previous pluck with whatever audio we have.
    if (this.pendingAttack) this.runAttack(true);
    if (this.pendingChroma) this.checkChroma(true);
    this.out.push({ type: 'onset', t, strength });
    this.tracker.onOnset(t, (e) => this.out.push(e));
    const sr = this.cfg.sampleRate;
    const postStart = frame + Math.round(0.012 * sr);
    this.pendingAttack = {
      t,
      preStart: frame - Math.round(0.048 * sr),
      preEnd: frame - Math.round(0.003 * sr),
      start: postStart,
      end: postStart + Math.round(0.064 * sr),
    };
    if (this.cfg.chroma) {
      const start = frame + Math.round(0.03 * sr);
      this.pendingChroma = { t, start, end: start + this.chromaLen };
    }
  }

  /** Copy context frames [start, end) out of the ring buffer (zeros where unavailable). */
  private segment(start: number, end: number): Float32Array {
    const len = Math.max(0, end - start);
    const seg = new Float32Array(len);
    const mask = FULL_RING - 1;
    const oldest = this.fullCount - FULL_RING;
    for (let i = 0; i < len; i++) {
      const c = start + i - this.frameOffset;
      if (c >= 0 && c >= oldest && c < this.fullCount) seg[i] = this.full[c & mask];
    }
    return seg;
  }

  private runAttack(early = false) {
    const p = this.pendingAttack;
    if (!p) return;
    this.pendingAttack = null;
    const end = Math.min(p.end, this.nowFrame());
    const fullLen = p.end - p.start;
    if (early && end - p.start < fullLen * 0.45) {
      this.tracker.onAttack(p.t, null, this.onset.gateDb, (e) => this.out.push(e));
      return;
    }
    const pre = this.segment(Math.max(p.preStart, this.nowFrame() - FULL_RING + 1), p.preEnd);
    const post = this.segment(p.start, end);
    const res = analyzeAttack(pre, post, this.cfg.sampleRate, { minMidi: this.minMidi, maxMidi: 90 });
    this.tracker.onAttack(p.t, res, this.onset.gateDb, (e) => this.out.push(e));
  }

  private checkChroma(force: boolean) {
    const p = this.pendingChroma;
    if (!p) return;
    const available = Math.min(this.nowFrame(), p.end) - p.start;
    if (this.nowFrame() < p.end && !(force && available >= 2048)) {
      if (force) this.pendingChroma = null;
      return;
    }
    this.pendingChroma = null;
    if (available < 1024) return;
    const seg = this.segment(p.start, p.start + available);
    const res = computeChroma(seg, this.cfg.sampleRate, this.chromaLen);
    if (res.energyDb < this.onset.gateDb - 6) return;
    this.out.push({ type: 'chroma', t: p.t, chroma: Array.from(res.chroma), energyDb: res.energyDb });
  }

  private runPitch() {
    const len = this.yinBuf.length;
    const mask = ANA_RING - 1;
    const start = this.anaCount - len;
    let sumSq = 0;
    for (let i = 0; i < len; i++) {
      const v = this.ana[(start + i) & mask];
      this.yinBuf[i] = v;
      sumSq += v * v;
    }
    const db = 10 * Math.log10(sumSq / len + 1e-12);
    const sr = this.cfg.sampleRate;
    // Map analysis-rate sample counts back to context frames (compensating filter delay).
    const filterDelay = this.decimator ? this.decimator.delay * (this.stage2 ? 3 : 1) : 0;
    const endFrame = this.anaCount * this.decFactor + this.frameOffset - filterDelay;
    const startFrame = endFrame - len * this.decFactor;
    const tStart = startFrame / sr;
    const tEnd = endFrame / sr;

    let freq = 0;
    let clarity = 0;
    if (db > this.onset.gateDb - 4) {
      const est = this.yin.detect(this.yinBuf);
      if (est && est.freq >= this.cfg.minFreq * 0.97 && est.freq <= this.cfg.maxFreq) {
        clarity = est.clarity;
        freq = est.freq;
      }
    }
    const voiced = freq > 0 && clarity >= VOICED_CLARITY;
    const frame: Frame = { tStart, tEnd, freq, clarity, voiced, db };
    if (this.cfg.emitPitch) {
      this.out.push({ type: 'pitch', t: (tStart + tEnd) / 2, freq: voiced ? freq : 0, clarity, db });
    }
    this.tracker.onFrame(frame, this.onset.gateDb, (e) => this.out.push(e));
  }

  reset() {
    this.onset.reset();
    this.tracker = new NoteTracker();
    this.pendingChroma = null;
    this.pendingAttack = null;
    this.fullCount = 0;
    this.anaCount = 0;
    this.sinceHop = 0;
    this.blockFill = 0;
  }
}

type Emit = (e: NoteEvent) => void;

interface PendingNote {
  t: number;
  midis: number[];
  freqs: number[];
  clar: number[];
  resolved: boolean;
}

/** Turns onsets, the pitch track and attack analysis into discrete note events. */
class NoteTracker {
  private pending: PendingNote | null = null;
  private lastMidi: number | null = null;
  private lastEmitted: number | null = null;
  private lastT = -Infinity;
  private stable: { midi: number; count: number; t: number } | null = null;
  private silent = 0;

  onOnset(t: number, emit: Emit) {
    if (this.pending && !this.pending.resolved) this.decide(this.pending, null, emit);
    this.pending = { t, midis: [], freqs: [], clar: [], resolved: false };
    this.stable = null;
  }

  onFrame(f: Frame, gateDb: number, emit: Emit) {
    const p = this.pending;
    if (p && !p.resolved) {
      if (f.freq > 0 && f.clarity >= ATTACK_CLARITY && f.tStart >= p.t + 0.003) {
        p.midis.push(Math.round(69 + 12 * Math.log2(f.freq / 440)));
        p.freqs.push(f.freq);
        p.clar.push(f.clarity);
        const n = p.midis.length;
        // Fast path: a clean, confident single note.
        if (n >= 2 && p.midis[n - 1] === p.midis[n - 2] && p.clar[n - 1] >= 0.85 && p.clar[n - 2] >= 0.85) {
          p.resolved = true;
          this.emitNote(emit, p.t, p.midis[n - 1], (p.freqs[n - 1] + p.freqs[n - 2]) / 2, p.clar[n - 1], false);
          this.stable = { midi: p.midis[n - 1], count: 2, t: p.t };
        }
      }
      if (!p.resolved && f.tEnd > p.t + 0.3) this.decide(p, null, emit);
      return;
    }

    if (!f.voiced) {
      this.silent++;
      if (this.silent >= 12) this.lastMidi = null;
      this.stable = null;
      return;
    }
    this.silent = 0;
    const mr = Math.round(69 + 12 * Math.log2(f.freq / 440));
    if (this.stable && this.stable.midi === mr) this.stable.count++;
    else this.stable = { midi: mr, count: 1, t: (f.tStart + f.tEnd) / 2 };

    const s = this.stable;
    if (this.lastMidi !== null) {
      // Legato: the pitch moved to a new note without a fresh pick attack.
      if (s.count === 3 && mr !== this.lastMidi && Math.abs(mr - this.lastMidi) !== 12) {
        this.emitNote(emit, s.t, mr, f.freq, f.clarity, true);
      }
    } else if (s.count === 5 && f.db > gateDb + 6) {
      // A soft start the onset detector missed.
      if (mr !== this.lastEmitted || s.t - this.lastT > 1) this.emitNote(emit, s.t, mr, f.freq, f.clarity, true);
    }
  }

  onAttack(t: number, res: { candidates: AttackCandidate[]; addedDb: number } | null, gateDb: number, emit: Emit) {
    const p = this.pending;
    if (!p || p.t !== t || p.resolved) return;
    this.decide(p, res && res.addedDb > gateDb - 12 ? res : null, emit);
  }

  private yinVote(p: PendingNote): { midi: number; freq: number; clarity: number } | null {
    if (p.midis.length < 2) return null;
    const byPc = new Map<number, number[]>();
    p.midis.forEach((m, i) => {
      const pc = ((m % 12) + 12) % 12;
      const arr = byPc.get(pc) ?? [];
      arr.push(i);
      byPc.set(pc, arr);
    });
    let best: number[] = [];
    byPc.forEach((idx) => {
      if (idx.length > best.length) best = idx;
    });
    if (best.length < 2) return null;
    const midiCount = new Map<number, number>();
    for (const i of best) midiCount.set(p.midis[i], (midiCount.get(p.midis[i]) ?? 0) + 1);
    let midi = p.midis[best[0]];
    let n = 0;
    midiCount.forEach((c, m) => {
      if (c > n || (c === n && m < midi)) {
        n = c;
        midi = m;
      }
    });
    const idx = best.filter((i) => p.midis[i] === midi);
    return {
      midi,
      freq: idx.reduce((a, i) => a + p.freqs[i], 0) / idx.length,
      clarity: Math.max(...idx.map((i) => p.clar[i])),
    };
  }

  private decide(p: PendingNote, attack: { candidates: AttackCandidate[] } | null, emit: Emit) {
    p.resolved = true;
    const yin = this.yinVote(p);
    const cands = attack?.candidates ?? [];
    const scoreOf = (m: number) =>
      cands.reduce((s, c) => (c.midi === m || Math.abs(c.midi - m) === 12 ? Math.max(s, c.score) : s), 0);

    let midi: number | null = null;
    let freq = 0;
    let clarity = 0;
    const exactScore = (m: number) => cands.find((c) => c.midi === m)?.score ?? 0;
    if (cands.length === 0) {
      if (yin) ({ midi, freq, clarity } = yin);
    } else if (yin && (yin.midi === cands[0].midi || exactScore(yin.midi) >= 0.75)) {
      // YIN is precise and the attack analysis agrees.
      ({ midi, freq, clarity } = yin);
    } else {
      // YIN was confused (often by strings still ringing): trust what the pluck added.
      midi = cands[0].midi;
      freq = 440 * Math.pow(2, (midi - 69) / 12);
      clarity = yin && scoreOf(yin.midi) > 0.5 ? yin.clarity * 0.8 : 0.5;
    }
    if (midi === null) return;
    this.emitNote(emit, p.t, midi, freq, clarity, false, cands.slice(0, 4));
    this.stable = { midi, count: 2, t: p.t };
  }

  private emitNote(
    emit: Emit,
    t: number,
    midi: number,
    freq: number,
    clarity: number,
    legato: boolean,
    candidates?: AttackCandidate[],
  ) {
    const exact = 69 + 12 * Math.log2(freq / 440);
    const e: NoteEvent = { type: 'note', t, midi, freq, cents: Math.round((exact - midi) * 100), clarity, legato };
    if (candidates && candidates.length) e.candidates = candidates;
    emit(e);
    this.lastMidi = midi;
    this.lastEmitted = midi;
    this.lastT = t;
  }
}
